import { toPng } from 'html-to-image'
import type { PaletteGene } from '../types/palette'

export const downloadJSON = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const buildPalettePayload = (genes: PaletteGene[]) =>
  genes.map((gene) => ({
    symbol: gene.symbol,
    value: Number(gene.value.toFixed(3)),
    zScore: Number(gene.normalized.toFixed(3)),
    percentile: Number(gene.percentile.toFixed(3)),
    colorHex: gene.color.hex,
  }))

export const downloadPNG = async (node: HTMLElement | null, filename: string) => {
  if (!node) return
  const dataUrl = await toPng(node, {
    cacheBust: true,
    backgroundColor: '#030712',
    style: {
      transform: 'scale(1)',
    },
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

