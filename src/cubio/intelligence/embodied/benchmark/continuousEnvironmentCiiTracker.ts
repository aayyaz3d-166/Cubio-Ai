/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 7: Continuous Environment CII Performance Tracker
 *
 * Tracks live Quality vs Efficiency metrics across real environment interactions
 * and monitors continuous improvement deltas rather than static pass/fail claims.
 */

import { ContinuousCiiSnapshot, EnvironmentType, InvariantVerification } from '../types';

export class ContinuousEnvironmentCiiTracker {
  private history: ContinuousCiiSnapshot[] = [];

  public recordInteraction(
    environmentType: EnvironmentType,
    verification: InvariantVerification,
    latencyMs: number
  ): ContinuousCiiSnapshot {
    const snapshotId = `CII_SNAP_${Date.now()}`;
    const qualityScore = verification.qualityScore;

    // Efficiency: Latency score + zero-variance bonus
    const efficiencyScore = Math.min(100.0, Math.max(20.0, 100.0 - (latencyMs / 50.0) * 10.0 + 10.0));
    const currentCiiScore = parseFloat((0.7 * qualityScore + 0.3 * efficiencyScore).toFixed(2));

    let improvementDelta = 0.0;
    if (this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      improvementDelta = parseFloat((currentCiiScore - prev.currentCiiScore).toFixed(2));
    }

    const snapshot: ContinuousCiiSnapshot = Object.freeze({
      snapshotId,
      environmentType,
      qualityScore,
      efficiencyScore,
      currentCiiScore,
      improvementDelta,
      timestamp: Date.now(),
    });

    this.history.push(snapshot);
    return snapshot;
  }

  public getHistory(): readonly ContinuousCiiSnapshot[] {
    return Object.freeze([...this.history]);
  }

  public getAverageCiiScore(): number {
    if (this.history.length === 0) return 100.0;
    const sum = this.history.reduce((acc, s) => acc + s.currentCiiScore, 0);
    return parseFloat((sum / this.history.length).toFixed(2));
  }
}
