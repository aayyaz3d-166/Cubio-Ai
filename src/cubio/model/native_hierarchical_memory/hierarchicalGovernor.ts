/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/hierarchicalGovernor.ts
 *
 * Resource Governor & Safety Enforcer:
 * - Permanent Hardware Actuation Lockout fail-closed (`IS_ACTUATION_BLOCKED = true`).
 * - Sovereign pure native TypeScript execution (no foreign vector/ML libraries).
 * - Epistemic Anti-Pollution Guard (blocks non-canonical promotion to L4).
 * - Bounded resource limits across L1, L2, and L3 memory levels.
 */

import {
  IS_ACTUATION_BLOCKED,
  CANONICAL_EPISTEMIC_STATUSES,
  MemoryLevel,
  HierarchicalConfig,
  HierarchicalMemoryActuationBlockedError,
  IllegalHierarchicalPromotionError,
  HierarchicalCapacityExceededError,
  HierarchicalMemoryError,
} from './types.js';

export class HierarchicalGovernor {
  private static readonly PROHIBITED_ACTUATION_TERMS = [
    'actuate physical',
    'control motor',
    'drive stepper',
    'robotics_arm_move',
    'fire thruster',
    'gpio_set_state',
    'hardware_actuate',
    'relay_switch_on',
  ];

  private static readonly PROHIBITED_FOREIGN_FRAMEWORKS = [
    'langchain',
    'llamaindex',
    'chromadb',
    'pinecone',
    'weaviate',
    'milvus',
    'qdrant',
    'faiss',
  ];

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(content?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new HierarchicalMemoryActuationBlockedError('IS_ACTUATION_BLOCKED invariant is false');
    }
    if (content) {
      const lower = content.toLowerCase();
      for (const term of this.PROHIBITED_ACTUATION_TERMS) {
        if (lower.includes(term)) {
          throw new HierarchicalMemoryActuationBlockedError(`Prohibited hardware directive detected: "${term}"`);
        }
      }
    }
  }

  /**
   * Asserts no foreign vector DB or ML framework imports.
   */
  public static assertNativeExecution(moduleName: string): void {
    const lower = moduleName.toLowerCase();
    for (const prohibited of this.PROHIBITED_FOREIGN_FRAMEWORKS) {
      if (lower.includes(prohibited)) {
        throw new HierarchicalMemoryError(
          `Foreign framework "${moduleName}" is strictly prohibited in sovereign CUBiO architecture.`,
          'FOREIGN_FRAMEWORK_PROHIBITED'
        );
      }
    }
  }

  /**
   * Asserts epistemic clearance for promotion to canonical persistent memory (L4).
   * Only FACT, AXIOM, and DERIVED are permitted. Ephemeral OBSERVATION or speculative
   * HYPOTHESIS cannot corrupt canonical memory.
   */
  public static assertCanonicalPromotionClearance(
    referenceId: string,
    targetLevel: MemoryLevel,
    epistemicStatus: string
  ): void {
    if (targetLevel === 'L4_CANONICAL_VDB') {
      const normalized = epistemicStatus.toUpperCase();
      if (!CANONICAL_EPISTEMIC_STATUSES.includes(normalized)) {
        throw new IllegalHierarchicalPromotionError(
          referenceId,
          epistemicStatus,
          `Status "${epistemicStatus}" is ephemeral or unverified. Only ${CANONICAL_EPISTEMIC_STATUSES.join(', ')} may be promoted to canonical persistent VDB.`
        );
      }
    }
  }

  /**
   * Validates capacity limits for a given memory level.
   */
  public static assertLevelCapacity(
    level: MemoryLevel,
    currentCount: number,
    config: HierarchicalConfig
  ): void {
    switch (level) {
      case 'L1_LOCAL':
        // L1 token capacity is validated by token sum, not count
        break;
      case 'L2_SESSION':
        if (currentCount >= config.maxL2SessionRefs) {
          throw new HierarchicalCapacityExceededError(level, currentCount, config.maxL2SessionRefs);
        }
        break;
      case 'L3_LONG_TERM':
        if (currentCount >= config.maxL3LongTermRefs) {
          throw new HierarchicalCapacityExceededError(level, currentCount, config.maxL3LongTermRefs);
        }
        break;
      case 'L4_CANONICAL_VDB':
        // Persistent VDB is bounded by database storage, not in-memory cache limit
        break;
    }
  }
}
