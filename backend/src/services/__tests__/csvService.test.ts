import { describe, it, expect } from "vitest";
import { parseCsv, batchRows } from "../csvService";
import { AppError, ErrorCode } from "../../utils/errors";

describe("parseCsv", () => {
  it("parses rows using whatever headers the file has, no fixed schema assumed", () => {
    const csv = "Full Name,Email\nJohn Doe,john@example.com";
    const rows = parseCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      "Full Name": "John Doe",
      Email: "john@example.com",
    });
  });

  it("handles a completely different header layout without special-casing", () => {
    const csv = "name,email,phone\nSarah,sarah@example.com,12345";
    const rows = parseCsv(csv);

    expect(Object.keys(rows[0])).toEqual(["name", "email", "phone"]);
  });

  it("trims whitespace from values", () => {
    const csv = "name,email\n  John  ,  john@example.com  ";
    const rows = parseCsv(csv);

    expect(rows[0].name).toBe("John");
    expect(rows[0].email).toBe("john@example.com");
  });

  it("tolerates rows with a different column count than the header", () => {
    const csv = "name,email,city\nJohn,john@example.com";
    expect(() => parseCsv(csv)).not.toThrow();
  });

  it("throws EMPTY_CSV for a header-only file with no data rows", () => {
    const csv = "name,email";
    expect(() => parseCsv(csv)).toThrow(AppError);

    try {
      parseCsv(csv);
    } catch (err) {
      expect((err as AppError).code).toBe(ErrorCode.EMPTY_CSV);
    }
  });

  it("throws INVALID_CSV for malformed CSV content", () => {
    const csv = 'name,email\n"unterminated quote,john@example.com';
    expect(() => parseCsv(csv)).toThrow(AppError);

    try {
      parseCsv(csv);
    } catch (err) {
      expect((err as AppError).code).toBe(ErrorCode.INVALID_CSV);
    }
  });
});

describe("batchRows", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({ name: `Row ${i + 1}` }));

  it("splits rows into batches of the given size", () => {
    const batches = batchRows(rows, 2);
    expect(batches).toHaveLength(3);
    expect(batches[0].rows).toHaveLength(2);
    expect(batches[1].rows).toHaveLength(2);
    expect(batches[2].rows).toHaveLength(1);
  });

  it("assigns correct 1-indexed row numbers across batches", () => {
    const batches = batchRows(rows, 2);
    expect(batches[0].rowNumbers).toEqual([1, 2]);
    expect(batches[1].rowNumbers).toEqual([3, 4]);
    expect(batches[2].rowNumbers).toEqual([5]);
  });

  it("assigns sequential batchIndex values", () => {
    const batches = batchRows(rows, 2);
    expect(batches.map((b) => b.batchIndex)).toEqual([0, 1, 2]);
  });

  it("returns a single batch when batchSize exceeds row count", () => {
    const batches = batchRows(rows, 100);
    expect(batches).toHaveLength(1);
    expect(batches[0].rows).toHaveLength(5);
  });

  it("returns an empty array for an empty input", () => {
    expect(batchRows([], 25)).toEqual([]);
  });
});
