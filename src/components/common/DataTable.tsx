import { ReactNode } from 'react'

interface DataTableProps {
  headers: string[]
  children: ReactNode
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
