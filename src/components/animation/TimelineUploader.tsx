import { useState } from 'react'
import Papa from 'papaparse'
import type { TimelineData, TimePoint } from '../../types/timeline'
import type { GeneExpression } from '../../data/sampleGenes'

type TimelineUploaderProps = {
  onTimelineLoad: (timeline: TimelineData) => void
  onError: (error: string) => void
}

type ParsedTimelineData = {
  title: string
  description: string
  timePoints: Array<{
    label: string
    timestamp: number
    csvFile: File
  }>
}

export function TimelineUploader({ onTimelineLoad, onError }: TimelineUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [timelineConfig, setTimelineConfig] = useState<ParsedTimelineData>({
    title: '',
    description: '',
    timePoints: [],
  })

  const addTimePoint = () => {
    setTimelineConfig(prev => ({
      ...prev,
      timePoints: [
        ...prev.timePoints,
        {
          label: `时间点 ${prev.timePoints.length + 1}`,
          timestamp: prev.timePoints.length,
          csvFile: null as any,
        },
      ],
    }))
  }

  const removeTimePoint = (index: number) => {
    setTimelineConfig(prev => ({
      ...prev,
      timePoints: prev.timePoints.filter((_, i) => i !== index),
    }))
  }

  const updateTimePoint = (index: number, field: keyof TimePoint, value: any) => {
    setTimelineConfig(prev => ({
      ...prev,
      timePoints: prev.timePoints.map((tp, i) => 
        i === index ? { ...tp, [field]: value } : tp
      ),
    }))
  }

  const handleFileSelect = (index: number, file: File) => {
    setTimelineConfig(prev => ({
      ...prev,
      timePoints: prev.timePoints.map((tp, i) => 
        i === index ? { ...tp, csvFile: file } : tp
      ),
    }))
  }

  const parseCSVFile = (file: File): Promise<GeneExpression[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            reject(new Error(`CSV 解析错误: ${result.errors[0].message}`))
            return
          }

          const requiredHeaders = ['symbol', 'value']
          const actualHeaders = result.meta.fields || []
          const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h))

          if (missingHeaders.length > 0) {
            reject(new Error(`缺少必需的列: ${missingHeaders.join(', ')}`))
            return
          }

          const genes: GeneExpression[] = []
          for (const row of result.data as any[]) {
            const symbol = String(row.symbol || '').trim()
            const value = Number(row.value)
            const description = String(row.description || '').trim()

            if (!symbol) {
              reject(new Error(`基因符号不能为空`))
              return
            }
            if (isNaN(value)) {
              reject(new Error(`基因表达值必须是数字: ${row.value}`))
              return
            }

            genes.push({ symbol, value, description })
          }

          if (genes.length === 0) {
            reject(new Error('未找到有效的基因数据'))
            return
          }

          resolve(genes)
        },
        error: (error: Error) => {
          reject(error)
        },
      })
    })
  }

  const processTimeline = async () => {
    if (!timelineConfig.title.trim()) {
      onError('请输入时间线标题')
      return
    }

    if (timelineConfig.timePoints.length < 2) {
      onError('至少需要2个时间点')
      return
    }

    const invalidTimePoints = timelineConfig.timePoints.filter(tp => !tp.csvFile)
    if (invalidTimePoints.length > 0) {
      onError('所有时间点都需要上传CSV文件')
      return
    }

    setIsUploading(true)

    try {
      const processedTimePoints: TimePoint[] = []

      for (let i = 0; i < timelineConfig.timePoints.length; i++) {
        const tp = timelineConfig.timePoints[i]
        const genes = await parseCSVFile(tp.csvFile)
        
        processedTimePoints.push({
          id: `t${i}`,
          label: tp.label,
          timestamp: tp.timestamp,
          genes,
        })
      }

      // 按时间戳排序
      processedTimePoints.sort((a, b) => a.timestamp - b.timestamp)

      const timeline: TimelineData = {
        title: timelineConfig.title,
        description: timelineConfig.description || '自定义时间线动画',
        timePoints: processedTimePoints,
        totalDuration: 8, // 默认8秒
      }

      onTimelineLoad(timeline)
    } catch (error) {
      onError(error instanceof Error ? error.message : '处理时间线数据时出错')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/40 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">自定义时间线动画</h3>
        <p className="text-sm text-slate-400">
          上传多个时间点的基因表达数据，生成动态演化动画
        </p>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">标题</label>
          <input
            type="text"
            value={timelineConfig.title}
            onChange={(e) => setTimelineConfig(prev => ({ ...prev, title: e.target.value }))}
            placeholder="例如：细胞分化过程"
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-white placeholder-slate-500 focus:border-plasma/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">描述（可选）</label>
          <textarea
            value={timelineConfig.description}
            onChange={(e) => setTimelineConfig(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述这个时间线展示的生物学过程..."
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900/50 px-3 py-2 text-white placeholder-slate-500 focus:border-plasma/50 focus:outline-none"
          />
        </div>
      </div>

      {/* 时间点配置 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-300">时间点配置</h4>
          <button
            onClick={addTimePoint}
            className="rounded-lg border border-plasma/30 bg-plasma/10 px-3 py-1 text-sm text-plasma transition hover:bg-plasma/20"
          >
            + 添加时间点
          </button>
        </div>

        <div className="space-y-3">
          {timelineConfig.timePoints.map((timePoint, index) => (
            <div key={index} className="rounded-lg border border-white/10 bg-slate-900/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">时间点 {index + 1}</span>
                {timelineConfig.timePoints.length > 1 && (
                  <button
                    onClick={() => removeTimePoint(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-400">标签</label>
                  <input
                    type="text"
                    value={timePoint.label}
                    onChange={(e) => updateTimePoint(index, 'label', e.target.value)}
                    placeholder="例如：0h, 6h, 12h"
                    className="mt-1 w-full rounded border border-white/20 bg-slate-800/50 px-2 py-1 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400">时间戳</label>
                  <input
                    type="number"
                    value={timePoint.timestamp}
                    onChange={(e) => updateTimePoint(index, 'timestamp', Number(e.target.value))}
                    placeholder="0"
                    className="mt-1 w-full rounded border border-white/20 bg-slate-800/50 px-2 py-1 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400">CSV 文件</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(index, file)
                    }}
                    className="mt-1 w-full text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-plasma/20 file:px-2 file:py-1 file:text-xs file:text-plasma"
                  />
                </div>
              </div>

              {timePoint.csvFile && (
                <div className="mt-2 text-xs text-slate-400">
                  已选择: {timePoint.csvFile.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 处理按钮 */}
      <button
        onClick={processTimeline}
        disabled={isUploading || timelineConfig.timePoints.length < 2}
        className="w-full rounded-lg border border-plasma/30 bg-plasma/10 py-3 text-plasma transition hover:bg-plasma/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? '处理中...' : '生成时间线动画'}
      </button>

      {/* 说明 */}
      <div className="rounded-lg bg-slate-900/50 p-4 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-2">使用说明：</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>每个时间点需要一个CSV文件，包含 symbol, value, description 列</li>
          <li>时间戳用于确定时间点的顺序和间隔</li>
          <li>建议使用相同的基因集合以获得最佳动画效果</li>
          <li>动画将自动在时间点之间进行平滑插值</li>
        </ul>
      </div>
    </div>
  )
}

