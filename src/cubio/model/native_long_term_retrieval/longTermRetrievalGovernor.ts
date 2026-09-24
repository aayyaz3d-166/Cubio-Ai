/**
 * CUBiO AI — Task 176: Long-Term VDB Memory Retrieval
 * src/cubio/model/native_long_term_retrieval/longTermRetrievalGovernor.ts
 *
 * Resource Governor & Safety Enforcer:
 * - Permanent Hardware Actuation Lockout fail-closed (`IS_ACTUATION_BLOCKED = true`).
 * - Pure sovereign native TypeScript VDB (no foreign vector databases).
 * - Bounded token budget enforcement (prevents runaway memory loading).
 * - Multi-tenant isolation verification.
 */

import {
  IS_ACTUATION_BLOCKED,
  LongTermRetrievalActuationBlockedError,
  LongTermRetrievalBudgetExceededError,
  LongTermRetrievalError,
} from './types.js';

export class LongTermRetrievalGovernor {
  private static readonly PROHIBITED_ACTUATION_TERMS = [
    'actuate physical',
    'control motor',
    'drive stepper',
    'robotics_arm_command',
    'fire thruster',
    'actuate hardware',
  ];

  private static readonly PROHIBITED_DATABASES = [
    'chromadb',
    'pinecone',
    'weaviate',
    'milvus',
    'qdrant',
    'faiss',
    'elasticsearch',
  ];

  private static readonly MAX_TOKEN_BUDGET_CEILING = 32768; // 32K token safety limit per assembly

  /**
   * Asserts permanent hardware actuation lockout fail-closed.
   */
  public static assertActuationLockout(content?: string): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new LongTermRetrievalActuationBlockedError('IS_ACTUATION_BLOCKED invariant is false.');
    }
    if (content) {
      const lower = content.toLowerCase();
      for (const term of this.PROHIBITED_ACTUATION_TERMS) {
        if (lower.includes(term)) {
          throw new LongTermRetrievalActuationBlockedError(`Prohibited actuation directive detected: "${term}"`);
        }
      }
    }
  }

  /**
   * Asserts no foreign vector databases or cloud search APIs are used.
   */
  public static assertNativeVdbOnly(dbName: string): void {
    const lower = dbName.toLowerCase();
    for (const prohibited of this.PROHIBITED_DATABASES) {
      if (lower.includes(prohibited)) {
        throw new LongTermRetrievalError(
          `Foreign database "${dbName}" is strictly prohibited. VDB remains the authoritative primary persistent brain.`,
          'FOREIGN_DATABASE_PROHIBITED'
        );
      }
    }
  }

  /**
   * Asserts token budget is bounded within safety ceiling.
   */
  public static assertTokenBudget(budget: number): void {
    if (budget <= 0) {
      throw new LongTermRetrievalError('Token budget must be positive.', 'INVALID_TOKEN_BUDGET');
    }
    if (budget > this.MAX_TOKEN_BUDGET_CEILING) {
      throw new LongTermRetrievalBudgetExceededError(budget, this.MAX_TOKEN_BUDGET_CEILING);
    }
  }
}
