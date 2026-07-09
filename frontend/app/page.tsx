"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);
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

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <UploadZone onFileSelected={handleFileSelected} />
      </div>

      {file && (
        <p className="mt-4 text-sm text-gray-600">
          Selected: <span className="font-medium">{file.name}</span> (
          {(file.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
