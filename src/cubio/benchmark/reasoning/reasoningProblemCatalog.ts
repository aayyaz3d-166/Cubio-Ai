/**
 * CUBiO AI — Phase 5: Task 64 — Native Reasoning Benchmark Suite
 * src/cubio/benchmark/reasoning/reasoningProblemCatalog.ts
 *
 * Canonical deterministic benchmark problems spanning all 8 reasoning categories:
 * DEDUCTION, MULTI_STEP, CONTRADICTION, NUMERICAL, RELATIONAL, SPATIAL,
 * INSUFFICIENT_INFO, and ADVERSARIAL_DISTRACTOR across 4 difficulty tiers.
 */

import { NativeInformationObject, InformationPayload } from '../../information/native/infoTypes';
import {
  computeInformationContentHash,
  computeInformationChecksum,
} from '../../information/native/infoSerialization';
import {
  BenchmarkProblem,
  BenchmarkCategory,
  BenchmarkDifficulty,
  ExpectedEpistemicStatus,
  BenchmarkConclusion,
} from './reasoningBenchmarkTypes';

function makePremiseObj(
  objectId: string,
  subject: string,
  predicate: string,
  object: string | number,
  modality: 'TEXT' | 'NUMERIC' | 'CATEGORICAL' = 'TEXT',
  cellId = 171,
  tenantId = 'tenant_benchmark'
): NativeInformationObject {
  let payload: InformationPayload;
  if (modality === 'NUMERIC') {
    payload = {
      modality: 'NUMERIC',
      kind: 'SCALAR',
      value: Number(object),
      unit: 'scalar',
    };
  } else if (modality === 'CATEGORICAL') {
    payload = {
      modality: 'CATEGORICAL',
      category: predicate,
      label: String(object),
      confidence: 1.0,
    };
  } else {
    payload = {
      modality: 'TEXT',
      content: `${subject} ${predicate} ${object}`,
      charCount: `${subject} ${predicate} ${object}`.length,
      encoding: 'utf-8',
    };
  }

  const storageKey = `${tenantId}:${objectId}`;
  const contentHash = computeInformationContentHash(payload);
  const checksum = computeInformationChecksum(
    {
      objectId,
      tenantId,
      domain: 'GENERAL_MEMORY',
      stateVersion: 1,
    },
    payload
  );

  return Object.freeze({
    mathType: 'NATIVE_INFORMATION_OBJECT',
    identity: {
      objectId,
      tenantId,
      storageKey,
      domain: 'GENERAL_MEMORY',
      stateVersion: 1,
      checksum,
      contentHash,
    },
    modality: payload.modality,
    payload,
    stateBinding: {
      stateId: `state_${objectId}`,
      cellId,
      stateVersion: 1,
      bindingChecksum: checksum,
      isCoherent: true,
    },
    metadata: Object.freeze({
      subject,
      predicate,
      object,
      description: `Benchmark premise ${subject} ${predicate} ${object}`,
    }),
    timestamps: {
      createdAt: 1700000000000,
      modifiedAt: 1700000000000,
    },
  });
}

export class ReasoningProblemCatalog {
  private static _problems: BenchmarkProblem[] = [];

