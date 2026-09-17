/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Experiment Manager
 *
 * Links experiments to spaces with explicit lineage and checksum tracking.
 */

import { PersonalSpace, ExperimentRecord } from './types';
import { ExperimentRepository } from './experimentRepository';
import {
  generateDeterministicExperimentId,
  generateDeterministicLineageId,
  deterministicHash,
} from './determinism';

export class ExperimentManager {
  private repository: ExperimentRepository;
  private expCounter = 0;

  constructor(repository = new ExperimentRepository()) {
    this.repository = repository;
  }

  public getRepository(): ExperimentRepository {
    return this.repository;
  }

  public createExperiment(space: PersonalSpace, name: string): ExperimentRecord {
    this.expCounter++;
    const experimentId = generateDeterministicExperimentId(space.spaceId, this.expCounter);
    const lineageId = generateDeterministicLineageId(space.spaceId, this.expCounter);

    const currentChecksum = deterministicHash(
      JSON.stringify([experimentId, space.spaceChecksum, space.observers.length, space.dimension.dimensionType])
    );

    const exp: ExperimentRecord = Object.freeze({
      experimentId,
      spaceId: space.spaceId,
      name,
      sourceSpaceChecksum: space.spaceChecksum,
      currentChecksum,
      observers: Object.freeze(space.observers.map((o) => Object.freeze({ ...o }))),
      dimension: space.dimension,
      geometryStatus: 'READY',
      certainty: 'EXACT',
      lineageId,
      createdAt: 0,
      updatedAt: 0,
    });

    this.repository.create(exp);
    return exp;
  }

  public listExperiments(spaceId?: string): readonly ExperimentRecord[] {
    return spaceId ? this.repository.listBySpace(spaceId) : this.repository.listAll();
  }

  public getExperiment(experimentId: string): ExperimentRecord | undefined {
    return this.repository.get(experimentId);
  }

  public deleteExperiment(experimentId: string): boolean {
    return this.repository.delete(experimentId);
  }
}
