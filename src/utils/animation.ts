import type { TimelineData, AnimationFrame } from '../types/timeline'
import type { GeneExpression } from '../data/sampleGenes'

/**
 * 在两个基因表达数据集之间进行线性插值
 */
export function interpolateGenes(
  genesA: GeneExpression[],
  genesB: GeneExpression[],
  t: number // 0-1 之间的插值参数
): GeneExpression[] {
  // 确保两个数据集包含相同的基因
  const geneMap = new Map<string, { a?: GeneExpression; b?: GeneExpression }>()
  
  genesA.forEach(gene => {
    geneMap.set(gene.symbol, { a: gene, ...geneMap.get(gene.symbol) })
  })
  
  genesB.forEach(gene => {
    geneMap.set(gene.symbol, { b: gene, ...geneMap.get(gene.symbol) })
  })

  const interpolatedGenes: GeneExpression[] = []
  
  geneMap.forEach(({ a, b }, symbol) => {
    if (a && b) {
      // 线性插值
      const interpolatedValue = a.value + (b.value - a.value) * t
      interpolatedGenes.push({
        symbol,
        value: interpolatedValue,
        description: a.description || b.description,
      })
    } else if (a) {
      // 只有A，使用A的值
      interpolatedGenes.push({ ...a })
    } else if (b) {
      // 只有B，使用B的值
      interpolatedGenes.push({ ...b })
    }
  })

  return interpolatedGenes
}

/**
 * 生成动画帧序列
 */
export function generateAnimationFrames(
  timeline: TimelineData,
  fps: number = 30
): AnimationFrame[] {
  const frames: AnimationFrame[] = []
  const totalFrames = Math.ceil(timeline.totalDuration * fps)
  const timePoints = timeline.timePoints.sort((a, b) => a.timestamp - b.timestamp)

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const currentTime = (frameIndex / totalFrames) * timeline.totalDuration
    
    // 找到当前时间对应的时间点区间
    let currentTimePointIndex = 0
    for (let i = 0; i < timePoints.length - 1; i++) {
      const currentPoint = timePoints[i]
      const nextPoint = timePoints[i + 1]
      
      if (currentTime >= currentPoint.timestamp && currentTime <= nextPoint.timestamp) {
        currentTimePointIndex = i
        break
      }
    }

    const currentTimePoint = timePoints[currentTimePointIndex]
    const nextTimePoint = timePoints[currentTimePointIndex + 1]

    if (!nextTimePoint) {
      // 最后一个时间点，不需要插值
      frames.push({
        timePoint: currentTimePoint,
        progress: 1,
        interpolatedGenes: currentTimePoint.genes,
      })
    } else {
      // 计算插值进度
      const segmentDuration = nextTimePoint.timestamp - currentTimePoint.timestamp
      const segmentProgress = segmentDuration > 0 
        ? (currentTime - currentTimePoint.timestamp) / segmentDuration 
        : 0

      // 生成插值基因数据
      const interpolatedGenes = interpolateGenes(
        currentTimePoint.genes,
        nextTimePoint.genes,
        segmentProgress
      )

      frames.push({
        timePoint: currentTimePoint,
        progress: segmentProgress,
        interpolatedGenes,
      })
    }
  }

  return frames
}

/**
 * 缓动函数 - 让动画更自然
 */
export const easingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
}

/**
 * 应用缓动函数到插值
 */
export function applyEasing(
  genesA: GeneExpression[],
  genesB: GeneExpression[],
  t: number,
  easingFunction: (t: number) => number = easingFunctions.easeInOut
): GeneExpression[] {
  const easedT = easingFunction(t)
  return interpolateGenes(genesA, genesB, easedT)
}

/**
 * 计算动画统计信息
 */
export function calculateAnimationStats(timeline: TimelineData) {
  const allGenes = new Set<string>()
  let minValue = Infinity
  let maxValue = -Infinity

  timeline.timePoints.forEach(timePoint => {
    timePoint.genes.forEach(gene => {
      allGenes.add(gene.symbol)
      minValue = Math.min(minValue, gene.value)
      maxValue = Math.max(maxValue, gene.value)
    })
  })

  return {
    uniqueGenes: Array.from(allGenes),
    geneCount: allGenes.size,
    valueRange: { min: minValue, max: maxValue },
    duration: timeline.totalDuration,
    timePointCount: timeline.timePoints.length,
  }
}

