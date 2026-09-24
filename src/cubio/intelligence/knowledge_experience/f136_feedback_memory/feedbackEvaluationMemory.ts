import { FeedbackEvaluationRecord } from '../types';

export class FeedbackEvaluationMemoryL9 {
  public logFeedback(source: FeedbackEvaluationRecord['feedbackSource'], delta: number): FeedbackEvaluationRecord {
    const feedbackId = 'FB_EVAL_' + Date.now();

    return Object.freeze({
      feedbackId,
      feedbackSource: source,
      scoreDelta: delta,
      updatedPolicyWeight: 0.95,
      recordedTimestamp: Date.now(),
    });
  }
}
