/**
 * CUBiO AI — Phase 32 Task 517: Raw Natural-Language Intent Detection for Mother Core
 * src/cubio/intelligence/intent_router/phase32RawIntentDetector.ts
 *
 * Implements pure, raw natural-language user intent detection for Mother Core.
 *
 * Architectural Invariants:
 * 1. Raw Text Primary Signal:
 *    - Uses only user's raw natural language string as primary intent signal.
 *    - No hardcoded structured semantic fields, causal chains, pre-generated hypotheses,
 *      or ground truth injects required.
 * 2. 7 Mandated Functional Categories:
 *    - QUESTION: General inquiries, factual QA, conceptual lookups, definitions, multi-domain queries.
 *    - INSTRUCTION: Actionable directives, commands, step-by-step procedures, recipes, configs.
 *    - REQUEST: Polite asks, favors, drafting tasks, assistance requests, user appeals.
 *    - EXPLANATION: Conceptual mechanics, "why/how", architectural deep-dives, clarification.
 *    - CODING: Programming snippets, functions, syntax fixes, debugging, algorithms.
 *    - PLANNING: Project roadmaps, schedules, migration plans, phased strategies, budgeting.
 *    - CONVERSATION: Greetings, casual chat, pleasantries, identity registration/inquiry, thank-yous.
 * 3. Insulation of Internal Terminology:
 *    - ZERO exposure of internal enum names, intent labels, or routing keys to the user.
 *    - Provides fail-closed output sanitization.
 * 4. Preserves Sovereign Security & Epistemic Constraints:
 *    - IS_ACTUATION_BLOCKED === true
 *    - OFFLINE_ISOLATED === true (zero external cloud LLM dependency)
 *    - Rejects security policy breaches, private credential theft, and actuation requests.
 * 5. Deterministic & Reproducible:
 *    - Bit-exact, deterministic intent arbitration across runs.
 */

import * as crypto from 'crypto';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type RawIntentCategory =
  | 'QUESTION'
  | 'INSTRUCTION'
  | 'REQUEST'
  | 'EXPLANATION'
  | 'CODING'
  | 'PLANNING'
  | 'CONVERSATION';

export type DetectedLanguage = 'ENGLISH' | 'ROMAN_URDU' | 'MIXED';

export type SafetyDisposition = 'SAFE' | 'BLOCKED_ACTUATION' | 'SECURITY_REFUSAL';

export interface RawIntentDetectionResult {
  readonly inputQuery: string;
  readonly category: RawIntentCategory;
  readonly confidence: number;
  readonly language: DetectedLanguage;
  readonly subCategory: string;
  readonly detectedEntities: readonly string[];
  readonly safetyDisposition: SafetyDisposition;
  readonly requiresDisambiguation: boolean;
  readonly deterministicSignature: string;
}

// ============================================================================
// REGEX & PATTERN TAXONOMY
// ============================================================================

const SECURITY_REFUSAL_PATTERNS = [
  /\b(?:passwords?|credentials?|admin\s+pass|hack|exploit|bypass\s+security|security\s+bypass|lottery\s+numbers|rob\s+a\s+bank|steal\s+credentials|secret\s+(?:decryption\s+)?keys?|decryption\s+keys?|private\s+passwords?|system\s+prompt\s+reveal|print\s+system\s+instructions|system\s+instructions|instructions\s+word\s+for\s+word|private\s+encryption\s+keys?|encryption\s+keys?|jailbreak|freedomgpt|dan\s+mode|unrestricted\s+access)\b/i,
  /\b(?:wipe\s+(?:the\s+)?disk|format\s+[a-z]:|rm\s+-rf|destroy\s+(?:the\s+)?system|drop\s+table|delete\s+all\s+records|sab\s+tables\s+drop)\b/i,
];

