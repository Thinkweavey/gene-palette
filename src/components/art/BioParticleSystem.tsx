/**
 * 基于生物学逻辑的粒子系统
 * 每个粒子代表一个基因，用通路关系驱动运动和颜色
 */

import { useEffect, useRef, useState } from 'react'
import type { GeneExpression } from '../../data/sampleGenes'
import { areInSamePathway } from '../../data/geneKnowledge'
import type { PaletteModeId } from '../../utils/color'
import type { PaletteGene } from '../../types/palette'

type Particle = {
  gene: GeneExpression
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  normalized: number
}

type BioParticleSystemProps = {
  genes: PaletteGene[]
  mode: PaletteModeId  // 保留用于未来扩展（根据模式改变粒子行为）
  width?: number  // 未使用，保留用于未来扩展
  height?: number  // 未使用，保留用于未来扩展
  onParticleClick?: (gene: GeneExpression) => void
}

const GRAVITY_STRENGTH = 0.0008  // 通路内基因的引力强度（减小，避免过度聚集）
const REPULSION_STRENGTH = 0.002  // 所有粒子之间的基础斥力（增大，防止重叠）
const DAMPING = 0.95  // 阻尼系数
const MIN_DISTANCE = 60  // 最小距离（增大，确保粒子不重叠：最大半径25*2+10余量）
const MAX_DISTANCE = 200  // 最大引力距离

