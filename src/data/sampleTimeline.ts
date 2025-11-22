import type { TimelineData } from '../types/timeline'

// 示例：细胞分化过程中的基因表达变化
export const sampleTimelineData: TimelineData = {
  title: '细胞分化时间序列',
  description: '模拟干细胞向神经元分化过程中关键基因的表达动态变化',
  totalDuration: 8, // 8秒动画
  timePoints: [
    {
      id: 't0',
      label: '0h (干细胞状态)',
      timestamp: 0,
      genes: [
        { symbol: 'OCT4', value: 4.2, description: 'Pluripotency maintenance' },
        { symbol: 'SOX2', value: 3.8, description: 'Stem cell transcription factor' },
        { symbol: 'NANOG', value: 3.5, description: 'Pluripotency regulator' },
        { symbol: 'NEUROG2', value: 0.5, description: 'Neuronal differentiation' },
        { symbol: 'MAP2', value: 0.3, description: 'Neuronal cytoskeleton' },
        { symbol: 'SYN1', value: 0.2, description: 'Synaptic vesicle protein' },
        { symbol: 'GFAP', value: 0.4, description: 'Glial fibrillary protein' },
        { symbol: 'NESTIN', value: 2.1, description: 'Neural stem cell marker' },
      ],
    },
    {
      id: 't6',
      label: '6h (早期分化)',
      timestamp: 6,
      genes: [
        { symbol: 'OCT4', value: 3.1, description: 'Pluripotency maintenance' },
        { symbol: 'SOX2', value: 2.9, description: 'Stem cell transcription factor' },
        { symbol: 'NANOG', value: 2.2, description: 'Pluripotency regulator' },
        { symbol: 'NEUROG2', value: 2.3, description: 'Neuronal differentiation' },
        { symbol: 'MAP2', value: 1.2, description: 'Neuronal cytoskeleton' },
        { symbol: 'SYN1', value: 0.8, description: 'Synaptic vesicle protein' },
        { symbol: 'GFAP', value: 1.1, description: 'Glial fibrillary protein' },
        { symbol: 'NESTIN', value: 2.8, description: 'Neural stem cell marker' },
      ],
    },
    {
      id: 't12',
      label: '12h (中期分化)',
      timestamp: 12,
      genes: [
        { symbol: 'OCT4', value: 1.8, description: 'Pluripotency maintenance' },
        { symbol: 'SOX2', value: 1.5, description: 'Stem cell transcription factor' },
        { symbol: 'NANOG', value: 1.1, description: 'Pluripotency regulator' },
        { symbol: 'NEUROG2', value: 3.7, description: 'Neuronal differentiation' },
        { symbol: 'MAP2', value: 2.8, description: 'Neuronal cytoskeleton' },
        { symbol: 'SYN1', value: 1.9, description: 'Synaptic vesicle protein' },
        { symbol: 'GFAP', value: 2.3, description: 'Glial fibrillary protein' },
        { symbol: 'NESTIN', value: 2.2, description: 'Neural stem cell marker' },
      ],
    },
    {
      id: 't24',
      label: '24h (成熟神经元)',
      timestamp: 24,
      genes: [
        { symbol: 'OCT4', value: 0.4, description: 'Pluripotency maintenance' },
        { symbol: 'SOX2', value: 0.6, description: 'Stem cell transcription factor' },
        { symbol: 'NANOG', value: 0.3, description: 'Pluripotency regulator' },
        { symbol: 'NEUROG2', value: 2.1, description: 'Neuronal differentiation' },
        { symbol: 'MAP2', value: 4.5, description: 'Neuronal cytoskeleton' },
        { symbol: 'SYN1', value: 3.8, description: 'Synaptic vesicle protein' },
        { symbol: 'GFAP', value: 1.2, description: 'Glial fibrillary protein' },
        { symbol: 'NESTIN', value: 0.8, description: 'Neural stem cell marker' },
      ],
    },
  ],
}

// 另一个示例：癌症进展过程
export const cancerProgressionTimeline: TimelineData = {
  title: '肿瘤进展时间序列',
  description: '模拟正常细胞向恶性肿瘤转化过程中关键基因的表达变化',
  totalDuration: 10,
  timePoints: [
    {
      id: 'normal',
      label: '正常细胞',
      timestamp: 0,
      genes: [
        { symbol: 'TP53', value: 3.8, description: 'Tumor suppressor' },
        { symbol: 'RB1', value: 3.2, description: 'Cell cycle control' },
        { symbol: 'CDKN1A', value: 2.9, description: 'Cell cycle inhibitor' },
        { symbol: 'MYC', value: 1.2, description: 'Oncogene' },
        { symbol: 'VEGFA', value: 0.8, description: 'Angiogenesis' },
        { symbol: 'MMP9', value: 0.5, description: 'Matrix metalloproteinase' },
      ],
    },
    {
      id: 'dysplasia',
      label: '异型增生',
      timestamp: 8,
      genes: [
        { symbol: 'TP53', value: 2.1, description: 'Tumor suppressor' },
        { symbol: 'RB1', value: 2.3, description: 'Cell cycle control' },
        { symbol: 'CDKN1A', value: 1.8, description: 'Cell cycle inhibitor' },
        { symbol: 'MYC', value: 2.8, description: 'Oncogene' },
        { symbol: 'VEGFA', value: 1.9, description: 'Angiogenesis' },
        { symbol: 'MMP9', value: 1.4, description: 'Matrix metalloproteinase' },
      ],
    },
    {
      id: 'malignant',
      label: '恶性肿瘤',
      timestamp: 16,
      genes: [
        { symbol: 'TP53', value: 0.3, description: 'Tumor suppressor' },
        { symbol: 'RB1', value: 0.8, description: 'Cell cycle control' },
        { symbol: 'CDKN1A', value: 0.6, description: 'Cell cycle inhibitor' },
        { symbol: 'MYC', value: 4.7, description: 'Oncogene' },
        { symbol: 'VEGFA', value: 4.2, description: 'Angiogenesis' },
        { symbol: 'MMP9', value: 3.9, description: 'Matrix metalloproteinase' },
      ],
    },
  ],
}

