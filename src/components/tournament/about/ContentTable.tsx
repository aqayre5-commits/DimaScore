import type { TableBlock } from '@/lib/constants/about-content';

interface ContentTableProps {
  block: TableBlock;
}

export function ContentTable({ block }: ContentTableProps) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-surface-2">
            {block.headers.map((header, i) => (
              <th
                key={i}
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-start text-xs font-semibold text-text-secondary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i} className="border-b border-border-subtle last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-2 text-text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
