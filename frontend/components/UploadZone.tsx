"use client";

import { useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a .csv file");
      return;
    }

    onFileSelected(file);
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center cursor-pointer transition-colors
        ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
    >
      <h3 className="text-base font-semibold text-gray-900">
        Drop your CSV here, or click to browse
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Facebook exports, Google Ads exports, spreadsheets, other CRM exports —
        any layout works
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
