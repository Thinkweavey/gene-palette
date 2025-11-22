import type { GeneExpression } from '../data/sampleGenes'

export type TimePoint = {
  id: string
  label: string // e.g., "0h", "6h", "12h", "24h"
  timestamp: number // hours or arbitrary time units
  genes: GeneExpression[]
}

export type TimelineData = {
  title: string
  description: string
  timePoints: TimePoint[]
  totalDuration: number // in seconds for animation
}

export type AnimationFrame = {
  timePoint: TimePoint
  progress: number // 0-1, interpolation progress to next frame
  interpolatedGenes?: GeneExpression[] // interpolated values between time points
}

export type AnimationState = {
  isPlaying: boolean
  currentFrame: number
  totalFrames: number
  fps: number
  loop: boolean
}

