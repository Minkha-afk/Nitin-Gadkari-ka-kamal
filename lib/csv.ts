/**
 * CSV writing, shared by the browser (export the analysis you just ran) and
 * the server (export what is in the database).
 *
 * Framework-free on purpose so both sides use the same escaping rules — a
 * street name with a comma in it is the single most common way an export ends
 * up silently misaligned by one column.
 */

export interface Column<T> {
  key: string;
  get: (row: T) => unknown;
}

/** RFC 4180: quote anything containing a comma, quote or newline; "" escapes a quote. */
function cell(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) value = value.join(' ');
  if (value instanceof Date) value = value.toISOString();
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const head = columns.map((c) => cell(c.key)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.get(r))).join(','));
  // CRLF, because Excel is the most likely destination and it is the one
  // reader that still cares.
  return [head, ...body].join('\r\n');
}

/**
 * Excel assumes the system code page unless a file opens with a byte-order
 * mark, which turns any address with an accent into mojibake. Three bytes to
 * avoid a support question.
 */
export const BOM = '﻿';

export function csvFilename(kind: string, suffix?: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `happyjourney-${kind}${suffix ? `-${suffix}` : ''}-${stamp}.csv`;
}

/** Browser-side download. No-op on the server. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick — Safari cancels the download if the URL dies first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
