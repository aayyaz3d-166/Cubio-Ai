/**
 * CUBiO AI — Phase 6: Task 78
 * Native Language Training & Curriculum
 * src/cubio/language/native/curriculum/languageCurriculumData.ts
 *
 * Governed multi-stage training data generator producing lexical, syntactic,
 * sequential, semantic, and reasoning-grounded linguistic samples with complete provenance.
 */

import * as crypto from 'crypto';
import {
  LanguageCurriculumStage,
  LanguageDatasetSplit,
  LanguageCurriculumSample,
  STAGE_CURRICULUM_CONFIGS,
  EpistemicTrainingViolationError,
  LanguageSplitLeakageError,
} from './languageCurriculumTypes';
import { NativeTokenizer } from '../nativeTokenizer';
import { EpistemicStatus } from '../languageTypes';

interface RawCurriculumEntry {
  text: string;
  stage: LanguageCurriculumStage;
  epistemicStatus: EpistemicStatus;
  domain?: string;
  referenceObjectIds?: string[];
}

export class LanguageCurriculumData {
  /**
   * Generates a complete, governed multi-stage curriculum dataset with strict train/val/test splits.
   */
  public static generateCurriculumDataset(
    tokenizer: NativeTokenizer,
    tenantId = 'default_tenant'
  ): {
    trainSamples: LanguageCurriculumSample[];
    valSamples: LanguageCurriculumSample[];
    testSamples: LanguageCurriculumSample[];
    unseenCombinations: LanguageCurriculumSample[];
  } {
    const rawEntries = this._getCurriculumCorpus();
    const allSamples: LanguageCurriculumSample[] = [];

    // Verify epistemic constraints and tokenize each sample
    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      const stageConfig = STAGE_CURRICULUM_CONFIGS[entry.stage];

      // Epistemic Law: Disallow non-canonical statuses in Stage 1 & Stage 2
      if (!stageConfig.allowedEpistemic.includes(entry.epistemicStatus)) {
        throw new EpistemicTrainingViolationError(
          `Stage ${entry.stage} prohibits epistemic status ${entry.epistemicStatus}. Allowed: ${stageConfig.allowedEpistemic.join(', ')}`
        );
      }

      const tokenResult = tokenizer.tokenize(entry.text);
      const tokenIds = tokenResult.tokens.map((t) => t.id);
      const contentHash = crypto.createHash('sha256').update(entry.text, 'utf8').digest('hex');

      // Deterministic 70/15/15 train/val/test split based on contentHash
      const hashInt = parseInt(contentHash.slice(0, 8), 16);
      const bucket = hashInt % 100;
      let split: LanguageDatasetSplit;
      if (bucket < 70) {
        split = LanguageDatasetSplit.TRAIN;
      } else if (bucket < 85) {
        split = LanguageDatasetSplit.VALIDATION;
      } else {
        split = LanguageDatasetSplit.TEST;
      }

      const sample: LanguageCurriculumSample = Object.freeze({
        sampleId: `sample_${contentHash.slice(0, 12)}_${i}`,
        text: entry.text,
        tokenIds: Object.freeze(tokenIds),
        stage: entry.stage,
        split,
        epistemicStatus: entry.epistemicStatus,
        domain: (entry.domain as any) || 'SPATIAL_MEMORY',
        provenanceId: `prov_${contentHash.slice(0, 10)}`,
        referenceObjectIds: Object.freeze(entry.referenceObjectIds || [`ref_obj_${i}`]),
        contentHash,
        timestamp: Date.now(),
      });

      allSamples.push(sample);
    }

    const trainSamples = allSamples.filter((s) => s.split === LanguageDatasetSplit.TRAIN);
    const valSamples = allSamples.filter((s) => s.split === LanguageDatasetSplit.VALIDATION);
    const testSamples = allSamples.filter((s) => s.split === LanguageDatasetSplit.TEST);

