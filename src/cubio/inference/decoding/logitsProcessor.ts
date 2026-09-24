/**
 * CubiO — Step 87 Logits Processor
 */

export class LogitsProcessor {
  public static applyTemperature(logits: number[], temperature = 0.7): number[] {
    if (temperature <= 0.001) return logits;
    return logits.map((l) => l / temperature);
  }

  public static applyRepetitionPenalty(logits: number[], generatedTokens: readonly number[], penalty = 1.15): number[] {
    const seen = new Set(generatedTokens);
    return logits.map((l, idx) => (seen.has(idx) ? (l > 0 ? l / penalty : l * penalty) : l));
  }

  public static applyTopK(logits: number[], topK = 50): number[] {
    if (topK <= 0 || topK >= logits.length) return logits;
    const indexed = logits.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);

    const threshold = indexed[topK - 1].val;
    return logits.map((l) => (l >= threshold ? l : -Infinity));
  }

  public static applyTopP(logits: number[], topP = 0.9): number[] {
    if (topP >= 1.0) return logits;

    // Compute softmax
    const maxL = Math.max(...logits.filter((v) => isFinite(v)));
    const exp = logits.map((l) => (isFinite(l) ? Math.exp(l - maxL) : 0));
    const sumExp = exp.reduce((a, b) => a + b, 0);
    const probs = exp.map((e) => e / (sumExp || 1));

    const indexed = probs.map((prob, idx) => ({ prob, idx, logit: logits[idx] }));
    indexed.sort((a, b) => b.prob - a.prob);

    let cumProb = 0;
    const allowed = new Set<number>();

    for (const item of indexed) {
      allowed.add(item.idx);
      cumProb += item.prob;
      if (cumProb >= topP) break;
    }

    return logits.map((l, idx) => (allowed.has(idx) ? l : -Infinity));
  }
}