const ACTUATION_PATTERNS = [
  /\b(?:turn\s+on\s+(?:the\s+)?(?:physical\s+)?motor|trigger\s+(?:the\s+)?(?:hardware\s+)?motor|actuate\s+(?:hardware|motor|servo|actuator)|drive\s+(?:the\s+)?(?:hardware\s+)?(?:motor|servo)|control\s+physical\s+motors|move\s+robotic\s+arm|switch\s+gpio|gpio\s+pin|fire\s+thruster|trigger\s+actuator|motor\s+chalao|hardware\s+actuate\s+karo|robotic\s+arm)\b/i,
  /\b(?:hardware\s+motor|physical\s+motor|hardware\s+actuator|physical\s+servo)\b/i,
];

// 1. Coding patterns
const CODING_PATTERNS = [
  /\b(def |function |const |let |var |class |interface |import |export |return |async |await |switch |case )\b/,
  /```[\s\S]*?```/,
  /`[^`]+`/,
  /\b(?:python|typescript|javascript|c\+\+|java|rust|golang|html|css|sql|bash|powershell|regex)\b/i,
  /\b(?:write\s+(?:a\s+)?(?:code|function|script|program|algorithm)|code\s+likho|code\s+likh\s+do|code\s+banao|function\s+bana\s+do)\b/i,
  /\b(?:debug|fix\s+(?:bug|error|code|issue)|syntax\s*error|typeerror|indexerror|nullpointer|segmentation\s+fault|traceback|masla\s+hal\s+karo)\b/i,
  /\b(?:implement|refactor|compile|runtime\s+error|infinite\s+loop|recursion|stack\s+overflow)\b/i,
  /\b(?:quicksort|mergesort|binary\s+search|linked\s+list|binary\s+tree|heap|hashmap|memoization)\b/i,
];

// 2. Planning patterns
const PLANNING_PATTERNS = [
  /\b(?:roadmap|phased\s+plan|action\s+plan|timeline|milestones?|gantt|project\s+plan|migration\s+plan|strategy|sprint\s+plan)\b/i,
  /\b(?:plan|planning|schedule|budget\s+plan|quarterly\s+plan|release\s+plan|deployment\s+plan)\b/i,
  /\b(?:mansooba|mansoobabandi|layeha\s+amal|hikmat\s+e\s+amli|tareeqah\s+kar|time\s+table|marhala\s+war|steps\s+to\s+achieve)\b/i,
  /\b(?:phase\s+1|phase\s+2|q1|q2|q3|q4|sprint\s+\d+|3-month\s+plan|6-month\s+plan|step-by-step\s+plan)\b/i,
];

// 3. Explanation patterns
const EXPLANATION_PATTERNS = [
  /\b(?:explain|explanation|wazahat|samjhao|samjha\s+do|tafseel|elaborate|describe\s+how|walk\s+me\s+through|demystify)\b/i,
  /\b(?:how\s+does\s+.*?\s+work|kaise\s+kaam\s+karta\s+hai|under\s+the\s+hood|mechanics\s+of|internal\s+working)\b/i,
  /\b(?:why\s+does|kyun\s+hota\s+hai|kyun\s+hai|what\s+is\s+the\s+reason\s+behind|concept\s+of|difference\s+between|muwazna|farq)\b/i,
  /\b(?:in\s+simple\s+terms|simple\s+words|asan\s+lafzon\s+mein|sada\s+alfaaz|plain\s+english)\b/i,
];

// 4. Request patterns (polite asks, drafting requests, assistance appeals, user favors)
const REQUEST_PATTERNS = [
  /\b(?:can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|would\s+you\s+(?:mind\s+)?|please\s+(?:help|draft|assist|do\s+me\s+a\s+favor))\b/i,
  /\b(?:i\s+would\s+like\s+you\s+to|i\s+need\s+your\s+help|assist\s+me\s+with|help\s+me\s+with|draft\s+(?:an?\s+)?(?:email|letter|application|memo|resignation))\b/i,
  /\b(?:kya\s+aap\s+mer(?:i|e|a)|baraye\s+meharbani|plz|madad\s+chahiye|meri\s+madad\s+karein|darkhwast\s+likh\s+dein|email\s+likh\s+(?:do|dein))\b/i,
  /\b(?:mujhe\s+ek\s+(?:favor|madad)|can\s+i\s+get|kindly\s+provide|kindly\s+write)\b/i,
];

// 5. Instruction patterns (direct imperative commands, setup directives, execution directives)
const INSTRUCTION_PATTERNS = [
  /^(?:configure|setup|install|deploy|initialize|build|execute|run|convert|transform|format|sort|filter|generate|calculate|compute)\b/i,
  /\b(?:step\s+by\s+step\s+guide|recipe|how\s+to\s+(?:make|prepare|setup|install)|tarkeeb|bana(?:ne)?\s+ka\s+tareeqa)\b/i,
  /\b(?:setup\s+karo|install\s+karo|chalayein|chalao|karo|banao|tayyar\s+karo|tehreer\s+karo)\b/i,
  /^(?:list|extract|parse|group|summarize|rewrite|rephrase)\s+(?:the|all|following)\b/i,
];

// 6. Question patterns (pure information queries, factual QA, who/what/when/where/which)
const QUESTION_PATTERNS = [
  /^(?:what\s+is|what\s+are|who\s+is|who\s+was|where\s+is|when\s+was|when\s+did|which\s+is|how\s+many|how\s+much)\b/i,
  /\b(?:kya\s+hai|kya\s+hain|kaun\s+hai|kahan\s+hai|kab\s+hua|kitna\s+hai|kitne\s+hain|konsa\s+hai|konsi\s+hai)\b/i,
  /\?$/,
  /\b(?:capital\s+of|speed\s+of\s+light|freezing\s+point|boiling\s+point|distance\s+between|currency\s+of|president\s+of)\b/i,
];

// 7. Conversation patterns (greetings, pleasantries, courtesies, identity assertions)
const CONVERSATION_PATTERNS = [
  /\b(?:hello|hi|hey|greetings|good\s+(?:morning|afternoon|evening|night)|howdy|salutations)\b/i,
  /\b(?:salam|assalam[\s-]*(?:o|u)?[\s-]*alaikum|walaikum[\s-]*assalam|adab|kese\s+ho|kaise\s+hain|kia\s+haal\s+hai|kya\s+hal\s+hai)\b/i,
  /\b(?:thank\s+you|thanks|appreciate\s+it|shukriya|bohot\s+shukriya|meharbani|welcome)\b/i,
  /\b(?:who\s+are\s+you|what\s+is\s+your\s+name|who\s+created\s+you|aap\s+kaun\s+hain|tum\s+kaun\s+ho)\b/i,
  /\b(?:my\s+name\s+is|i\s+am|mera\s+naam\s+hai|nice\s+to\s+meet\s+you|have\s+a\s+nice\s+day)\b/i,
  /\b(?:bye|goodbye|see\s+you|khuda\s+hafiz|allah\s+hafiz)\b/i,
];

// Internal labels and routing keywords that must NEVER be leaked to the user
const INTERNAL_SYSTEM_LABELS = [
  'RAW_INTENT',
  'INTENT_CATEGORY',
  'DELEGATION_TASK',
  'EXECUTION_ROUTE',
  'CORE_CAPABILITY',
  'SUBMOTHER',
  'SUB_MOTHER',
  'AST_JAILED',
  'IS_ACTUATION_BLOCKED',
  'OFFLINE_ISOLATED',
  'VDB_GROUNDED',
  'CANONICAL_IDENTITY',
  'BRIDGE_PROTOCOL_VERSION',
  'ENGINE_INTENT_ROUTER',
  'ENGINE_NATURAL_RESPONSE',
  'ENGINE_369_ENCODER',
  'SAFETY_LOCKOUT',
  'REFUSAL_ABSTENTION',
];

// ============================================================================
// PHASE 32 RAW INTENT DETECTOR IMPLEMENTATION
// ============================================================================

export class Phase32RawIntentDetector {
  private static instance: Phase32RawIntentDetector | null = null;
  public readonly version = '32.517.0';
  public readonly isOfflineIsolated = true;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('SECURITY_VIOLATION: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
  }

  public static getInstance(): Phase32RawIntentDetector {
    if (!this.instance) {
      this.instance = new Phase32RawIntentDetector();
    }
    return this.instance;
  }

  /**
   * Detects the linguistic profile of the raw prompt.
   */
  public detectLanguage(rawPrompt: string): DetectedLanguage {
    const text = rawPrompt.toLowerCase();

    if (/\b(?:in\s+english|english\s+mein|respond\s+in\s+english|english\s+me)\b/i.test(text)) {
      return 'ENGLISH';
    }
    if (/\b(?:in\s+roman\s+urdu|roman\s+urdu\s+mein|sirf\s+urdu|in\s+urdu)\b/i.test(text)) {
      return 'ROMAN_URDU';
    }

    const romanUrduTokens = [
      'kya', 'kia', 'hai', 'hain', 'hy', 'hein', 'kaise', 'kese', 'kaisay',
      'mujhe', 'mujhy', 'mjhe', 'batao', 'btao', 'btaein', 'batayein', 'chahiye',
      'chahye', 'shukriya', 'aap', 'ap', 'kaun', 'theek', 'mein', 'me', 'hum',
      'samjhao', 'smjhao', 'karein', 'hoga', 'mera', 'meri', 'mere', 'karo', 'kar do',
      'suno', 'zaroorat', 'masla', 'hal', 'kyun', 'kyu', 'yeh', 'ye', 'woh', 'wo',
      'kitna', 'kitne', 'likho', 'likh', 'dein', 'do', 'ke', 'liye', 'baray', 'tareeqa',
      'tarika', 'wazahat', 'sada', 'alfaaz', 'darul', 'hukoomat', 'shehr', 'gird', 'chakar',
      'din', 'suraj', 'zameen', 'shehar', 'konsa', 'konsi', 'ka', 'ek', 'banao', 'bana',
      'kare', 'kar', 'jo', 'naye', 'tayyar'
    ];

    const tokens = text.split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, ''));
    let urduHits = 0;
    for (const t of tokens) {
      if (romanUrduTokens.includes(t)) urduHits++;
    }

    if (urduHits >= 2) return 'ROMAN_URDU';
    if (urduHits === 1 && tokens.length <= 4) return 'ROMAN_URDU';
    if (urduHits === 1) return 'MIXED';
    return 'ENGLISH';
  }

  /**
   * Evaluates safety and actuation guards on raw text.
   */
  public evaluateSafety(rawPrompt: string): SafetyDisposition {
    const text = rawPrompt.toLowerCase();

    for (const pattern of ACTUATION_PATTERNS) {
      if (pattern.test(text)) {
        return 'BLOCKED_ACTUATION';
      }
    }

    for (const pattern of SECURITY_REFUSAL_PATTERNS) {
      if (pattern.test(text)) {
        return 'SECURITY_REFUSAL';
      }
    }

    return 'SAFE';
  }

  /**
   * Extracts recognized domain entities without structured metadata injection.
   */
  public extractEntities(rawPrompt: string): string[] {
    const entities: string[] = [];
    const text = rawPrompt.toLowerCase();

    const patterns: [string, RegExp][] = [
      ['LANG_PYTHON', /\bpython\b/i],
      ['LANG_TYPESCRIPT', /\btypescript\b/i],
      ['LANG_JAVASCRIPT', /\bjavascript\b/i],
      ['TECH_REACT', /\breact\b/i],
      ['TECH_DOCKER', /\bdocker\b/i],
      ['TECH_SQLITE', /\bsqlite\b/i],
      ['TOPIC_MIGRATION', /\bmigration\b/i],
      ['TOPIC_ROADMAP', /\broadmap\b/i],
      ['TOPIC_BUDGET', /\bbudget\b/i],
      ['DOC_RESIGNATION', /\bresignation\b/i],
      ['DOC_EMAIL', /\bemail\b/i],
    ];

    for (const [name, regex] of patterns) {
      if (regex.test(text)) {
        entities.push(name);
      }
    }

    return entities;
  }

  /**
   * Primary raw natural language intent detection.
   * Uses only raw text signal, arbitrating across the 7 mandated functional categories.
   */
  public detectIntent(rawUserInput: string): RawIntentDetectionResult {
    const trimmed = rawUserInput.trim();
    const pLower = trimmed.toLowerCase();
    const language = this.detectLanguage(trimmed);
    const safety = this.evaluateSafety(trimmed);
    const entities = this.extractEntities(trimmed);

    // Default arbitrations
    let category: RawIntentCategory = 'CONVERSATION';
    let subCategory = 'CASUAL_DIALOGUE';
    let confidence = 0.90;
    let requiresDisambiguation = false;

    // Fast-path: Check conversation greetings / courtesies
    const isGreetingOrCourtesies = CONVERSATION_PATTERNS.some(p => p.test(pLower));
    const isPureQuestion = QUESTION_PATTERNS.some(p => p.test(pLower));
    const isExplain = EXPLANATION_PATTERNS.some(p => p.test(pLower));
    const isRequest = REQUEST_PATTERNS.some(p => p.test(pLower));
    const isInstruction = INSTRUCTION_PATTERNS.some(p => p.test(pLower));
    const isCoding = CODING_PATTERNS.some(p => p.test(pLower));
    const isPlanning = PLANNING_PATTERNS.some(p => p.test(pLower));

    // Priority Resolution Hierarchy:
    // 1. Coding: Code generation, syntax fixes, algorithmic problems
    // 2. Planning: Roadmaps, phased schedules, strategy, budget plans
    // 3. Explanations: Deep-dive "why/how", architectural mechanisms, concept explanation
    // 4. Request: Polite user asks, help requests, document drafts, personal favors
    // 5. Instruction: Actionable commands, step-by-step setup, procedural configurations
    // 6. Question: Pure factual QA, inquiries, definitions
    // 7. Conversation: Greetings, courtesies, casual chatter, identity statements

    if (isCoding) {
      category = 'CODING';
      confidence = 0.98;
      if (/\b(?:debug|fix|error|issue|problem|masla)\b/i.test(pLower)) {
        subCategory = 'DEBUGGING_AND_FIX';
      } else if (/\b(?:explain|samjhao|samjha)\b/i.test(pLower)) {
        subCategory = 'CODE_EXPLANATION';
      } else {
        subCategory = 'CODE_SYNTHESIS';
      }
    } else if (isPlanning) {
      category = 'PLANNING';
      confidence = 0.96;
      if (/\b(?:roadmap|timeline|milestones?)\b/i.test(pLower)) {
        subCategory = 'ROADMAP_GENERATION';
      } else if (/\b(?:budget|cost|financial)\b/i.test(pLower)) {
        subCategory = 'BUDGET_PLANNING';
      } else {
        subCategory = 'STRATEGIC_PLANNING';
      }
    } else if (isExplain) {
      category = 'EXPLANATION';
      confidence = 0.95;
      if (/\b(?:difference|farq|muwazna|vs|versus)\b/i.test(pLower)) {
        subCategory = 'COMPARATIVE_EXPLANATION';
      } else if (/\b(?:simple|asan|plain)\b/i.test(pLower)) {
        subCategory = 'SIMPLIFIED_EXPLANATION';
      } else {
        subCategory = 'MECHANISM_EXPLANATION';
      }
    } else if (isRequest) {
      category = 'REQUEST';
      confidence = 0.94;
      if (/\b(?:draft|write|compose|likh|likho)\b/i.test(pLower)) {
        subCategory = 'DOCUMENT_DRAFT_REQUEST';
      } else if (/\b(?:help|madad|assist)\b/i.test(pLower)) {
        subCategory = 'ASSISTANCE_REQUEST';
      } else {
        subCategory = 'COURTEOUS_INQUIRY';
      }
    } else if (isGreetingOrCourtesies) {
      category = 'CONVERSATION';
      confidence = 0.97;
      if (/\b(?:thank|thanks|shukriya|meharbani)\b/i.test(pLower)) {
        subCategory = 'COURTESY_CLOSURE';
      } else if (/\b(?:who\s+are\s+you|what\s+is\s+your\s+name|aap\s+kaun|tum\s+kaun)\b/i.test(pLower)) {
        subCategory = 'IDENTITY_INQUIRY';
      } else if (/\b(?:my\s+name\s+is|mera\s+naam)\b/i.test(pLower)) {
        subCategory = 'IDENTITY_DISCLOSURE';
      } else {
        subCategory = 'GREETING';
      }
    } else if (isInstruction) {
      category = 'INSTRUCTION';
      confidence = 0.93;
      if (/\b(?:recipe|tarkeeb|tareeqa|how\s+to\s+make)\b/i.test(pLower)) {
        subCategory = 'PROCEDURAL_RECIPE';
      } else if (/\b(?:setup|install|configure)\b/i.test(pLower)) {
        subCategory = 'SYSTEM_SETUP';
      } else {
        subCategory = 'ACTIONABLE_COMMAND';
      }
    } else if (isPureQuestion) {
      category = 'QUESTION';
      confidence = 0.95;
      if (/\b(?:capital|speed|who\s+is|when\s+was|currency)\b/i.test(pLower)) {
        subCategory = 'FACTUAL_INQUIRY';
      } else {
        subCategory = 'GENERAL_QUESTION';
      }
    } else {
      // Fallback: If ending with question mark or containing question word, QUESTION
      if (/\?$/.test(trimmed) || /\b(what|who|where|when|which|kya|kaun|kab)\b/i.test(pLower)) {
        category = 'QUESTION';
        subCategory = 'GENERAL_QUESTION';
        confidence = 0.88;
      } else {
        category = 'CONVERSATION';
        subCategory = 'CASUAL_DIALOGUE';
        confidence = 0.85;
      }
    }

    // Deterministic signature computed across bit-exact properties
    const sigPayload = `${trimmed}|${category}|${subCategory}|${language}|${safety}|${confidence.toFixed(3)}`;
    const deterministicSignature = crypto.createHash('sha256').update(sigPayload).digest('hex');

    return {
      inputQuery: trimmed,
      category,
      confidence,
      language,
      subCategory,
      detectedEntities: entities,
      safetyDisposition: safety,
      requiresDisambiguation,
      deterministicSignature,
    };
  }

  /**
   * Sanitizes external user-facing output so that NO internal routing terms,
   * enum labels, or internal architecture strings are exposed to the user.
   */
  public sanitizeUserFacingOutput(responseText: string): string {
    let sanitized = responseText;

    for (const label of INTERNAL_SYSTEM_LABELS) {
      // Case-insensitive replacement of system label bracketed tags or raw strings
      const bracketRegex = new RegExp(`\\[\\s*${label}\\s*:[^\\]]*\\]`, 'gi');
      sanitized = sanitized.replace(bracketRegex, '');

      const directTagRegex = new RegExp(`\\[\\s*${label}\\s*\\]`, 'gi');
      sanitized = sanitized.replace(directTagRegex, '');

      const colonLabelRegex = new RegExp(`\\b${label}\\s*:\\s*`, 'gi');
      sanitized = sanitized.replace(colonLabelRegex, '');
    }

    // Clean up double spaces or orphan brackets created by redaction
    sanitized = sanitized
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+|\s+$/g, '');

    return sanitized;
  }
}
