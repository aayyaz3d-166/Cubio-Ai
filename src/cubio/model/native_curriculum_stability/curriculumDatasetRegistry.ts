/**
 * CUBiO AI — Task 167: Native Curriculum & Training Stability
 * src/cubio/model/native_curriculum_stability/curriculumDatasetRegistry.ts
 *
 * Sovereign Native Dataset Registry & Episode Generator:
 * - 100% Native TypeScript synthetic dataset generation.
 * - Zero external API calls, zero downloaded datasets, zero scraped web data.
 * - 4 deterministic stage splits with decoupled training episodes and holdout validation probes.
 */

import { CurriculumStage, CurriculumEpisode } from './types';

export interface CurriculumValidationProbe {
  readonly id: string;
  readonly prompt: string;
  readonly expectedTokenOrPrefix: string;
  readonly targetTokenId?: number;
}

export class CurriculumDatasetRegistry {
  /**
   * Generates training episodes for a designated curriculum stage.
   */
  public static getTrainingEpisodes(stage: CurriculumStage): readonly CurriculumEpisode[] {
    switch (stage) {
      case CurriculumStage.STAGE_1_SYMBOLIC_PRIMITIVES:
        return [
          {
            id: 'S1-TR-01',
            stage,
            prompt: 'token anchor alpha',
            completion: 'syntax bind root',
            expectedPattern: 'syntax',
          },
          {
            id: 'S1-TR-02',
            stage,
            prompt: 'primitive identity cell',
            completion: 'canonical index 369',
            expectedPattern: 'canonical',
          },
          {
            id: 'S1-TR-03',
            stage,
            prompt: 'symbol variable assign',
            completion: 'value state verified',
            expectedPattern: 'value',
          },
          {
            id: 'S1-TR-04',
            stage,
            prompt: 'syntax structure sequence',
            completion: 'token stream aligned',
            expectedPattern: 'token',
          },
        ];

      case CurriculumStage.STAGE_2_SPATIAL_RELATIONS:
        return [
          {
            id: 'S2-TR-01',
            stage,
            prompt: 'spatial lattice node at coordinate (0, 0, 0)',
            completion: 'hexagonal neighbor at (1, 0, 0)',
            spatialCellId: 'HCP-CELL-0-0-0',
            expectedPattern: 'hexagonal',
          },
          {
            id: 'S2-TR-02',
            stage,
            prompt: 'HCP layer L1 adjacent to layer L0',
            completion: 'sphere contact 12 kiss count',
            spatialCellId: 'HCP-LAYER-L1',
            expectedPattern: 'sphere',
          },
          {
            id: 'S2-TR-03',
            stage,
            prompt: 'spatial bounding box for cell cluster',
            completion: 'volume radius bounded 1.0',
            spatialCellId: 'HCP-CLUSTER-A',
            expectedPattern: 'volume',
          },
          {
            id: 'S2-TR-04',
            stage,
            prompt: 'coordinate transform in hexagonal lattice',
            completion: 'vector offset orthogonal basis',
            spatialCellId: 'HCP-VECTOR-BASIS',
            expectedPattern: 'vector',
          },
        ];

      case CurriculumStage.STAGE_3_CAUSAL_EPISTEMICS:
        return [
          {
            id: 'S3-TR-01',
            stage,
            prompt: 'causal relation: observation verified by cryptographic signature',
            completion: 'epistemic state CERTAIN direct evidence',
            expectedPattern: 'epistemic',
          },
          {
            id: 'S3-TR-02',
            stage,
            prompt: 'causal chain: database write with outdated stateVersion',
            completion: 'OCC conflict detected write rejected',
            expectedPattern: 'OCC',
          },
          {
            id: 'S3-TR-03',
            stage,
            prompt: 'epistemic evaluation: secondary witness without hash proof',
            completion: 'epistemic state PLAUSIBLE tentative inference',
            expectedPattern: 'epistemic',
          },
          {
            id: 'S3-TR-04',
            stage,
            prompt: 'causal branch: counter-evidence contradicts hypothesis H1',
            completion: 'hypothesis refuted epistemic DISPROVEN',
            expectedPattern: 'hypothesis',
          },
        ];

      case CurriculumStage.STAGE_4_MULTI_STEP_REASONING:
        return [
          {
            id: 'S4-TR-01',
            stage,
            prompt: 'multi-step deduction: step 1 premise valid, step 2 inference verified',
            completion: 'step 3 conclusion sound and immutable',
            expectedPattern: 'step',
          },
          {
            id: 'S4-TR-02',
            stage,
            prompt: 'hypothesis decomposition: decompose problem into spatial and causal sub-tasks',
            completion: 'synthesize partial results into final resolution',
            expectedPattern: 'synthesize',
          },
          {
            id: 'S4-TR-03',
            stage,
            prompt: 'counterfactual analysis: what if spatial anchor had rotated 60 degrees',
            completion: 'lattice symmetry preserved invariants hold',
            expectedPattern: 'lattice',
          },
          {
            id: 'S4-TR-04',
            stage,
            prompt: 'recursive self-reflection: verify logical deduction steps for contradiction',
            completion: 'zero contradictions found proof certified',
            expectedPattern: 'zero',
          },
        ];
    }
  }

