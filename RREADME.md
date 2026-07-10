# GrowEasy AI CSV Importer

An AI-powered CSV importer that maps arbitrary lead export formats (Facebook Lead Ads, Google Ads, spreadsheets, other CRM exports) onto the GrowEasy CRM schema, using Gemini for intelligent field mapping.

## How it works

1. **Upload** — drag & drop or pick a `.csv` file. No processing happens yet.
2. **Preview** — the file is parsed client-side (no network call) and shown in a scrollable table with sticky headers, using whatever columns the file actually has.
3. **Confirm** — only on confirmation is the file sent to the backend.
4. **AI extraction** — the backend splits the CSV into batches, sends each batch to Gemini with a JSON-schema-constrained prompt, validates the response server-side, and merges everything into `imported` / `skipped` sets.
5. **Results** — a table showing which rows were imported vs skipped, with a reason for every skip.

## Project structure

```
groweasy-csv-importer/
  backend/                    Express + TypeScript API
    src/
      routes/                 import.ts (POST /api/import)
      services/               csvService, aiExtractionService, validationService
      services/__tests__/     Vitest unit tests
      utils/                  errors.ts, batchRetry.ts
      types/                  crm.ts
      server.ts
  frontend/                   Next.js app (App Router, Tailwind CSS)
    app/                      page.tsx, layout.tsx
    components/               UploadZone, PreviewTable, ProgressBar, ResultsTable, ThemeToggle
    lib/                      types.ts
  .gitignore
  docker-compose.yml
  README.md
```

## Tech stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Papa Parse (client-side CSV preview)
- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini (`gemini-2.5-flash`) via `@google/genai`, using schema-constrained JSON output
- **CSV parsing**: `csv-parse`
- **File upload**: `multer` (CSV-only, 10MB limit)
- **Testing**: Vitest
- **Containerization**: Docker, Docker Compose

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# add your GEMINI_API_KEY to .env (free tier: https://aistudio.google.com/apikey)
npm run dev
```

Runs on **http://localhost:4000**. Confirm with `curl http://localhost:4000/health`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # or create it manually, see below
npm run dev
```

Runs on **http://localhost:3000**.

## Local setup with Docker

The fastest way to run the whole app — no need to install Node, npm, or manage two separate terminals.

```bash
export GEMINI_API_KEY=your_actual_key
docker compose up --build
```

- Frontend: **http://localhost:3000**
- Backend: **http://localhost:4000**

To stop:

```bash
docker compose down
```

Environment variables can also be set via a `.env` file at the project root instead of `export` — Docker Compose picks it up automatically:

```
GEMINI_API_KEY=your_actual_key
GEMINI_MODEL=gemini-2.5-flash
BATCH_SIZE=25
BATCH_CONCURRENCY=4
BATCH_MAX_RETRIES=5
```

## Environment variables

**Backend** (`backend/.env`)

| Variable            | Description                        | Default                 |
| ------------------- | ---------------------------------- | ----------------------- |
| `PORT`              | Server port                        | `4000`                  |
| `CORS_ORIGIN`       | Allowed frontend origin(s)         | `http://localhost:3000` |
| `GEMINI_API_KEY`    | Gemini API key used for extraction | —                       |
| `GEMINI_MODEL`      | Gemini model name                  | `gemini-2.5-flash`      |
| `BATCH_SIZE`        | Rows sent to the AI per call       | `25`                    |
| `BATCH_CONCURRENCY` | Concurrent batch calls in flight   | `4`                     |
| `BATCH_MAX_RETRIES` | Retry attempts per failed batch    | `5`                     |

**Frontend** (`frontend/.env.local`)

| Variable              | Description      | Default                 |
| --------------------- | ---------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL | `http://localhost:4000` |

## API

### `POST /api/import`

`multipart/form-data` with a `file` field — must be a `.csv` file.

**Response**

```json
{
  "imported": [
    { "name": "John Doe", "email": "john.doe@example.com", "...": "..." }
  ],
  "skipped": [
    {
      "row": 3,
      "reason": "no email or mobile number found",
      "raw": { "...": "..." }
    }
  ],
  "totalImported": 3,
  "totalSkipped": 1
}
```

**Error responses** use a consistent shape:

```json
{ "code": "INVALID_CSV", "message": "Only .csv files are accepted" }
```

Error codes: `NO_FILE_UPLOADED`, `INVALID_CSV`, `EMPTY_CSV`, `AI_EXTRACTION_FAILED`, `AI_PROVIDER_NOT_CONFIGURED`, `INTERNAL_ERROR`.

## Testing

```bash
cd backend
npm test
```

Unit tests cover `csvService` (arbitrary-header parsing, batching) and `validationService` (enum enforcement, skip-condition safety net, date validation). `aiExtractionService` isn't unit tested since it makes a live network call to Gemini — it's covered by manual end-to-end testing instead (see below).

## Design decisions

- **Schema-constrained AI output**: the extraction call uses Gemini's `responseSchema` / `responseMimeType: "application/json"` to force well-typed structured output, rather than parsing free text — avoids brittle JSON parsing.
- **Server-side re-validation**: `crm_status` and `data_source` enum values, and the "skip if no email/mobile" rule, are re-checked independently in `validationService.ts` rather than trusting the AI's compliance blindly. This is defense-in-depth, not a replacement for good prompting.
- **Batching + bounded concurrency**: large files are split into batches of `BATCH_SIZE` rows and processed with a concurrency cap (`runWithConcurrency`), so a big CSV doesn't fire hundreds of simultaneous AI calls at once.
- **Per-batch failure isolation**: if a batch exhausts its retries (e.g. a transient `503` from the AI provider), only that batch's rows are marked skipped with a reason — the rest of the import still completes.
- **No fixed CSV schema assumed**: `csvService.ts` parses whatever headers a file has; all field mapping happens in the AI prompt, not in the parser.

## Manual end-to-end testing

```bash
curl -X POST http://localhost:4000/api/import -F "file=@messy.csv"
```

Or via Postman: POST to `/api/import`, Body → form-data → key `file`, type **File**, value your CSV.

## Possible next steps

- Streaming per-batch progress to the frontend (SSE) instead of the current animated progress bar
- Virtualized results table for very large imports
- Unit or integration tests for `aiExtractionService` using a mocked Gemini response
