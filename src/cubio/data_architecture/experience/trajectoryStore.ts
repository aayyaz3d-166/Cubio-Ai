import { EpisodicTrajectory, MasterProvenanceRecord } from '../types';
import { ProvenanceHasher } from '../provenance/hashing';

export class TrajectoryStore {
  private trajectories = new Map<string, EpisodicTrajectory>();
  private hasher = new ProvenanceHasher();

  public recordTrajectory(
    taskFingerprint: string,
    initialContext: Record<string, unknown>,
    steps: { stepIndex: number; toolInvoked: string; parametersDigest: string; observationDelta: Record<string, unknown>; stepLatencyMs: number }[],
    outcome: { isSuccess: boolean; ciiScoreAchieved: number; physicalDefectsDetected: number; totalExecutionTimeMs: number }
  ): EpisodicTrajectory {
    const timestamp = Date.now();
    const trajectoryId = 'EPISODE_' + timestamp;
    const content = Object.freeze({
      initialContext: Object.freeze({ ...initialContext }),
      stepTrace: Object.freeze(steps.map(s => Object.freeze({ ...s, observationDelta: Object.freeze({ ...s.observationDelta }) }))),
      finalOutcome: Object.freeze({ ...outcome }),
    });

    const contentHash = this.hasher.hashContent(content);
    const provenanceHash = this.hasher.hashProvenanceLeaf(contentHash, 'TIER_3_MACHINE_CANDIDATE', []);
    const trajectoryHash = this.hasher.hashNode(trajectoryId, contentHash, provenanceHash, timestamp);

    const provenance: MasterProvenanceRecord = Object.freeze({
      recordId: 'PROV_' + provenanceHash.slice(2, 10),
      provenanceTier: 'TIER_3_MACHINE_CANDIDATE',
      version: 1,
      parentLineage: Object.freeze([]),
      verificationState: outcome.isSuccess ? 'EMPIRICALLY_VERIFIED' : 'UNVERIFIED_HEURISTIC',
      timestamp,
      hash: provenanceHash,
      content: Object.freeze({
        creatorType: 'AUTONOMOUS_EXTRACTOR',
        evaluatorRecordHash: 'EVAL_CII_' + outcome.ciiScoreAchieved,
        targetResourceHash: contentHash,
      }),
    });

    const record: EpisodicTrajectory = Object.freeze({
      trajectoryId,
      taskFingerprint,
      version: 1,
      parentLineage: Object.freeze([]),
      verificationState: outcome.isSuccess ? 'EMPIRICALLY_VERIFIED' : 'UNVERIFIED_HEURISTIC',
      timestamp,
      hash: trajectoryHash,
      provenance,
      content,
    });

    this.trajectories.set(trajectoryId, record);
    return record;
  }

  public getTrajectory(id: string): EpisodicTrajectory | undefined {
    return this.trajectories.get(id);
  }

  public getAll(): readonly EpisodicTrajectory[] {
    return Object.freeze(Array.from(this.trajectories.values()));
  }
}
