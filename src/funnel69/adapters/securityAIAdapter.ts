/**
 * 3D Memory Studio — Funnel 69
 * Security AI Adapter (F47 Authoritative Gate)
 *
 * Ensures RED records, classified data, or restricted payloads NEVER enter:
 * - AI Chat context
 * - AI prompt
 * - Model request
 * - AI response
 * - Conversation history
 * - 3D focus request
 */

import { DataClassification } from '../../funnel47/types';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';

export const RESTRICTED_NOTICE = 'This information is restricted.';

export class SecurityAIAdapter {
  public isPermitted(classification: DataClassification): boolean {
    return isPermittedInWorkspace(classification);
  }

  public isStatePermitted(stateId: string): boolean {
    if (stateId.toUpperCase().includes('RED') || stateId.toUpperCase().includes('RESTRICTED')) {
      return false;
    }
    return true;
  }

  public filterPermitted<T extends { classification: DataClassification }>(items: readonly T[]): T[] {
    return items.filter((item) => this.isPermitted(item.classification));
  }

  public sanitizePrompt(prompt: string): { isClean: boolean; sanitized: string } {
    const pUpper = prompt.toUpperCase();
    if (pUpper.includes('STATE_RED') || pUpper.includes('CLASSIFIED_RED') || pUpper.includes('RESTRICTED_DATA')) {
      return {
        isClean: false,
        sanitized: RESTRICTED_NOTICE,
      };
    }
    return {
      isClean: true,
      sanitized: prompt,
    };
  }

  public getRestrictedNotice(): string {
    return RESTRICTED_NOTICE;
  }
}
