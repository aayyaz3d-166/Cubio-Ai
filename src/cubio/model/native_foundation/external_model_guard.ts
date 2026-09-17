/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * external_model_guard.ts
 *
 * Enforces fail-closed isolation:
 * - 0 external pretrained models (Qwen, Llama, Mistral, Gemma, GPT, Claude, Gemini, etc.)
 * - 0 external tokenizer dependencies
 * - 0 external network calls
 * - 0 hardware motor / physical actuation
 */

import { PROHIBITED_EXTERNAL_MODEL_IDENTIFIERS, FORBIDDEN_ACTUATION_PATTERNS } from './native_model_types';

export class ExternalModelDependencyError extends Error {
  constructor(modelName: string) {
    super(`[EXTERNAL_MODEL_BLOCKED] Attempted invocation of external pretrained model '${modelName}'. CUBiO operates strictly on sovereign native models.`);
    this.name = 'ExternalModelDependencyError';
  }
}

export class ActuationBlockedError extends Error {
  constructor(action: string) {
    super(`[ACTUATION_BLOCKED] Attempted physical actuation command '${action}'. Hardware actuation is permanently locked out.`);
    this.name = 'ActuationBlockedError';
  }
}

export class NetworkAccessBlockedError extends Error {
  constructor(url: string) {
    super(`[NETWORK_BLOCKED] Attempted remote network access to '${url}'. CUBiO native model training operates strictly in sovereign offline mode.`);
    this.name = 'NetworkAccessBlockedError';
  }
}

export class ExternalModelGuard {
  private static interceptedCalls = 0;
  private static blockedActuations = 0;
  private static blockedNetworkCalls = 0;

  /**
   * Asserts that a model identifier is NOT an external pretrained model.
   * Throws ExternalModelDependencyError if prohibited.
   */
  public static assertNativeOnly(modelIdentifier: string): void {
    const lower = modelIdentifier.toLowerCase().trim();
    for (const prohibited of PROHIBITED_EXTERNAL_MODEL_IDENTIFIERS) {
      if (prohibited === 'phi') {
        if (lower === 'phi' || lower.includes('phi-') || lower.includes('phi_') || lower.includes('phi1') || lower.includes('phi2') || lower.includes('phi3') || lower.includes('phi4')) {
          this.interceptedCalls++;
          throw new ExternalModelDependencyError(modelIdentifier);
        }
      } else if (prohibited === 't5') {
        if (lower === 't5' || lower.includes('t5-') || lower.includes('t5_') || lower.includes('flan-t5')) {
          this.interceptedCalls++;
          throw new ExternalModelDependencyError(modelIdentifier);
        }
      } else if (lower.includes(prohibited)) {
        this.interceptedCalls++;
        throw new ExternalModelDependencyError(modelIdentifier);
      }
    }
  }

  /**
   * Asserts that an actuation command or intent is blocked.
   */
  public static assertActuationBlocked(command: string): void {
    const lower = command.toLowerCase().trim();
    for (const forbidden of FORBIDDEN_ACTUATION_PATTERNS) {
      if (lower.includes(forbidden)) {
        this.blockedActuations++;
        throw new ActuationBlockedError(command);
      }
    }
  }

  /**
   * Asserts that network access is blocked.
   */
  public static assertNetworkBlocked(targetUrl: string): void {
    this.blockedNetworkCalls++;
    throw new NetworkAccessBlockedError(targetUrl);
  }

  public static getInterceptedCount(): number {
    return this.interceptedCalls;
  }

  public static getBlockedActuationsCount(): number {
    return this.blockedActuations;
  }

  public static getBlockedNetworkCallsCount(): number {
    return this.blockedNetworkCalls;
  }

  public static resetCounters(): void {
    this.interceptedCalls = 0;
    this.blockedActuations = 0;
    this.blockedNetworkCalls = 0;
  }
}
