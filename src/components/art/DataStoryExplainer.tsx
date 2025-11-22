/**
 * 数据故事解释器
 * 自动解释艺术图形的科学意义
 */

import type { GeneExpression } from '../../data/sampleGenes'
import { getGeneCategories, getGenePathways, geneStories, getCategoryColorHint } from '../../data/geneKnowledge'

type DataStoryExplainerProps = {
  gene: GeneExpression | null
  normalized: number
  color: string
}

export function DataStoryExplainer({ gene, normalized, color }: DataStoryExplainerProps) {
  if (!gene) {
    return (
      <div className="min-h-[400px] rounded-2xl border border-white/10 bg-slate-950/60 p-7 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">数据故事</p>
        <p className="mt-5 text-sm leading-relaxed text-slate-400">
          点击粒子查看基因的科学意义和生物学功能解释。
        </p>
      </div>
    )
  }

  const categories = getGeneCategories(gene.symbol)
  const pathways = getGenePathways(gene.symbol)
  const story = geneStories[gene.symbol] || gene.description || '功能待补充'

  // 计算表达状态
  const expressionStatus = normalized > 0.6 
    ? '高表达' 
    : normalized > 0.3 
    ? '中等表达' 
    : '低表达'

  return (
    <div className="min-h-[400px] rounded-2xl border border-white/10 bg-slate-950/60 p-7 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">数据故事</p>
          <h3 className="mt-3 font-display text-2xl text-plasma">{gene.symbol}</h3>
        </div>
        <div 
          className="h-14 w-14 rounded-full border-2 border-white/20 shadow-lg shadow-plasma/30"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="space-y-5">
        {/* 表达状态 */}
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-500">表达状态</p>
          <p className="mt-2 text-sm text-white">
            <span className="font-semibold">{expressionStatus}</span>
            {' '}
            <span className="text-slate-400">(log2 = {gene.value.toFixed(2)})</span>
          </p>
        </div>

        {/* 生物学故事 */}
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-500">生物学意义</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{story}</p>
        </div>

        {/* 功能类别 */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500">功能类别</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map(cat => (
                <span
                  key={cat}
                  className="rounded-lg border border-plasma/30 bg-plasma/10 px-2 py-1 text-xs text-plasma"
                >
                  {cat.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 参与通路 */}
        {pathways.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500">参与通路</p>
            <div className="mt-3 space-y-2">
              {pathways.map(pathway => (
                <div key={pathway.name} className="text-sm leading-relaxed text-slate-300">
                  <span className="font-medium text-plasma">{pathway.name}</span>
                  {' - '}
                  <span className="text-slate-400">
                    {pathway.genes.filter(g => g !== gene.symbol).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 颜色解释 */}
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-500">颜色映射</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            基于 {categories[0] ? getCategoryColorHint(categories[0]) : '表达强度'} 
            {' '}生成。颜色越 {normalized > 0.5 ? '亮' : '暗'}，表示表达越 
            {normalized > 0.5 ? '高' : '低'}。
          </p>
        </div>
      </div>
    </div>
  )
}

