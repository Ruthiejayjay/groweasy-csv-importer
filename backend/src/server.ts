import "dotenv/config";
import express, {Request, Response, NextFunction} from "express";
import cors from "cors";
import importRouter from "./routes/import";
import { AppError, ErrorCode } from "./utils/errors";

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CORS_ORIGIN.split(",") }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", importRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }

  console.error(err);
  res.status(500).json({ code: ErrorCode.INTERNAL_ERROR, message: "An unexpected error occurred" });
});

app.listen(PORT, () => {
  console.log(`GrowEasy CSV importer backend listening on port ${PORT}`);
});

