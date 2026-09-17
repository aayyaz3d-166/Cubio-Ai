/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * model_database.ts
 *
 * Sovereign 9-Table Relational In-Memory / File Database for:
 * 1. models
 * 2. checkpoints
 * 3. training_runs
 * 4. evaluations
 * 5. datasets
 * 6. lineage_dag
 * 7. security_scans
 * 8. reproducibility_logs
 * 9. epistemic_audit
 */

import {
  NativeModelCheckpoint,
  ModelGenesisRecord,
  TrainingConfiguration,
  ModelEvaluationScorecard,
  LineageNode,
} from './native_model_types';

export class ModelDatabase {
  private static instance: ModelDatabase | null = null;

  public readonly models = new Map<string, any>();
  public readonly checkpoints = new Map<string, NativeModelCheckpoint>();
  public readonly training_runs = new Map<string, { config: TrainingConfiguration; telemetry: any[] }>();
  public readonly evaluations = new Map<string, ModelEvaluationScorecard>();
  public readonly datasets = new Map<string, any>();
  public readonly lineage_dag = new Map<string, LineageNode>();
  public readonly security_scans = new Map<string, any>();
  public readonly reproducibility_logs = new Map<string, any>();
  public readonly epistemic_audit = new Map<string, any>();

  public static getInstance(): ModelDatabase {
    if (!this.instance) {
      this.instance = new ModelDatabase();
    }
    return this.instance;
  }

  public registerGenesis(record: ModelGenesisRecord): void {
    this.models.set(record.genesisId, {
      modelId: record.genesisId,
      status: 'GENESIS',
      genesisSeed: record.genesisSeed,
      stateHash: record.deterministicGenesisStateHash,
      createdAt: record.createdAt,
    });

    this.lineage_dag.set(record.genesisId, {
      nodeId: record.genesisId,
      nodeType: 'GENESIS',
      parentNodeIds: [],
      stateHash: record.deterministicGenesisStateHash,
      timestamp: record.createdAt,
      metadata: { genesisSeed: record.genesisSeed },
    });
  }

  public registerTrainingRun(config: TrainingConfiguration, telemetry: any[]): void {
    this.training_runs.set(config.trainingRunId, { config, telemetry });

    this.lineage_dag.set(config.trainingRunId, {
      nodeId: config.trainingRunId,
      nodeType: 'TRAINING_RUN',
      parentNodeIds: [config.genesisHash],
      stateHash: config.trainingRunId,
      timestamp: new Date().toISOString(),
      metadata: { epochs: config.epochs, learningRate: config.learningRate },
    });
  }

  public registerCheckpoint(checkpoint: NativeModelCheckpoint): void {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);

    this.lineage_dag.set(checkpoint.checkpointId, {
      nodeId: checkpoint.checkpointId,
      nodeType: 'CHECKPOINT',
      parentNodeIds: checkpoint.lineageParentStateHash ? [checkpoint.lineageParentStateHash] : [],
      stateHash: checkpoint.modelStateHash,
      timestamp: checkpoint.createdAt,
      metadata: { parameterCount: checkpoint.parameterInventory.totalParameters },
    });
  }

  public registerEvaluation(evalResult: ModelEvaluationScorecard): void {
    this.evaluations.set(evalResult.evaluationId, evalResult);
  }

  public clear(): void {
    this.models.clear();
    this.checkpoints.clear();
    this.training_runs.clear();
    this.evaluations.clear();
    this.datasets.clear();
    this.lineage_dag.clear();
    this.security_scans.clear();
    this.reproducibility_logs.clear();
    this.epistemic_audit.clear();
  }
}
