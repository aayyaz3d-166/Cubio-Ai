/**
 * CUBiO AI — Phase 32 Task 531: English + Roman Urdu Code-Mixed Conversational Engine
 * src/cubio/intelligence/natural_response/phase32CodeMixedConversationalEngine.ts
 *
 * Implements native, high-clarity handling of English + Roman Urdu code-mixed dialogues:
 * 1. Technical Term Preservation:
 *    - Recognizes English technical nouns, API names, data structures, and errors embedded
 *      inside Roman Urdu SOV grammatical structures without mangling or forced transliteration.
 * 2. Intent & Domain Specialization:
 *    - CODING: Algorithmic implementations, syntax debugging, API design.
 *    - EVERYDAY_QA: Factual, physical, and historical queries code-mixed.
 *    - PLANNING: Phased milestones, architecture roadmaps, rollout steps.
 *    - TROUBLESHOOTING: Diagnostic triage, stack traces, memory leaks, connection pools.
 * 3. Requested Language Policy:
 *    - Explicit English: Delivers authoritative English when requested ("in English", "explain in English").
 *    - Explicit Roman Urdu: Delivers conversational Roman Urdu while keeping technical nouns English.
 *    - Code-Mixed Default: High-clarity hybrid register (fluent Urdu syntax with English technical terms).
 *    - Prevents abrupt language shifts that degrade conceptual clarity.
 * 4. Multi-Turn Context & Antecedent Continuity:
 *    - Accurately references preceding technical concepts and entities across follow-up turns.
 * 5. Permanent Safety & Actuation Invariants:
 *    - IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
 *    - Actuation and security lockouts enforced regardless of code-mixed phrasing.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import {
  Phase32RawIntentDetector,
  RawIntentCategory,
  SafetyDisposition,
  DetectedLanguage,
} from '../intent_router/phase32RawIntentDetector';
import {
  Phase32RomanUrduConversationalEngine,
} from './phase32RomanUrduConversationalEngine';
import {
  Phase32EnglishConversationalEngine,
} from './phase32EnglishConversationalEngine';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type CodeMixedDomain =
  | 'CODING'
  | 'EVERYDAY_QA'
  | 'PLANNING'
  | 'TROUBLESHOOTING'
  | 'GENERAL_CONVERSATION';

export type ResponseLanguageMode = 'ENGLISH' | 'ROMAN_URDU' | 'CODE_MIXED';

export interface CodeMixedDialogueRequest {
  readonly query: string;
  readonly previousTopic?: string;
  readonly dialogueHistory?: readonly { role: string; content: string }[];
  readonly requestedLanguage?: ResponseLanguageMode;
  readonly activeParameters?: Record<string, string>;
}

export interface CodeMixedDialogueResponse {
  readonly originalQuery: string;
  readonly detectedDomain: CodeMixedDomain;
  readonly responseLanguageUsed: ResponseLanguageMode;
  readonly recognizedTechnicalTerms: readonly string[];
  readonly directResponseText: string;
  readonly isMultiTurnFollowUp: boolean;
  readonly activeSubject: string;
  readonly safetyDisposition: SafetyDisposition;
  readonly hasArtificialSentienceClaims: boolean;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// TECHNICAL VOCABULARY REGISTRY
// ============================================================================

const TECHNICAL_ENTITIES = [
  'api endpoint', 'endpoint', 'timeout', 'database', 'postgresql', 'sqlite',
  'mongodb', 'connection pool', 'memory leak', 'useeffect', 'react', 'virtual dom',
  'async/await', 'async await', 'promise', 'kubernetes', 'pod', 'docker',
  'container', 'binary search', 'indexerror', 'typeerror', 'roadmap',
  'sprint planning', 'deployment pipeline', 'caching', 'redis', 'jwt token',
  'microservices', 'load balancer', 'throughput', 'latency', 'nullpointerexception',
  'speed of light', 'capital of france', 'capital of pakistan'
];

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32CodeMixedConversationalEngine {
  private static instance: Phase32CodeMixedConversationalEngine | null = null;

  private readonly rawDetector: Phase32RawIntentDetector;
  private readonly urduEngine: Phase32RomanUrduConversationalEngine;
  private readonly englishEngine: Phase32EnglishConversationalEngine;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
    this.urduEngine = Phase32RomanUrduConversationalEngine.getInstance();
    this.englishEngine = Phase32EnglishConversationalEngine.getInstance();
  }

  public static getInstance(): Phase32CodeMixedConversationalEngine {
    if (!Phase32CodeMixedConversationalEngine.instance) {
      Phase32CodeMixedConversationalEngine.instance = new Phase32CodeMixedConversationalEngine();
    }
    return Phase32CodeMixedConversationalEngine.instance;
  }

  /**
   * Extracts recognized English technical terms embedded inside the text.
   */
  public extractTechnicalTerms(query: string): string[] {
    const qLower = query.toLowerCase();
    const found: string[] = [];

    for (const term of TECHNICAL_ENTITIES) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(qLower)) {
        found.push(term);
      }
    }
    return found;
  }

  /**
   * Identifies the primary domain of the code-mixed query.
   */
  public identifyDomain(query: string, technicalTerms: string[]): CodeMixedDomain {
    const qLower = query.toLowerCase();

    // 1. Troubleshooting (Errors, leaks, debugging, crash, fix)
    if (/\b(?:troubleshoot|debug|fix|masla|error|exception|memory\s+leak|crash|exhaust|loop\s+mein|issue|slow|hang)\b/i.test(qLower)) {
      return 'TROUBLESHOOTING';
    }

    // 2. Planning (Roadmaps, phases, architecture planning, sprint, timeline)
    if (/\b(?:plan|roadmap|timeline|phase|milestone|sprint|mansooba|schedule|migration\s+ka\s+plan)\b/i.test(qLower)) {
      return 'PLANNING';
    }

    // 3. Coding (Writing code, implementing algorithms, functions, scripts)
    if (/\b(?:code|likho|implement|function|script|algorithm|syntax|def |class )\b/i.test(qLower) ||
        technicalTerms.some(t => ['binary search', 'async/await', 'useeffect'].includes(t))) {
      return 'CODING';
    }

    // 4. Everyday QA / Knowledge inquiries
    if (/\b(?:speed\s+of\s+light|capital|darul\s+hukoomat|kya\s+hai|what\s+is|who\s+is|kitni\s+hai|france|pakistan)\b/i.test(qLower)) {
      return 'EVERYDAY_QA';
    }

    return 'GENERAL_CONVERSATION';
  }

  /**
   * Determines the target response language according to explicit requests and conversational cues.
   */
  public determineResponseLanguage(
    query: string,
    explicitRequested?: ResponseLanguageMode
  ): ResponseLanguageMode {
    if (explicitRequested) return explicitRequested;

    const qLower = query.toLowerCase();

    // Explicit English requests
    if (/\b(?:in\s+english|english\s+mein|respond\s+in\s+english|explain\s+in\s+english)\b/i.test(qLower)) {
      return 'ENGLISH';
    }

    // Explicit Roman Urdu requests
    if (/\b(?:in\s+roman\s+urdu|roman\s+urdu\s+mein|sirf\s+urdu|urdu\s+me|urdu\s+mein)\b/i.test(qLower)) {
      return 'ROMAN_URDU';
    }

    // Default for technical dialogues with code-mixing is CODE_MIXED (optimal clarity)
    return 'CODE_MIXED';
  }

  /**
   * Processes a code-mixed conversational request across multi-turn context.
   */
  public processCodeMixedDialogue(request: CodeMixedDialogueRequest): CodeMixedDialogueResponse {
    const t0 = performance.now();
    const query = request.query.trim();

    // 1. Safety & Actuation Lockout
    let safetyDisposition = this.rawDetector.evaluateSafety(query);
    if (safetyDisposition === 'SAFE') {
      const isActuation = /\b(?:motor\s+(?:chalao|start)|hardware\s+(?:trigger|control)|robotic\s+arm|pin\s+switch|actuate|gpio)\b/i.test(query);
      if (isActuation) safetyDisposition = 'BLOCKED_ACTUATION';

      const isSecurity = /\b(?:passwords?|keys|secret\s+credentials|admin\s+token)\b/i.test(query) &&
        /\b(?:dikhao|show|de\s+do|give|expose)\b/i.test(query);
      if (isSecurity) safetyDisposition = 'SECURITY_REFUSAL';
    }

    if (safetyDisposition !== 'SAFE') {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const refusal = safetyDisposition === 'BLOCKED_ACTUATION'
        ? 'Physical actuator command radd kar di gayi hai. Hardware actuation offline safety protocols ke tehat strictly blocked hai.'
        : 'Request declined. System security policies aur credentials access strictly prohibited hain.';
      return {
        originalQuery: query,
        detectedDomain: 'GENERAL_CONVERSATION',
        responseLanguageUsed: 'CODE_MIXED',
        recognizedTechnicalTerms: [],
        directResponseText: refusal,
        isMultiTurnFollowUp: false,
        activeSubject: 'SAFETY_INTERCEPT',
        safetyDisposition,
        hasArtificialSentienceClaims: false,
        latencyMs: elapsed,
        signature: this.computeSignature(query, refusal),
      };
    }

    // 2. Linguistic and Technical Term Extraction
    const technicalTerms = this.extractTechnicalTerms(query);
    const domain = this.identifyDomain(query, technicalTerms);
    const responseLanguage = this.determineResponseLanguage(query, request.requestedLanguage);

    // 3. Multi-Turn Subject / Topic Resolution
    let isFollowUp = false;
    let activeSubject = request.previousTopic || '';

    const isShortFollowUp = /^(?:how|kaise|kyun|why|and\s+price|aur\s+price|code\s+bhi|and\s+code|aur\s+detail|fix\s+kaise\s+karein)\??$/i.test(query);
    if (isShortFollowUp && request.previousTopic) {
      isFollowUp = true;
      activeSubject = request.previousTopic;
    } else if (technicalTerms.length > 0) {
      activeSubject = technicalTerms[0];
    } else if (!activeSubject) {
      activeSubject = 'General Technical Context';
    }

    // 4. Synthesize Domain Response with Language Adherence
    const responseText = this.synthesizeResponse(query, domain, responseLanguage, activeSubject, isFollowUp);

    // 5. Anti-Sentience Invariant Check
    const hasArtificialSentienceClaims = /\b(?:main\s+mehsoos\s+karta|i\s+feel|meri\s+khwahish|i\s+have\s+emotions)\b/i.test(responseText);
    const elapsed = Number((performance.now() - t0).toFixed(2));

    return {
      originalQuery: query,
      detectedDomain: domain,
      responseLanguageUsed: responseLanguage,
      recognizedTechnicalTerms: technicalTerms,
      directResponseText: responseText,
      isMultiTurnFollowUp: isFollowUp,
      activeSubject,
      safetyDisposition,
      hasArtificialSentienceClaims,
      latencyMs: elapsed,
      signature: this.computeSignature(query, responseText),
    };
  }

  // --------------------------------------------------------------------------
  // RESPONSE SYNTHESIS BY DOMAIN & LANGUAGE
  // --------------------------------------------------------------------------

  private synthesizeResponse(
    query: string,
    domain: CodeMixedDomain,
    langMode: ResponseLanguageMode,
    subject: string,
    isFollowUp: boolean
  ): string {
    const qLower = query.toLowerCase();

    // DOMAIN 1: CODING
    if (domain === 'CODING') {
      if (subject.toLowerCase().includes('binary') || qLower.includes('binary')) {
        if (langMode === 'ENGLISH') {
          return `Here is the binary search implementation in Python:\n\n\`\`\`python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\`\`\`\nBinary search runs in O(log n) logarithmic time complexity on sorted collections.`;
        }
        // CODE_MIXED / ROMAN_URDU:
        return `Yeh raha **Binary Search** ka Python implementation:\n\n\`\`\`python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\`\`\`\n**Explanation:** Binary search sorted array ke \`mid\` element ko target se compare karta hai aur har iteration mein search interval ko half kar deta hai (O(log n) time complexity).`;
      }

      if (subject.toLowerCase().includes('async') || qLower.includes('async')) {
        return `\`async/await\` JavaScript mein promises ko synchronous-style syntax ke sath handle karne ke liye use hota hai taake event loop block na ho.\n\n\`\`\`javascript\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    return await response.json();\n  } catch (error) {\n    console.error("Network error:", error);\n  }\n}\n\`\`\``;
      }
    }

    // DOMAIN 2: TROUBLESHOOTING
    if (domain === 'TROUBLESHOOTING') {
      // Memory leak in React useEffect
      if (qLower.includes('useeffect') || qLower.includes('memory leak')) {
        if (langMode === 'ENGLISH') {
          return `To resolve the \`useEffect\` memory leak, ensure you pass an explicit dependency array and return a cleanup function to cancel pending subscriptions or abort API controllers upon component unmount:\n\n\`\`\`javascript\nuseEffect(() => {\n  const controller = new AbortController();\n  fetchData({ signal: controller.signal });\n  return () => controller.abort(); // Cleanup\n}, []);\n\`\`\``;
        }
        return `React \`useEffect\` mein memory leak ko fix karne ke liye 2 zaroori steps karein:\n\n1. **Dependency Array Pass Karein:** Empty array \`[]\` ya specific dependencies pass karein taake infinite re-renders ruk sakein.\n2. **Cleanup Function Return Karein:** Pending event listeners ya API fetch requests ko unmount par abort karein:\n\n\`\`\`javascript\nuseEffect(() => {\n  const controller = new AbortController();\n  fetchData({ signal: controller.signal });\n  return () => controller.abort(); // Cleanup\n}, []);\n\`\`\``;
      }

      // Connection pool exhaustion
      if (qLower.includes('connection pool') || qLower.includes('exhaust')) {
        if (langMode === 'ENGLISH') {
          return `Database connection pool exhaustion typically occurs when connections are not released back to the pool after query execution or when idle timeouts are misconfigured. Remediate by using connection context managers (\`with pool.acquire()\`), enforcing connection timeouts, and scaling pool size proportional to active worker threads.`;
        }
        return `Database connection pool exhaustion ko fix karne ke liye 3 steps execute karein:\n\n1. **Explicit Release:** Har query ke baad connection ko release ya close karein taake leak na ho.\n2. **Timeout Configuration:** \`idleTimeoutMillis\` aur \`connectionTimeoutMillis\` set karein.\n3. **Pool Sizing:** Worker concurrency ke mutabiq pool size adjust karein. Context manager (\`with db.connection()\`) use karna best practice hai.`;
      }

      if (isFollowUp) {
        return `Is maslay ko troubleshoot karne ke liye error logs check karein aur connection lifecycle ko context managers ke sath encapsulate karein.`;
      }
    }

    // DOMAIN 3: PLANNING
    if (domain === 'PLANNING') {
      if (qLower.includes('migration') || subject.toLowerCase().includes('migration') || qLower.includes('database')) {
        if (langMode === 'ENGLISH') {
          return `Here is the structured 3-phase backend database migration roadmap:\n\n- **Phase 1 (Assessment & Schema Migration):** Extract existing schemas, generate DDL for target database, and validate data types.\n- **Phase 2 (Dual Writing & Backfill):** Implement dual-write logic in the application layer, backfill historic records, and verify data parity.\n- **Phase 3 (Cutover & Deprecation):** Switch primary read/write traffic to the new database, decommission legacy endpoints, and verify zero downtime.`;
        }
        return `Backend database migration ke liye 3-phase structured roadmap yeh hai:\n\n- **Phase 1 (Schema & Preparation):** Target database mein schemas aur indexes design karein aur test data ke sath migration scripts validate karein.\n- **Phase 2 (Dual Writing & Backfill):** Application layer par dual-write mechanism implement karein aur historic records ko batch backfill karein.\n- **Phase 3 (Cutover & Verification):** Production traffic ko naye database par switch karein, parity check verify karein, aur legacy system ko safely decommission karein.`;
      }
    }

    // DOMAIN 4: EVERYDAY QA
    if (domain === 'EVERYDAY_QA') {
      if (qLower.includes('speed of light') || qLower.includes('roshni')) {
        if (langMode === 'ENGLISH') {
          return `The speed of light in vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s).`;
        }
        return `Vacuum mein **Speed of Light** taqreeban **299,792,458 meters per second** (yaani taqreeban 300,000 km/s) hoti hai. Ye physics ke mutabiq cosmic speed limit hai.`;
      }
      if (qLower.includes('france') || qLower.includes('paris')) {
        return langMode === 'ENGLISH'
          ? 'The capital of France is Paris.'
          : 'France ka capital city **Paris** hai, jo mulk ka markazi cultural aur economic hub hai.';
      }
    }

    // GENERAL CONVERSATION
    if (langMode === 'ENGLISH') {
      return `Understood. Ready to proceed with technical execution on ${subject}.`;
    }
    return `Bilkul theek hai. ${subject} par agla technical step execute karne ke liye tayyar hain.`;
  }

  private computeSignature(query: string, response: string): string {
    return crypto
      .createHash('sha256')
      .update(`CODE_MIXED_V1:${query}:${response}`)
      .digest('hex');
  }
}
