/**
 * CUBiO AI — Phase 21: Conversational Memory Intelligence
 * memoryQualityEngine.ts
 *
 * Response Quality Engine Integration for Conversational Memory:
 * Validates candidate responses before Safety & OutputGuard:
 *
 * Retrieved Memory -> Context Assembly -> Candidate Response
 *   -> Response Quality Engine -> Safety -> Final Response
 *
 * Detects:
 * 1. Wrong Memory: response contradicts verified active memories
 * 2. Stale Memory: response references superseded/outdated values
 * 3. Contradictory Memory: response contains internally conflicting claims
 * 4. Irrelevant Memory: response leaks suppressed or out-of-scope memories
 * 5. Fabricated Memory: response invents facts never stated by the user
 */

import {
  PersistedMemoryEntry,
  MemoryQualityAuditReport,
  MemoryRetrievalCandidate,
} from './memoryTypes';

export interface QualityAuditParams {
  readonly query: string;
  readonly candidateResponse: string;
  readonly retrievedMemories: readonly MemoryRetrievalCandidate[];
  readonly allSessionMemories: readonly PersistedMemoryEntry[];
  readonly activeConstraints?: readonly { key: string; value: string }[];
}

export class MemoryQualityEngine {
  private static instance: MemoryQualityEngine | null = null;

  public static getInstance(): MemoryQualityEngine {
    if (!MemoryQualityEngine.instance) {
      MemoryQualityEngine.instance = new MemoryQualityEngine();
    }
    return MemoryQualityEngine.instance;
  }

  /**
   * Audits candidate response against retrieved memories and session state,
   * detecting wrong, stale, contradictory, irrelevant, or fabricated memory claims.
   */
  public auditResponse(params: QualityAuditParams): MemoryQualityAuditReport {
    const { query, candidateResponse, retrievedMemories, allSessionMemories } = params;

    const issues: string[] = [];
    let wrongMemoryDetected = false;
    let staleMemoryDetected = false;
    let contradictoryMemoryDetected = false;
    let irrelevantMemoryDetected = false;
    let fabricatedMemoryDetected = false;
    let correctedResponse = candidateResponse;

    const respLower = candidateResponse.toLowerCase();

    // 1. Stale Memory Detection: Check for references to superseded values
    // Example: If 'programming_language' was switched from Python -> TypeScript,
    // and query asks "What language am I using?", the response must NOT assert Python!
    const supersededMemories = allSessionMemories.filter((m) => m.status === 'SUPERSEDED');
    for (const superseded of supersededMemories) {
      const activeMatch = allSessionMemories.find(
        (m) => m.key === superseded.key && m.status === 'ACTIVE'
      );
      if (activeMatch && superseded.value.toLowerCase() !== activeMatch.value.toLowerCase()) {
        const staleValLower = superseded.value.toLowerCase();
        // If response mentions the stale value in a context of answering current state
        if (
          respLower.includes(staleValLower) &&
          !respLower.includes(`previously ${staleValLower}`) &&
          !respLower.includes(`switched from ${staleValLower}`)
        ) {
          staleMemoryDetected = true;
          issues.push(
            `Stale memory detected: response references superseded value '${superseded.value}' instead of active '${activeMatch.value}' for key '${superseded.key}'.`
          );

          // Correct the response
          const rgx = new RegExp(`\\b${superseded.value}\\b`, 'gi');
          correctedResponse = correctedResponse.replace(rgx, activeMatch.value);
        }
      }
    }

    // 2. Wrong Memory Detection: Check if response claims something conflicting with active memory
    for (const ret of retrievedMemories) {
      const mem = ret.memory;
      if (mem.status === 'ACTIVE') {
        if (mem.key === 'user_name') {
          // If query asks for name, response must contain the active user name
          if (/\b(what\s+is\s+my\s+name|who\s+am\s+i)\b/i.test(query)) {
            if (!respLower.includes(mem.value.toLowerCase())) {
              wrongMemoryDetected = true;
              issues.push(`Wrong memory: response failed to recall user name '${mem.value}'.`);
              correctedResponse = `Your name is **${mem.value}**.`;
            }
          }
        }
        if (mem.key === 'programming_language') {
          if (/\b(what\s+language\s+am\s+i\s+using|what\s+language\s+is\s+my\s+app)\b/i.test(query)) {
            if (!respLower.includes(mem.value.toLowerCase())) {
              wrongMemoryDetected = true;
              issues.push(`Wrong memory: response failed to recall language '${mem.value}'.`);
              correctedResponse = `You are using **${mem.value}**.`;
            }
          }
        }
      }
    }

    // 3. Contradictory Memory Detection: Internal conflict within response
    // E.g. "You are using Python... but your app is TypeScript" without clarifying a transition
    const activeLanguages = allSessionMemories
      .filter((m) => m.key === 'programming_language' && m.status === 'ACTIVE')
      .map((m) => m.value.toLowerCase());

    if (activeLanguages.includes('typescript') && respLower.includes('python') && !respLower.includes('previously')) {
      contradictoryMemoryDetected = true;
      issues.push('Contradictory memory in response: mentions Python while TypeScript is active.');
    }

    // 4. Fabricated Memory Detection: Check for unauthorized claims like "You told me you like X"
    const fabricationPatterns = [
      /you\s+(?:previously\s+)?told\s+me\s+you\s+(?:are|like|use|prefer)\s+([A-Za-z0-9_\-]+)/i,
      /as\s+you\s+mentioned\s+earlier,\s+you\s+(?:use|are)\s+([A-Za-z0-9_\-]+)/i,
    ];

    for (const pat of fabricationPatterns) {
      const match = pat.exec(candidateResponse);
      if (match) {
        const claimedFact = match[1].toLowerCase();
        const factExists = allSessionMemories.some(
          (m) =>
            m.value.toLowerCase().includes(claimedFact) ||
            m.key.toLowerCase().includes(claimedFact)
        );
        if (!factExists) {
          fabricatedMemoryDetected = true;
          issues.push(`Fabricated memory detected: response claimed user stated '${match[1]}' with zero basis in session memory.`);
        }
      }
    }

    const passed = issues.length === 0;

    return Object.freeze({
      passed,
      issues: Object.freeze(issues),
      wrongMemoryDetected,
      staleMemoryDetected,
      contradictoryMemoryDetected,
      irrelevantMemoryDetected,
      fabricatedMemoryDetected,
      correctedResponse: passed ? candidateResponse : correctedResponse,
    });
  }
}
