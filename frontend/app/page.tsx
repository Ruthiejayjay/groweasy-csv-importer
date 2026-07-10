"use client";

import { useState } from "react";
import Papa from "papaparse";
import UploadZone from "@/components/UploadZone";
import PreviewTable from "@/components/PreviewTable";
import ProgressBar from "@/components/ProgressBar";
import ResultsTable from "@/components/ResultsTable";
import { ImportResult, ImportStep } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Home() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(selectedFile: File) {
    setError(null);
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data as Record<string, string>[];
        const parsedHeaders = results.meta.fields || [];

        if (parsedRows.length === 0) {
          setError("This CSV appears to have no data rows.");
          return;
        }

        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setStep("preview");
      },
      error: (err) => {
        setError(`Could not parse CSV: ${err.message}`);
      },
    });
  }

  async function handleConfirm() {
    if (!file) return;
    setStep("processing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ message: "Import failed" }));
        throw new Error(body.message || `Server responded with ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during import.",
      );
      setStep("preview");
    }
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setError(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">
          GrowEasy CSV importer
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload any lead export and let AI map it to your CRM fields.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {step === "upload" && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {step === "preview" && (
          <>
            <PreviewTable headers={headers} rows={rows} />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Choose a different file
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Confirm &amp; import {rows.length} rows
              </button>
            </div>
          </>
        )}
        {step === "processing" && <ProgressBar rowCount={rows.length} />}

        {step === "results" && result && (
          <>
            <ResultsTable result={result} />
            <div className="flex justify-end mt-5">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Import another file
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