  static {
    // -------------------------------------------------------------
    // 1. DEDUCTION (Transitive Syllogisms & Categorical Logic)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'DED_01_EASY',
      name: 'Transitive Container Deduction',
      category: 'DEDUCTION',
      difficulty: 'EASY',
      description: 'Deduce that ContainerA contains ItemC via ContainerB',
      premises: [
        makePremiseObj('ded_01_p1', 'ContainerA', 'contains', 'ContainerB'),
        makePremiseObj('ded_01_p2', 'ContainerB', 'contains', 'ItemC'),
      ],
      expectedConclusion: { subject: 'ContainerA', predicate: 'contains', object: 'ItemC' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'DED_02_MEDIUM',
      name: 'Mechanical Assembly Part-Of Deduction',
      category: 'DEDUCTION',
      difficulty: 'MEDIUM',
      description: 'Deduce that Piston is part_of Engine via CylinderBlock',
      premises: [
        makePremiseObj('ded_02_p1', 'Piston', 'part_of', 'CylinderBlock'),
        makePremiseObj('ded_02_p2', 'CylinderBlock', 'part_of', 'Engine'),
      ],
      expectedConclusion: { subject: 'Piston', predicate: 'part_of', object: 'Engine' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'DED_03_HARD_UNSEEN',
      name: 'Software Service Dependency Deduction',
      category: 'DEDUCTION',
      difficulty: 'HARD',
      description: 'Deduce that FrontendService depends_on DataStore via GatewayService',
      premises: [
        makePremiseObj('ded_03_p1', 'FrontendService', 'depends_on', 'GatewayService'),
        makePremiseObj('ded_03_p2', 'GatewayService', 'depends_on', 'DataStore'),
      ],
      expectedConclusion: { subject: 'FrontendService', predicate: 'depends_on', object: 'DataStore' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 2. MULTI_STEP (Deep Multi-Hop DAG Reasoning)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'MULTI_01_MEDIUM',
      name: '4-Hop State Transition Pipeline',
      category: 'MULTI_STEP',
      difficulty: 'MEDIUM',
      description: 'Traverse 4 sequential transitions from Stage1 to Stage5',
      premises: [
        makePremiseObj('mul_01_p1', 'Stage1', 'transitions_to', 'Stage2'),
        makePremiseObj('mul_01_p2', 'Stage2', 'transitions_to', 'Stage3'),
        makePremiseObj('mul_01_p3', 'Stage3', 'transitions_to', 'Stage4'),
        makePremiseObj('mul_01_p4', 'Stage4', 'transitions_to', 'Stage5'),
      ],
      expectedConclusion: { subject: 'Stage1', predicate: 'transitions_to', object: 'Stage5' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 3,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'MULTI_02_HARD_UNSEEN',
      name: '5-Hop Enterprise Dependency Chain',
      category: 'MULTI_STEP',
      difficulty: 'HARD',
      description: 'Trace 5-hop service dependency tree down to CoreKernel',
      premises: [
        makePremiseObj('mul_02_p1', 'ClientApp', 'depends_on', 'AuthProxy'),
        makePremiseObj('mul_02_p2', 'AuthProxy', 'depends_on', 'TokenValidator'),
        makePremiseObj('mul_02_p3', 'TokenValidator', 'depends_on', 'CryptoProvider'),
        makePremiseObj('mul_02_p4', 'CryptoProvider', 'depends_on', 'CoreKernel'),
      ],
      expectedConclusion: { subject: 'ClientApp', predicate: 'depends_on', object: 'CoreKernel' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 3,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 3. CONTRADICTION (Contradictory Evidence & Conflict Detection)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'CONTRA_01_MEDIUM',
      name: 'Functional State Mutual Exclusion',
      category: 'CONTRADICTION',
      difficulty: 'MEDIUM',
      description: 'Detect contradictory status on same entity ServerNodeAlpha',
      premises: [
        makePremiseObj('con_01_p1', 'ServerNodeAlpha', 'status', 'ONLINE'),
        makePremiseObj('con_01_p2', 'ServerNodeAlpha', 'status', 'OFFLINE'),
      ],
      expectedConclusion: null,
      expectedEpistemicStatus: 'REFUTED_HYPOTHESIS',
      minRequiredDepth: 0,
      isUnseen: false,
      contradictionExpected: true,
    });

    this._problems.push({
      problemId: 'CONTRA_02_HARD_UNSEEN',
      name: 'Security Lock State Invariant Violation',
      category: 'CONTRADICTION',
      difficulty: 'HARD',
      description: 'Surface contradiction on single-valued security lock state',
      premises: [
        makePremiseObj('con_02_p1', 'VaultLock42', 'state', 'SECURE_LOCKED'),
        makePremiseObj('con_02_p2', 'VaultLock42', 'state', 'BREACH_UNLOCKED'),
      ],
      expectedConclusion: null,
      expectedEpistemicStatus: 'REFUTED_HYPOTHESIS',
      minRequiredDepth: 0,
      isUnseen: true,
      contradictionExpected: true,
    });

    // -------------------------------------------------------------
    // 4. NUMERICAL (Quantitative Range & Inequality Deduction)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'NUM_01_EASY',
      name: 'Transitive Greater-Than Chain',
      category: 'NUMERICAL',
      difficulty: 'EASY',
      description: 'Deduce numeric ordering MetricAlpha leads_to MetricGamma',
      premises: [
        makePremiseObj('num_01_p1', 'MetricAlpha', 'leads_to', 'MetricBeta'),
        makePremiseObj('num_01_p2', 'MetricBeta', 'leads_to', 'MetricGamma'),
      ],
      expectedConclusion: { subject: 'MetricAlpha', predicate: 'leads_to', object: 'MetricGamma' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'NUM_02_HARD_UNSEEN',
      name: 'Thermal Energy Cascade Deduction',
      category: 'NUMERICAL',
      difficulty: 'HARD',
      description: 'Multi-stage thermal gradient progression',
      premises: [
        makePremiseObj('num_02_p1', 'ReactorCore', 'leads_to', 'HeatExchanger'),
        makePremiseObj('num_02_p2', 'HeatExchanger', 'leads_to', 'TurbineBlade'),
      ],
      expectedConclusion: { subject: 'ReactorCore', predicate: 'leads_to', object: 'TurbineBlade' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 5. RELATIONAL (Graph Hierarchies & Structural Relations)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'REL_01_EASY',
      name: 'Module Component Hierarchy',
      category: 'RELATIONAL',
      difficulty: 'EASY',
      description: 'Deduce hierarchical relationship SubModule part_of AppSystem',
      premises: [
        makePremiseObj('rel_01_p1', 'SubModule', 'part_of', 'MainPackage'),
        makePremiseObj('rel_01_p2', 'MainPackage', 'part_of', 'AppSystem'),
      ],
      expectedConclusion: { subject: 'SubModule', predicate: 'part_of', object: 'AppSystem' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'REL_02_HARD_UNSEEN',
      name: 'Supply Chain Component Provenance',
      category: 'RELATIONAL',
      difficulty: 'HARD',
      description: 'Trace component integration through aerospace assembly chain',
      premises: [
        makePremiseObj('rel_02_p1', 'SensorChip', 'part_of', 'AvionicsModule'),
        makePremiseObj('rel_02_p2', 'AvionicsModule', 'part_of', 'GuidanceSystem'),
      ],
      expectedConclusion: { subject: 'SensorChip', predicate: 'part_of', object: 'GuidanceSystem' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 6. SPATIAL (343 Spatial Lattice Containment & Connectivity)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'SPAT_01_EASY',
      name: 'Spatial Volumetric Containment',
      category: 'SPATIAL',
      difficulty: 'EASY',
      description: 'Transitive spatial containment across geometric sub-volumes',
      premises: [
        makePremiseObj('spat_01_p1', 'CellZone10', 'contains', 'SubClusterAlpha'),
        makePremiseObj('spat_01_p2', 'SubClusterAlpha', 'contains', 'TargetNodeX'),
      ],
      expectedConclusion: { subject: 'CellZone10', predicate: 'contains', object: 'TargetNodeX' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'SPAT_02_HARD_UNSEEN',
      name: 'Spatial Grid Adjacency Route',
      category: 'SPATIAL',
      difficulty: 'HARD',
      description: 'Lattice grid connectivity across spatial nodes',
      premises: [
        makePremiseObj('spat_02_p1', 'GridCell171', 'connected_to', 'GridCell172'),
        makePremiseObj('spat_02_p2', 'GridCell172', 'connected_to', 'GridCell173'),
      ],
      expectedConclusion: { subject: 'GridCell171', predicate: 'connected_to', object: 'GridCell173' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 7. INSUFFICIENT_INFO (Incomplete Premise Set -> Must Return UNKNOWN)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'INSUF_01_MEDIUM',
      name: 'Disjoint Component Graph (Unknown Link)',
      category: 'INSUFFICIENT_INFO',
      difficulty: 'MEDIUM',
      description: 'Two disjoint pairs with no bridge premise; must return EPISTEMIC_UNKNOWN',
      premises: [
        makePremiseObj('insuf_01_p1', 'ClusterX', 'contains', 'Node1'),
        makePremiseObj('insuf_01_p2', 'ClusterY', 'contains', 'Node2'),
      ],
      expectedConclusion: null,
      expectedEpistemicStatus: 'EPISTEMIC_UNKNOWN',
      minRequiredDepth: 0,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'INSUF_02_HARD_UNSEEN',
      name: 'Missing Dependency Link (Refuse Guessing)',
      category: 'INSUFFICIENT_INFO',
      difficulty: 'HARD',
      description: 'AppA depends_on ServiceB, ServiceD depends_on DB; connection between B and D unknown',
      premises: [
        makePremiseObj('insuf_02_p1', 'AppA', 'depends_on', 'ServiceB'),
        makePremiseObj('insuf_02_p2', 'ServiceD', 'depends_on', 'DBCluster'),
      ],
      expectedConclusion: null,
      expectedEpistemicStatus: 'EPISTEMIC_UNKNOWN',
      minRequiredDepth: 0,
      isUnseen: true,
    });

    // -------------------------------------------------------------
    // 8. ADVERSARIAL_DISTRACTOR (Irrelevant Premise Noise Resistance)
    // -------------------------------------------------------------
    this._problems.push({
      problemId: 'ADV_01_MEDIUM',
      name: 'Transitive Chain in Noise Distractor Field',
      category: 'ADVERSARIAL_DISTRACTOR',
      difficulty: 'MEDIUM',
      description: 'Extract true chain (A contains C) amidst 6 irrelevant distractors',
      premises: [
        makePremiseObj('adv_01_p1', 'SecureVault', 'contains', 'InnerSafe'),
        makePremiseObj('adv_01_d1', 'WeatherSensor', 'status', 'SUNNY'),
        makePremiseObj('adv_01_d2', 'ClockTower', 'status', 'TICKING'),
        makePremiseObj('adv_01_p2', 'InnerSafe', 'contains', 'GoldBar'),
        makePremiseObj('adv_01_d3', 'StreetLight', 'status', 'ILLUMINATED'),
      ],
      expectedConclusion: { subject: 'SecureVault', predicate: 'contains', object: 'GoldBar' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: false,
    });

    this._problems.push({
      problemId: 'ADV_02_HARD_UNSEEN',
      name: 'Deep Dependency in Dense Adversarial Noise',
      category: 'ADVERSARIAL_DISTRACTOR',
      difficulty: 'HARD',
      description: 'Identify genuine dependency in enterprise telemetry noise',
      premises: [
        makePremiseObj('adv_02_d1', 'TelemetryAlpha', 'status', 'RECORDING'),
        makePremiseObj('adv_02_p1', 'IngestQueue', 'depends_on', 'MessageBroker'),
        makePremiseObj('adv_02_d2', 'CoolingFan3', 'status', 'SPINNING'),
        makePremiseObj('adv_02_d3', 'AmbientTemp', 'status', 'NOMINAL'),
        makePremiseObj('adv_02_p2', 'MessageBroker', 'depends_on', 'StorageCluster'),
        makePremiseObj('adv_02_d4', 'NetworkLED', 'status', 'BLINKING'),
      ],
      expectedConclusion: { subject: 'IngestQueue', predicate: 'depends_on', object: 'StorageCluster' },
      expectedEpistemicStatus: 'ESTABLISHED_FACT',
      minRequiredDepth: 1,
      isUnseen: true,
    });
  }

  /**
   * Retrieves all benchmark problems in the catalog.
   */
  public static getAllProblems(): readonly BenchmarkProblem[] {
    return Object.freeze([...this._problems]);
  }

  /**
   * Retrieves problems for a specific category.
   */
  public static getProblemsByCategory(category: BenchmarkCategory): readonly BenchmarkProblem[] {
    return Object.freeze(this._problems.filter((p) => p.category === category));
  }

  /**
   * Retrieves unseen evaluation problems to test generalization.
   */
  public static getUnseenProblems(): readonly BenchmarkProblem[] {
    return Object.freeze(this._problems.filter((p) => p.isUnseen));
  }

  /**
   * Retrieves seen baseline problems.
   */
  public static getSeenProblems(): readonly BenchmarkProblem[] {
    return Object.freeze(this._problems.filter((p) => !p.isUnseen));
  }

  /**
   * Retrieves a problem by its unique ID.
   */
  public static getProblemById(id: string): BenchmarkProblem | undefined {
    return this._problems.find((p) => p.problemId === id);
  }
}