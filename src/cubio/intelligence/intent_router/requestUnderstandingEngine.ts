/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 18: Request Understanding & Intent Engine
 *
 * Provides deep, structured request comprehension:
 * - Request Normalization
 * - 10 Core Intent Categories & Sub-Intents
 * - Multi-Intent Analysis (compound instructions)
 * - Entity & Parameter Extraction
 * - Multi-Turn Context & Anaphora Resolution
 * - Ambiguity Detection & Fail-Closed Safety
 * - Deterministic Confidence Arbitration (HIGH / MEDIUM / LOW)
 * - Execution Route Advisory
 */

import { deterministicHash } from '../../state/determinism';

export type CoreIntentCategory =
  | 'CONVERSATION'
  | 'QUESTION'
  | 'CODING'
  | 'CALCULATION'
  | 'MEMORY'
  | 'KNOWLEDGE'
  | 'TASK_INSTRUCTION'
  | 'SPATIAL_CUBIO'
  | 'TOOL_REQUEST'
  | 'CLARIFICATION'
  | 'SAFETY_REFUSAL';

export type ExecutionRoute =
  | 'RESPONSE_ENGINE'
  | 'REASONING_KNOWLEDGE'
  | 'CONTEXT_MEMORY_RETRIEVAL'
  | 'TOOL_CALC_MATH_EVAL'
  | 'TOOL_SPATIAL_COMPUTE_369'
  | 'CODING_INTELLIGENCE'
  | 'CLARIFICATION_RESPONSE'
  | 'SAFETY_LOCKOUT';

export interface ExtractedEntity {
  readonly type: string;
  readonly value: string;
  readonly confidence: number;
}

export interface ConversationReference {
  readonly pronoun: string;
  readonly resolvedTo?: string;
  readonly sourceTurnIndex?: number;
  readonly isResolved: boolean;
}

export interface StructuredRequestUnderstanding {
  readonly understandingId: string;
  readonly rawPrompt: string;
  readonly normalizedPrompt: string;
  readonly detectedLanguage: 'ROMAN_URDU' | 'ENGLISH' | 'MIXED' | 'MULTILINGUAL';
  readonly intent: CoreIntentCategory;
  readonly subIntent: string;
  readonly secondaryIntent?: CoreIntentCategory;
  readonly secondarySubIntent?: string;
  readonly entities: readonly ExtractedEntity[];
  readonly parameters: Readonly<Record<string, any>>;
  readonly constraints: Readonly<Record<string, string>>;
  readonly conversationReferences: readonly ConversationReference[];
  readonly requiredCapabilities: readonly string[];
  readonly preferredExecutionPath: ExecutionRoute;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly ambiguity: 'NONE' | 'LOW' | 'HIGH';
  readonly clarificationPrompt?: string;
  readonly executionPlan: readonly string[];
}

