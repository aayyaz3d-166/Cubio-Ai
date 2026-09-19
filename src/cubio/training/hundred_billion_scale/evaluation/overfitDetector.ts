/**
 * CubiO — Step 86 Overfit Detector
 */

export class OverfitDetector {
  public static checkGeneralizationGap(trainLoss: number, valLoss: number, threshold = 0.5): {
    gap: number;
    isOverfitting: boolean;
  } {
    const gap = parseFloat(Math.abs(valLoss - trainLoss).toFixed(4));
    return {
      gap,
      isOverfitting: gap > threshold,
    };
  }
}
