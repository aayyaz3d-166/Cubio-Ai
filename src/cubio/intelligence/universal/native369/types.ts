/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F58: Native 369 Intelligence Types & Epistemic Separation
 *
 * Core Rule: 369 is a CubiO universal capability (HARMONIC_369) behind the Router.
 * Crucial Rule: Strict separation between Proven Mathematics vs. Experimental Harmonics.
 */

import { ProviderInfo, ProviderStatus } from '../universalTypes';

export interface VerifiedMathSection {
  readonly inputNumber: number;
  readonly digitalRoot: number; // dr(n) = 1 + ((n - 1) mod 9) for n > 0
  readonly modularClassMod9: number; // n mod 9
  readonly doublingCycleStep: readonly number[]; // [1, 2, 4, 8, 7, 5]
  readonly isTriadicInvariantNode: boolean; // Node in {3, 6, 9}
  readonly formalMathematicalProof: string;
  readonly isMathematicallyProven: true;
}

export interface ExperimentalHarmonicsSection {
  readonly rootHarmonic: 3 | 6 | 9;
  readonly solfeggioCarrierHz: number; // e.g. 396, 417, 528, 639, 741, 852, 963
  readonly vortexFluxVector: readonly [number, number, number];
  readonly harmonicResonanceIndex: number;
  readonly qualitativeAttunement: string;
  readonly isTheoreticalHeuristic: true;
  readonly isMathematicallyProven: false;
}

export interface EpistemicBoundaryAudit {
  readonly epistemicIntegrityPassed: boolean;
  readonly mathematicalProofsSeparated: boolean;
  readonly experimentalHeuristicsLabeled: boolean;
  readonly auditNotes: string;
}

export interface Native369Report {
  readonly requestId: string;
  readonly query: string;
  readonly verifiedMathematics: VerifiedMathSection;
  readonly experimentalHarmonics: ExperimentalHarmonicsSection;
  readonly epistemicBoundaryAudit: EpistemicBoundaryAudit;
  readonly providerId: string;
  readonly reportChecksum: string;
  readonly timestamp: number;
}

export interface INative369Engine {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  compute369(promptOrNumber: string | number): Promise<Readonly<Native369Report>>;
}
