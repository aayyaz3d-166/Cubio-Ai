/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Capability Registry
 *
 * Maps Universal Capability Classes to existing CubiO engines and external providers.
 * Acts as the resolution layer between abstract capabilities and concrete executors.
 */

import { EngineCapability } from '../core/types';
import { UniversalCapabilityClass, ProviderType } from './universalTypes';
import { CubiOProviderRegistry } from './providerRegistry';

export interface CapabilityResolution {
  readonly capabilityClass: UniversalCapabilityClass;
  readonly resolvedBy: 'INTERNAL_ENGINE' | 'EXTERNAL_PROVIDER' | 'UNAVAILABLE';
  readonly engineId?: string;
  readonly engineCapability?: EngineCapability;
  readonly providerType?: ProviderType;
  readonly available: boolean;
}

/**
 * Static mapping from UniversalCapabilityClass to existing CubiO engine identifiers.
 */
const INTERNAL_ENGINE_MAP: Partial<
  Record<UniversalCapabilityClass, { engineId: string; engineCapability: EngineCapability }>
> = {
  NATURAL_LANGUAGE: { engineId: 'ENGINE_NATURAL_RESPONSE', engineCapability: 'NATURAL_LANGUAGE_SYNTHESIS' },
  SPATIAL_REASONING: { engineId: 'ENGINE_REASONING', engineCapability: 'SPATIAL_REASONING' },
  GEOMETRIC_REASONING: { engineId: 'ENGINE_NATURAL_RESPONSE', engineCapability: 'SPATIAL_REASONING' },
  PREDICTION: { engineId: 'ENGINE_PREDICTION', engineCapability: 'PREDICTION' },
  HARMONIC_369: { engineId: 'ENGINE_369_ENCODER', engineCapability: 'HARMONIC_369' },
  WORKFLOW_EXECUTION: { engineId: 'ENGINE_NATURAL_RESPONSE', engineCapability: 'NATURAL_LANGUAGE_SYNTHESIS' },
  PROJECT_ASSISTANCE: { engineId: 'ENGINE_NATURAL_RESPONSE', engineCapability: 'NATURAL_LANGUAGE_SYNTHESIS' },
  FILE_ANALYSIS: { engineId: 'ENGINE_FILE', engineCapability: 'FILE_STORAGE' },
  MULTI_AGENT_PROBLEM_SOLVING: { engineId: 'ENGINE_NATURAL_RESPONSE', engineCapability: 'NATURAL_LANGUAGE_SYNTHESIS' },
};

/**
 * Mapping from UniversalCapabilityClass to required external ProviderType.
 */
const EXTERNAL_PROVIDER_MAP: Partial<Record<UniversalCapabilityClass, ProviderType>> = {
  LLM_REASONING: 'LLM',
  MULTILINGUAL: 'LLM',
  VISION: 'VISION',
  IMAGE_GENERATION: 'IMAGE',
  VOICE_INPUT: 'SPEECH',
  VOICE_OUTPUT: 'SPEECH',
  CODE_GENERATION: 'CODE_EXECUTION',
  CODE_ANALYSIS: 'CODE_EXECUTION',
  CODE_DEBUGGING: 'CODE_EXECUTION',
  RESEARCH: 'LLM',
  MATHEMATICAL_REASONING: 'LLM',
};

export class CubiOCapabilityRegistry {
  constructor(private readonly providerRegistry: CubiOProviderRegistry) {}

  /**
   * Resolves a capability class to its concrete executor (internal engine or external provider).
   */
  public resolveCapability(capClass: UniversalCapabilityClass): Readonly<CapabilityResolution> {
    // 1. Check internal engine mapping first
    const internal = INTERNAL_ENGINE_MAP[capClass];
    if (internal) {
      return Object.freeze({
        capabilityClass: capClass,
        resolvedBy: 'INTERNAL_ENGINE' as const,
        engineId: internal.engineId,
        engineCapability: internal.engineCapability,
        available: true,
      });
    }

    // 2. Check external provider mapping
    const providerType = EXTERNAL_PROVIDER_MAP[capClass];
    if (providerType) {
      const available = this.providerRegistry.isCapabilityAvailable(capClass);
      return Object.freeze({
        capabilityClass: capClass,
        resolvedBy: available ? ('EXTERNAL_PROVIDER' as const) : ('UNAVAILABLE' as const),
        providerType,
        available,
      });
    }

    // 3. Unknown capability
    return Object.freeze({
      capabilityClass: capClass,
      resolvedBy: 'UNAVAILABLE' as const,
      available: false,
    });
  }

  /**
   * Resolves multiple capabilities at once.
   */
  public resolveCapabilities(
    capClasses: readonly UniversalCapabilityClass[]
  ): readonly CapabilityResolution[] {
    return Object.freeze(capClasses.map((c) => this.resolveCapability(c)));
  }

  /**
   * Returns all capabilities that are currently available.
   */
  public getAvailableCapabilities(): readonly UniversalCapabilityClass[] {
    const allCaps: UniversalCapabilityClass[] = [
      'NATURAL_LANGUAGE', 'LLM_REASONING', 'MULTILINGUAL', 'VISION',
      'IMAGE_GENERATION', 'VOICE_INPUT', 'VOICE_OUTPUT', 'CODE_GENERATION',
      'CODE_ANALYSIS', 'CODE_DEBUGGING', 'WORKFLOW_EXECUTION', 'PROJECT_ASSISTANCE',
      'FILE_ANALYSIS', 'RESEARCH', 'MATHEMATICAL_REASONING', 'SPATIAL_REASONING',
      'GEOMETRIC_REASONING', 'PREDICTION', 'HARMONIC_369', 'MULTI_AGENT_PROBLEM_SOLVING',
    ];
    return Object.freeze(allCaps.filter((c) => this.resolveCapability(c).available));
  }

  /**
   * Returns all capabilities that are currently unavailable.
   */
  public getUnavailableCapabilities(): readonly UniversalCapabilityClass[] {
    const allCaps: UniversalCapabilityClass[] = [
      'NATURAL_LANGUAGE', 'LLM_REASONING', 'MULTILINGUAL', 'VISION',
      'IMAGE_GENERATION', 'VOICE_INPUT', 'VOICE_OUTPUT', 'CODE_GENERATION',
      'CODE_ANALYSIS', 'CODE_DEBUGGING', 'WORKFLOW_EXECUTION', 'PROJECT_ASSISTANCE',
      'FILE_ANALYSIS', 'RESEARCH', 'MATHEMATICAL_REASONING', 'SPATIAL_REASONING',
      'GEOMETRIC_REASONING', 'PREDICTION', 'HARMONIC_369', 'MULTI_AGENT_PROBLEM_SOLVING',
    ];
    return Object.freeze(allCaps.filter((c) => !this.resolveCapability(c).available));
  }
}
