import Papa, { type ParseResult } from 'papaparse'
import type { GeneExpression } from '../data/sampleGenes'

export type CsvResult =
  | { ok: true; data: GeneExpression[] }
  | { ok: false; error: string }

const REQUIRED_HEADERS = ['symbol', 'value', 'description'] as const

const normalizeHeader = (value: string) => value.trim().toLowerCase()

const hasRequiredHeaders = (headers: string[]) => {
  const normalized = headers.map(normalizeHeader)
  return REQUIRED_HEADERS.every((header) => normalized.includes(header))
}

const handleResult = (result: ParseResult<Record<string, string>>): CsvResult => {
  if (result.errors.length) {
    return { ok: false, error: 'CSV 解析失败，请检查文件格式（编码/分隔符等）。' }
  }

  if (!result.meta.fields || !hasRequiredHeaders(result.meta.fields)) {
    return { ok: false, error: 'CSV 必须包含 symbol,value,description 三列。' }
  }

  const rows = (result.data as Record<string, string>[]).map((row) => ({
    symbol: (row.symbol || '').trim(),
    value: Number(row.value),
    description: (row.description || '').trim(),
  }))

  const invalid = rows.find((row) => !row.symbol || Number.isNaN(row.value))
  if (invalid) {
    return { ok: false, error: '存在缺失 symbol 或无法解析的 value。' }
  }

  if (!rows.length) {
    return { ok: false, error: 'CSV 为空，请至少提供 1 条数据。' }
  }

  return { ok: true, data: rows }
}

export const parseGeneCsv = (file: File): Promise<CsvResult> =>
  new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result) => {
        const parsed = handleResult(result)
        if (!parsed.ok) {
          resolve({ ok: false, error: 'CSV 解析失败，请检查文件格式（编码/分隔符等）。' })
          return
        }
        resolve(parsed)
      },
      error: () => {
        resolve({ ok: false, error: '无法读取文件，请重试或检查文件权限。' })
      },
    })
  })

