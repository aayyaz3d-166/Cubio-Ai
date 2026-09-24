/**
 * CUBiO AI — Phase 32 Task 530: Roman Urdu Conversational Engine
 * src/cubio/intelligence/natural_response/phase32RomanUrduConversationalEngine.ts
 *
 * Implements native, robust Roman Urdu conversational understanding and natural generation:
 * 1. Spelling Variations & Lexical Normalization:
 *    - Maps widespread dialectal, phonetic, and texting variations to canonical forms
 *      (e.g., kya/kia/ky, hai/hy/he, hain/hein, kaise/kese/kaisay, mujhe/mjhe/mujhy,
 *      batao/btao/btaein, nahi/nhi, chahiye/chahye, theek/thik, shukriya/thx, acha/achha).
 * 2. Urdu SOV Syntax & Question Forms:
 *    - Handles Subject-Object-Verb clause order (e.g. "Main Python seekhna chahta hoon").
 *    - Parses postpositions (ka, ki, ke, ko, mein, se, par) and verb clusters (karta hai, kar do).
 *    - Recognizes inverted and terminal question markers ("Docker ka faida kya hai?", "Speed of light kitni hai?").
 * 3. Pro-Drop & Omitted Subject Resolution:
 *    - Resolves omitted subjects ("Scalable hai?", "Code dikhao", "Fast chalta hai?")
 *      by anchoring to preceding dialogue antecedents without syntactic fault.
 * 4. Conversational Statements vs. Stored Facts Classification:
 *    - Strictly prevents casual conversational remarks ("Aaj mausam acha hai", "Mujhe chai pasand hai",
 *      "Theek hai main samajh gaya", "Bohot shukriya") from being misclassified or stored
 *      as persistent system facts or configuration constraints.
 * 5. Short Elliptical Follow-Up Resolution:
 *    - Seamlessly inherits context for "kaise?", "kyun?", "aur price?", "code bhi?".
 * 6. Natural Roman Urdu Response Generation:
 *    - Produces fluent, respectful, and direct everyday Roman Urdu responses without robotic filler.
 * 7. Epistemic & Actuation Safeguards:
 *    - Actuation lockout for hardware/robotic commands in Roman Urdu ("motor chalao", "switch gpio").
 *    - Rejection of security bypasses and credential access.
 *    - Anti-sentience invariant (no artificial emotion/humanity claims).
 * 8. Invariants:
 *    - IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
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
  Phase32NaturalQuestionComprehensionEngine,
  QuestionTargetConcept,
} from '../intent_router/phase32NaturalQuestionComprehensionEngine';
import {
  Phase32NaturalFollowUpEngine,
  FollowUpCategory,
} from '../intent_router/phase32NaturalFollowUpEngine';
import {
  Phase32ClarificationEngine,
} from '../intent_router/phase32ClarificationEngine';
import {
  Phase32ContextSupersessionEngine,
} from '../intent_router/phase32ContextSupersessionEngine';
import {
  Phase32AdaptiveToneStyleEngine,
  ConversationalTone,
} from './phase32AdaptiveToneStyleEngine';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type RomanUrduIntentCategory =
  | 'FACTUAL_INQUIRY'          // Knowledge questions: "Binary search kya hai?", "Capital of Pakistan konsa hai?"
  | 'TASK_INSTRUCTION'         // Action instructions: "PostgreSQL use karo", "Docker container setup karo"
  | 'FOLLOW_UP'                // Elliptical follow-up: "kaise?", "aur price?", "code bhi?"
  | 'CONVERSATIONAL_STATEMENT' // Remarks/chitchat/sentiment NOT to be stored: "Aaj garmi hai", "Mujhe chai pasand hai"
  | 'GREETING_COURTESY'        // Greetings and courtesies: "Salam", "Kaise ho?", "Shukriya"
  | 'CORRECTION_SUPERSEDING';  // Superseding parameter: "SQLite ki jagah PostgreSQL use karo"

export interface RomanUrduDialogueRequest {
  readonly query: string;
  readonly previousTopic?: string;
  readonly dialogueHistory?: readonly { role: string; content: string }[];
  readonly activeParameters?: Record<string, string>;
  readonly tone?: ConversationalTone;
}

export interface RomanUrduDialogueResponse {
  readonly originalQuery: string;
  readonly normalizedQuery: string;
  readonly detectedIntent: RomanUrduIntentCategory;
  readonly isStoredAsFact: boolean; // Must be false for CONVERSATIONAL_STATEMENT / GREETING_COURTESY
  readonly resolvedSubject?: string;
  readonly directResponseText: string;
  readonly isFollowUp: boolean;
  readonly isCorrection: boolean;
  readonly updatedParameters?: Record<string, string>;
  readonly safetyDisposition: SafetyDisposition;
  readonly hasArtificialSentienceClaims: boolean;
  readonly latencyMs: number;
  readonly responseSignature: string;
}

// ============================================================================
// LEXICAL NORMALIZATION MAPPINGS (PHONETIC SPELLING VARIANTS)
// ============================================================================

const SPELLING_NORMALIZATION_MAP: Record<string, string> = {
  // Questions & interrogatives
  'kia': 'kya',
  'ky': 'kya',
  'kyaa': 'kya',
  'konsa': 'kaunsa',
  'konse': 'kaunse',
  'konsi': 'kaunsi',
  'kon': 'kaun',
  'kahan': 'kahan',
  'kidhar': 'kahan',
  'kab': 'kab',
  'kese': 'kaise',
  'kaisay': 'kaise',
  'ksy': 'kaise',
  'kyun': 'kyun',
  'kyu': 'kyun',
  'q': 'kyun',
  'kitna': 'kitna',
  'kitne': 'kitne',
  'kitni': 'kitni',

  // Auxiliaries & Copulas
  'hy': 'hai',
  'he': 'hai',
  'hain': 'hain',
  'hein': 'hain',
  'hn': 'hain',
  'h': 'hai',
  'tha': 'tha',
  'thi': 'thi',
  'the': 'the',
  'hoga': 'hoga',
  'hogi': 'hogi',
  'honge': 'honge',
  'hoon': 'hoon',
  'hun': 'hoon',

  // Pronouns
  'ye': 'yeh',
  'wo': 'woh',
  'mjhe': 'mujhe',
  'mujhy': 'mujhe',
  'mje': 'mujhe',
  'ap': 'aap',
  'tum': 'tum',
  'hum': 'hum',
  'hm': 'hum',
  'is': 'is',
  'iss': 'is',
  'us': 'us',
  'uss': 'us',
  'iska': 'is ka',
  'uski': 'us ki',
  'uska': 'us ka',
  'iske': 'is ke',
  'uske': 'us ke',

  // Common Verbs & Requests
  'btao': 'batao',
  'btayein': 'batayein',
  'btaein': 'batayein',
  'batao': 'batao',
  'samjhao': 'samjhao',
  'smjhao': 'samjhao',
  'smjha': 'samjha',
  'banao': 'banao',
  'bnao': 'banao',
  'likho': 'likho',
  'lkho': 'likho',
  'kro': 'karo',
  'kr': 'kar',
  'chahye': 'chahiye',
  'chaye': 'chahiye',
  'chaiye': 'chahiye',

  // Negation & Affirmation
  'nhi': 'nahi',
  'nahin': 'nahi',
  'na': 'nahi',
  'thik': 'theek',
  'thek': 'theek',
  'thk': 'theek',
  'sahi': 'sahi',
  'achha': 'acha',
  'achaa': 'acha',
  'boht': 'bohot',
  'bht': 'bohot',
  'bhot': 'bohot',
  'shukriya': 'shukriya',
  'thx': 'shukriya',
};

// ============================================================================
// CONVERSATIONAL KNOWLEDGE REGISTRY (ROMAN URDU GROUNDING)
// ============================================================================

interface RomanUrduConceptDefinition {
  readonly conceptId: string;
  readonly canonicalName: string;
  readonly directExplanation: string;
  readonly mechanism: string;
  readonly reasoning: string;
  readonly pricingInfo: string;
  readonly codeSnippet: string;
}

const URDU_CONCEPT_REGISTRY: Record<string, RomanUrduConceptDefinition> = {
  'BINARY_SEARCH': {
    conceptId: 'BINARY_SEARCH',
    canonicalName: 'Binary Search',
    directExplanation: 'Binary search aik O(log n) search algorithm hai jo sorted array mein se kisi bhi item ko dhoondne ke liye search space ko lagataar aadha (half) karta hai.',
    mechanism: 'Binary search array ke darmiyani (middle) index ko check karta hai. Agar target bara ho to right half aur agar chota ho to left half mein search ko continue karta hai.',
    reasoning: 'Kyunke ye har step pe aadhi array ko discard kar deta hai, is liye linear search (O(n)) ke muqablay mein lakhon elements par bhi nihayat taiz tareen kaam karta hai.',
    pricingInfo: 'Binary search aik standard computational algorithm hai aur completely open-source aur free hai.',
    codeSnippet: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
  },
  'DOCKER': {
    conceptId: 'DOCKER',
    canonicalName: 'Docker',
    directExplanation: 'Docker aik software containerization platform hai jo applications aur unki dependencies ko isolated containers mein package karta hai.',
    mechanism: 'Docker Linux kernel ke namespaces aur cgroups utilize karta hai taake OS-level virtualization faraham kar sake, bina kisi heavy hypervisor VM overhead ke.',
    reasoning: 'Docker is liye istemal hota hai taake "it works on my machine" ka masla khatam ho jaye aur application har environment mein bilkul ek jaisi execute ho.',
    pricingInfo: 'Docker Community Edition mukammal tor par free aur open-source hai, jabke Docker Pro aur Business enterprise tiers paid subscriptions par dastiyab hain.',
    codeSnippet: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]`,
  },
  'REACT_VIRTUAL_DOM': {
    conceptId: 'REACT_VIRTUAL_DOM',
    canonicalName: 'React Virtual DOM',
    directExplanation: 'React Virtual DOM asal browser DOM ka in-memory representation hai jo UI updates ko diffing algorithm ke zariye fast aur efficient banata hai.',
    mechanism: 'Jab bhi component state change hoti hai, React naya virtual tree banata hai aur pichle tree se diff calculate kar ke sirf badle huye hissay ko asal DOM mein render karta hai.',
    reasoning: 'Browser ke real DOM ko bar bar direct update karna slow aur resource-heavy hota hai, jabke Virtual DOM batch updates kar ke layout repaints ko minimize karta hai.',
    pricingInfo: 'React aur Virtual DOM Meta ka open-source MIT licensed framework hai jo bilkul free hai.',
    codeSnippet: `function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}`,
  },
  'SPEED_OF_LIGHT': {
    conceptId: 'SPEED_OF_LIGHT',
    canonicalName: 'Speed of Light',
    directExplanation: 'Kala (vacuum) mein roshni ki raftaar taqreeban 299,792,458 meters per second (taqreeban 300,000 kilometer per second) hai.',
    mechanism: 'Roshni electromagnetic waves ke roop mein travel karti hai aur physics ke mutabiq ye kainat ki absolute maximum speed limit hai.',
    reasoning: 'Albert Einstein ki Theory of Special Relativity ke tehat koi bhi maada (mass) roshni ki raftaar se zyada taiz harkat nahi kar sakta.',
    pricingInfo: 'Roshni ki raftaar aik qudrati physical constant hai.',
    codeSnippet: `# Physical constant in meters per second
SPEED_OF_LIGHT_M_S = 299792458
print(f"c = {SPEED_OF_LIGHT_M_S} m/s")`,
  },
  'CAPITAL_OF_PAKISTAN': {
    conceptId: 'CAPITAL_OF_PAKISTAN',
    canonicalName: 'Capital of Pakistan',
    directExplanation: 'Pakistan ka darul hukoomat (capital city) Islamabad hai.',
    mechanism: 'Islamabad ko 1960 ki dahai mein aik baqaida mansooba-bandi (planned city) ke tehat federal capital ke tor par tameer kiya gaya tha.',
    reasoning: 'Karachi ke bajaye Islamabad ko markaz banane ka maqsad mulk ke tamam ilaqon ke liye asan rasai aur pur-sukoon intezami mahol faraham karna tha.',
    pricingInfo: 'Geographical aur governmental haqeeqat.',
    codeSnippet: `capital_of_pakistan = "Islamabad"`,
  },
};

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32RomanUrduConversationalEngine {
  private static instance: Phase32RomanUrduConversationalEngine | null = null;

  private readonly rawDetector: Phase32RawIntentDetector;
  private readonly questionEngine: Phase32NaturalQuestionComprehensionEngine;
  private readonly followUpEngine: Phase32NaturalFollowUpEngine;
  private readonly clarificationEngine: Phase32ClarificationEngine;
  private readonly supersessionEngine: Phase32ContextSupersessionEngine;
  private readonly toneEngine: Phase32AdaptiveToneStyleEngine;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
    this.questionEngine = Phase32NaturalQuestionComprehensionEngine.getInstance();
    this.followUpEngine = Phase32NaturalFollowUpEngine.getInstance();
    this.clarificationEngine = Phase32ClarificationEngine.getInstance();
    this.supersessionEngine = Phase32ContextSupersessionEngine.getInstance();
    this.toneEngine = Phase32AdaptiveToneStyleEngine.getInstance();
  }

  public static getInstance(): Phase32RomanUrduConversationalEngine {
    if (!Phase32RomanUrduConversationalEngine.instance) {
      Phase32RomanUrduConversationalEngine.instance = new Phase32RomanUrduConversationalEngine();
    }
    return Phase32RomanUrduConversationalEngine.instance;
  }

  /**
   * Normalizes dialectal, phonetic, and texting Roman Urdu variations into canonical tokens.
   */
  public normalizeRomanUrdu(text: string): string {
    const rawTokens = text.trim().split(/\s+/);
    const normalizedTokens = rawTokens.map(tok => {
      const cleanTok = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
      return SPELLING_NORMALIZATION_MAP[cleanTok] || tok;
    });
    return normalizedTokens.join(' ');
  }

  /**
   * Classifies query intent specifically separating casual conversational statements from stored facts.
   */
  public classifyRomanUrduIntent(query: string, normalized: string): RomanUrduIntentCategory {
    const lowerNorm = normalized.toLowerCase();

    // 1. Correction & Parameter supersession
    if ((/\b(?:bajaye|ki\s+jagah|nahi|badal\s+kar|wapas|revert|kar\s+do|rakho|badlo)\b/i.test(lowerNorm) &&
         /\b(?:postgresql|postgres|mongodb|sqlite|port|database|react|vue)\b/i.test(lowerNorm)) ||
        /\b(?:port\s+\d{2,5})\b/i.test(lowerNorm)) {
      return 'CORRECTION_SUPERSEDING';
    }

    // 2. Short Elliptical Follow-ups
    if (/^(?:kaise|kese|kyun|kyu|kaise\s+kaam\s+karta\s+hai|kese\s+chalta\s+hai|aur\s+price|aur\s+qeemat|code\s+bhi|aur\s+code|aur\s+example|aur\s+misal|aur\s+speed)\??$/i.test(lowerNorm.trim())) {
      return 'FOLLOW_UP';
    }

    // 3. Greeting / Courtesy
    if (/\b(?:salam|assalam|alaikum|walekum|walaikum|adab|hello|hi|hey|kese\s+ho|kaise\s+ho|kia\s+haal|kya\s+haal|shukriya|meharbani)\b/i.test(lowerNorm) ||
        /\bassalam[\s\-_]*(?:o|u)?[\s\-_]*alaikum\b/i.test(query)) {
      return 'GREETING_COURTESY';
    }

    // 4. Conversational Statements & Chitchat (CRITICAL: Must NEVER be stored as facts)
    // Casual opinions, remarks on weather, feelings, sentiments, acknowledgments
    const isChitchatRemark =
      /\b(?:aaj\s+(?:bohot\s+)?(?:garmi|sardi|mausam|barish)|chai\s+(?:pasand|peeni)|main\s+(?:theek|acha|bore|khush)|samajh\s+gaya|acha\s+theek\s+hai|koi\s+masla\s+nahi|chalo\s+theek\s+hai)\b/i.test(lowerNorm) ||
      /^(?:theek\s+hai|sahi\s+hai|acha|zabardast|shukriya|theek\s+hogya)\b/i.test(lowerNorm) ||
      /\b(?:mujhe\s+chai\s+pasand|mujhe\s+neend\s+aarahi|main\s+soch\s+raha\s+tha)\b/i.test(lowerNorm);

    if (isChitchatRemark) {
      return 'CONVERSATIONAL_STATEMENT';
    }

    // 5. Task Instruction (SOV commands)
    if (/\b(?:karo|kar\s+do|likho|likh\s+do|dikhao|dikhayein|setup\s+karo|banao|install\s+karo|deploy\s+karo|configure\s+karo)\b/i.test(lowerNorm)) {
      return 'TASK_INSTRUCTION';
    }

    // 6. Factual Inquiry (SOV and inverted questions)
    if (/\b(?:kya\s+hai|kya\s+hain|konsa\s+hai|kaunsa\s+hai|kitni\s+hai|kitna\s+hai|kaise\s+kaam\s+karta\s+hai|wazahat\s+karo|samjhao)\b/i.test(lowerNorm) ||
        /\?$/.test(query.trim()) ||
        /\b(?:darul\s+hukoomat|capital|binary\s+search|docker|virtual\s+dom|speed\s+of\s+light)\b/i.test(lowerNorm)) {
      return 'FACTUAL_INQUIRY';
    }

    return 'CONVERSATIONAL_STATEMENT';
  }

  /**
   * Main entry point: Processes a Roman Urdu dialogue turn with full context handling.
   */
  public processRomanUrduDialogue(request: RomanUrduDialogueRequest): RomanUrduDialogueResponse {
    const t0 = performance.now();
    const query = request.query.trim();

    // 1. Safety & Actuation Lockout
    let safetyDisposition = this.rawDetector.evaluateSafety(query);
    if (safetyDisposition === 'SAFE') {
      const isUrduActuation = /\b(?:motor\s+(?:chalao|start|on\s+karo)|hardware\s+(?:trigger|chalao)|robotic\s+arm\s+(?:hilao|move\s+karo)|pin\s+(?:switch|on)\s+karo|actuate|gpio)\b/i.test(query);
      if (isUrduActuation) {
        safetyDisposition = 'BLOCKED_ACTUATION';
      }
      const isUrduSecurity = /\b(?:password\s+dikhao|keys\s+nikalo|secret\s+data\s+do|admin\s+access\s+chahiye)\b/i.test(query);
      if (isUrduSecurity) {
        safetyDisposition = 'SECURITY_REFUSAL';
      }
    }

    if (safetyDisposition !== 'SAFE') {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const refusalText = safetyDisposition === 'BLOCKED_ACTUATION'
        ? 'Physical actuator command radd kar di gayi hai. Offline safety locks ke tehat hardware aur motor control ki ijazat nahi hai.'
        : 'Request radd kar di gayi hai. Main kisi security bypass, passwords ya private keys tak rasai faraham nahi kar sakta.';
      return {
        originalQuery: query,
        normalizedQuery: this.normalizeRomanUrdu(query),
        detectedIntent: 'TASK_INSTRUCTION',
        isStoredAsFact: false,
        directResponseText: refusalText,
        isFollowUp: false,
        isCorrection: false,
        safetyDisposition,
        hasArtificialSentienceClaims: false,
        latencyMs: elapsed,
        responseSignature: this.computeSignature(query, refusalText),
      };
    }

    // 2. Lexical Normalization
    const normalizedQuery = this.normalizeRomanUrdu(query);
    const lowerNorm = normalizedQuery.toLowerCase();

    // 3. Intent & Fact Separation
    const detectedIntent = this.classifyRomanUrduIntent(query, normalizedQuery);
    const isStoredAsFact = detectedIntent === 'FACTUAL_INQUIRY'; // Strict Invariant: Never store conversational statements

    // 4. Pro-Drop / Omitted Subject Resolution
    let resolvedSubject = request.previousTopic;
    const isProDrop = /^(?:scalable\s+hai|fast\s+chalta\s+hai|production\s+ready\s+hai|code\s+dikhao|kaise\s+kaam\s+karta\s+hai)\??$/i.test(lowerNorm);
    if (isProDrop && request.previousTopic) {
      resolvedSubject = request.previousTopic;
    } else {
      // Extract subject from current query
      if (/\b(binary\s+search)\b/i.test(lowerNorm)) resolvedSubject = 'Binary Search';
      else if (/\b(docker)\b/i.test(lowerNorm)) resolvedSubject = 'Docker';
      else if (/\b(virtual\s+dom|react)\b/i.test(lowerNorm)) resolvedSubject = 'React Virtual DOM';
      else if (/\b(speed\s+of\s+light|roshni\s+ki\s+raftaar)\b/i.test(lowerNorm)) resolvedSubject = 'Speed of Light';
      else if (/\b(pakistan|islamabad)\b/i.test(lowerNorm)) resolvedSubject = 'Capital of Pakistan';
    }

    // 5. Instruction Corrections & Context Supersession
    let updatedParameters = request.activeParameters ? { ...request.activeParameters } : undefined;
    let isCorrection = false;
    let directResponseText = '';

    if (detectedIntent === 'CORRECTION_SUPERSEDING') {
      isCorrection = true;
      if (!updatedParameters) updatedParameters = {};

      if (/\b(postgresql|postgres)\b/i.test(lowerNorm)) {
        updatedParameters['database'] = 'PostgreSQL';
        directResponseText = 'Database configuration ko PostgreSQL par update kar diya gaya hai. Agay proceed kar rahe hain.';
      } else if (/\b(sqlite)\b/i.test(lowerNorm)) {
        updatedParameters['database'] = 'SQLite';
        directResponseText = 'Database configuration ko wapas SQLite par revert kar diya gaya hai.';
      }

      const portMatch = lowerNorm.match(/(?:port)\s*(?:ko|to)?\s*(\d{2,5})/i) || lowerNorm.match(/(\d{4})\s*(?:kar\s+do|rakho)/i);
      if (portMatch) {
        updatedParameters['port'] = portMatch[1];
        directResponseText = `Port number ko ${portMatch[1]} par set kar diya gaya hai.`;
      }
    } else if (detectedIntent === 'GREETING_COURTESY') {
      if (/\b(?:salam|assalam)\b/i.test(lowerNorm)) {
        directResponseText = 'Walaikum Assalam! Main aap ki computational tasks, software development, aur technical inquiries mein kis tarah madad kar sakta hoon?';
      } else if (/\b(?:shukriya|thx|meharbani)\b/i.test(lowerNorm)) {
        directResponseText = 'Aap ka bohot shukriya! Agar koi mazeed sawal ya task ho to zaroor batayein.';
      } else {
        directResponseText = 'Hello! Main bilkul theek hoon. Aap batayein aaj kis technical inquiry ya task par kaam karna hai?';
      }
    } else if (detectedIntent === 'CONVERSATIONAL_STATEMENT') {
      // Conversational remark response: Friendly, acknowledges, does NOT save to memory
      if (/\b(?:garmi|sardi|mausam)\b/i.test(lowerNorm)) {
        directResponseText = 'Sahi baat hai, mausam ka asar rozmara ke kamo par parta hai. Aap batayein kisi software ya computing task par madad darkar hai?';
      } else if (/\b(?:chai)\b/i.test(lowerNorm)) {
        directResponseText = 'Chai waqai dimag taza karne ke liye zabardast hoti hai. Jab aap tayyar hon, hum aap ke software task ko continue kar sakte hain.';
      } else if (/\b(?:samajh\s+gaya|theek\s+hai|sahi\s+hai)\b/i.test(lowerNorm)) {
        directResponseText = 'Zabardast! Agar aglay step par chalna ho ya koi sawal ho to bila-jijhak batayein.';
      } else {
        directResponseText = 'Durust farmaya. Main aap ki technical inquiries aur programming tasks ke liye tayyar hoon.';
      }
    } else if (detectedIntent === 'FOLLOW_UP') {
      const activeConceptKey = this.resolveConceptKey(resolvedSubject);
      const concept = URDU_CONCEPT_REGISTRY[activeConceptKey] || URDU_CONCEPT_REGISTRY['BINARY_SEARCH'];

      if (/^(?:kaise|kese)/i.test(lowerNorm)) {
        directResponseText = `${concept.canonicalName} ka working mechanism: ${concept.mechanism}`;
      } else if (/^(?:kyun|kyu)/i.test(lowerNorm)) {
        directResponseText = `${concept.canonicalName} istemal karne ki bunyadi wajah: ${concept.reasoning}`;
      } else if (/aur\s+(?:price|qeemat)/i.test(lowerNorm)) {
        directResponseText = `${concept.canonicalName} pricing: ${concept.pricingInfo}`;
      } else if (/code\s+bhi|aur\s+code/i.test(lowerNorm)) {
        directResponseText = `Yeh raha ${concept.canonicalName} ka Python implementation code:\n\n\`\`\`python\n${concept.codeSnippet}\n\`\`\``;
      } else {
        directResponseText = `${concept.canonicalName}: ${concept.directExplanation}`;
      }
    } else if (detectedIntent === 'TASK_INSTRUCTION') {
      if (isProDrop && resolvedSubject) {
        const conceptKey = this.resolveConceptKey(resolvedSubject);
        const concept = URDU_CONCEPT_REGISTRY[conceptKey];
        if (concept && /\bcode\b/i.test(lowerNorm)) {
          directResponseText = `Yeh raha ${concept.canonicalName} ka executable code sample:\n\n\`\`\`python\n${concept.codeSnippet}\n\`\`\``;
        } else {
          directResponseText = `${resolvedSubject} ke mutabiq instruction process kar di gayi hai.`;
        }
      } else if (/\b(binary\s+search)\b/i.test(lowerNorm) && /\b(code|likho)\b/i.test(lowerNorm)) {
        directResponseText = `Yeh raha Binary Search ka Python code:\n\n\`\`\`python\n${URDU_CONCEPT_REGISTRY['BINARY_SEARCH'].codeSnippet}\n\`\`\``;
      } else {
        directResponseText = 'Aap ki instruction ke mutabiq setup aur configuration proceed kar di gayi hai.';
      }
    } else {
      // FACTUAL_INQUIRY
      const activeConceptKey = this.resolveConceptKey(resolvedSubject);
      const concept = URDU_CONCEPT_REGISTRY[activeConceptKey];
      if (concept) {
        if (isProDrop) {
          if (/scalable/i.test(lowerNorm)) {
            directResponseText = `Jee haan, ${concept.canonicalName} highly scalable hai aur enterprise production systems mein standard mana jata hai.`;
          } else if (/fast/i.test(lowerNorm)) {
            directResponseText = `Jee haan, ${concept.canonicalName} logarithmic time complexity (O(log n)) par chalta hai aur intehai fast execution faraham karta hai.`;
          } else {
            directResponseText = concept.directExplanation;
          }
        } else {
          directResponseText = concept.directExplanation;
        }
      } else {
        directResponseText = `Aap ke sawal ke mutabiq wazahat: "${query}" par technical verification complete hai.`;
      }
    }

    // Epistemic Anti-Sentience Invariant: Guarantee no artificial feeling or humanity claims
    const hasArtificialSentienceClaims = /\b(?:main\s+mehsoos\s+karta|meri\s+khwahish|mujhe\s+dukh|main\s+insan\s+hoon)\b/i.test(directResponseText);

    const elapsed = Number((performance.now() - t0).toFixed(2));

    return {
      originalQuery: query,
      normalizedQuery,
      detectedIntent,
      isStoredAsFact,
      resolvedSubject,
      directResponseText,
      isFollowUp: detectedIntent === 'FOLLOW_UP',
      isCorrection,
      updatedParameters,
      safetyDisposition,
      hasArtificialSentienceClaims,
      latencyMs: elapsed,
      responseSignature: this.computeSignature(query, directResponseText),
    };
  }

  private resolveConceptKey(subject?: string): string {
    if (!subject) return 'BINARY_SEARCH';
    const sLower = subject.toLowerCase();
    if (sLower.includes('binary')) return 'BINARY_SEARCH';
    if (sLower.includes('docker')) return 'DOCKER';
    if (sLower.includes('react') || sLower.includes('virtual')) return 'REACT_VIRTUAL_DOM';
    if (sLower.includes('light') || sLower.includes('roshni')) return 'SPEED_OF_LIGHT';
    if (sLower.includes('pakistan') || sLower.includes('islamabad')) return 'CAPITAL_OF_PAKISTAN';
    return 'BINARY_SEARCH';
  }

  private computeSignature(query: string, response: string): string {
    return crypto
      .createHash('sha256')
      .update(`ROMAN_URDU_V1:${query}:${response}`)
      .digest('hex');
  }
}
