import { TinyTransformerLM, ModelParameters } from './tiny_transformer';
import { TinyLMConfig, computeConfigHash } from './tiny_lm_config';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

export interface CheckpointData {
  step: number;
  configHash: string;
  config: TinyLMConfig;
  modelHash: string;
  lossHistory: number[];
  weights: {
    tokenEmbeddings: number[];
    positionEmbeddings: number[];
    finalNormGamma: number[];
    finalNormBeta: number[];
    lmHead: number[];
    layers: {
      qWeight: number[];
      kWeight: number[];
      vWeight: number[];
      outWeight: number[];
      ffn1Weight: number[];
      ffn1Bias: number[];
      ffn2Weight: number[];
      ffn2Bias: number[];
      norm1Gamma: number[];
      norm1Beta: number[];
      norm2Gamma: number[];
      norm2Beta: number[];
    }[];
  };
  optimizerState?: any;
}

export class CheckpointManager {
  private readonly outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public save(
    step: number,
    model: TinyTransformerLM,
    optimizer: any,
    lossHistory: number[]
  ): string {
    const filename = `tiny_lm_step_${step.toString().padStart(6, '0')}.json`;
    const filePath = path.join(this.outputDir, filename);

    const weights = {
      tokenEmbeddings: Array.from(model.params.tokenEmbeddings),
      positionEmbeddings: Array.from(model.params.positionEmbeddings),
      finalNormGamma: Array.from(model.params.finalNormGamma),
      finalNormBeta: Array.from(model.params.finalNormBeta),
      lmHead: Array.from(model.params.lmHead),
      layers: model.params.layers.map((l) => ({
        qWeight: Array.from(l.qWeight),
        kWeight: Array.from(l.kWeight),
        vWeight: Array.from(l.vWeight),
        outWeight: Array.from(l.outWeight),
        ffn1Weight: Array.from(l.ffn1Weight),
        ffn1Bias: Array.from(l.ffn1Bias),
        ffn2Weight: Array.from(l.ffn2Weight),
        ffn2Bias: Array.from(l.ffn2Bias),
        norm1Gamma: Array.from(l.norm1Gamma),
        norm1Beta: Array.from(l.norm1Beta),
        norm2Gamma: Array.from(l.norm2Gamma),
        norm2Beta: Array.from(l.norm2Beta),
      })),
    };

    const data: CheckpointData = {
      step,
      configHash: computeConfigHash(model.config),
      config: model.config,
      modelHash: model.computeModelHash(),
      lossHistory,
      weights,
      optimizerState: optimizer?.getSerializableState ? optimizer.getSerializableState() : undefined,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }

  public load(filePath: string, model: TinyTransformerLM, optimizer?: any): CheckpointData {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data: CheckpointData = JSON.parse(content);

    model.params.tokenEmbeddings.set(data.weights.tokenEmbeddings);
    model.params.positionEmbeddings.set(data.weights.positionEmbeddings);
    model.params.finalNormGamma.set(data.weights.finalNormGamma);
    model.params.finalNormBeta.set(data.weights.finalNormBeta);
    model.params.lmHead.set(data.weights.lmHead);

    for (let l = 0; l < data.weights.layers.length; l++) {
      const src = data.weights.layers[l];
      const dst = model.params.layers[l];
      dst.qWeight.set(src.qWeight);
      dst.kWeight.set(src.kWeight);
      dst.vWeight.set(src.vWeight);
      dst.outWeight.set(src.outWeight);
      dst.ffn1Weight.set(src.ffn1Weight);
      dst.ffn1Bias.set(src.ffn1Bias);
      dst.ffn2Weight.set(src.ffn2Weight);
      dst.ffn2Bias.set(src.ffn2Bias);
      dst.norm1Gamma.set(src.norm1Gamma);
      dst.norm1Beta.set(src.norm1Beta);
      dst.norm2Gamma.set(src.norm2Gamma);
      dst.norm2Beta.set(src.norm2Beta);
    }

    if (optimizer && data.optimizerState) {
      optimizer.loadState(data.optimizerState);
    }

    return data;
  }
}
