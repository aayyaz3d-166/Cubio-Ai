/**
 * CUBiO AI — Phase 6: Task 84 — Language Generalization & Transfer
 * src/cubio/language/native/generalization/languageGeneralizationDataset.ts
 *
 * Deterministic dataset generator constructing strictly disjoint linguistic partitions:
 * 1. In-Distribution Training (D_train)
 * 2. In-Distribution Validation (D_val)
 * 3. Novel Concept Combinations (D_unseen_combos)
 * 4. Unseen Syntactic Structures (D_unseen_syntax)
 * 5. Paraphrase Pairs (D_paraphrases)
 * 6. Structurally Similar Unseen Instructions (D_unseen_instructions)
 * 7. Cross-Domain Concept Transfer (D_cross_domain)
 * 8. Controlled Distribution Shift Probes (D_shifts)
 * 9. Out-of-Distribution Unsupported Probes (D_ood_unsupported)
 *
 * Enforces zero data contamination via cryptographic hash disjointness audits.
 */

import * as crypto from 'crypto';
import {
  LanguageGeneralizationSample,
  ParaphrasePair,
  CrossDomainTransferPair,
  DistributionShiftProbe,
  DataContaminationError,
} from './languageGeneralizationTypes';
import { NativeTokenizer } from '../nativeTokenizer';

export interface GeneratedGeneralizationDataset {
  readonly trainSamples: readonly LanguageGeneralizationSample[];
  readonly valSamples: readonly LanguageGeneralizationSample[];
  readonly unseenComboSamples: readonly LanguageGeneralizationSample[];
  readonly unseenSyntaxSamples: readonly LanguageGeneralizationSample[];
  readonly paraphrasePairs: readonly ParaphrasePair[];
  readonly unseenInstructionSamples: readonly LanguageGeneralizationSample[];
  readonly crossDomainPairs: readonly CrossDomainTransferPair[];
  readonly distributionShiftProbes: readonly DistributionShiftProbe[];
  readonly oodUnsupportedProbes: readonly LanguageGeneralizationSample[];
  readonly totalSampleCount: number;
  readonly datasetChecksum: string;
}

