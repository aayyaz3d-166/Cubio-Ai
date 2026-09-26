import { createHash } from 'crypto';

export interface TinyLMConfig {
  readonly modelName: string;
  readonly vocabSize: number;
  readonly maxSeqLen: number;
  readonly embedDim: number;
  readonly numHeads: number;
  readonly numLayers: number;
  readonly ffnDim: number;
  readonly dropout?: number;
  readonly tieWordEmbeddings: boolean;
  
  // Training parameters
  readonly seed: number;
  readonly learningRate: number;
  readonly minLearningRate: number;
  readonly warmupSteps: number;
  readonly maxSteps: number;
  readonly batchSize: number;
  readonly weightDecay: number;
  readonly clipNorm: number;
  readonly beta1: number;
  readonly beta2: number;
  readonly eps: number;
}

export const DEFAULT_TINY_LM_CONFIG: TinyLMConfig = {
  modelName: 'TinyConversationalLM-v1',
  vocabSize: 512,
  maxSeqLen: 64,
  embedDim: 64,
  numHeads: 4,
  numLayers: 2,
  ffnDim: 128,
  dropout: 0.0,
  tieWordEmbeddings: false,

  seed: 42,
  learningRate: 1e-3,
  minLearningRate: 1e-4,
  warmupSteps: 5,
  maxSteps: 50,
  batchSize: 2,
  weightDecay: 0.01,
  clipNorm: 1.0,
  beta1: 0.9,
  beta2: 0.999,
  eps: 1e-8,
};

export function computeConfigHash(config: TinyLMConfig): string {
  const json = JSON.stringify(config, Object.keys(config).sort());
  return createHash('sha256').update(json).digest('hex');
}
