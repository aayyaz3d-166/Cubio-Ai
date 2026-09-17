/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Experiment Repository
 *
 * Repository abstraction for Space-linked research experiments.
 */

import { ExperimentRecord } from './types';

export class ExperimentRepository {
  private experiments: Map<string, ExperimentRecord> = new Map();

  public create(exp: ExperimentRecord): void {
    if (this.experiments.has(exp.experimentId)) {
      throw new Error(`Experiment ${exp.experimentId} already exists.`);
    }
    this.experiments.set(exp.experimentId, exp);
  }

  public get(experimentId: string): ExperimentRecord | undefined {
    return this.experiments.get(experimentId);
  }

  public listBySpace(spaceId: string): readonly ExperimentRecord[] {
    return Object.freeze(
      Array.from(this.experiments.values()).filter((e) => e.spaceId === spaceId)
    );
  }

  public listAll(): readonly ExperimentRecord[] {
    return Object.freeze(Array.from(this.experiments.values()));
  }

  public delete(experimentId: string): boolean {
    return this.experiments.delete(experimentId);
  }

  public clear(): void {
    this.experiments.clear();
  }
}
