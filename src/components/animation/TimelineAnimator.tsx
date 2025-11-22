import { useEffect, useRef, useState, useCallback } from 'react'
import type { TimelineData, AnimationState, AnimationFrame } from '../../types/timeline'
import type { PaletteModeId } from '../../utils/color'
import { generateAnimationFrames, calculateAnimationStats } from '../../utils/animation'
import { mapValueToColor } from '../../utils/color'
import { computeStats, toZScore } from '../../utils/math'
import { getGenePathways } from '../../data/geneKnowledge'

type TimelineAnimatorProps = {
  timeline: TimelineData
  mode: PaletteModeId
  onFrameChange?: (frame: AnimationFrame, frameIndex: number) => void
}

type AnimatedParticle = {
  symbol: string
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  radius: number
  targetRadius: number
  color: string
  targetColor: string
  value: number
  normalized: number
  trail: Array<{ x: number; y: number; alpha: number }>
}

const ANIMATION_CONFIG = {
  fps: 30,
  particleCount: 50,
  trailLength: 8,
  transitionSpeed: 0.15,
  minRadius: 6,
  maxRadius: 25,
  canvasWidth: 800,
  canvasHeight: 600,
}

export function TimelineAnimator({ timeline, mode, onFrameChange }: TimelineAnimatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<AnimatedParticle[]>([])
  const framesRef = useRef<AnimationFrame[]>([])
  
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentFrame: 0,
    totalFrames: 0,
    fps: ANIMATION_CONFIG.fps,
    loop: true,
  })

  const [currentTimePoint, setCurrentTimePoint] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)

  // 生成动画帧
  useEffect(() => {
    const frames = generateAnimationFrames(timeline, ANIMATION_CONFIG.fps)
    framesRef.current = frames
    setAnimationState(prev => ({ ...prev, totalFrames: frames.length }))
  }, [timeline])

  // 初始化粒子
  const initializeParticles = useCallback(() => {
    if (!timeline.timePoints.length) return

    const stats = calculateAnimationStats(timeline)
    const firstTimePoint = timeline.timePoints[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = ANIMATION_CONFIG.canvasWidth / 2
    const centerY = ANIMATION_CONFIG.canvasHeight / 2
    const distributionRadius = Math.min(ANIMATION_CONFIG.canvasWidth, ANIMATION_CONFIG.canvasHeight) * 0.3

    const particles: AnimatedParticle[] = stats.uniqueGenes.map((symbol, index) => {
      const angle = (index / stats.uniqueGenes.length) * Math.PI * 2
      const gene = firstTimePoint.genes.find(g => g.symbol === symbol)
      const value = gene?.value || 0
      
      // 计算标准化值
      const allValues = firstTimePoint.genes.map(g => g.value)
      const geneStats = computeStats(allValues)
      const normalized = toZScore(value, geneStats.mean, geneStats.std)
      
      // 计算颜色和大小
      const color = mapValueToColor(normalized, mode)
      const radius = ANIMATION_CONFIG.minRadius + 
        ((normalized + 3) / 6) * (ANIMATION_CONFIG.maxRadius - ANIMATION_CONFIG.minRadius)

      const x = centerX + Math.cos(angle) * distributionRadius
      const y = centerY + Math.sin(angle) * distributionRadius

      return {
        symbol,
        x,
        y,
        targetX: x,
        targetY: y,
        vx: 0,
        vy: 0,
        radius: Math.max(ANIMATION_CONFIG.minRadius, radius),
        targetRadius: Math.max(ANIMATION_CONFIG.minRadius, radius),
        color: color.hex,
        targetColor: color.hex,
        value,
        normalized,
        trail: [],
      }
    })

    particlesRef.current = particles
  }, [timeline, mode])

  // 更新粒子状态
  const updateParticles = useCallback((frame: AnimationFrame) => {
    if (!frame.interpolatedGenes) return

    const allValues = frame.interpolatedGenes.map(g => g.value)
    const geneStats = computeStats(allValues)

    particlesRef.current.forEach(particle => {
      const gene = frame.interpolatedGenes!.find(g => g.symbol === particle.symbol)
      if (!gene) return

      // 更新数值和标准化值
      particle.value = gene.value
      particle.normalized = toZScore(gene.value, geneStats.mean, geneStats.std)

      // 更新目标颜色和大小
      const color = mapValueToColor(particle.normalized, mode)
      particle.targetColor = color.hex
      particle.targetRadius = Math.max(
        ANIMATION_CONFIG.minRadius,
        ANIMATION_CONFIG.minRadius + 
        ((particle.normalized + 3) / 6) * (ANIMATION_CONFIG.maxRadius - ANIMATION_CONFIG.minRadius)
      )

      // 基于生物学通路调整位置
      const pathways = getGenePathways(particle.symbol)
      if (pathways.length > 0) {
        // 有通路关系的基因会相互吸引
        const relatedParticles = particlesRef.current.filter(p => 
          p.symbol !== particle.symbol && 
          pathways.some(pathway => pathway.genes.includes(p.symbol))
        )

        if (relatedParticles.length > 0) {
          const avgX = relatedParticles.reduce((sum, p) => sum + p.x, 0) / relatedParticles.length
          const avgY = relatedParticles.reduce((sum, p) => sum + p.y, 0) / relatedParticles.length
          
          // 轻微向相关基因聚集
          particle.targetX += (avgX - particle.x) * 0.02
          particle.targetY += (avgY - particle.y) * 0.02
        }
      }

      // 平滑过渡
      particle.x += (particle.targetX - particle.x) * ANIMATION_CONFIG.transitionSpeed
      particle.y += (particle.targetY - particle.y) * ANIMATION_CONFIG.transitionSpeed
      particle.radius += (particle.targetRadius - particle.radius) * ANIMATION_CONFIG.transitionSpeed
      
      // 颜色插值（简化版，实际应该在RGB空间插值）
      if (particle.color !== particle.targetColor) {
        particle.color = particle.targetColor
      }

      // 更新轨迹
      particle.trail.unshift({ x: particle.x, y: particle.y, alpha: 1 })
      if (particle.trail.length > ANIMATION_CONFIG.trailLength) {
        particle.trail.pop()
      }
      
      // 更新轨迹透明度
      particle.trail.forEach((point, index) => {
        point.alpha = 1 - (index / ANIMATION_CONFIG.trailLength)
      })
    })
  }, [mode])

  // 渲染函数
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    // 清空画布
    ctx.fillStyle = 'rgba(3, 7, 18, 0.1)' // 轻微的拖尾效果
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制连接线（同一通路的基因）
    particlesRef.current.forEach(particle => {
      const pathways = getGenePathways(particle.symbol)
      pathways.forEach(pathway => {
        pathway.genes.forEach(geneSymbol => {
          if (geneSymbol === particle.symbol) return
          
          const relatedParticle = particlesRef.current.find(p => p.symbol === geneSymbol)
          if (!relatedParticle) return

          const distance = Math.sqrt(
            Math.pow(particle.x - relatedParticle.x, 2) + 
            Math.pow(particle.y - relatedParticle.y, 2)
          )

          if (distance < 200) { // 只绘制较近的连接
            ctx.strokeStyle = `rgba(127, 90, 240, ${0.2 * (1 - distance / 200)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(relatedParticle.x, relatedParticle.y)
            ctx.stroke()
          }
        })
      })
    })

    // 绘制粒子轨迹
    particlesRef.current.forEach(particle => {
      particle.trail.forEach((point, index) => {
        if (index === 0) return // 跳过当前位置
        
        ctx.beginPath()
        ctx.arc(point.x, point.y, particle.radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color}${Math.floor(point.alpha * 50).toString(16).padStart(2, '0')}`
        ctx.fill()
      })
    })

    // 绘制粒子
    particlesRef.current.forEach(particle => {
      // 发光效果
      ctx.shadowBlur = 15
      ctx.shadowColor = particle.color
      
      // 主粒子
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.fill()
      
      // 重置阴影
      ctx.shadowBlur = 0
      
      // 边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      // 基因标签
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(particle.symbol, particle.x, particle.y + particle.radius + 12)
    })
  }, [])

  // 动画循环
  const animate = useCallback(() => {
    if (!animationState.isPlaying) return

    const currentFrame = framesRef.current[animationState.currentFrame]
    if (currentFrame) {
      updateParticles(currentFrame)
      render()
      
      setCurrentTimePoint(currentFrame.timePoint.label)
      setProgress(currentFrame.progress)
      onFrameChange?.(currentFrame, animationState.currentFrame)
    }

    // 更新帧索引
    setAnimationState(prev => {
      let nextFrame = prev.currentFrame + 1
      if (nextFrame >= prev.totalFrames) {
        nextFrame = prev.loop ? 0 : prev.totalFrames - 1
        if (!prev.loop) {
          return { ...prev, currentFrame: nextFrame, isPlaying: false }
        }
      }
      return { ...prev, currentFrame: nextFrame }
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [animationState.isPlaying, animationState.currentFrame, animationState.totalFrames, animationState.loop, updateParticles, render, onFrameChange])

  // 控制函数
  const play = () => setAnimationState(prev => ({ ...prev, isPlaying: true }))
  const pause = () => setAnimationState(prev => ({ ...prev, isPlaying: false }))
  const reset = () => setAnimationState(prev => ({ ...prev, currentFrame: 0, isPlaying: false }))
  const toggleLoop = () => setAnimationState(prev => ({ ...prev, loop: !prev.loop }))

  // 初始化
  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  // 启动/停止动画
  useEffect(() => {
    if (animationState.isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, animationState.isPlaying])

  // 初始渲染
  useEffect(() => {
    if (!animationState.isPlaying && framesRef.current.length > 0) {
      const currentFrame = framesRef.current[animationState.currentFrame]
      if (currentFrame) {
        updateParticles(currentFrame)
        render()
      }
    }
  }, [animationState.currentFrame, updateParticles, render, animationState.isPlaying])

  return (
    <div className="flex flex-col space-y-4">
      {/* 画布 */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <canvas
          ref={canvasRef}
          width={ANIMATION_CONFIG.canvasWidth}
          height={ANIMATION_CONFIG.canvasHeight}
          className="block"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8), rgba(3, 7, 18, 0.95))',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        
        {/* 时间点指示器 */}
        <div className="absolute top-4 left-4 rounded-lg bg-slate-900/80 px-3 py-2 backdrop-blur-sm">
          <p className="text-xs text-slate-400">当前时间点</p>
          <p className="font-mono text-sm text-plasma">{currentTimePoint}</p>
          <p className="text-xs text-slate-500">进度: {Math.round(progress * 100)}%</p>
        </div>
      </div>

      {/* 控制面板 */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={animationState.isPlaying ? pause : play}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-plasma/30 bg-plasma/10 text-plasma transition hover:bg-plasma/20"
          >
            {animationState.isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={reset}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
          >
            ⏹️
          </button>

          <button
            onClick={toggleLoop}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              animationState.loop
                ? 'border-plasma/30 bg-plasma/10 text-plasma'
                : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            循环播放
          </button>
        </div>

        <div className="flex items-center space-x-4 text-sm text-slate-300">
          <span>
            帧: {animationState.currentFrame + 1} / {animationState.totalFrames}
          </span>
          <span>
            时长: {timeline.totalDuration}s
          </span>
          <span>
            FPS: {animationState.fps}
          </span>
        </div>
      </div>
    </div>
  )
}