  /**
   * Generates holdout validation probes for a designated curriculum stage.
   * Probes are distinct from training episodes to evaluate generalization without data leakage.
   */
  public static getValidationProbes(stage: CurriculumStage): readonly CurriculumValidationProbe[] {
    switch (stage) {
      case CurriculumStage.STAGE_1_SYMBOLIC_PRIMITIVES:
        return [
          {
            id: 'S1-VAL-01',
            prompt: 'token anchor beta',
            expectedTokenOrPrefix: 'syntax',
          },
          {
            id: 'S1-VAL-02',
            prompt: 'primitive identity node',
            expectedTokenOrPrefix: 'canonical',
          },
          {
            id: 'S1-VAL-03',
            prompt: 'symbol variable update',
            expectedTokenOrPrefix: 'value',
          },
          {
            id: 'S1-VAL-04',
            prompt: 'syntax structure flow',
            expectedTokenOrPrefix: 'token',
          },
        ];

      case CurriculumStage.STAGE_2_SPATIAL_RELATIONS:
        return [
          {
            id: 'S2-VAL-01',
            prompt: 'spatial lattice node at coordinate (1, 1, 0)',
            expectedTokenOrPrefix: 'hexagonal',
          },
          {
            id: 'S2-VAL-02',
            prompt: 'HCP layer L2 adjacent to layer L1',
            expectedTokenOrPrefix: 'sphere',
          },
          {
            id: 'S2-VAL-03',
            prompt: 'spatial bounding box for target node',
            expectedTokenOrPrefix: 'volume',
          },
          {
            id: 'S2-VAL-04',
            prompt: 'coordinate transform along z axis',
            expectedTokenOrPrefix: 'vector',
          },
        ];

      case CurriculumStage.STAGE_3_CAUSAL_EPISTEMICS:
        return [
          {
            id: 'S3-VAL-01',
            prompt: 'causal relation: mathematical theorem verified by formal proof',
            expectedTokenOrPrefix: 'epistemic',
          },
          {
            id: 'S3-VAL-02',
            prompt: 'causal chain: concurrent modification on tenant memory cell',
            expectedTokenOrPrefix: 'OCC',
          },
          {
            id: 'S3-VAL-03',
            prompt: 'epistemic evaluation: circumstantial trace without direct signature',
            expectedTokenOrPrefix: 'epistemic',
          },
          {
            id: 'S3-VAL-04',
            prompt: 'causal branch: direct counter-example invalidates theorem T2',
            expectedTokenOrPrefix: 'hypothesis',
          },
        ];

      case CurriculumStage.STAGE_4_MULTI_STEP_REASONING:
        return [
          {
            id: 'S4-VAL-01',
            prompt: 'multi-step deduction: step 1 premises verified, step 2 lemma established',
            expectedTokenOrPrefix: 'step',
          },
          {
            id: 'S4-VAL-02',
            prompt: 'hypothesis decomposition: separate complex reasoning into atomic lemmas',
            expectedTokenOrPrefix: 'synthesize',
          },
          {
            id: 'S4-VAL-03',
            prompt: 'counterfactual analysis: what if evidence E2 was missing',
            expectedTokenOrPrefix: 'lattice',
          },
          {
            id: 'S4-VAL-04',
            prompt: 'recursive self-reflection: check multi-hop chain for fallacy',
            expectedTokenOrPrefix: 'zero',
          },
        ];
    }
  }
}
