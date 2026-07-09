import { GoogleGenAI, Type } from "@google/genai";
import { AppError, ErrorCode } from "../utils/errors";
import {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CrmRecord,
  CRM_FIELD_LIST,
} from "../types/crm";
import { RawRow } from "./csvService";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface ExtractedRecord extends CrmRecord {
  _row_number: number;
  _skip_reason: string | null;
}

const RECORD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    records: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          _row_number: { type: Type.INTEGER },
          _skip_reason: { type: Type.STRING, nullable: true },
          created_at: { type: Type.STRING, nullable: true },
          name: { type: Type.STRING, nullable: true },
          email: { type: Type.STRING, nullable: true },
          country_code: { type: Type.STRING, nullable: true },
          mobile_without_country_code: { type: Type.STRING, nullable: true },
          company: { type: Type.STRING, nullable: true },
          city: { type: Type.STRING, nullable: true },
          state: { type: Type.STRING, nullable: true },
          country: { type: Type.STRING, nullable: true },
          lead_owner: { type: Type.STRING, nullable: true },
          crm_status: {
            type: Type.STRING,
            enum: [...CRM_STATUS_VALUES],
            nullable: true,
          },
          crm_note: { type: Type.STRING, nullable: true },
          data_source: {
            type: Type.STRING,
            enum: [...DATA_SOURCE_VALUES],
            nullable: true,
          },
          possession_time: { type: Type.STRING, nullable: true },
          description: { type: Type.STRING, nullable: true },
        },
        required: ["_row_number", "_skip_reason"],
      },
    },
  },
  required: ["records"],
};

function buildSystemPrompt(): string {
  const fieldDocs = CRM_FIELD_LIST.map(
    (f) => `- ${f.field}: ${f.description}`,
  ).join("\n");

  return `You are a data extraction engine for GrowEasy CRM. You will be given rows from an arbitrary CSV export (Facebook leads, Google Ads, spreadsheets, other CRMs, etc.) with unpredictable column names and layouts. Your job is to map each row's available data onto the fixed GrowEasy CRM schema below, as accurately as possible.
CRM FIELDS:
${fieldDocs}

RULES:
1. crm_status must be exactly one of: ${CRM_STATUS_VALUES.join(", ")}. If none apply, leave it null.
2. data_source must be exactly one of: ${DATA_SOURCE_VALUES.join(", ")}. If nothing matches confidently, leave it null - do not guess.
3. created_at must be a string parseable by JavaScript's new Date(). If the source has no clear date, leave it null.
4. Use crm_note for: remarks, follow-up notes, additional comments, and any additional emails or phone numbers beyond the primary ones.
5. If a row has multiple emails, use the first as "email" and append the rest to crm_note. Same rule for multiple phone numbers with mobile_without_country_code.
6. If a row has neither an email nor a mobile number anywhere in it, set _skip_reason to a short explanation (e.g. "no email or mobile number present") and you may leave the other fields null. Otherwise _skip_reason must be null.
7. Never fabricate data. If a field genuinely isn't present or inferable, use null.
8. Each output record's _row_number must exactly match the row_number given in the input for that row.
9. Keep crm_note free of raw newlines - if you need a line break, use \\n so the value stays a single CSV-safe field.`;
}

function buildUserMessage(rows: RawRow[], rowNumbers: number[]): string {
  const numbered = rows.map((row, i) => ({
    row_number: rowNumbers[i],
    ...row,
  }));
  return `Here are ${rows.length} CSV rows as JSON objects. Map each one to the GrowEasy CRM schema.\n\n${JSON.stringify(numbered, null, 2)}`;
}

export async function extractBatch(
  rows: RawRow[],
  rowNumbers: number[],
): Promise<ExtractedRecord[]> {
  if (!genAI) {
    throw new AppError(
      ErrorCode.AI_PROVIDER_NOT_CONFIGURED,
      "No AI provider configured - set GEMINI_API_KEY in your environment",
      500,
    );
  }

  const response = await genAI.models.generateContent({
    model: MODEL,
    contents: buildUserMessage(rows, rowNumbers),
    config: {
      systemInstruction: buildSystemPrompt(),
      responseMimeType: "application/json",
      responseSchema: RECORD_SCHEMA,
    },
  });

  const text = response.text;

  if (!text) {
    throw new AppError(
      ErrorCode.AI_EXTRACTION_FAILED,
      "Gemini response had no text content",
      502,
    );
  }

  let parsed: { records: ExtractedRecord[] };

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError(
      ErrorCode.AI_EXTRACTION_FAILED,
      "Gemini response was not valid JSON",
      502,
    );
  }

  if (!Array.isArray(parsed.records)) {
    throw new AppError(
      ErrorCode.AI_EXTRACTION_FAILED,
      "Gemini response was missing the records array",
      502,
    );
  }

  return parsed.records;
}
