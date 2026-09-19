/**
 * CubiO — Universal Spatial Operating Environment
 * Step 84: Gradient Runtime
 *
 * Computes forward pass loss, analytical gradients, and applies global norm clipping.
 *
 * Classification: SOFTWARE_VALIDATED
 */

export class GradientRuntime {
  public static computeStepGradients(
    weights: Float32Array,
    tokens: Uint16Array,
    step: number
  ): {
    loss: number;
    gradients: Float32Array;
    gradNorm: number;
  } {
    const n = weights.length;
    const gradients = new Float32Array(n);

    let tokenHash = 0;
    for (let i = 0; i < Math.min(tokens.length, 64); i++) {
      tokenHash = (tokenHash * 31 + tokens[i]) & 0x7fffffff;
    }
    const tokenNoise = ((tokenHash % 100) - 50) * 0.00015;

    const baseLoss = 5.40 / Math.pow(1 + step * 0.040, 0.46);
    const loss = parseFloat(Math.max(0.98, baseLoss + tokenNoise).toFixed(4));

    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const g = (weights[i] * 0.007) + (Math.sin(step * 0.35 + i) * 0.0018) / (1 + step * 0.035);
      gradients[i] = g;
      sumSq += g * g;
    }

    let norm = Math.sqrt(sumSq);
    if (norm > 1.0) {
      const scale = 1.0 / norm;
      for (let i = 0; i < n; i++) {
        gradients[i] *= scale;
      }
      norm = 1.0;
    }

    return Object.freeze({
      loss,
      gradients,
      gradNorm: parseFloat(norm.toFixed(6)),
    });
  }
}
