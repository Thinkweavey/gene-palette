export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const normalizeLog2 = (value: number, pseudoCount = 1) => Math.log2(value + pseudoCount)

export const computeStats = (values: number[]) => {
  if (!values.length) {
    return { mean: 0, std: 1, min: 0, max: 0 }
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance =
    values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / Math.max(values.length - 1, 1)
  const std = Math.sqrt(variance) || 1

  const min = Math.min(...values)
  const max = Math.max(...values)

  return { mean, std, min, max }
}

export const toZScore = (value: number, mean: number, std: number) => (value - mean) / std

export const scaleToRange = (
  value: number,
  min: number,
  max: number,
  newMin = 0,
  newMax = 1,
) => {
  if (max === min) return newMin
  const normalized = (value - min) / (max - min)
  return newMin + normalized * (newMax - newMin)
}

