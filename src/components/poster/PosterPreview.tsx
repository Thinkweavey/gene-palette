import { memo } from 'react'
import type { PaletteGene } from '../../types/palette'
import { geneStories, getGeneCategories, getGenePathways } from '../../data/geneKnowledge'

type PosterPreviewProps = {
  palette: PaletteGene[]
  primaryGene: PaletteGene | null
  modeName?: string
}

export const PosterPreview = memo(function PosterPreview({
  palette,
  primaryGene,
  modeName = 'Aurora Flux',
}: PosterPreviewProps) {
  const focusGene = primaryGene ?? palette[0]
  const fallbackStory = '探索基因表达数据与视觉艺术的跨界融合'
  const story = focusGene ? geneStories[focusGene.symbol] ?? focusGene.description ?? fallbackStory : fallbackStory
  const categories = focusGene ? getGeneCategories(focusGene.symbol) : []
  const pathways = focusGene ? getGenePathways(focusGene.symbol) : []
  const topPalette = palette.slice(0, 6)

  // 生成洞察信息
  const insights = [
    `基因 ${focusGene?.symbol || 'N/A'} 在当前样本中呈 ${focusGene && focusGene.normalized > 0 ? '高表达' : '低表达'} 状态 (log2 = ${focusGene?.value.toFixed(2) || 'N/A'})`,
    `该基因主要参与 ${categories.map(c => c.replace(/[_\s]+/g, ' ')).join(', ') || '多种生物学功能'}`,
    pathways.length > 0 ? `与 ${pathways.map(p => p.name).join(', ')} 通路相关联` : '参与重要的细胞信号通路',
    `通过 ${modeName} 调色模式，其表达强度被映射为 ${focusGene?.color.hex || '#ffffff'}`,
  ]

  return (
    <div className="relative h-[900px] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-night via-nebula to-night text-white shadow-2xl">
      {/* 背景网格效果 */}
      <div className="absolute inset-0 bg-grid-glow bg-grid-sm opacity-20" />
      
      {/* 背景光晕效果 */}
      <div className="absolute inset-0 blur-[120px]">
        <div className="absolute -top-10 left-20 h-40 w-40 rounded-full bg-aurora/30" />
        <div className="absolute top-20 right-20 h-48 w-48 rounded-full bg-plasma/25" />
        <div className="absolute bottom-20 left-1/2 h-32 w-32 rounded-full bg-ion/20" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-10">
        {/* 顶部标题区域 */}
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-plasma opacity-90">Gene Flux Palette Research</p>
          <h1 className="mt-3 font-display text-5xl font-bold text-white drop-shadow-glow">
            {focusGene ? `${focusGene.symbol} 表达谱艺术化研究` : 'Gene Expression Art Study'}
          </h1>
          <p className="mt-4 text-lg text-slate-300 opacity-90">
            {story}
          </p>
        </header>

        {/* 主要内容区域 */}
        <div className="flex flex-1 gap-8">
          {/* 左侧：调色板和洞察 */}
          <div className="flex w-2/5 flex-col space-y-6">
            {/* 调色板展示 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Color Narrative</p>
              <div className="mt-5 space-y-3">
                {topPalette.map((gene) => (
                  <div key={gene.symbol} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg border border-white/20 shadow-lg"
                        style={{ 
                          backgroundColor: gene.color.hex,
                          boxShadow: `0 0 15px ${gene.color.hex}40`
                        }}
                      />
                      <div>
                        <p className="font-mono text-sm font-semibold text-white">{gene.symbol}</p>
                        <p className="text-xs text-slate-400">log2: {gene.value.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-500">z-score</p>
                      <p className="font-mono text-sm text-slate-300">{gene.normalized.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心洞察 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Core Insights</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-plasma flex-shrink-0" />
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 右侧：焦点基因和功能信息 */}
          <div className="flex flex-1 flex-col space-y-6">
            {/* 焦点基因 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus Gene</p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-2xl border-2 border-white/20 shadow-2xl"
                  style={{ 
                    backgroundColor: focusGene?.color.hex || '#374151',
                    boxShadow: `0 0 30px ${focusGene?.color.hex || '#374151'}50`
                  }}
                />
                <div>
                  <h3 className="font-display text-3xl font-bold text-plasma">
                    {focusGene?.symbol || 'N/A'}
                  </h3>
                  <p className="text-sm text-slate-300">
                    Expression Level: {focusGene?.value.toFixed(2) || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Normalized Score: {focusGene?.normalized.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* 功能分类和通路 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Functional Context</p>
              
              {categories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-300 mb-3">Biological Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-aurora/20 px-3 py-1 text-xs font-medium text-aurora border border-aurora/30"
                      >
                        {category.replace(/[_\s]+/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pathways.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-300 mb-3">Associated Pathways</p>
                  <div className="space-y-2">
                    {pathways.map((pathway) => (
                      <div key={pathway.name} className="rounded-lg bg-slate-800/50 p-3">
                        <p className="text-sm font-medium text-ion">{pathway.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Related genes: {pathway.genes.filter(g => g !== focusGene?.symbol).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 技术信息 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Technical Details</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Palette Mode</p>
                  <p className="font-medium text-white">{modeName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Dataset Size</p>
                  <p className="font-medium text-white">{palette.length} genes</p>
                </div>
                <div>
                  <p className="text-slate-400">Color Space</p>
                  <p className="font-medium text-white">LCH Perceptual</p>
                </div>
                <div>
                  <p className="text-slate-400">Normalization</p>
                  <p className="font-medium text-white">Z-Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <footer className="mt-8 text-center">
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 px-6 py-4">
            <p className="text-xs text-slate-400">
              Generated by Gene Flux Palette • Transforming biological data into visual narratives • {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
})

