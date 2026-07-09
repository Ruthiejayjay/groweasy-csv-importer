import { parse } from "csv-parse/sync";
import { AppError, ErrorCode } from "../utils/errors";

export type RawRow = Record<string, string>;

export interface RowBatch {
  batchIndex: number;
  rows: RawRow[];
  rowNumbers: number[];
}

export function parseCsv(csvText: string): RawRow[] {
  let records: RawRow[];

  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new AppError(
      ErrorCode.INVALID_CSV,
      `Could not parse CSV file: ${(err as Error).message}`,
    );
  }
  if (!records.length) {
    throw new AppError(ErrorCode.EMPTY_CSV, "CSV file contains no data rows");
  }
  return records;
}

export function batchRows(rows: RawRow[], batchSize: number): RowBatch[] {
  const batches: RowBatch[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const rowsSlice = rows.slice(i, i + batchSize);
    const rowNumbers = rowsSlice.map((_, idx) => i + idx + 1);
    batches.push({
      batchIndex: batches.length,
      rows: rowsSlice,
      rowNumbers,
    });
  }

  return batches;
}