    // Anti-leakage cryptographic check: ensure zero overlap between splits
    const trainHashes = new Set(trainSamples.map((s) => s.contentHash));
    for (const v of valSamples) {
      if (trainHashes.has(v.contentHash)) {
        throw new LanguageSplitLeakageError(`Validation sample leaked into training set: ${v.sampleId}`);
      }
    }
    for (const t of testSamples) {
      if (trainHashes.has(t.contentHash)) {
        throw new LanguageSplitLeakageError(`Test sample leaked into training set: ${t.sampleId}`);
      }
    }

    // Generate novel unseen test combinations for true structural generalization testing
    const unseenEntries = this._getUnseenCombinations();
    const unseenCombinations: LanguageCurriculumSample[] = unseenEntries.map((entry, idx) => {
      const tokenResult = tokenizer.tokenize(entry.text);
      const contentHash = crypto.createHash('sha256').update(entry.text, 'utf8').digest('hex');
      return Object.freeze({
        sampleId: `unseen_${contentHash.slice(0, 12)}_${idx}`,
        text: entry.text,
        tokenIds: Object.freeze(tokenResult.tokens.map((t) => t.id)),
        stage: entry.stage,
        split: LanguageDatasetSplit.TEST,
        epistemicStatus: entry.epistemicStatus,
        domain: (entry.domain as any) || 'SPATIAL_MEMORY',
        provenanceId: `prov_unseen_${idx}`,
        referenceObjectIds: Object.freeze([`ref_unseen_${idx}`]),
        contentHash,
        timestamp: Date.now(),
      });
    });

    // Ensure none of the unseen combinations exist in training
    for (const u of unseenCombinations) {
      if (trainHashes.has(u.contentHash)) {
        throw new LanguageSplitLeakageError(`Unseen combination unexpectedly present in training set: ${u.text}`);
      }
    }

