import { ImportResult } from "@/lib/types";

const CRM_COLUMNS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "crm_note", label: "Note" },
];

interface ResultsTableProps {
  result: ImportResult;
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const rows = [
    ...result.imported.map((r) => ({
      ...r,
      _status: "imported" as const,
      _reason: "",
    })),
    ...result.skipped.map((s) => ({
      ...(s.raw as Record<string, unknown>),
      _status: "skipped" as const,
      _reason: s.reason,
    })),
  ];

  return (
    <div>
      <div className="flex gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {result.totalImported}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Imported
          </div>
        </div>
        <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {result.totalSkipped}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Skipped
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[480px] border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
            <tr>
              <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                Status
              </th>
              {CRM_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800"
                >
                  {c.label}
                </th>
              ))}
              <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                      row._status === "imported"
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {row._status === "imported" ? "Imported" : "Skipped"}
                  </span>
                </td>
                {CRM_COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
                <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  {row._status === "skipped" ? row._reason : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