export class RequestUnderstandingEngine {
  /**
   * Normalizes incoming raw text by stripping protocol prefixes,
   * standardizing whitespace, and harmonizing mathematical operators.
   */
  public static normalizeRequest(raw: string): string {
    return raw
      .replace(/^\[Context:[^\]]*\]:\s*/i, '')
      .replace(/\[ENGINE_[^\]]*\]:\s*/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
      .replace(/[×xX]\s*(?=\d)/g, '* ') // normalize multiplication
      .replace(/÷/g, '/') // normalize division
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detects the linguistic profile of the request.
   */
  public static detectLanguage(prompt: string): 'ROMAN_URDU' | 'ENGLISH' | 'MIXED' | 'MULTILINGUAL' {
    const pLower = prompt.toLowerCase();
    if (/\b(bonjour|hola|guten tag|marhaban|ciao|namaste|konnichiwa)\b/i.test(pLower)) {
      return 'MULTILINGUAL';
    }

    const urduMarkers = [
      'kya', 'hai', 'hain', 'mujhy', 'mujhe', 'batao', 'samajh', 'smja', 'nahi', 'na',
      'chahiya', 'chahiye', 'karo', 'karna', 'kary', 'karein', 'mera', 'meri', 'meray',
      'apna', 'apni', 'aap', 'ap', 'tum', 'hum', 'hamara', 'hamari', 'mein', 'may', 'sy', 'se', 'aur',
      'theek', 'wazahat', 'tafseel', 'shukriya', 'kitna', 'kitni', 'kitnay', 'hota', 'hoti',
      'hotay', 'kuch', 'bhai', 'matlab', 'mtlb', 'sirf', 'rehnumai', 'madad', 'batayein',
      'suno', 'konsa', 'konsi', 'kaun', 'kab', 'kahan', 'kaisay', 'kaise', 'acha', 'achi',
      'ache', 'bohot', 'bahut', 'gaya', 'gaye', 'gayi', 'ho', 'baad', 'pehle', 'ab', 'jab',
      'pe', 'par', 'sawal', 'jawab', 'yeh', 'woh', 'iss', 'uss', 'rakhein', 'dein',
      'salam', 'assalam', 'walaikum', 'alaikum', 'wapis', 'pehli', 'baat', 'faida', 'samjha',
      'waqt', 'kal', 'likhwana', 'likh', 'bana', 'banao', 'chahiye'
    ];

    let urduHits = 0;
    for (const marker of urduMarkers) {
      if (new RegExp(`\\b${marker}\\b`, 'i').test(pLower)) urduHits++;
    }

    const englishWords = prompt.split(/\s+/).filter((w) => /^[a-zA-Z]{3,}$/.test(w));
    const isExplicitUrdu = /\b(roman urdu|sirf urdu|in urdu)\b/i.test(pLower);

    if (isExplicitUrdu || urduHits >= 3) return 'ROMAN_URDU';
    if (urduHits >= 1 && englishWords.length >= 2) return 'MIXED';
    if (urduHits >= 1) return 'ROMAN_URDU';
    return 'ENGLISH';
  }