    return {
      trainSamples,
      valSamples,
      testSamples,
      unseenCombinations,
    };
  }

  // -------------------------------------------------------------
  // Governed Multi-Stage Training Corpus
  // -------------------------------------------------------------

  private static _getCurriculumCorpus(): RawCurriculumEntry[] {
    return [
      // STAGE 1: SYMBOLS & VOCABULARY (Lexical Grounding)
      { text: 'alpha beta gamma delta epsilon zeta eta theta iota kappa.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'zero one two three four five six seven eight nine ten.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'symbol token subword character string sequence text vocabulary.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'lattice coordinate dimension vector matrix tensor scalar.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'quantum flux inductance capacitance frequency impedance resistance.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'spatial cell origin center boundary harmonic octave frequency.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'atom molecule electron proton neutron photon phonon.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'memory store index record state version checksum identifier.', stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY, epistemicStatus: 'CANONICAL_FACT' },

      // STAGE 2: SYNTAX & GRAMMAR (Structural Composition)
      { text: 'A qubit exists in a linear superposition of two basis states.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'The spatial memory index contains three hundred forty-three cells.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Every deterministic state maintains an immutable cryptographic digest.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'The resonator frequency shifts proportionally when the qubit changes state.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'If temperature increases above critical threshold, superconductivity vanishes.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Multi-layer neural projections preserve dimensional spatial boundaries.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Punctuation marks, including commas and periods, define grammatical clause boundaries.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Mathematical axioms form the foundation of formal logical deduction.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },

      // STAGE 3: ORDERED SEQUENCES (Contextual Continuity)
      { text: 'First, cryogenic cooling reduces thermal fluctuations. Next, microwave pulses excite the transmon. Finally, dispersive readout measures the state.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'A photon enters the optical cavity. The mirrors reflect the wave repeatedly. Interference creates standing electromagnetic wave patterns.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Initial training updates lexical embeddings. Subsequent epochs stabilize syntactic transitions. Long-term consolidation prevents catastrophic forgetting.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: 'When sequence tokens exceed active context capacity, older tokens spill into sparse memory. Lightweight reference pointers preserve temporal lineage.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'The sensor detected an energy spike at ten milliseconds. Subsequent measurements confirmed a sustained resonant oscillation.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: 'Subwords combine into meaningful linguistic phrases. Ordered phrases form complete propositions with verifiable truth values.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'CANONICAL_FACT' },

      // STAGE 4: SEMANTICS & PROPOSITIONS (Factual Truth & Epistemic Grounding)
      { text: '[FACT] The speed of light in vacuum is exactly 299792458 meters per second.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'CANONICAL_FACT' },
      { text: '[FACT] Absolute zero temperature corresponds to zero Kelvin or minus 273.15 Celsius.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'CANONICAL_FACT' },
      { text: '[EVIDENCE] Laboratory spectrometer measured emission peak at wavelength 656.3 nanometers.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: '[EVIDENCE] Dielectric loss tangent decreased by forty percent upon cryogenic vacuum baking.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: '[HYPOTHESIS] Quasiparticle poisoning in aluminum thin films causes observed phase relaxation.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'SUPPORTED_HYPOTHESIS' },
      { text: '[HYPOTHESIS] Surface magnetic dipole fluctuations account for residual 1/f flux noise.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'SUPPORTED_HYPOTHESIS' },

      // STAGE 5: REASONING-GROUNDED GENERATION (Deductive & Relational Language)
      { text: 'PREMISE: All superconducting materials have zero electrical resistance below Tc. FACT: Niobium is superconducting at 4K. CONCLUSION: Niobium has zero resistance at 4K.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'PREMISE: A system in thermal equilibrium has constant temperature. EVIDENCE: Measured temperature fluctuated rapidly. CONCLUSION: The system is not in thermal equilibrium.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: 'HYPOTHESIS: Dark matter consists of sterile neutrinos. CONTRADICTION: Observation ruled out keV mass range. REVISION: Dark matter hypothesis requires lighter axion candidate.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'SUPPORTED_HYPOTHESIS' },
      { text: 'QUERY: What is the exact spin polarization of the unmeasured defect? EVALUATION: Data missing. ANSWER: [UNKNOWN] The spin polarization is currently unobservable.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'EPISTEMIC_UNKNOWN' },
      { text: 'DEDUCTION: If qubit frequency equals cavity frequency, strong resonant coupling occurs. The cavity is tuned to 5 GHz. Therefore, transmon must be tuned to 5 GHz.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'ANALYSIS: Contradictory evidence detected between sensor A and sensor B. Epistemic resolution requires withholding canonical promotion until calibration completes.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'EPISTEMIC_UNKNOWN' },
    ];
  }

  // -------------------------------------------------------------
  // Novel Unseen Evaluation Combinations
  // -------------------------------------------------------------

  private static _getUnseenCombinations(): RawCurriculumEntry[] {
    return [
      { text: 'PREMISE: High magnetic fields suppress Cooper pair formation. FACT: Field exceeds critical threshold. CONCLUSION: Cooper pairs dissociate.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'CANONICAL_FACT' },
      { text: '[EVIDENCE] Cryogenic heterodyne mixer measured zero-point vacuum noise calibration.', stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS, epistemicStatus: 'EMPIRICAL_EVIDENCE' },
      { text: 'QUERY: Predict deterministic outcome of unmeasured radioactive decay event. ANSWER: [UNKNOWN] Exact decay instant is quantum mechanical UNKNOWN.', stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION, epistemicStatus: 'EPISTEMIC_UNKNOWN' },
      { text: 'First, magnetic shielding attenuates external noise. Next, microwave attenuation eliminates thermal photons. Finally, qubit coherence reaches one millisecond.', stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES, epistemicStatus: 'CANONICAL_FACT' },
      { text: 'Non-equilibrium phonon scattering generates localized quasiparticle bursts across the substrate.', stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR, epistemicStatus: 'CANONICAL_FACT' },
    ];
  }
}
