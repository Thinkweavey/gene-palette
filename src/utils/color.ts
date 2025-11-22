import chroma from 'chroma-js'
import { clamp } from './math'

export type PaletteModeId = 'aurora' | 'ion' | 'void'
export type GeneColorSample = {
  hex: string
  rgb: string
  luminance: number
}

const paletteScaleStops: Record<PaletteModeId, string[]> = {
  aurora: ['#152238', '#7f5af0', '#00ffd0'],
  ion: ['#041625', '#46c1ff', '#f5f3ff'],
  void: ['#111827', '#4338ca', '#f0abfc'],
}

const scaleCache: Partial<Record<PaletteModeId, chroma.Scale>> = {}

const getScale = (mode: PaletteModeId) => {
  if (!scaleCache[mode]) {
    scaleCache[mode] = chroma.scale(paletteScaleStops[mode]).domain([-2.5, 0, 2.5]).mode('lrgb')
  }
  return scaleCache[mode]!
}

export const mapValueToColor = (normalizedValue: number, mode: PaletteModeId): GeneColorSample => {
  const scale = getScale(mode)
  const clamped = clamp(normalizedValue, -3, 3)
  const color = scale(clamped)
  return {
    hex: color.hex(),
    rgb: color.rgb().join(','),
    luminance: color.luminance(),
  }
}

export const buildGradient = (values: number[], mode: PaletteModeId) => {
  if (!values.length) return 'linear-gradient(to right, #0f172a, #1f2937)'
  const scale = getScale(mode)
  const stops = values.map((val, idx) => {
    const color = scale(clamp(val, -3, 3))
    const position = Math.round((idx / Math.max(values.length - 1, 1)) * 100)
    return `${color.hex()} ${position}%`
  })
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

