/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Provider / Capability Layer Types & Contracts
 *
 * Supports 8 Provider Classes: LLM, Vision, Image, STT, TTS, Code sandbox, Research, External tools.
 * Enforces Honest Availability Invariant: Provider unavailable -> Honest UNAVAILABLE, no hallucination.
 */

export type UniversalProviderClass =
  | 'LLM'
  | 'VISION'
  | 'IMAGE'
  | 'STT'
  | 'TTS'
  | 'CODE_SANDBOX'
  | 'RESEARCH'
  | 'EXTERNAL_TOOLS';

export type UniversalProviderHealth = 'UP' | 'DEGRADED' | 'DOWN';

export interface UniversalProviderProfile {
  readonly id: string;
  readonly name: string;
  readonly providerClass: UniversalProviderClass;
  readonly health: UniversalProviderHealth;
  readonly latencyMs: number;
  readonly costPer1kUnits: number;
  readonly fidelityScore: number; // 0.0 to 1.0
  readonly supportedFeatures: readonly string[];
  readonly isLocalSovereign: boolean;
  readonly lastCheckedAt: number;
}

export interface ProviderSelectionCriteria {
  readonly providerClass: UniversalProviderClass;
  readonly requiredFeatures?: readonly string[];
  readonly maxLatencyMs?: number;
  readonly maxCost?: number;
  readonly preferLocalSovereign?: boolean;
}

export interface ProviderScoredCandidate {
  readonly profile: UniversalProviderProfile;
  readonly compositeScore: number;
  readonly reasons: readonly string[];
}

export interface ProviderExecutionResult<T = unknown> {
  readonly status: 'SUCCESS' | 'UNAVAILABLE' | 'FAILED';
  readonly providerId?: string;
  readonly providerClass: UniversalProviderClass;
  readonly result?: T;
  readonly executionTimeMs: number;
  readonly cost: number;
  readonly isSovereignFallback: boolean;
  readonly error?: string;
}

export interface IProviderCapabilityCoordinator {
  registerProvider(profile: UniversalProviderProfile): void;
  updateProviderHealth(
    providerId: string,
    health: UniversalProviderHealth,
    latencyMs?: number
  ): void;
  selectBestProvider(criteria: ProviderSelectionCriteria): ProviderScoredCandidate | undefined;
  executeCapability<T>(
    criteria: ProviderSelectionCriteria,
    executor: (profile: UniversalProviderProfile) => Promise<T>
  ): Promise<Readonly<ProviderExecutionResult<T>>>;
}
