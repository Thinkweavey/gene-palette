export type GeneExpression = {
  symbol: string
  value: number
  description?: string
}

export const sampleGenes: GeneExpression[] = [
  { symbol: 'TP53', value: 3.4, description: 'DNA damage response' },
  { symbol: 'BRCA1', value: 2.8, description: 'Homologous recombination' },
  { symbol: 'MYC', value: 4.1, description: 'Cell cycle regulation' },
  { symbol: 'EGFR', value: 1.7, description: 'Growth factor signaling' },
  { symbol: 'VEGFA', value: 3.9, description: 'Angiogenesis' },
  { symbol: 'HIF1A', value: 2.5, description: 'Hypoxia response' },
  { symbol: 'MTOR', value: 1.3, description: 'Metabolic control' },
  { symbol: 'CDKN1A', value: 2.2, description: 'Cell cycle arrest' },
  { symbol: 'BCL2', value: 1.1, description: 'Apoptosis regulation' },
  { symbol: 'GATA3', value: 2.9, description: 'Lineage specification' },
]

