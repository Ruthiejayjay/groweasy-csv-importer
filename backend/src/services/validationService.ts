import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES, CrmRecord } from "../types/crm";
import { ExtractedRecord } from "./aiExtractionService";
import { RawRow } from "./csvService";

export interface SkippedRecord {
  row: number;
  reason: string;
  raw: Record<string, unknown>;
}

const STATUS_SET = new Set<string>(CRM_STATUS_VALUES);
const SOURCE_SET = new Set<string>(DATA_SOURCE_VALUES);

function isValidDate(value: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

export function validateAndSplit(
  extracted: ExtractedRecord[],
  originalRows: RawRow[],
  rowNumbers: number[],
): { imported: CrmRecord[]; skipped: SkippedRecord[] } {
  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  const rawByRowNumber = new Map<number, RawRow>(
    rowNumbers.map((num, idx) => [num, originalRows[idx]]),
  );

  for (const record of extracted) {
    const raw = rawByRowNumber.get(record._row_number) ?? {};

    const hasEmail = Boolean(record.email && record.email.trim());
    const hasMobile = Boolean(
      record.mobile_without_country_code &&
      record.mobile_without_country_code.trim(),
    );

    if (record._skip_reason || (!hasEmail && !hasMobile)) {
      skipped.push({
        row: record._row_number,
        reason: record._skip_reason || "no email or mobile number found",
        raw,
      });
      continue;
    }

    const crmStatus =
      record.crm_status && STATUS_SET.has(record.crm_status)
        ? record.crm_status
        : "";
    const dataSource =
      record.data_source && SOURCE_SET.has(record.data_source)
        ? record.data_source
        : "";
    const createdAt = isValidDate(record.created_at) ? record.created_at : null;

    imported.push({
      created_at: createdAt,
      name: record.name || null,
      email: record.email || null,
      country_code: record.country_code || null,
      mobile_without_country_code: record.mobile_without_country_code || null,
      company: record.company || null,
      city: record.city || null,
      state: record.state || null,
      country: record.country || null,
      lead_owner: record.lead_owner || null,
      crm_status: crmStatus,
      crm_note: record.crm_note || null,
      data_source: dataSource,
      possession_time: record.possession_time || null,
      description: record.description || null,
    });
  }
  return { imported, skipped };
}
