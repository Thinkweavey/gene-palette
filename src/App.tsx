import { useMemo, useRef, useState } from 'react'
import { sampleGenes, type GeneExpression } from './data/sampleGenes'
import { mapValueToColor, type PaletteModeId } from './utils/color'
import { downloadJSON, downloadPNG, buildPalettePayload } from './utils/export'
import { parseGeneCsv } from './utils/csv'
import { computeStats, scaleToRange, toZScore } from './utils/math'
import type { PaletteGene } from './types/palette'
import type { TimelineData } from './types/timeline'
import { BioParticleSystem } from './components/art/BioParticleSystem'
import { DataStoryExplainer } from './components/art/DataStoryExplainer'
import { PosterPreview } from './components/poster/PosterPreview'
import { TimelineAnimator } from './components/animation/TimelineAnimator'
import { TimelineUploader } from './components/animation/TimelineUploader'
import { sampleTimelineData, cancerProgressionTimeline } from './data/sampleTimeline'
type NormalizedGene = Omit<PaletteGene, 'color'>

const paletteModes: Array<{
  id: PaletteModeId
  name: string
  description: string
  gradient: string
}> = [
  {
    id: 'aurora',
    name: 'Aurora Flux',
    description: 'Warm up-regulation, cool down-regulation',
    gradient: 'from-aurora to-plasma',
  },
  {
    id: 'ion',
    name: 'Ion Drift',
    description: 'High variance pops with neon plasma edge',
    gradient: 'from-ion to-aurora',
  },
  {
    id: 'void',
    name: 'Void Bloom',
    description: 'Muted lows with sharp violet peaks',
    gradient: 'from-slate-500 to-aurora',
  },
]