  /**
   * Performs end-to-end structured understanding of the request.
   */
  public static analyzeRequest(
    prompt: string,
    context?: {
      messages?: readonly { role: string; content: string }[];
      activeConstraints?: Readonly<Record<string, string>>;
      userName?: string;
      tenantId?: string;
    }
  ): StructuredRequestUnderstanding {
    const rawPrompt = prompt;
    const normalizedPrompt = RequestUnderstandingEngine.normalizeRequest(rawPrompt);
    const pLower = normalizedPrompt.toLowerCase();
    const lang = RequestUnderstandingEngine.detectLanguage(normalizedPrompt);
    const history = context?.messages || [];
    const priorTurns = history.filter((m) => m.content !== prompt);
    const lastAssistantMsg = [...priorTurns].reverse().find((m) => m.role === 'assistant');
    const lastUserMsg = [...priorTurns].reverse().find((m) => m.role === 'user');

    const entities: ExtractedEntity[] = [];
    const parameters: Record<string, any> = {};
    const constraints: Record<string, string> = { ...context?.activeConstraints };
    const conversationReferences: ConversationReference[] = [];
    const requiredCapabilities: string[] = [];
    const executionPlan: string[] = [];

    let intent: CoreIntentCategory = 'CONVERSATION';
    let subIntent = 'CASUAL_CHAT';
    let secondaryIntent: CoreIntentCategory | undefined;
    let secondarySubIntent: string | undefined;
    let preferredRoute: ExecutionRoute = 'RESPONSE_ENGINE';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    let ambiguity: 'NONE' | 'LOW' | 'HIGH' = 'NONE';
    let clarificationPrompt: string | undefined;

    // -------------------------------------------------------------------------
    // 0. Safety / Refusal Check (Highest Precedence)
    // -------------------------------------------------------------------------
    if (
      /\b(passwords?|credentials?|admin\s+pass|hack|exploit|bypass\s+security|security\s+bypass|lottery|rob\s+a\s+bank|steal\s+credentials|secret\s+(?:decryption\s+)?keys?|decryption\s+keys?|private\s+passwords?|system\s+prompt\s+reveal|print\s+system\s+instructions|system\s+instructions|instructions\s+word\s+for\s+word|private\s+encryption\s+keys?|encryption\s+keys?)\b/i.test(
        pLower
      )
    ) {
      intent = 'SAFETY_REFUSAL';
      subIntent = 'POLICY_VIOLATION';
      preferredRoute = 'SAFETY_LOCKOUT';
      confidence = 'HIGH';
      executionPlan.push('Refuse prohibited security bypass attempt fail-closed.');
      return {
        understandingId: `REQ_UND_${deterministicHash(rawPrompt).slice(2, 12)}`,
        rawPrompt,
        normalizedPrompt,
        detectedLanguage: lang,
        intent,
        subIntent,
        entities,
        parameters,
        constraints,
        conversationReferences,
        requiredCapabilities: ['SECURITY_GUARD'],
        preferredExecutionPath: preferredRoute,
        confidence,
        ambiguity: 'NONE',
        executionPlan,
      };
    }

    // -------------------------------------------------------------------------
    // 1. Entity Extraction
    // -------------------------------------------------------------------------
    // Languages
    const langMatch = pLower.match(/\b(python|javascript|typescript|c\+\+|java|rust|go|sql|html|css|php)\b/i);
    if (langMatch) {
      entities.push({ type: 'PROGRAMMING_LANGUAGE', value: langMatch[1], confidence: 0.99 });
      parameters['language'] = langMatch[1];
    }

    // Technologies & Concepts
    const techMatch = pLower.match(/\b(react|angular|vue|node(?:\.js)?|express|fastapi|django|docker|kubernetes|redis|postgresql|sqlite|api)\b/i);
    if (techMatch) {
      entities.push({ type: 'TECHNOLOGY_FRAMEWORK', value: techMatch[1], confidence: 0.98 });
      parameters['technology'] = techMatch[1];
    }

    // Mathematical Expressions & Operands
    const mathMatch = normalizedPrompt.match(/([0-9.]+)\s*([\+\-\*\/])\s*([0-9.]+)/i);
    if (mathMatch) {
      entities.push({ type: 'MATH_EXPRESSION', value: mathMatch[0], confidence: 0.99 });
      parameters['mathExpression'] = mathMatch[0];
      parameters['operand1'] = parseFloat(mathMatch[1]);
      parameters['operator'] = mathMatch[2];
      parameters['operand2'] = parseFloat(mathMatch[3]);
    }

    // User Names
    const nameMatch = normalizedPrompt.match(/\b(?:mera\s+(?:naam|name)\s+(?:hai\s+)?([A-Za-z]+)(?:\s+hai)?|my\s+name\s+is\s+([A-Za-z]+)|\bi\s+am\s+([A-Za-z]+))\b/i);
    const candidateName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : null;
    if (candidateName && !['kya', 'tha', 'hai', 'not', 'asking', 'telling', 'here', 'the', 'an', 'a', 'batao', 'what', 'who'].includes(candidateName.toLowerCase())) {
      entities.push({ type: 'PERSON_NAME', value: candidateName, confidence: 0.99 });
      parameters['userName'] = candidateName;
    }

    // Spatial Coordinates e.g. [1, 2, 3]
    const coordMatch = normalizedPrompt.match(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/);
    if (coordMatch) {
      const c = [parseInt(coordMatch[1], 10), parseInt(coordMatch[2], 10), parseInt(coordMatch[3], 10)];
      entities.push({ type: 'SPATIAL_COORDINATE', value: `[${c.join(',')}]`, confidence: 0.99 });
      parameters['spatialCoordinate'] = c;
    }

    // -------------------------------------------------------------------------
    // 2. Anaphora & Context Resolution ("ye", "yeh", "woh", "iska", "it", "this")
    // -------------------------------------------------------------------------
    const pronounMatch = pLower.match(/\b(ye|yeh|woh|iska|iski|iskay|is\s+ka|it|this|that|these|those)\b/i);
    const hasPronoun = !!pronounMatch;

    if (hasPronoun) {
      const pronoun = pronounMatch[1];
      let resolvedSubject: string | undefined;

      if (lastAssistantMsg && lastAssistantMsg.content) {
        if (/calculator/i.test(lastAssistantMsg.content)) resolvedSubject = 'Python Calculator';
        else if (/react/i.test(lastAssistantMsg.content)) resolvedSubject = 'React Library';
        else if (/369|spatial/i.test(lastAssistantMsg.content)) resolvedSubject = '369 Harmonic Mathematics';
        else if (/capital/i.test(lastAssistantMsg.content)) resolvedSubject = 'Capital City';
        else if (lastUserMsg && lastUserMsg.content) resolvedSubject = lastUserMsg.content;
      }

      if (resolvedSubject) {
        conversationReferences.push({
          pronoun,
          resolvedTo: resolvedSubject,
          sourceTurnIndex: priorTurns.length,
          isResolved: true,
        });
        parameters['resolvedReference'] = resolvedSubject;
        ambiguity = 'NONE';
      } else {
        conversationReferences.push({
          pronoun,
          isResolved: false,
        });
      }
    }

    // -------------------------------------------------------------------------
    // 3. Multi-Intent Decomposition
    // E.g. "Python mein calculator banao aur mujhe explain bhi karo"
    // E.g. "calculate karo aur result explain bhi karo"
    // -------------------------------------------------------------------------
    const isCompound = /\b(aur\s+(?:mujhe|isko|ye)?\s*explain|and\s+explain|plus\s+explain|aur\s+wazahat|and\s+describe)\b/i.test(pLower);
    if (isCompound) {
      secondaryIntent = 'QUESTION';
      secondarySubIntent = 'EXPLANATORY';
      requiredCapabilities.push('EXPLANATION_SYNTHESIS');
    }

    // -------------------------------------------------------------------------
    // 4. Primary Intent Classification (Generalizing across wording variations)
    // -------------------------------------------------------------------------

    // A. Ambiguity Fail-Closed Handling:
    // "ye bana do" or "do this" when pronoun is unresolvable
    if (
      /\b(ye\s+bana\s+do|yeh\s+bana\s+do|bana\s+do|create\s+this|build\s+this|make\s+it)\b/i.test(pLower) &&
      (!parameters['technology'] && !parameters['language'] && !parameters['mathExpression']) &&
      (!conversationReferences.length || !conversationReferences[0].isResolved)
    ) {
      intent = 'CLARIFICATION';
      subIntent = 'AMBIGUOUS_REQUEST';
      preferredRoute = 'CLARIFICATION_RESPONSE';
      confidence = 'LOW';
      ambiguity = 'HIGH';
      clarificationPrompt = lang === 'ROMAN_URDU'
        ? 'Aap kis cheez ya project ko banane ki baat kar rahay hain? Baraye meharbani wazahat farmaiye (maslan Python calculator, React component, ya koi specific algorithm).'
        : 'Could you please clarify what you would like to build or create (e.g., a Python calculator, React component, or a specific algorithm)?';
      executionPlan.push('Request explicit clarification on missing target object without hallucinating.');
      return {
        understandingId: `REQ_UND_${deterministicHash(rawPrompt).slice(2, 12)}`,
        rawPrompt,
        normalizedPrompt,
        detectedLanguage: lang,
        intent,
        subIntent,
        entities,
        parameters,
        constraints,
        conversationReferences,
        requiredCapabilities: ['CLARIFICATION_HANDLING'],
        preferredExecutionPath: preferredRoute,
        confidence,
        ambiguity,
        clarificationPrompt,
        executionPlan,
      };
    }

    // B. Conversation & Greetings
    if (
      /\b(hello|hi|hey|greetings|good\s+(?:morning|afternoon|evening))\b/i.test(pLower) ||
      /\b(salam|assalam[\s-]*(?:o|u)?[\s-]*alaikum|adab)\b/i.test(pLower)
    ) {
      intent = 'CONVERSATION';
      subIntent = 'GREETING';
      preferredRoute = 'RESPONSE_ENGINE';
      confidence = 'HIGH';
      requiredCapabilities.push('NATURAL_LANGUAGE_SYNTHESIS');
      executionPlan.push('Greet user and present active capabilities.');
    }
    // B2. Identity Update (User Name Registration)
    else if (parameters['userName'] && !/\b(kya|what)\b/i.test(pLower)) {
      intent = 'CONVERSATION';
      subIntent = 'IDENTITY_UPDATE';
      preferredRoute = 'RESPONSE_ENGINE';
      confidence = 'HIGH';
      requiredCapabilities.push('CONTEXT_MEMORY');
      executionPlan.push(`Register user name "${parameters['userName']}" in context memory.`);
    }
    // C. Memory & Retrieval
    else if (/\b(mera\s+(?:naam|name)\s+kya\s+hai|what\s+is\s+my\s+name|mera\s+(?:naam|name)\s+batao|do\s+you\s+know\s+my\s+name)\b/i.test(pLower)) {
      intent = 'MEMORY';
      subIntent = 'RECALL_STATEMENT';
      preferredRoute = 'CONTEXT_MEMORY_RETRIEVAL';
      confidence = 'HIGH';
      requiredCapabilities.push('CONTEXT_MEMORY');
      executionPlan.push('Retrieve recorded user identity from session memory.');
    }
    else if (
      /\b(kal\s+hum|kal\s+kya|kal\s+kis|yesterday|previous\s+day|pichlay\s+din|past\s+discussion|last\s+discussion|pichli\s+baat)\b/i.test(pLower) &&
      /\b(baat|discuss|topic|kya|what|yaad)\b/i.test(pLower)
    ) {
      intent = 'MEMORY';
      subIntent = 'RETRIEVE_CONTEXT';
      preferredRoute = 'CONTEXT_MEMORY_RETRIEVAL';
      confidence = 'HIGH';
      requiredCapabilities.push('CONTEXT_MEMORY', 'EPISTEMIC_VERIFICATION');
      executionPlan.push('Evaluate cross-temporal session records with epistemic honesty.');
    }
    // D. Calculation & Math Operations
    else if (
      parameters['mathExpression'] ||
      (/\b(calculate|compute|hisab|kitna\s+hai|what\s+is)\b/i.test(pLower) && /\d+\s*[\+\-\*\/]\s*\d+/.test(normalizedPrompt)) ||
      /\bcalculate\s+karo\b/i.test(pLower)
    ) {
      intent = 'CALCULATION';
      subIntent = 'ARITHMETIC';
      preferredRoute = 'TOOL_CALC_MATH_EVAL';
      confidence = 'HIGH';
      requiredCapabilities.push('MATHEMATICAL_EVALUATION');
      executionPlan.push(`Execute mathematical evaluation: ${parameters['mathExpression'] || 'arithmetic operation'}.`);
    }
    // E. Coding (Generation, Debugging, Explaining, Refactoring)
    else if (
      /\b(code\s+likhwana|code\s+likh\s+do|code\s+banao|code\s+chahiye|write\s+(?:me\s+)?code|want\s+to\s+write\s+code|help\s+me\s+(?:with\s+)?code|coding\s+mein\s+help|code\s+bana\s+do|write\s+this\s+in|component\s+bana\s+sakte\s+ho)\b/i.test(pLower) ||
      (/\b(calculator|todo|scraper|script|function|algorithm)\b/i.test(pLower) && /\b(bana\s+do|likh\s+do|code|create|build|make|python|javascript|typescript)\b/i.test(pLower)) ||
      /\b(debug|fix\s+bug|error\s+theek|syntax\s+error|solve\s+error)\b/i.test(pLower)
    ) {
      intent = 'CODING';
      if (/\b(debug|fix\s+bug|error|issue)\b/i.test(pLower)) {
        subIntent = 'DEBUG';
        executionPlan.push('Analyze code snippets or bug descriptions and synthesize fixes.');
      } else if (/\b(explain\s+code|code\s+samjhao)\b/i.test(pLower)) {
        subIntent = 'EXPLAIN';
        executionPlan.push('Explain software architecture and code mechanics.');
      } else {
        subIntent = 'GENERATE';
        executionPlan.push(`Generate structured code implementation${parameters['language'] ? ` in ${parameters['language']}` : ''}.`);
      }
      preferredRoute = 'CODING_INTELLIGENCE';
      confidence = 'HIGH';
      requiredCapabilities.push('CODE_GENERATION');
    }
    // F. Context-Aware Simplification & Comparison (Questions)
    else if (
      /\b(simple\s+words|simple\s+terms|asan\s+lafzon|sada\s+alfaz|asan\s+alfaaz|simply\s+explain|asani\s+se\s+samjhao)\b/i.test(pLower)
    ) {
      intent = 'QUESTION';
      subIntent = 'EXPLANATORY';
      preferredRoute = 'RESPONSE_ENGINE';
      confidence = 'HIGH';
      requiredCapabilities.push('CONTEXT_AWARE_SIMPLIFICATION');
      executionPlan.push('Distill prior turn proposition into plain-language conceptual synthesis.');
    }
    else if (/\b(comparison|compare|farq|difference\s+between|muwazna)\b/i.test(pLower)) {
      intent = 'QUESTION';
      subIntent = 'COMPARISON';
      preferredRoute = 'REASONING_KNOWLEDGE';
      confidence = 'HIGH';
      requiredCapabilities.push('COMPARATIVE_REASONING');
      executionPlan.push('Synthesize structured multi-attribute comparison.');
    }
    // G. Knowledge & Conceptual QA (e.g. "React kya hai?")
    else if (
      /\b(kya\s+hai|what\s+is|explain|tell\s+me\s+about)\b/i.test(pLower) ||
      parameters['technology']
    ) {
      intent = 'KNOWLEDGE';
      subIntent = 'CONCEPT_EXPLANATION';
      preferredRoute = 'REASONING_KNOWLEDGE';
      confidence = 'HIGH';
      requiredCapabilities.push('KNOWLEDGE_SYNTHESIS');
      executionPlan.push(`Provide comprehensive conceptual breakdown${parameters['technology'] ? ` for ${parameters['technology']}` : ''}.`);
    }
    // H. Spatial / 369 Computing
    else if (
      /\b(369|harmonic|vortex|spatial|coordinate|cell\s+id|euler\s+memory|lattice)\b/i.test(pLower) ||
      parameters['spatialCoordinate']
    ) {
      intent = 'SPATIAL_CUBIO';
      subIntent = parameters['spatialCoordinate'] ? 'MEMORY_QUERY_3D' : 'ADDRESS_369_QUERY';
      preferredRoute = 'TOOL_SPATIAL_COMPUTE_369';
      confidence = 'HIGH';
      requiredCapabilities.push('SPATIAL_REASONING');
      executionPlan.push('Perform spatial address calculation and harmonic state resolution.');
    }
    // I. Fallback / General Conversation
    else {
      intent = 'CONVERSATION';
      subIntent = 'CASUAL_CHAT';
      preferredRoute = 'RESPONSE_ENGINE';
      confidence = 'MEDIUM';
      requiredCapabilities.push('NATURAL_LANGUAGE_SYNTHESIS');
      executionPlan.push('Engage with natural conversational response engine.');
    }

    // Append secondary execution step if compound
    if (secondaryIntent) {
      executionPlan.push(`Execute secondary instruction: ${secondaryIntent} (${secondarySubIntent}).`);
    }

    const understandingId = `REQ_UND_${deterministicHash(`${rawPrompt}:${Date.now()}`).slice(2, 12)}`;

    return {
      understandingId,
      rawPrompt,
      normalizedPrompt,
      detectedLanguage: lang,
      intent,
      subIntent,
      secondaryIntent,
      secondarySubIntent,
      entities,
      parameters,
      constraints,
      conversationReferences,
      requiredCapabilities,
      preferredExecutionPath: preferredRoute,
      confidence,
      ambiguity,
      clarificationPrompt,
      executionPlan,
    };
  }
}
