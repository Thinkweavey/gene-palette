import type { GeneExpression } from '../data/sampleGenes'
import type { GeneColorSample } from '../utils/color'

export type PaletteGene = GeneExpression & {
  normalized: number
  percentile: number
  color: GeneColorSample
}