function App() {
  const [mode, setMode] = useState(paletteModes[0].id)
  const [source, setSource] = useState<'sample' | 'custom'>('sample')
  const [customGenes, setCustomGenes] = useState<GeneExpression[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedGene, setSelectedGene] = useState<GeneExpression | null>(null)
  
  // 时间线动画相关状态
  const [activeTimeline, setActiveTimeline] = useState<TimelineData | null>(null)
  const [timelineSource, setTimelineSource] = useState<'sample1' | 'sample2' | 'custom'>('sample1')
  const [timelineError, setTimelineError] = useState<string | null>(null)
  
  const previewRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeGenes = source === 'custom' ? customGenes : sampleGenes
  const stats = useMemo(() => computeStats(activeGenes.map((gene) => gene.value)), [activeGenes])
  const normalizedGenes = useMemo<NormalizedGene[]>(
    () =>
      activeGenes.map((gene) => ({
        ...gene,
        normalized: toZScore(gene.value, stats.mean, stats.std),
        percentile: scaleToRange(gene.value, stats.min, stats.max, 0, 1),
      })),
    [activeGenes, stats],
  )

  const featuredGenes = useMemo(() => normalizedGenes.slice(0, 4), [normalizedGenes])
  const averageExpression = useMemo(
    () => activeGenes.reduce((acc, gene) => acc + gene.value, 0) / activeGenes.length,
    [activeGenes],
  )

  const palette = useMemo(
    () =>
      normalizedGenes.map((gene) => ({
        ...gene,
        color: mapValueToColor(gene.normalized, mode),
      })),
    [normalizedGenes, mode],
  )

  const activeMode = useMemo(() => paletteModes.find((p) => p.id === mode), [mode])
  const selectedPaletteGene = useMemo(() => {
    if (!selectedGene) return null
    return palette.find((gene) => gene.symbol === selectedGene.symbol) ?? null
  }, [selectedGene, palette])
  const posterPrimaryGene = selectedPaletteGene ?? palette[0] ?? null

  // 时间线数据管理
  const currentTimeline = useMemo(() => {
    switch (timelineSource) {
      case 'sample1':
        return sampleTimelineData
      case 'sample2':
        return cancerProgressionTimeline
      case 'custom':
        return activeTimeline
      default:
        return sampleTimelineData
    }
  }, [timelineSource, activeTimeline])

  const handleTimelineLoad = (timeline: TimelineData) => {
    setActiveTimeline(timeline)
    setTimelineSource('custom')
    setTimelineError(null)
  }

  const handleTimelineError = (error: string) => {
    setTimelineError(error)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-night text-slate-100">
      <div className="absolute inset-0 bg-grid-glow bg-grid-sm opacity-40" />
      <div className="absolute inset-0 blur-[180px]">
        <div className="absolute -top-20 left-32 h-64 w-64 rounded-full bg-aurora/30" />
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-plasma/25" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[1600px] space-y-10 px-4 py-12 xl:px-6">
        {/* 上栏：三列布局（控制台 + 粒子画布 + 数据故事） */}
        <section className="grid gap-4 md:gap-6 lg:grid-cols-[300px,1fr,360px] xl:grid-cols-[320px,1fr,380px] xl:gap-8">
          {/* 左栏：控制台 */}
          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-4 shadow-2xl shadow-aurora/10 backdrop-blur-2xl md:p-6 lg:p-8">
            <header className="mb-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Lab Console</p>
              <h1 className="font-display text-2xl text-white lg:text-3xl">Gene Flux Palette</h1>
              <p className="text-sm leading-relaxed text-slate-400">
                Prototype interface for translating expression matrices into chromatic systems.
              </p>
            </header>

            <div className="mb-6 space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Dataset</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-white drop-shadow-glow lg:text-3xl">
                    {activeGenes.length}
                  </span>
                  <span className="text-xs text-slate-400">genes</span>
                </div>
                <p className="mt-2 text-xs">
                  Avg expression <span className="text-plasma">{averageExpression.toFixed(2)}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Data source</p>
                <p className="mt-2 font-mono text-sm text-plasma">
                  {source === 'sample' ? 'Built-in sample' : 'Custom CSV'}
                </p>
                {source === 'custom' && (
                  <button
                    className="mt-3 w-full rounded-xl border border-plasma/30 bg-white/5 px-3 py-2 text-xs text-plasma transition hover:bg-white/10"
                    onClick={() => {
                      setSource('sample')
                      setUploadError(null)
                    }}
                  >
                    还原示例数据
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Palette Modes</p>
              {paletteModes.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => setMode(palette.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                    mode === palette.id
                      ? 'border-plasma/50 bg-gradient-to-r from-white/10 to-white/5 shadow-lg shadow-plasma/20'
                      : 'border-white/5 bg-slate-950/40 hover:border-plasma/30 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`h-2 rounded-full bg-gradient-to-r ${palette.gradient}`} />
                  <p className="mt-2 font-medium text-white">{palette.name}</p>
                  <p className="text-xs text-slate-400">{palette.description}</p>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Featured genes</p>
              <div className="mt-3 space-y-2">
                {featuredGenes.map((gene) => (
                  <div
                    key={gene.symbol}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/40 px-3 py-2"
                  >
                    <div>
                      <p className="font-mono text-sm text-plasma">{gene.symbol}</p>
                      <p className="text-xs text-slate-400">{gene.description}</p>
                    </div>
                    <p className="font-semibold text-white">{gene.value.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Upload CSV</p>
              <div className="mt-2 rounded-2xl border border-dashed border-plasma/40 bg-white/[0.04] p-4">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const result = await parseGeneCsv(file)
                    if (result.ok) {
                      setCustomGenes(result.data)
                      setSource('custom')
                      setUploadError(null)
                    } else {
                      setUploadError(result.error)
                    }
                    if (inputRef.current) {
                      inputRef.current.value = ''
                    }
                  }}
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-white/10 px-3 py-2 text-sm text-white transition hover:border-plasma/60 hover:shadow-lg hover:shadow-plasma/20"
                >
                  选择 CSV 文件
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  需要列：symbol / value / description。value 需为数字；建议 1~200 行。
                </p>
                {uploadError && (
                  <p className="mt-2 text-xs text-rose-300">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 中栏：粒子画布 */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-4 shadow-2xl shadow-ion/10 backdrop-blur-3xl md:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Art Generator</p>
                <h2 className="font-display text-2xl text-white drop-shadow-glow lg:text-3xl">
                  生物学驱动的艺术生成
                </h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  每个粒子代表一个基因，用生物学通路关系驱动运动和颜色。点击粒子查看科学解释。
                </p>
              </div>
              <div className="rounded-2xl border border-plasma/30 bg-slate-950/60 px-4 py-3 text-right sm:flex-shrink-0">
                <p className="text-xs text-slate-400">Active mode</p>
                <p className="mt-1 font-display text-lg text-plasma lg:text-xl">{activeMode?.name}</p>
              </div>
            </div>

            {/* 粒子系统画布 */}
            <div
              ref={previewRef}
              className="relative min-h-[500px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-6 lg:min-h-[600px] lg:p-8"
            >
              <BioParticleSystem
                genes={palette}
                mode={mode}
                onParticleClick={(gene) => {
                  setSelectedGene(gene)
                  const matched = palette.find(p => p.symbol === gene.symbol)
                  if (matched) {
                    setSelectedGene(matched)
                  }
                }}
              />
            </div>

            {/* 导出按钮 */}
            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/5 pt-6">
              <button
                onClick={() => downloadJSON('gene-palette.json', buildPalettePayload(palette))}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-plasma/40 hover:bg-white/[0.08] hover:text-plasma"
              >
                Export palette JSON
              </button>
              <button
                onClick={() => downloadPNG(previewRef.current, 'gene-art.png')}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-plasma/40 hover:bg-white/[0.08] hover:text-plasma"
              >
                Export art PNG
              </button>
            </div>
          </div>

          {/* 右栏：数据故事解释器 */}
          <div className="flex flex-col space-y-4 lg:space-y-6">
            <DataStoryExplainer
              gene={selectedGene}
              normalized={selectedGene ? palette.find(p => p.symbol === selectedGene.symbol)?.normalized || 0 : 0}
              color={selectedGene ? palette.find(p => p.symbol === selectedGene.symbol)?.color.hex || '#ffffff' : '#ffffff'}
            />

            {/* 色卡网格 */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 lg:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">基因色卡</p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 lg:gap-3">
                {palette.slice(0, 10).map((gene) => (
                  <button
                    key={gene.symbol}
                    onClick={() => setSelectedGene(gene)}
                    className={`group relative h-10 rounded-xl border-2 transition lg:h-12 ${
                      selectedGene?.symbol === gene.symbol
                        ? 'border-plasma shadow-lg shadow-plasma/50'
                        : 'border-white/10 hover:border-plasma/40'
                    }`}
                    style={{ backgroundColor: gene.color.hex }}
                    title={`${gene.symbol}: ${gene.value.toFixed(2)}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                      {gene.symbol}
                    </span>
        </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 下栏：科研海报模板 */}
        <section className="w-full rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl shadow-plasma/10 backdrop-blur-2xl lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Poster Builder</p>
              <h2 className="mt-2 font-display text-2xl text-white lg:text-3xl">科研海报模板</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                自动将当前调色板与基因故事排版成科普/科研海报，可用于演示、社交媒体或文档封面。
        </p>
      </div>
            <button
              onClick={() => downloadPNG(posterRef.current, 'gene-poster.png')}
              className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-plasma/40 hover:bg-white/[0.08] hover:text-plasma md:mt-0"
            >
              Export poster PNG
            </button>
          </div>

          <div ref={posterRef}>
            <PosterPreview palette={palette} primaryGene={posterPrimaryGene} modeName={activeMode?.name} />
          </div>
        </section>

        {/* 时间线动画生成器 */}
        <section className="w-full rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl shadow-ion/10 backdrop-blur-2xl lg:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Timeline Animation</p>
              <h2 className="mt-2 font-display text-2xl text-white lg:text-3xl">基因电影生成器</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                输入多组时间序列数据，生成动态艺术动画，讲述"细胞的一生"。
              </p>
            </div>
            <button
              onClick={() => downloadPNG(animationRef.current, 'gene-animation.png')}
              className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-plasma/40 hover:bg-white/[0.08] hover:text-plasma md:mt-0"
            >
              Export frame PNG
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            {/* 动画播放器 */}
            <div ref={animationRef}>
              {currentTimeline && (
                <TimelineAnimator
                  timeline={currentTimeline}
                  mode={mode}
                  onFrameChange={(frame, frameIndex) => {
                    // 可以在这里处理帧变化事件
                    console.log(`Frame ${frameIndex}:`, frame.timePoint.label)
                  }}
                />
              )}
            </div>

            {/* 控制面板 */}
            <div className="space-y-6">
              {/* 示例数据选择 */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">示例时间线</p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setTimelineSource('sample1')
                      setTimelineError(null)
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      timelineSource === 'sample1'
                        ? 'border-plasma/50 bg-plasma/10 text-plasma'
                        : 'border-white/10 bg-slate-950/40 text-white hover:border-plasma/30'
                    }`}
                  >
                    <p className="font-medium">细胞分化时间序列</p>
                    <p className="text-xs opacity-80">干细胞 → 神经元分化过程</p>
                  </button>

                  <button
                    onClick={() => {
                      setTimelineSource('sample2')
                      setTimelineError(null)
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      timelineSource === 'sample2'
                        ? 'border-plasma/50 bg-plasma/10 text-plasma'
                        : 'border-white/10 bg-slate-950/40 text-white hover:border-plasma/30'
                    }`}
                  >
                    <p className="font-medium">肿瘤进展时间序列</p>
                    <p className="text-xs opacity-80">正常细胞 → 恶性肿瘤转化</p>
                  </button>
                </div>
              </div>

              {/* 时间线信息 */}
              {currentTimeline && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">当前时间线</p>
                  <h4 className="font-medium text-white mb-2">{currentTimeline.title}</h4>
                  <p className="text-sm text-slate-300 mb-4">{currentTimeline.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">时间点数量:</span>
                      <span className="text-white">{currentTimeline.timePoints.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">动画时长:</span>
                      <span className="text-white">{currentTimeline.totalDuration}秒</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">基因数量:</span>
                      <span className="text-white">
                        {currentTimeline.timePoints[0]?.genes.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 自定义上传 */}
              <TimelineUploader
                onTimelineLoad={handleTimelineLoad}
                onError={handleTimelineError}
              />

              {/* 错误显示 */}
              {timelineError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm text-red-300">{timelineError}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
