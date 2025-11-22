/**
 * 基因功能知识库
 * 基于真实生物学知识，驱动艺术生成的逻辑
 */

export type GeneCategory = 
  | 'tumor_suppressor'  // 肿瘤抑制基因（冷色系）
  | 'oncogene'          // 促癌基因（暖色系）
  | 'cell_cycle'        // 细胞周期
  | 'apoptosis'         // 细胞凋亡
  | 'angiogenesis'      // 血管生成
  | 'metabolism'        // 代谢
  | 'immune'            // 免疫
  | 'dna_repair'        // DNA修复
  | 'signaling'         // 信号转导
  | 'transcription'     // 转录调控

export type PathwayRelation = {
  genes: string[]       // 通路内的基因
  name: string          // 通路名称
  category: GeneCategory[]
}

/**
 * 基因功能分类知识库
 */
export const geneCategories: Record<string, GeneCategory[]> = {
  // 肿瘤抑制基因（通常低表达 = 癌症风险，冷色系）
  TP53: ['tumor_suppressor', 'dna_repair', 'apoptosis'],
  BRCA1: ['tumor_suppressor', 'dna_repair'],
  CDKN1A: ['tumor_suppressor', 'cell_cycle'],
  
  // 促癌基因（高表达 = 癌症促进，暖色系）
  MYC: ['oncogene', 'transcription', 'cell_cycle'],
  EGFR: ['oncogene', 'signaling'],
  
  // 血管生成相关（冷-暖过渡）
  VEGFA: ['angiogenesis', 'signaling'],
  HIF1A: ['angiogenesis', 'transcription', 'metabolism'],
  
  // 代谢相关（中性色系）
  MTOR: ['metabolism', 'signaling'],
  
  // 细胞凋亡（冷色系）
  BCL2: ['apoptosis'],
  
  // 分化相关（中性）
  GATA3: ['transcription'],
}

/**
 * 生物学通路关系
 */
export const pathways: PathwayRelation[] = [
  {
    name: 'p53 信号通路',
    genes: ['TP53', 'CDKN1A'],
    category: ['tumor_suppressor', 'cell_cycle'],
  },
  {
    name: 'DNA 修复通路',
    genes: ['TP53', 'BRCA1'],
    category: ['dna_repair', 'tumor_suppressor'],
  },
  {
    name: '血管生成通路',
    genes: ['VEGFA', 'HIF1A'],
    category: ['angiogenesis'],
  },
  {
    name: '生长因子信号通路',
    genes: ['EGFR', 'MTOR'],
    category: ['signaling', 'metabolism'],
  },
  {
    name: '细胞周期调控',
    genes: ['MYC', 'CDKN1A'],
    category: ['cell_cycle'],
  },
]

/**
 * 基因功能描述（用于故事解释）
 */
export const geneStories: Record<string, string> = {
  TP53: 'TP53 是著名的"基因组守护者"，负责检测 DNA 损伤并启动修复或凋亡程序。在癌症中通常低表达，导致基因组不稳定。',
  BRCA1: 'BRCA1 参与 DNA 双链断裂修复，突变会增加乳腺癌和卵巢癌风险。',
  MYC: 'MYC 是强大的转录因子，促进细胞增殖。过表达会驱动多种癌症发展。',
  EGFR: 'EGFR 是重要的生长因子受体，在肺癌、结肠癌中常发生突变，是靶向治疗的关键靶点。',
  VEGFA: 'VEGFA 促进新血管形成，为肿瘤提供营养和氧气。抗血管生成是重要的癌症治疗策略。',
  HIF1A: 'HIF1A 响应低氧环境，调节血管生成和代谢适应。肿瘤内部常处于缺氧状态。',
  MTOR: 'MTOR 是细胞代谢的核心调控者，连接营养状态和细胞生长。在多种癌症中异常激活。',
  CDKN1A: 'CDKN1A 是细胞周期检查点，阻止异常细胞进入 S 期。是 p53 通路的关键效应分子。',
  BCL2: 'BCL2 抑制细胞凋亡，帮助癌细胞逃避程序性死亡。是重要的治疗靶点。',
  GATA3: 'GATA3 参与细胞分化，在乳腺癌中表达与预后相关。',
}

/**
 * 获取基因的功能类别
 */
export function getGeneCategories(symbol: string): GeneCategory[] {
  return geneCategories[symbol] || ['signaling']
}

/**
 * 判断两个基因是否在同一通路
 */
export function areInSamePathway(gene1: string, gene2: string): boolean {
  return pathways.some(pathway => 
    pathway.genes.includes(gene1) && pathway.genes.includes(gene2)
  )
}

/**
 * 获取基因通路信息
 */
export function getGenePathways(symbol: string): PathwayRelation[] {
  return pathways.filter(pathway => pathway.genes.includes(symbol))
}

/**
 * 根据功能类别生成颜色提示
 */
export function getCategoryColorHint(category: GeneCategory): string {
  const hints: Record<GeneCategory, string> = {
    tumor_suppressor: '冷色调（蓝/紫）- 保护性基因',
    oncogene: '暖色调（红/橙）- 促癌基因',
    cell_cycle: '中性色调 - 细胞周期调控',
    apoptosis: '冷色调（青/蓝）- 程序性死亡',
    angiogenesis: '过渡色调（紫-红）- 血管生成',
    metabolism: '中性色调（绿/黄）- 代谢控制',
    immune: '中性色调 - 免疫相关',
    dna_repair: '冷色调（蓝）- DNA 修复',
    signaling: '中性色调 - 信号转导',
    transcription: '中性色调 - 转录调控',
  }
  return hints[category] || '中性色调'
}

