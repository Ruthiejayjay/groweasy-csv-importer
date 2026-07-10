import { describe, it, expect } from "vitest";
import { validateAndSplit } from "../validationService";
import { ExtractedRecord } from "../aiExtractionService";
import { RawRow } from "../csvService";

function makeRecord(overrides: Partial<ExtractedRecord>): ExtractedRecord {
  return {
    _row_number: 1,
    _skip_reason: null,
    created_at: null,
    name: null,
    email: null,
    country_code: null,
    mobile_without_country_code: null,
    company: null,
    city: null,
    state: null,
    country: null,
    lead_owner: null,
    crm_status: null,
    crm_note: null,
    data_source: null,
    possession_time: null,
    description: null,
    ...overrides,
  };
}

const rawRows: RawRow[] = [{ name: "raw row 1" }];
const rowNumbers = [1];

describe("validateAndSplit", () => {
  it("imports a record with a valid email and no other issues", () => {
    const record = makeRecord({ email: "john@example.com" });
    const { imported, skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported).toHaveLength(1);
    expect(skipped).toHaveLength(0);
    expect(imported[0].email).toBe("john@example.com");
  });

  it("imports a record with only a mobile number, no email", () => {
    const record = makeRecord({ mobile_without_country_code: "9876543210" });
    const { imported, skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported).toHaveLength(1);
    expect(skipped).toHaveLength(0);
  });

  it("skips a record when the AI already marked a _skip_reason", () => {
    const record = makeRecord({ email: "john@example.com", _skip_reason: "duplicate entry" });
    const { imported, skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toBe("duplicate entry");
  });

  it("skips a record with neither email nor mobile, even if the AI didn't flag it (defense-in-depth)", () => {
    const record = makeRecord({ _skip_reason: null, email: null, mobile_without_country_code: null });
    const { imported, skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toBe("no email or mobile number found");
  });

  it("treats an empty/whitespace-only email or mobile as absent", () => {
    const record = makeRecord({ email: "   ", mobile_without_country_code: "" });
    const { imported, skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });

  it("keeps a valid crm_status enum value", () => {
    const record = makeRecord({ email: "john@example.com", crm_status: "SALE_DONE" });
    const { imported } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported[0].crm_status).toBe("SALE_DONE");
  });

  it("blanks out an invalid crm_status value instead of trusting the AI blindly", () => {
    const record = makeRecord({ email: "john@example.com", crm_status: "NOT_A_REAL_STATUS" as never });
    const { imported } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported[0].crm_status).toBe("");
  });

  it("blanks out an invalid data_source value", () => {
    const record = makeRecord({ email: "john@example.com", data_source: "made_up_source" as never });
    const { imported } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported[0].data_source).toBe("");
  });

  it("keeps a valid, parseable created_at date", () => {
    const record = makeRecord({ email: "john@example.com", created_at: "2026-05-13 14:20:48" });
    const { imported } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported[0].created_at).toBe("2026-05-13 14:20:48");
  });

  it("nulls out a created_at value that new Date() can't parse", () => {
    const record = makeRecord({ email: "john@example.com", created_at: "not a real date" });
    const { imported } = validateAndSplit([record], rawRows, rowNumbers);

    expect(imported[0].created_at).toBeNull();
  });

  it("attaches the original raw row to a skipped record for traceability", () => {
    const record = makeRecord({ _skip_reason: "no contact info" });
    const { skipped } = validateAndSplit([record], rawRows, rowNumbers);

    expect(skipped[0].row).toBe(1);
    expect(skipped[0].raw).toEqual({ name: "raw row 1" });
  });

  it("splits a mixed batch into the correct imported/skipped counts", () => {
    const records: ExtractedRecord[] = [
      makeRecord({ _row_number: 1, email: "a@example.com" }),
      makeRecord({ _row_number: 2, _skip_reason: "no email or mobile" }),
      makeRecord({ _row_number: 3, mobile_without_country_code: "111" }),
    ];
    const rows: RawRow[] = [{ a: "1" }, { a: "2" }, { a: "3" }];
    const nums = [1, 2, 3];

    const { imported, skipped } = validateAndSplit(records, rows, nums);

    expect(imported).toHaveLength(2);
    expect(skipped).toHaveLength(1);
  });
});