export function BioParticleSystem({
  genes,
  mode: _mode, // 保留用于未来扩展（根据模式改变粒子行为）
  width: _propWidth, // 未使用，保留用于未来扩展
  height: _propHeight, // 未使用，保留用于未来扩展
  onParticleClick,
}: BioParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])
  const selectedGeneRef = useRef<GeneExpression | null>(null)
  const [selectedGene, setSelectedGene] = useState<GeneExpression | null>(null)
  
  // 完全固定的尺寸，只在首次加载时计算一次，之后不再改变
  const dimensionsRef = useRef<{ width: number; height: number } | null>(null)
  const dimensionsInitializedRef = useRef(false)

  // 同步 selectedGene 到 ref（用于动画循环，避免重启动画）
  useEffect(() => {
    selectedGeneRef.current = selectedGene
    // 不触发任何副作用，只更新 ref
  }, [selectedGene])

  // 一次性初始化画布尺寸（只在组件挂载时执行一次）
  useEffect(() => {
    if (dimensionsInitializedRef.current) return  // 已经初始化过，不再执行
    if (!containerRef.current) return

    const initDimensions = () => {
      if (!containerRef.current || !canvasRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      // containerRef 是 flex 容器，应该填满父容器
      // 使用容器的实际尺寸作为画布的逻辑尺寸，确保一一对应
      const width = Math.floor(rect.width) || 600
      const height = Math.floor(rect.height) || 400

      if (width > 100 && height > 100) {
        dimensionsRef.current = { width, height }
        dimensionsInitializedRef.current = true

        // 立即设置画布的逻辑尺寸（width/height 属性）
        // 这必须和容器的实际尺寸匹配，否则画布会被拉伸或缩小
        canvasRef.current.width = width
        canvasRef.current.height = height
        
        // 确保画布在容器中居中（通过 CSS 的 flex 布局实现）
        // 这样画布的逻辑尺寸和显示尺寸就完全匹配了
      }
    }

    // 延迟初始化，确保布局完成，可能需要多次尝试
    let attemptCount = 0
    const maxAttempts = 10
    
    const tryInit = () => {
      if (dimensionsInitializedRef.current || attemptCount >= maxAttempts) return
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect && rect.width > 100 && rect.height > 100) {
        initDimensions()
      } else {
        attemptCount++
        setTimeout(tryInit, 50)
      }
    }

    const timeoutId = setTimeout(tryInit, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])  // 空依赖数组，只在挂载时执行一次

  // 初始化粒子（只在基因列表变化时初始化，确保画布尺寸已设置）
  useEffect(() => {
    if (!canvasRef.current || genes.length === 0) return

    const canvas = canvasRef.current

    // 获取画布尺寸（优先使用画布实际尺寸，最准确）
    let currentWidth = canvas.width || dimensionsRef.current?.width || 600
    let currentHeight = canvas.height || dimensionsRef.current?.height || 400

    // 如果画布尺寸还没设置，从容器获取（作为临时值）
    if ((!currentWidth || currentWidth < 100) && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      currentWidth = Math.floor(rect.width) || 600
    }
    if ((!currentHeight || currentHeight < 100) && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      currentHeight = Math.floor(rect.height) || 400
    }

    // 确保尺寸有效
    if (currentWidth < 100) currentWidth = 600
    if (currentHeight < 100) currentHeight = 400

    // 如果粒子已存在且基因列表匹配，只更新颜色和数值，绝对不重置位置
    const existingParticles = particlesRef.current
    if (
      existingParticles.length === genes.length &&
      existingParticles.every((p, i) => p.gene.symbol === genes[i]?.symbol)
    ) {
      // 只更新颜色和数值，保留所有位置和速度信息
      particlesRef.current = existingParticles.map((p, i) => ({
        ...p,
        gene: genes[i],  // 更新基因对象（可能包含新的 description）
        color: genes[i].color.hex,
        normalized: genes[i].normalized,
      }))
      return
    }

    // 只在基因列表完全改变时创建新粒子
    const normalizedValues = genes.map(g => g.normalized)
    const minNorm = Math.min(...normalizedValues)
    const maxNorm = Math.max(...normalizedValues)
    const normRange = maxNorm - minNorm || 1

    // 使用画布的逻辑中心点（width/2, height/2），这是画布的实际中心
    const margin = 40  // 边界缓冲区，确保粒子不会贴边
    const centerX = currentWidth / 2  // 画布的逻辑中心 X
    const centerY = currentHeight / 2  // 画布的逻辑中心 Y
    
    // 增大初始分布半径，确保粒子分散，避免重叠
    const maxParticleRadius = 25
    const availableWidth = currentWidth - margin * 2 - maxParticleRadius * 2
    const availableHeight = currentHeight - margin * 2 - maxParticleRadius * 2
    // 增大分布半径到50%，让粒子更分散
    const distributionRadius = Math.max(80, Math.min(availableWidth, availableHeight) * 0.5)

    particlesRef.current = genes.map((gene, i) => {
      const angle = (i / genes.length) * Math.PI * 2
      const normalizedRatio = normRange > 0 ? (gene.normalized - minNorm) / normRange : 0.5
      const particleRadius = Math.max(8, 8 + normalizedRatio * 17)
      
      // 从画布中心开始分布
      const initialX = centerX + Math.cos(angle) * distributionRadius
      const initialY = centerY + Math.sin(angle) * distributionRadius
      
      // 边界检查，确保粒子初始位置在画布的逻辑边界内
      const minX = margin + particleRadius
      const maxX = currentWidth - margin - particleRadius
      const minY = margin + particleRadius
      const maxY = currentHeight - margin - particleRadius
      
      const safeX = Math.max(minX, Math.min(maxX, initialX))
      const safeY = Math.max(minY, Math.min(maxY, initialY))
      
      return {
        gene,
        x: safeX,
        y: safeY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: particleRadius,
        color: gene.color.hex,
        normalized: gene.normalized,
      }
    })
  }, [genes])  // 只在基因列表变化时执行，完全不依赖尺寸

  // 动画循环（使用固定的尺寸，完全不依赖 state）
  useEffect(() => {
    if (!canvasRef.current || particlesRef.current.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 获取固定尺寸（从 ref 或画布实际尺寸）
    const dims = dimensionsRef.current || { width: canvas.width || 600, height: canvas.height || 400 }
    const width = dims.width
    const height = dims.height

    if (width === 0 || height === 0) return

    const margin = 40  // 增大边界缓冲区，确保大粒子（半径最大25）也不会贴边或越界

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current

      // 更新粒子位置（基于生物学逻辑的力）
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        
        // 边界反弹（带缓冲区，确保粒子始终在可视区域内，包括粒子的完整半径）
        const minX = margin + p1.radius
        const maxX = width - margin - p1.radius
        const minY = margin + p1.radius
        const maxY = height - margin - p1.radius

        if (p1.x < minX || p1.x > maxX) {
          p1.vx *= -0.8
          p1.x = Math.max(minX, Math.min(maxX, p1.x))
        }
        if (p1.y < minY || p1.y > maxY) {
          p1.vy *= -0.8
          p1.y = Math.max(minY, Math.min(maxY, p1.y))
        }

        // 基于生物学逻辑的相互作用
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          // 所有粒子之间的基础斥力（防止重叠，这是最重要的）
          const minSeparation = p1.radius + p2.radius + 10  // 最小分离距离（两个粒子半径之和 + 10px余量）
          if (distance < MIN_DISTANCE || distance < minSeparation) {
            const force = REPULSION_STRENGTH * (1 / (distance / 30 + 0.1)) * (1 - distance / MIN_DISTANCE)
            const angle = Math.atan2(dy, dx)
            p1.vx -= Math.cos(angle) * force
            p1.vy -= Math.sin(angle) * force
            p2.vx += Math.cos(angle) * force
            p2.vy += Math.sin(angle) * force
          }

          // 通路内基因：引力（生物学逻辑：相关基因聚集）
          if (areInSamePathway(p1.gene.symbol, p2.gene.symbol)) {
            // 只有当距离足够大时才有引力（避免与斥力冲突）
            if (distance > minSeparation && distance < MAX_DISTANCE) {
              const force = GRAVITY_STRENGTH / (distance / 100 + 0.1)
              const angle = Math.atan2(dy, dx)
              p1.vx += Math.cos(angle) * force
              p1.vy += Math.sin(angle) * force
              p2.vx -= Math.cos(angle) * force
              p2.vy -= Math.sin(angle) * force

              // 绘制连线（通路关系）
              ctx.strokeStyle = `rgba(127, 90, 240, ${0.3 * (1 - distance / MAX_DISTANCE)})`
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }
        }

        // 应用速度
        p1.x += p1.vx
        p1.y += p1.vy
        p1.vx *= DAMPING
        p1.vy *= DAMPING

        // 绘制粒子（确保半径为正值，添加可见性增强）
        const drawRadius = Math.max(8, p1.radius)  // 最小8像素
        const isSelected = selectedGeneRef.current?.symbol === p1.gene.symbol
        
        // 添加发光效果（外圈阴影）
        ctx.shadowBlur = 10
        ctx.shadowColor = p1.color
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, drawRadius, 0, Math.PI * 2)
        
        // 绘制填充
        ctx.fillStyle = p1.color
        ctx.fill()
        
        // 重置阴影
        ctx.shadowBlur = 0
        
        // 添加描边（让粒子更明显）
        if (isSelected) {
          // 选中状态：亮绿色描边
          ctx.strokeStyle = '#00ffd0'
          ctx.lineWidth = 3
          ctx.stroke()
          // 添加外层光环
          ctx.beginPath()
          ctx.arc(p1.x, p1.y, drawRadius + 4, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 255, 208, 0.3)'
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          // 普通状态：淡白色描边，增加可见性
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // 绘制基因符号标签
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(p1.gene.symbol, p1.x, p1.y + p1.radius + 12)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [genes])  // 只在基因列表变化时重启动画，完全不依赖尺寸和选择状态

  // 点击检测
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedParticle = particlesRef.current.find(p => {
      const dx = p.x - x
      const dy = p.y - y
      return Math.sqrt(dx * dx + dy * dy) < p.radius + 10
    })

    if (clickedParticle) {
      setSelectedGene(clickedParticle.gene)
      onParticleClick?.(clickedParticle.gene)
    } else {
      setSelectedGene(null)
    }
  }

  // 获取固定尺寸（优先使用 ref，如果没有则使用默认值）
  const canvasWidth = dimensionsRef.current?.width || 600
  const canvasHeight = dimensionsRef.current?.height || 400

  return (
    <div ref={containerRef} className="relative h-full w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleClick}
        className="cursor-pointer rounded-2xl border border-white/10"
        style={{ 
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'block',  // 确保canvas不产生内联空隙
          // 不使用 CSS 缩放，确保逻辑尺寸和显示尺寸一致
          // 画布的 width/height 属性应该和容器的实际尺寸匹配
        }}
      />
    </div>
  )
}

