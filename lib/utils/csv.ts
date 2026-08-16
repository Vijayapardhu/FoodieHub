export type CsvValue = string | number | boolean | null | undefined

export interface CsvColumn<T> {
  header: string
  value: (row: T) => CsvValue
}

/**
 * Wraps a field so commas, quotes and newlines survive a round trip through
 * Excel and Sheets. Doubling the quote is the RFC 4180 escape.
 */
function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ""
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",")
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(",")
  )
  return [header, ...body].join("\r\n")
}

/**
 * Triggers a client-side download. The BOM makes Excel read the file as UTF-8,
 * without which the ₹ sign renders as mojibake.
 */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
) {
  const csv = toCsv(rows, columns)
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** `orders-2026-08-16.csv` — sortable and unambiguous. */
export function datedFilename(prefix: string, date = new Date()): string {
  const iso = date.toISOString().slice(0, 10)
  return `${prefix}-${iso}.csv`
}