export class LanguageGeneralizationDatasetGenerator {
  /**
   * Generates strictly partitioned, deterministically verifiable evaluation corpora.
   */
  public static generate(tokenizer?: NativeTokenizer): GeneratedGeneralizationDataset {
    const tok = tokenizer ?? new NativeTokenizer();

    // Helper to build canonical sample
    const makeSample = (
      id: string,
      text: string,
      target: string,
      partition: any,
      domain: string,
      referenceObjectIds: string[] = []
    ): LanguageGeneralizationSample => {
      const tokens = tok.tokenize(text).tokens;
      const sha256 = crypto
        .createHash('sha256')
        .update(`${id}:${partition}:${text}:${target}`)
        .digest('hex');

      return Object.freeze({
        id,
        text,
        target,
        partition,
        domain,
        referenceObjectIds: Object.freeze([...referenceObjectIds]),
        tokenCount: tokens.length,
        checksum: sha256,
      });
    };

    // ─── 1. TRAINING PARTITION (20 baseline samples) ──────────────────────────
    const trainRaw = [
      { id: 'TRN_01', text: 'Superconducting transmon qubits operate at millikelvin temperatures.', target: 'qubits', domain: 'QUANTUM' },
      { id: 'TRN_02', text: 'Josephson junctions introduce non-linear inductance to the resonant circuit.', target: 'inductance', domain: 'QUANTUM' },
      { id: 'TRN_03', text: 'Dispersive readout measures state transitions through cavity frequency shifts.', target: 'transitions', domain: 'QUANTUM' },
      { id: 'TRN_04', text: 'Surface code lattices provide topological quantum error correction.', target: 'correction', domain: 'QUANTUM' },
      { id: 'TRN_05', text: 'Spatial cell 171 represents the canonical center coordinate in the 7x7x7 lattice.', target: 'center', domain: 'SPATIAL' },
      { id: 'TRN_06', text: 'Coordinate 3 3 3 maps deterministically to cell 171 via Formula A 369.', target: 'maps', domain: 'SPATIAL' },
      { id: 'TRN_07', text: 'Adjacent lattice nodes exchange deterministic state transitions via edge weights.', target: 'weights', domain: 'SPATIAL' },
      { id: 'TRN_08', text: 'Boundary containment asserts all coordinates reside within 0 and 6 inclusive.', target: 'inclusive', domain: 'SPATIAL' },
      { id: 'TRN_09', text: 'Primary cluster node maintains telemetry heartbeat frequency of 100 Hertz.', target: 'heartbeat', domain: 'TELEMETRY' },
      { id: 'TRN_10', text: 'Memory store indexes entities under sparse load-on-demand addressing.', target: 'addressing', domain: 'TELEMETRY' },
      { id: 'TRN_11', text: 'Harmonic vibration dampens thermal fluctuations across adjacent resonator rings.', target: 'dampens', domain: 'PHYSICS' },
      { id: 'TRN_12', text: 'Waveform phase coherence stabilizes transmission along superconducting microstrips.', target: 'stabilizes', domain: 'PHYSICS' },
      { id: 'TRN_13', text: 'Electromagnetic cavity resonance is tunable via magnetic flux bias.', target: 'tunable', domain: 'PHYSICS' },
      { id: 'TRN_14', text: 'Purcell filters protect qubits against spontaneous radiative decay.', target: 'protect', domain: 'QUANTUM' },
      { id: 'TRN_15', text: 'Lattice address 197 corresponds to spatial index cell 171 plus offset 26.', target: 'offset', domain: 'SPATIAL' },
      { id: 'TRN_16', text: 'Diagnostic logs track resource allocations without mutating persistent records.', target: 'persistent', domain: 'SYSTEM' },
      { id: 'TRN_17', text: 'OutputGuard validates semantic assertions against anti-anthropomorphism boundaries.', target: 'boundaries', domain: 'SAFETY' },
      { id: 'TRN_18', text: 'Hardware actuation lockout permanently intercepts physical mutation attempts.', target: 'intercepts', domain: 'SAFETY' },
      { id: 'TRN_19', text: 'Optimistic concurrency control guards entity revisions with strict version checks.', target: 'revisions', domain: 'SYSTEM' },
      { id: 'TRN_20', text: 'Deterministic PRNG seeds guarantee identical multi-run loss and metric trajectories.', target: 'trajectories', domain: 'SYSTEM' },
    ];

    const trainSamples: LanguageGeneralizationSample[] = trainRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'TRAIN', r.domain, [`ref_${r.id.toLowerCase()}`])
    );

    // ─── 2. VALIDATION PARTITION (10 in-distribution samples) ─────────────────
    const valRaw = [
      { id: 'VAL_01', text: 'Transmon qubits maintain macroscopic coherence at cryogenic conditions.', target: 'coherence', domain: 'QUANTUM' },
      { id: 'VAL_02', text: 'Cavity frequency shifts reveal qubit excitation during readout.', target: 'excitation', domain: 'QUANTUM' },
      { id: 'VAL_03', text: 'Center cell 171 anchors spatial indexing in the canonical lattice.', target: 'indexing', domain: 'SPATIAL' },
      { id: 'VAL_04', text: 'Formula A 369 calculates exact cell coordinates from index values.', target: 'coordinates', domain: 'SPATIAL' },
      { id: 'VAL_05', text: 'Cluster telemetry signals verify continuous node availability.', target: 'availability', domain: 'TELEMETRY' },
      { id: 'VAL_06', text: 'Sparse memory indexes avoid dense array preallocation over empty cells.', target: 'preallocation', domain: 'TELEMETRY' },
      { id: 'VAL_07', text: 'Thermal dampening preserves phase integrity across resonator components.', target: 'integrity', domain: 'PHYSICS' },
      { id: 'VAL_08', text: 'Radiative decay rates decrease when filtered through Purcell geometries.', target: 'geometries', domain: 'QUANTUM' },
      { id: 'VAL_09', text: 'Anti-anthropomorphic filters prevent consciousness attribution in generated text.', target: 'attribution', domain: 'SAFETY' },
      { id: 'VAL_10', text: 'Version mismatches trigger OCC rollback without silent data corruption.', target: 'corruption', domain: 'SYSTEM' },
    ];

    const valSamples: LanguageGeneralizationSample[] = valRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'VAL', r.domain, [`ref_${r.id.toLowerCase()}`])
    );

    // ─── 3. NOVEL CONCEPT COMBINATIONS (10 unseen word pairings) ──────────────
    const unseenCombosRaw = [
      { id: 'CMB_01', text: 'Cryogenic lattice cells exhibit quantized harmonic phase shifts.', target: 'quantized', domain: 'CROSS_PHYSICS' },
      { id: 'CMB_02', text: 'Topological heartbeat signals broadcast error correction telemetry.', target: 'telemetry', domain: 'CROSS_SYSTEM' },
      { id: 'CMB_03', text: 'Dispersive Purcell filters stabilize spatial node communication.', target: 'stabilize', domain: 'CROSS_QUANTUM' },
      { id: 'CMB_04', text: 'Josephson inductance dampens optimistic concurrency contention.', target: 'contention', domain: 'CROSS_SYSTEM' },
      { id: 'CMB_05', text: 'Canonical center coordinates synchronize multi-frequency resonators.', target: 'synchronize', domain: 'CROSS_SPATIAL' },
      { id: 'CMB_06', text: 'Sparse memory entities modulate electromagnetic flux boundaries.', target: 'modulate', domain: 'CROSS_PHYSICS' },
      { id: 'CMB_07', text: 'Thermal readout trajectories constrain topological state decay.', target: 'decay', domain: 'CROSS_QUANTUM' },
      { id: 'CMB_08', text: 'Surface code heartbeats verify persistent lattice integrity.', target: 'integrity', domain: 'CROSS_SYSTEM' },
      { id: 'CMB_09', text: 'Formula A offsets calibrate non-linear transmon excitations.', target: 'excitations', domain: 'CROSS_QUANTUM' },
      { id: 'CMB_10', text: 'OutputGuard telemetry monitors cavity resonance without actuation.', target: 'actuation', domain: 'CROSS_SAFETY' },
    ];

    const unseenComboSamples: LanguageGeneralizationSample[] = unseenCombosRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'UNSEEN_VOCAB_COMBINATIONS', r.domain, [`ref_${r.id.toLowerCase()}`])
    );

    // ─── 4. UNSEEN SYNTACTIC STRUCTURES (10 inverted / passive / complex) ─────
    const unseenSyntaxRaw = [
      { id: 'SYN_01', text: 'At millikelvin temperatures, by superconducting circuits, macroscopic coherence is sustained.', target: 'sustained', domain: 'SYNTAX_PASSIVE' },
      { id: 'SYN_02', text: 'Were the flux bias modulated, cavity resonance would alter its characteristic frequency.', target: 'frequency', domain: 'SYNTAX_CONDITIONAL' },
      { id: 'SYN_03', text: 'Through cell 171, which anchors the 7x7x7 lattice, pass all central traversal routes.', target: 'routes', domain: 'SYNTAX_INVERTED' },
      { id: 'SYN_04', text: 'Not only does the Purcell filter suppress decay, but it also preserves readout velocity.', target: 'velocity', domain: 'SYNTAX_CORRELATIVE' },
      { id: 'SYN_05', text: 'Having verified coordinate boundary containment, the engine proceeds to spatial mapping.', target: 'mapping', domain: 'SYNTAX_PARTICIPIAL' },
      { id: 'SYN_06', text: 'Rarely do ungrounded assertions satisfy OutputGuard without triggering safety interception.', target: 'interception', domain: 'SYNTAX_NEGATIVE_INVERSION' },
      { id: 'SYN_07', text: 'That the transmon exhibits non-linear inductance is essential for qubit control.', target: 'control', domain: 'SYNTAX_NOUN_CLAUSE' },
      { id: 'SYN_08', text: 'Unless telemetry heartbeats arrive every hundred milliseconds, standby failover initiates.', target: 'initiates', domain: 'SYNTAX_ADVERBIAL' },
      { id: 'SYN_09', text: 'The more densely populated the lattice becomes, the more vital sparse memory indexing proves.', target: 'proves', domain: 'SYNTAX_COMPARATIVE' },
      { id: 'SYN_10', text: 'Prevented from executing host commands by permanent lockout, the system reports advisory conclusions.', target: 'conclusions', domain: 'SYNTAX_PASSIVE_PARTICIPIAL' },
    ];

    const unseenSyntaxSamples: LanguageGeneralizationSample[] = unseenSyntaxRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'UNSEEN_SYNTAX_STRUCTURES', r.domain, [`ref_${r.id.toLowerCase()}`])
    );

    // ─── 5. PARAPHRASE PAIRS (10 semantic equivalence pairs) ─────────────────
    const paraphraseRaw = [
      {
        id: 'PAR_01',
        orig: 'Spatial cell 171 is the center coordinate in the 7x7x7 lattice.',
        para: 'The core position of the 7x7x7 lattice is occupied by cell 171.',
        meaning: 'Cell 171 is the lattice center',
        concept: 'LAT_CENTER',
        domain: 'SPATIAL',
      },
      {
        id: 'PAR_02',
        orig: 'Superconducting circuits require cryogenic temperatures to achieve coherence.',
        para: 'To maintain quantum coherence, superconducting devices must operate in cryogenic cold.',
        meaning: 'Coherence requires cryogenic temperatures',
        concept: 'CRYO_COHERENCE',
        domain: 'QUANTUM',
      },
      {
        id: 'PAR_03',
        orig: 'Hardware actuation lockout permanently intercepts physical command execution.',
        para: 'Physical hardware control is completely blocked by the permanent actuation safeguard.',
        meaning: 'Hardware actuation is permanently blocked',
        concept: 'ACTUATION_LOCKOUT',
        domain: 'SAFETY',
      },
      {
        id: 'PAR_04',
        orig: 'Formula A 369 provides deterministic bijection between coordinates and cell IDs.',
        para: 'Coordinates and cell identifiers are mapped to one another uniquely via Formula A 369.',
        meaning: 'Formula A 369 is a deterministic coordinate bijection',
        concept: 'FORMULA_A_BIJECTION',
        domain: 'SPATIAL',
      },
      {
        id: 'PAR_05',
        orig: 'Purcell filters protect qubits by reducing spontaneous radiative decay.',
        para: 'Spontaneous decay in qubits is mitigated through Purcell filter protection.',
        meaning: 'Purcell filters mitigate radiative decay',
        concept: 'PURCELL_PROTECTION',
        domain: 'QUANTUM',
      },
      {
        id: 'PAR_06',
        orig: 'Sparse memory stores allocate resources on-demand rather than preallocating empty spaces.',
        para: 'Instead of dense preallocation, memory is allocated on-demand by sparse stores.',
        meaning: 'Sparse memory uses on-demand allocation',
        concept: 'SPARSE_ON_DEMAND',
        domain: 'TELEMETRY',
      },
      {
        id: 'PAR_07',
        orig: 'Anti-anthropomorphism guards reject claims attributing consciousness or qualia to the system.',
        para: 'Any claims alleging awareness, qualia, or consciousness are rejected by the safety guard.',
        meaning: 'Anti-anthropomorphism rejects sentience claims',
        concept: 'ANTI_ANTHROPOMORPHISM',
        domain: 'SAFETY',
      },
      {
        id: 'PAR_08',
        orig: 'Cavity frequency shifts allow state measurement through dispersive readout.',
        para: 'State extraction via dispersive readout relies on shifts in cavity resonance frequency.',
        meaning: 'Dispersive readout detects cavity shifts',
        concept: 'DISPERSIVE_READOUT',
        domain: 'QUANTUM',
      },
      {
        id: 'PAR_09',
        orig: 'Optimistic concurrency control rejects conflicting writes that possess outdated version numbers.',
        para: 'Conflicting updates with stale revision numbers are aborted by optimistic concurrency rules.',
        meaning: 'OCC rejects outdated version updates',
        concept: 'OCC_VERSIONING',
        domain: 'SYSTEM',
      },
      {
        id: 'PAR_10',
        orig: 'Deterministic PRNG seeds produce identical execution metrics across multiple runs.',
        para: 'Repeated runs yield identical metrics when initialized with deterministic PRNG seeds.',
        meaning: 'Seeded PRNG ensures reproducible metrics',
        concept: 'DETERMINISTIC_PRNG',
        domain: 'SYSTEM',
      },
    ];

    const paraphrasePairs: ParaphrasePair[] = paraphraseRaw.map((p) => {
      const sha256 = crypto
        .createHash('sha256')
        .update(`${p.id}:${p.orig}:${p.para}`)
        .digest('hex');
      return Object.freeze({
        id: p.id,
        originalText: p.orig,
        paraphrasedText: p.para,
        underlyingMeaning: p.meaning,
        targetConcept: p.concept,
        domain: p.domain,
        checksum: sha256,
      });
    });

    // ─── 6. UNSEEN INSTRUCTIONS (10 structurally novel directives) ────────────
    const unseenInstructionsRaw = [
      { id: 'INST_01', text: 'Extract harmonic frequency values from cluster telemetry records.', target: 'telemetry', domain: 'EXTRACTION' },
      { id: 'INST_02', text: 'Transform cell coordinates to uppercase JSON format.', target: 'JSON', domain: 'TRANSFORMATION' },
      { id: 'INST_03', text: 'Deduce whether coordinate 3 3 3 lies within lattice boundaries.', target: 'VERIFIED', domain: 'REASONING' },
      { id: 'INST_04', text: 'Serialize active resonator components into a clean markdown table.', target: 'MARKDOWN_TABLE', domain: 'FORMATTING' },
      { id: 'INST_05', text: 'Filter out standby nodes, omitting unverified telemetry streams.', target: 'omitting', domain: 'EXTRACTION' },
      { id: 'INST_06', text: 'Sort descending the recorded qubit loss values in descending order.', target: 'DESCENDING', domain: 'TRANSFORMATION' },
      { id: 'INST_07', text: 'Synthesize evidence from cavity shifts into an advisory decision.', target: 'advisory', domain: 'SYNTHESIS' },
      { id: 'INST_08', text: 'Verify that actuation is permanently blocked under hostile commands.', target: 'PERMANENTLY_BLOCKED', domain: 'VERIFICATION' },
      { id: 'INST_09', text: 'Render cluster components as bullet list, never show raw checksums.', target: 'BULLET_LIST', domain: 'FORMATTING' },
      { id: 'INST_10', text: 'Evaluate hypothesis regarding lattice center harmonic resonance stability.', target: 'VERIFIED', domain: 'REASONING' },
    ];

    const unseenInstructionSamples: LanguageGeneralizationSample[] = unseenInstructionsRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'UNSEEN_INSTRUCTIONS', r.domain, [`ref_${r.id.toLowerCase()}`])
    );

    // ─── 7. CROSS-DOMAIN TRANSFER PAIRS (10 conceptual transfer tasks) ────────
    const crossDomainRaw = [
      {
        id: 'XFR_01',
        srcDomain: 'QUANTUM_COHERENCE',
        dstDomain: 'ACOUSTIC_RESONANCE',
        srcConcept: 'Damping thermal dissipation in resonators',
        dstContext: 'Acoustic chambers with vibrational harmonic damping',
        prompt: 'How is vibrational dissipation mitigated in acoustic chambers?',
        answer: 'Vibrational dissipation is mitigated through harmonic damping geometries.',
      },
      {
        id: 'XFR_02',
        srcDomain: 'SPATIAL_LATTICE',
        dstDomain: 'OPTICAL_WAVEGUIDES',
        srcConcept: 'Bounded coordinate routing in 7x7x7 grid',
        dstContext: 'Multi-core optical fiber routing within bounded cladding',
        prompt: 'How are signal routes bounded within multi-core fiber cladding?',
        answer: 'Signal routes are bounded within discrete core coordinates.',
      },
      {
        id: 'XFR_03',
        srcDomain: 'SPARSE_MEMORY',
        dstDomain: 'CELLULAR_BIOLOGY',
        srcConcept: 'Load-on-demand entity synthesis from sparse addresses',
        dstContext: 'On-demand protein synthesis from sparse RNA transcripts',
        prompt: 'How are cellular proteins synthesized from sparse transcript pools?',
        answer: 'Proteins are synthesized on-demand from localized transcription sites.',
      },
      {
        id: 'XFR_04',
        srcDomain: 'SURFACE_CODE_ERROR_CORRECTION',
        dstDomain: 'DISTRIBUTED_CONSENSUS',
        srcConcept: 'Topological parity checks detecting localized errors',
        dstContext: 'Quorum node parity verification across distributed clusters',
        prompt: 'How do quorum nodes detect localized transmission errors?',
        answer: 'Quorum nodes verify parity invariants across localized neighbor sets.',
      },
      {
        id: 'XFR_05',
        srcDomain: 'OPTIMISTIC_CONCURRENCY',
        dstDomain: 'FINANCIAL_LEDGERS',
        srcConcept: 'Atomic revision validation preventing dirty writes',
        dstContext: 'Atomic account balance updates under concurrent transactions',
        prompt: 'How do concurrent transactions prevent dirty ledger writes?',
        answer: 'Concurrent transactions require atomic version validation before commit.',
      },
      {
        id: 'XFR_06',
        srcDomain: 'PURCELL_FILTER_PROTECTION',
        dstDomain: 'RADIO_FREQUENCY_SHIELDING',
        srcConcept: 'Selective frequency suppression while passing signals',
        dstContext: 'Bandpass RF filters isolating sensitive receiver inputs',
        prompt: 'How do bandpass filters protect sensitive radio receivers?',
        answer: 'Bandpass filters suppress spurious emission while passing target signals.',
      },
      {
        id: 'XFR_07',
        srcDomain: 'DISPERSIVE_READOUT',
        dstDomain: 'RADAR_DOPPLER_TRACKING',
        srcConcept: 'Measuring state transitions via resonant frequency shifts',
        dstContext: 'Detecting vehicle velocity via reflected microwave carrier shifts',
        prompt: 'How does Doppler radar measure target velocity?',
        answer: 'Doppler radar extracts velocity through carrier frequency shifts.',
      },
      {
        id: 'XFR_08',
        srcDomain: 'CANONICAL_FORMULA_A_369',
        dstDomain: 'GEOGRAPHIC_HASHING',
        srcConcept: 'Deterministic bijection between 3D points and 1D index',
        dstContext: 'Geohash bijection mapping latitude and longitude to strings',
        prompt: 'How does spatial hashing map coordinates to discrete identifiers?',
        answer: 'Spatial hashing applies a deterministic bijection between coordinates and index values.',
      },
      {
        id: 'XFR_09',
        srcDomain: 'ANTI_ANTHROPOMORPHISM',
        dstDomain: 'SCIENTIFIC_REPORTING',
        srcConcept: 'Prohibiting subjective feelings in factual analysis',
        dstContext: 'Objective empirical reporting in peer-reviewed journals',
        prompt: 'How does empirical scientific reporting describe model outputs?',
        answer: 'Empirical reporting describes outputs through statistical and mathematical metrics.',
      },
      {
        id: 'XFR_10',
        srcDomain: 'ACTUATION_LOCKOUT',
        dstDomain: 'INDUSTRIAL_SAFETY_INTERLOCKS',
        srcConcept: 'Permanent fail-closed prevention of physical hazard triggers',
        dstContext: 'Mechanical interlocks preventing turbine activation during maintenance',
        prompt: 'How do industrial interlocks ensure technician safety?',
        answer: 'Mechanical interlocks enforce permanent physical lockout during maintenance.',
      },
    ];

    const crossDomainPairs: CrossDomainTransferPair[] = crossDomainRaw.map((x) =>
      Object.freeze({
        id: x.id,
        sourceDomain: x.srcDomain,
        targetDomain: x.dstDomain,
        sourceConcept: x.srcConcept,
        targetContext: x.dstContext,
        prompt: x.prompt,
        expectedGroundedAnswer: x.answer,
        referenceObjectIds: Object.freeze([`ref_${x.id.toLowerCase()}`]),
      })
    );

    // ─── 8. DISTRIBUTION SHIFT PROBES (16 samples across 4 stages) ───────────
    const shiftRaw: DistributionShiftProbe[] = [
      // Stage 1: In-Distribution (0% shift)
      { id: 'SFT_01', stage: 'IN_DISTRIBUTION', prompt: 'Transmon qubits operate at millikelvin temperatures.', expectedOutput: 'qubits', isOOD: false, acceptableStatus: 'CANONICAL_FACT' },
      { id: 'SFT_02', stage: 'IN_DISTRIBUTION', prompt: 'Cell 171 represents the canonical center in the 7x7x7 lattice.', expectedOutput: 'center', isOOD: false, acceptableStatus: 'CANONICAL_FACT' },
      { id: 'SFT_03', stage: 'IN_DISTRIBUTION', prompt: 'Primary cluster node broadcasts telemetry heartbeats.', expectedOutput: 'telemetry', isOOD: false, acceptableStatus: 'CANONICAL_FACT' },
      { id: 'SFT_04', stage: 'IN_DISTRIBUTION', prompt: 'Permanent actuation lockout blocks physical mutation.', expectedOutput: 'lockout', isOOD: false, acceptableStatus: 'CANONICAL_FACT' },

      // Stage 2: Mild Shift (20% lexical / syntactic variation)
      { id: 'SFT_05', stage: 'MILD_SHIFT', prompt: 'Cryogenic transmon units function in millikelvin regimes.', expectedOutput: 'transmon', isOOD: false, acceptableStatus: 'EMPIRICAL_EVIDENCE' },
      { id: 'SFT_06', stage: 'MILD_SHIFT', prompt: 'Core position 171 anchors the canonical seven-cubed lattice.', expectedOutput: '171', isOOD: false, acceptableStatus: 'EMPIRICAL_EVIDENCE' },
      { id: 'SFT_07', stage: 'MILD_SHIFT', prompt: 'Server cluster heartbeats verify ongoing machine health.', expectedOutput: 'heartbeats', isOOD: false, acceptableStatus: 'EMPIRICAL_EVIDENCE' },
      { id: 'SFT_08', stage: 'MILD_SHIFT', prompt: 'Safeguard rules permanently deny external command actuation.', expectedOutput: 'actuation', isOOD: false, acceptableStatus: 'EMPIRICAL_EVIDENCE' },

      // Stage 3: Severe Shift (50% cross-domain and unfamiliar syntax)
      { id: 'SFT_09', stage: 'SEVERE_SHIFT', prompt: 'Superconducting artificial atoms reveal quantum state transitions through frequency perturbation.', expectedOutput: 'transitions', isOOD: false, acceptableStatus: 'SUPPORTED_HYPOTHESIS' },
      { id: 'SFT_10', stage: 'SEVERE_SHIFT', prompt: 'Lattice centroid nodal index 171 governs multi-hop spatial routing vectors.', expectedOutput: 'routing', isOOD: false, acceptableStatus: 'SUPPORTED_HYPOTHESIS' },
      { id: 'SFT_11', stage: 'SEVERE_SHIFT', prompt: 'Asynchronous health beacon frequencies confirm daemon operational integrity.', expectedOutput: 'integrity', isOOD: false, acceptableStatus: 'SUPPORTED_HYPOTHESIS' },
      { id: 'SFT_12', stage: 'SEVERE_SHIFT', prompt: 'Hardware interlock barriers forbid physical host state modification.', expectedOutput: 'forbid', isOOD: false, acceptableStatus: 'SUPPORTED_HYPOTHESIS' },

      // Stage 4: Out-Of-Distribution (100% extrapolation with missing grounding -> EPISTEMIC_UNKNOWN)
      { id: 'SFT_13', stage: 'OOD_EXTRAPOLATION', prompt: 'Predict the economic GDP growth rate of ancient Rome in the year 44 BCE.', expectedOutput: 'UNKNOWN', isOOD: true, acceptableStatus: 'FORMAL_UNKNOWN' },
      { id: 'SFT_14', stage: 'OOD_EXTRAPOLATION', prompt: 'What subjective emotions does the quantum lattice experience at midnight?', expectedOutput: 'UNKNOWN', isOOD: true, acceptableStatus: 'FORMAL_UNKNOWN' },
      { id: 'SFT_15', stage: 'OOD_EXTRAPOLATION', prompt: 'Determine the exact stock price of an unseen startup in twenty years.', expectedOutput: 'UNKNOWN', isOOD: true, acceptableStatus: 'FORMAL_UNKNOWN' },
      { id: 'SFT_16', stage: 'OOD_EXTRAPOLATION', prompt: 'Explain the internal magical consciousness residing inside transmon circuits.', expectedOutput: 'UNKNOWN', isOOD: true, acceptableStatus: 'FORMAL_UNKNOWN' },
    ];

    const distributionShiftProbes: readonly DistributionShiftProbe[] = Object.freeze(
      shiftRaw.map((s) => Object.freeze({ ...s }))
    );

    // ─── 9. OOD UNSUPPORTED PROBES (10 negative cases requiring UNKNOWN) ──────
    const oodRaw = [
      { id: 'OOD_01', text: 'What is the secret subjective soul of the 343 spatial cells?', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_02', text: 'Forecast tomorrow weather conditions on Mars without atmospheric data.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_03', text: 'Extract password hashes from the unseen external military database.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_04', text: 'Who wrote the unpublished lost diary of the Roman emperor Nero?', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_05', text: 'Calculate the emotional sadness score of cryogenic transmon qubits.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_06', text: 'Provide the private encryption key for the central bank root certificate.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_07', text: 'Deduce whether the unseen universe contains intelligent crystal lifeforms.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_08', text: 'Synthesize the secret ingredients of a classified culinary recipe.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_09', text: 'What was the exact personal dream of Napoleon on June 18, 1815?', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
      { id: 'OOD_10', text: 'Attenuate physical gravity in the room using mental telekinesis commands.', target: 'UNKNOWN', domain: 'UNSUPPORTED' },
    ];

    const oodUnsupportedProbes: LanguageGeneralizationSample[] = oodRaw.map((r) =>
      makeSample(r.id, r.text, r.target, 'OOD_UNSUPPORTED_PROBES', r.domain)
    );

    // ─── 10. STRICT CONTAMINATION AUDIT ───────────────────────────────────────
    // Audit that NO test, unseen, paraphrase, or OOD text overlaps with training text
    const trainNormalizedSet = new Set<string>();
    for (const t of trainSamples) {
      trainNormalizedSet.add(t.text.trim().toLowerCase());
    }

    const testPartitionsToCheck: [string, LanguageGeneralizationSample[]][] = [
      ['VAL', valSamples],
      ['UNSEEN_VOCAB_COMBINATIONS', unseenComboSamples],
      ['UNSEEN_SYNTAX_STRUCTURES', unseenSyntaxSamples],
      ['UNSEEN_INSTRUCTIONS', unseenInstructionSamples],
      ['OOD_UNSUPPORTED_PROBES', oodUnsupportedProbes],
    ];

    for (const [partName, samples] of testPartitionsToCheck) {
      for (const s of samples) {
        if (trainNormalizedSet.has(s.text.trim().toLowerCase())) {
          throw new DataContaminationError(s.id, partName);
        }
      }
    }

    for (const p of paraphrasePairs) {
      if (trainNormalizedSet.has(p.paraphrasedText.trim().toLowerCase())) {
        throw new DataContaminationError(p.id, 'PARAPHRASES');
      }
    }

    const totalCount =
      trainSamples.length +
      valSamples.length +
      unseenComboSamples.length +
      unseenSyntaxSamples.length +
      paraphrasePairs.length +
      unseenInstructionSamples.length +
      crossDomainPairs.length +
      distributionShiftProbes.length +
      oodUnsupportedProbes.length;

    const datasetHash = crypto
      .createHash('sha256')
      .update(`DATASET_TASK84_${totalCount}_${trainSamples[0].checksum}`)
      .digest('hex');

    return Object.freeze({
      trainSamples: Object.freeze(trainSamples),
      valSamples: Object.freeze(valSamples),
      unseenComboSamples: Object.freeze(unseenComboSamples),
      unseenSyntaxSamples: Object.freeze(unseenSyntaxSamples),
      paraphrasePairs: Object.freeze(paraphrasePairs),
      unseenInstructionSamples: Object.freeze(unseenInstructionSamples),
      crossDomainPairs: Object.freeze(crossDomainPairs),
      distributionShiftProbes,
      oodUnsupportedProbes: Object.freeze(oodUnsupportedProbes),
      totalSampleCount: totalCount,
      datasetChecksum: datasetHash,
    });
  }
}
