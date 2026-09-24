/**
 * CubiO — Step 87 Token Sampler
 */

export class Sampler {
  public static sampleGreedy(logits: readonly number[]): number {
    let maxVal = -Infinity;
    let maxIdx = 0;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > maxVal) {
        maxVal = logits[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  public static sampleMultinomial(logits: readonly number[], seed = 369): number {
    const valid = logits.filter((v) => isFinite(v));
    if (valid.length === 0) return 0;

    const maxL = Math.max(...valid);
    const exp = logits.map((l) => (isFinite(l) ? Math.exp(l - maxL) : 0));
    const sumExp = exp.reduce((a, b) => a + b, 0);
    const probs = exp.map((e) => e / (sumExp || 1));

    // Pseudo-random roll
    const rand = (Math.sin(seed * 997 + Date.now() % 1000) + 1) / 2;
    let acc = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (rand <= acc) {
        return i;
      }
    }
    return probs.length - 1;
  }
}
