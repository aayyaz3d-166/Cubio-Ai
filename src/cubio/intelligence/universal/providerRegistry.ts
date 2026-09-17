/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F46: Provider Registry
 *
 * Central registry for all external/internal capability providers.
 * Supports LLM, Image, Vision, Speech, Code Execution, and Tool providers.
 * Returns honest UNAVAILABLE status when no provider is registered.
 */

import { deterministicHash } from '../../state/determinism';
import {
  ProviderType,
  ProviderStatus,
  ProviderInfo,
  UniversalCapabilityClass,
  ILLMProvider,
  IImageProvider,
  IVisionProvider,
  ISpeechProvider,
  ICodeExecutionProvider,
  IToolProvider,
} from './universalTypes';

export type AnyProvider =
  | ILLMProvider
  | IImageProvider
  | IVisionProvider
  | ISpeechProvider
  | ICodeExecutionProvider
  | IToolProvider;

/**
 * Capability-to-ProviderType mapping.
 * Capabilities served by existing CubiO engines map to 'INTERNAL'.
 */
const CAPABILITY_PROVIDER_MAP: Record<UniversalCapabilityClass, ProviderType | 'INTERNAL'> = {
  NATURAL_LANGUAGE: 'INTERNAL',
  LLM_REASONING: 'LLM',
  MULTILINGUAL: 'LLM',
  VISION: 'VISION',
  IMAGE_GENERATION: 'IMAGE',
  VOICE_INPUT: 'SPEECH',
  VOICE_OUTPUT: 'SPEECH',
  CODE_GENERATION: 'CODE_EXECUTION',
  CODE_ANALYSIS: 'CODE_EXECUTION',
  CODE_DEBUGGING: 'CODE_EXECUTION',
  WORKFLOW_EXECUTION: 'INTERNAL',
  PROJECT_ASSISTANCE: 'INTERNAL',
  FILE_ANALYSIS: 'INTERNAL',
  RESEARCH: 'LLM',
  MATHEMATICAL_REASONING: 'LLM',
  SPATIAL_REASONING: 'INTERNAL',
  GEOMETRIC_REASONING: 'INTERNAL',
  PREDICTION: 'INTERNAL',
  HARMONIC_369: 'INTERNAL',
  MULTI_AGENT_PROBLEM_SOLVING: 'INTERNAL',
};

export class CubiOProviderRegistry {
  private providers: Map<string, AnyProvider> = new Map();
  private providersByType: Map<ProviderType, Set<string>> = new Map();

  constructor() {
    // Initialize type buckets
    const types: ProviderType[] = ['LLM', 'IMAGE', 'VISION', 'SPEECH', 'CODE_EXECUTION', 'TOOL'];
    for (const t of types) {
      this.providersByType.set(t, new Set());
    }
  }

  /**
   * Registers a provider into the registry.
   */
  public registerProvider(provider: AnyProvider): void {
    const info = provider.getInfo();
    this.providers.set(info.providerId, provider);
    const bucket = this.providersByType.get(info.providerType);
    if (bucket) {
      bucket.add(info.providerId);
    }
  }

  /**
   * Unregisters a provider by ID.
   */
  public unregisterProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    const info = provider.getInfo();
    this.providers.delete(providerId);
    const bucket = this.providersByType.get(info.providerType);
    if (bucket) {
      bucket.delete(providerId);
    }
    return true;
  }

  /**
   * Returns a specific provider by ID, or the first available provider of a type.
   */
  public getProvider<T extends AnyProvider>(type: ProviderType, providerId?: string): T | null {
    if (providerId) {
      const p = this.providers.get(providerId);
      return (p && p.getInfo().providerType === type ? p : null) as T | null;
    }
    const bucket = this.providersByType.get(type);
    if (!bucket || bucket.size === 0) return null;
    const firstId = bucket.values().next().value;
    return (firstId ? this.providers.get(firstId) ?? null : null) as T | null;
  }

  /**
   * Lists all registered providers of a type.
   */
  public getAvailableProviders(type: ProviderType): readonly ProviderInfo[] {
    const bucket = this.providersByType.get(type);
    if (!bucket) return [];
    const infos: ProviderInfo[] = [];
    for (const id of bucket) {
      const p = this.providers.get(id);
      if (p) infos.push(p.getInfo());
    }
    return Object.freeze(infos);
  }

  /**
   * Returns the status of a specific provider.
   */
  public getProviderStatus(type: ProviderType, providerId?: string): ProviderStatus {
    const p = this.getProvider(type, providerId);
    if (!p) return 'UNAVAILABLE';
    return p.getInfo().status;
  }

  /**
   * Checks if any provider can serve a given capability class.
   */
  public isCapabilityAvailable(capClass: UniversalCapabilityClass): boolean {
    const requiredType = CAPABILITY_PROVIDER_MAP[capClass];
    if (requiredType === 'INTERNAL') return true; // Served by existing CubiO engines
    const bucket = this.providersByType.get(requiredType);
    if (!bucket || bucket.size === 0) return false;
    for (const id of bucket) {
      const p = this.providers.get(id);
      if (p && p.getInfo().status === 'AVAILABLE') return true;
    }
    return false;
  }

  /**
   * Returns the required provider type for a capability class.
   */
  public getRequiredProviderType(capClass: UniversalCapabilityClass): ProviderType | 'INTERNAL' {
    return CAPABILITY_PROVIDER_MAP[capClass];
  }

  /**
   * Returns a summary of all provider registrations.
   */
  public getRegistrySummary(): Readonly<Record<ProviderType, number>> {
    const summary: Record<string, number> = {};
    for (const [type, bucket] of this.providersByType) {
      summary[type] = bucket.size;
    }
    return Object.freeze(summary) as Record<ProviderType, number>;
  }

  /**
   * Returns total number of registered providers.
   */
  public get totalProviders(): number {
    return this.providers.size;
  }
}
