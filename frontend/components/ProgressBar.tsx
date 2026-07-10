"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  rowCount: number;
}

export default function ProgressBar({ rowCount }: ProgressBarProps) {
  const [width, setWidth] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.08 : w));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-16">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
        Mapping your CSV to GrowEasy CRM fields...
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Processing {rowCount} rows in batches. This can take a moment for larger
        files.
      </p>
      <div className="w-full max-w-md mx-auto h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-5 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
