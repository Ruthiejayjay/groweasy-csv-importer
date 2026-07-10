interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="overflow-x-auto max-h-[480px] border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm whitespace-nowrap">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="text-left font-semibold text-gray-500 px-4 py-2.5 border-b border-gray-200">
              #
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-semibold text-gray-500 px-4 py-2.5 border-b border-gray-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b border-gray-100 text-gray-500">
                {i + 1}
              </td>
              {headers.map((h) => (
                <td
                  key={h}
                  className="px-4 py-2 border-b border-gray-100 text-gray-900"
                >
                  {row[h] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
