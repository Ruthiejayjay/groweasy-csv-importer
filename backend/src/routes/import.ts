import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { parseCsv, batchRows, RowBatch } from "../services/csvService";
import { extractBatch, ExtractedRecord } from "../services/aiExtractionService";
import { validateAndSplit, SkippedRecord } from "../services/validationService";
import { withRetry, runWithConcurrency } from "../utils/batchRetry";
import { AppError, ErrorCode } from "../utils/errors";
import { ImportResult } from "../types/importResult";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      cb(new AppError(ErrorCode.INVALID_CSV, "Only .csv files are accepted"));
      return;
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const router = Router();

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 25;
const BATCH_CONCURRENCY = Number(process.env.BATCH_CONCURRENCY) || 4;
const BATCH_MAX_RETRIES = Number(process.env.BATCH_MAX_RETRIES) || 3;

router.post(
  "/import",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(
          ErrorCode.NO_FILE_UPLOADED,
          "No CSV file was uploaded",
        );
      }

      const csvText = req.file.buffer.toString("utf-8");
      const rows = parseCsv(csvText);
      const batches: RowBatch[] = batchRows(rows, BATCH_SIZE);

      const result: ImportResult = {
        imported: [],
        skipped: [],
        totalImported: 0,
        totalSkipped: 0,
      };

      await runWithConcurrency(batches, BATCH_CONCURRENCY, async (batch) => {
        try {
          const extracted: ExtractedRecord[] = await withRetry(
            () => extractBatch(batch.rows, batch.rowNumbers),
            BATCH_MAX_RETRIES,
          );

          const { imported, skipped } = validateAndSplit(
            extracted,
            batch.rows,
            batch.rowNumbers,
          );
          result.imported.push(...imported);
          result.skipped.push(...skipped);
        } catch (err) {
          const reason =
            err instanceof Error
              ? err.message
              : "AI extraction failed for this batch";
          const batchSkipped: SkippedRecord[] = batch.rowNumbers.map(
            (rowNum, idx) => ({
              row: rowNum,
              reason: `Batch processing failed: ${reason}`,
              raw: batch.rows[idx],
            }),
          );
          result.skipped.push(...batchSkipped);
        }
      });

      result.totalImported = result.imported.length;
      result.totalSkipped = result.skipped.length;

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
