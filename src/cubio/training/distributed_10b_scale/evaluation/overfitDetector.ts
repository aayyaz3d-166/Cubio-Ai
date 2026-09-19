/**
 * CubiO — Step 85 Overfit Detector
 * Monitors generalization gap (Val Loss - Train Loss) to detect overparameterization or data memorization.
 */

export class OverfitDetector {
  public static checkGeneralization(trainLoss: number, valLoss: number): {
    generalizationGap: number;
    isOverfitting: boolean;
    recommendation: string;
  } {
    const gap = valLoss - trainLoss;
    const isOverfitting = gap > 1.25;

    return {
      generalizationGap: parseFloat(gap.toFixed(4)),
      isOverfitting,
      recommendation: isOverfitting
        ? 'Increase dropout or weight decay.'
        : 'Generalization healthy; scaling is effective.',
    };
  }
}
