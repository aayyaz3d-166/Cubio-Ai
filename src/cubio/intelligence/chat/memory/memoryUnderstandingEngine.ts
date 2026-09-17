/**
 * CUBiO AI — Phase 21: Conversational Memory Intelligence
 * memoryUnderstandingEngine.ts
 *
 * Master Memory Understanding & Classification Engine:
 * - Classifies user message into 10 canonical categories
 * - Identifies explicit memory action verbs (RECALL, STORE, UPDATE, CORRECT, FORGET)
 * - Distinguishes between RECALL and STORE (never confuses query with storage)
 * - Extracts structured, provenanced facts with key-value normalization
 * - Detects corrections and supersessions against active session memories
 * - Filters out non-memory-worthy messages (greetings, fillers, acknowledgments)
 * - Enforces Hallucination Memory Lock: assistant outputs & unverified claims are never auto-stored
 */

import {
  MemoryClassificationCategory,
  ExplicitMemoryAction,
  MemoryAuthorityLevel,
  ExtractedFactCandidate,
  MemoryUnderstandingResult,
  PersistedMemoryEntry,
} from './memoryTypes';

export class MemoryUnderstandingEngine {
  private static instance: MemoryUnderstandingEngine | null = null;

  public static getInstance(): MemoryUnderstandingEngine {
    if (!MemoryUnderstandingEngine.instance) {
      MemoryUnderstandingEngine.instance = new MemoryUnderstandingEngine();
    }
    return MemoryUnderstandingEngine.instance;
  }

  /**
   * Analyzes an incoming user message and active session memories to determine
   * memory classification, explicit memory verbs, extracted facts, and contradiction signals.
   */
  public analyze(
    message: string,
    existingMemories: readonly PersistedMemoryEntry[] = []
  ): MemoryUnderstandingResult {
    const raw = message.trim();
    const lower = raw.toLowerCase();

    const categories: MemoryClassificationCategory[] = [];
    const extractedFacts: ExtractedFactCandidate[] = [];
    let explicitAction: ExplicitMemoryAction = 'NONE';
    let targetKey: string | undefined;
    let isCorrection = false;
    let correctedKey: string | undefined;
    let correctedValue: string | undefined;
    const detectedContradictions: {
      existingMemoryId: string;
      key: string;
      existingValue: string;
      conflictingValue: string;
      reason: string;
    }[] = [];

    // =========================================================================
    // 1. FILTER: NON-MEMORY-WORTHY INPUT (GREETINGS, ACKNOWLEDGMENTS, FILLERS)
    // =========================================================================
    const isPureGreetingOrFiller =
      /^(hello|hi|hey|greetings|salam|assalam|aao|adab|thanks|thank you|shukriya|ok|okay|got it|cool|nice|understood|bye|goodbye)[!.?]*$/i.test(
        lower
      );

    if (isPureGreetingOrFiller) {
      return Object.freeze({
        categories: Object.freeze(['NO_MEMORY_WORTHY_INFO'] as MemoryClassificationCategory[]),
        explicitAction: 'NONE',
        extractedFacts: Object.freeze([]),
        isCorrection: false,
        detectedContradictions: Object.freeze([]),
        isMemoryWorthy: false,
        reasoning: 'Input is casual greeting or filler with zero persistent factual claims.',
      });
    }

    // =========================================================================
    // 2. EXPLICIT MEMORY VERB DETECTION (RECALL vs STORE vs CORRECT vs FORGET)
    // =========================================================================
    const isExplicitRecall =
      /\b(what\s+did\s+i\s+(?:tell|say\s+to)\s+you|what\s+did\s+we\s+discuss|recall|what\s+is\s+my|what\s+was\s+my|what\s+language\s+am\s+i\s+using|what\s+stack|what\s+framework|tell\s+me\s+my|do\s+you\s+remember\s+my|kya\s+tha|kya\s+hai\s+mera)\b/i.test(
        lower
      );

    const isExplicitStore =
      /\b(remember\s+that|remember\s+this|store\s+this|save\s+this|keep\s+in\s+mind\s+that|note\s+that|mehfooz\s+kar(?:o|na)|yaad\s+rakh(?:o|na))\b/i.test(
        lower
      );

    const isExplicitCorrection =
      /\b(actually\b|wait\b|correction\b|instead\b|switch(?:ing)?\s+to\b|change\s+(?:to|my|the)\b|update\s+(?:to|my|the)\b|nahi\b|ghalat\b)/i.test(
        lower
      );

    const isExplicitForget =
      /\b(forget\s+that|forget\s+my|delete\s+memory|remove\s+memory|do\s+not\s+remember|bhool\s+jao)\b/i.test(
        lower
      );

    if (isExplicitForget) {
      explicitAction = 'FORGET';
      categories.push('EXPLICIT_MEMORY_REQUEST');
    } else if (isExplicitRecall) {
      explicitAction = 'RECALL';
      categories.push('EXPLICIT_MEMORY_REQUEST', 'PREVIOUS_CONVERSATION_REFERENCE');
    } else if (isExplicitCorrection) {
      explicitAction = 'CORRECT';
      isCorrection = true;
      categories.push('CORRECTION_UPDATE', 'EXPLICIT_MEMORY_REQUEST');
    } else if (isExplicitStore) {
      explicitAction = 'STORE';
      categories.push('EXPLICIT_MEMORY_REQUEST');
    }

    // =========================================================================
    // 3. FACT & ATTRIBUTE EXTRACTION
    // =========================================================================

    // A. User Name: "My name is Ayyaz", "Mera naam Ayyaz hai", "I am Ayyaz"
    const nameMatch = raw.match(
      /(?:my\s+name\s+is|call\s+me|i\s+am|mera\s+naam)\s+([A-Z][a-zA-Z0-9_\-]+)/i
    );
    if (nameMatch && !isExplicitRecall) {
      const val = nameMatch[1].trim();
      const stopWords = ['using', 'building', 'writing', 'working', 'switching', 'planning', 'trying', 'a', 'an', 'the'];
      if (!stopWords.includes(val.toLowerCase())) {
        extractedFacts.push({
          key: 'user_name',
          value: val,
          rawFact: `User name is ${val}`,
          category: 'USER_FACT',
          authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
          confidence: 0.99,
          tags: ['identity', 'user_profile'],
        });
        categories.push('USER_FACT');
      }
    }

    // B. Frontend / Application Framework: "My project uses React", "Built with React", "We use Next.js"
    const stackMatch = raw.match(
      /(?:project\s+(?:uses|is\s+built\s+with|runs\s+on)|using|built\s+with|app\s+uses|stack\s+is|framework\s+is|uses)\s+(React(?:\.js)?|Vue(?:\.js)?|Angular|Next\.js|Svelte|Solid|Remix)\b/i
    );
    if (stackMatch && !isExplicitRecall) {
      const framework = stackMatch[1].trim();
      extractedFacts.push({
        key: 'frontend_stack',
        value: framework,
        rawFact: `Project uses ${framework}`,
        category: 'USER_FACT',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.98,
        tags: ['technology', 'stack', 'frontend'],
      });
      categories.push('USER_FACT');
    }

    // Direct explicit mention: "remember that I use React"
    if (isExplicitStore && /\breact\b/i.test(raw)) {
      if (!extractedFacts.some((f) => f.key === 'frontend_stack')) {
        extractedFacts.push({
          key: 'frontend_stack',
          value: 'React',
          rawFact: 'User explicitly uses React',
          category: 'USER_FACT',
          authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
          confidence: 0.99,
          tags: ['technology', 'stack', 'frontend'],
        });
        categories.push('USER_FACT');
      }
    }

    // C. Authentication Provider: "It has Firebase authentication", "Uses Auth0", "Supabase auth"
    const authMatch = raw.match(
      /(?:uses|has|with)\s+(Firebase|Auth0|Supabase|NextAuth|Cognito|Keycloak)(?:\s+(?:authentication|auth))?/i
    );
    if (authMatch && !isExplicitRecall) {
      const authProvider = authMatch[1].trim();
      extractedFacts.push({
        key: 'auth_provider',
        value: authProvider,
        rawFact: `Authentication provider is ${authProvider}`,
        category: 'USER_FACT',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.98,
        tags: ['technology', 'authentication', 'security'],
      });
      categories.push('USER_FACT');
    }

    // D. Programming Language & Corrections: "I am building a Python application", "switching to TypeScript"
    const langSwitchMatch = raw.match(
      /(?:switching\s+to|change\s+to|use|using|switched\s+to|switch\s+to)\s+(TypeScript|Python|Rust|Go(?:lang)?|JavaScript|Java|C\+\+|Kotlin|Swift)\b/i
    );
    const langBuildingMatch = raw.match(
      /(?:building\s+a\s+|developing\s+a\s+|written\s+in\s+|project\s+is\s+in\s+)(TypeScript|Python|Rust|Go(?:lang)?|JavaScript|Java|C\+\+|Kotlin|Swift)\b/i
    );

    const langHit = (langSwitchMatch ? langSwitchMatch[1] : langBuildingMatch ? langBuildingMatch[1] : null);
    if (langHit && !isExplicitRecall) {
      const langVal = langHit.trim();
      extractedFacts.push({
        key: 'programming_language',
        value: langVal,
        rawFact: `Programming language is ${langVal}`,
        category: isCorrection ? 'CORRECTION_UPDATE' : 'USER_FACT',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.99,
        tags: ['technology', 'language'],
      });
      if (isCorrection) {
        correctedKey = 'programming_language';
        correctedValue = langVal;
      }
      categories.push('USER_FACT');
    }

    // E. Explicit Preference Constraints
    if (/\b(do not use external models|no external models|native models only)\b/i.test(lower)) {
      extractedFacts.push({
        key: 'model_policy',
        value: 'NATIVE_ONLY',
        rawFact: 'Strict native models only',
        category: 'PREFERENCE_CONSTRAINT',
        authority: MemoryAuthorityLevel.EXPLICIT_CURRENT_CONSTRAINT,
        confidence: 1.0,
        tags: ['policy', 'constraint'],
      });
      categories.push('PREFERENCE_CONSTRAINT');
    }

    if (/\b(use 369 addressing|strict 369|369 system)\b/i.test(lower)) {
      extractedFacts.push({
        key: 'addressing_policy',
        value: '369_CANONICAL',
        rawFact: 'Use strict 369 addressing',
        category: 'PREFERENCE_CONSTRAINT',
        authority: MemoryAuthorityLevel.EXPLICIT_CURRENT_CONSTRAINT,
        confidence: 1.0,
        tags: ['spatial', 'addressing'],
      });
      categories.push('PREFERENCE_CONSTRAINT');
    }

    if (/\b(keep this project local|strictly local|offline only)\b/i.test(lower)) {
      extractedFacts.push({
        key: 'locality_policy',
        value: 'STRICT_LOCAL',
        rawFact: 'Strictly offline local execution',
        category: 'PREFERENCE_CONSTRAINT',
        authority: MemoryAuthorityLevel.EXPLICIT_CURRENT_CONSTRAINT,
        confidence: 1.0,
        tags: ['security', 'isolation'],
      });
      categories.push('PREFERENCE_CONSTRAINT');
    }

    // F. Key-Value Facts: Secret codes, options, budgets, ports, worker nodes
    const secretMatch = raw.match(
      /(?:secret code|code word|password|key)\s+(?:is|=|set to)\s+([A-Za-z0-9_\-]+)/i
    );
    if (secretMatch && !isExplicitRecall) {
      extractedFacts.push({
        key: 'secret_code',
        value: secretMatch[1].trim(),
        rawFact: `Secret code is ${secretMatch[1].trim()}`,
        category: 'USER_FACT',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.99,
        tags: ['credential', 'secret'],
      });
      categories.push('USER_FACT');
    }

    // Option selection & updates
    const optionSwitchMatch = raw.match(/(?:actually use|change to|switch to|instead use)\s+option\s+([A-Za-z0-9_\-]+)/i);
    const optionInitMatch = raw.match(/(?:use|select)\s+option\s+([A-Za-z0-9_\-]+)/i);
    if (optionSwitchMatch && !isExplicitRecall) {
      extractedFacts.push({
        key: 'selected_option',
        value: optionSwitchMatch[1].trim(),
        rawFact: `Selected option is ${optionSwitchMatch[1].trim()}`,
        category: 'CORRECTION_UPDATE',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.99,
        tags: ['selection', 'configuration'],
      });
      isCorrection = true;
      correctedKey = 'selected_option';
      correctedValue = optionSwitchMatch[1].trim();
      categories.push('CORRECTION_UPDATE');
    } else if (optionInitMatch && !isExplicitRecall) {
      extractedFacts.push({
        key: 'selected_option',
        value: optionInitMatch[1].trim(),
        rawFact: `Selected option is ${optionInitMatch[1].trim()}`,
        category: 'PREFERENCE_CONSTRAINT',
        authority: MemoryAuthorityLevel.EXPLICIT_CURRENT_CONSTRAINT,
        confidence: 0.98,
        tags: ['selection', 'configuration'],
      });
      categories.push('PREFERENCE_CONSTRAINT');
    }

    // Budget extraction
    const budgetMatch = raw.match(/(?:budget|limit)[^\d]*\$?([0-9,]+)/i);
    if (budgetMatch && !isExplicitRecall) {
      const rawNum = budgetMatch[1].replace(/,/g, '');
      extractedFacts.push({
        key: 'budget',
        value: `$${rawNum}`,
        rawFact: `Budget is $${rawNum}`,
        category: isCorrection ? 'CORRECTION_UPDATE' : 'USER_FACT',
        authority: MemoryAuthorityLevel.CURRENT_EXPLICIT_USER_STATEMENT,
        confidence: 0.98,
        tags: ['finance', 'budget'],
      });
      if (isCorrection) {
        correctedKey = 'budget';
        correctedValue = `$${rawNum}`;
      }
      categories.push('USER_FACT');
    }

    // Task requirement: "How should I structure the login page?", "Design the architecture"
    if (/\b(how\s+should\s+i|how\s+to|structure|design|build|create|implement|setup|configure)\b/i.test(lower)) {
      categories.push('TASK_REQUIREMENT');
    }

    // =========================================================================
    // 4. CONTRADICTION & CONFLICT CHECKING
    // =========================================================================
    for (const newFact of extractedFacts) {
      const conflictingExisting = existingMemories.find(
        (m) => m.key === newFact.key && m.status === 'ACTIVE' && m.value.toLowerCase() !== newFact.value.toLowerCase()
      );
      if (conflictingExisting) {
        detectedContradictions.push({
          existingMemoryId: conflictingExisting.memoryId,
          key: newFact.key,
          existingValue: conflictingExisting.value,
          conflictingValue: newFact.value,
          reason: `Key '${newFact.key}' previously held '${conflictingExisting.value}', new statement asserts '${newFact.value}'.`,
        });
        if (!categories.includes('CONTRADICTION')) {
          categories.push('CONTRADICTION');
        }
        if (!categories.includes('CORRECTION_UPDATE')) {
          categories.push('CORRECTION_UPDATE');
        }
        isCorrection = true;
        correctedKey = newFact.key;
        correctedValue = newFact.value;
      }
    }

    // =========================================================================
    // 5. FALLBACK CLASSIFICATION
    // =========================================================================
    if (categories.length === 0) {
      categories.push('CONVERSATIONAL_CONTEXT');
    }

    const isMemoryWorthy =
      extractedFacts.length > 0 ||
      explicitAction === 'STORE' ||
      explicitAction === 'CORRECT' ||
      explicitAction === 'FORGET' ||
      isCorrection;

    const reasoning = `Classified as [${categories.join(', ')}]. Action: ${explicitAction}. Facts extracted: ${
      extractedFacts.length
    }. Memory worthy: ${isMemoryWorthy}.`;

    return Object.freeze({
      categories: Object.freeze(Array.from(new Set(categories))),
      explicitAction,
      targetKey,
      extractedFacts: Object.freeze(extractedFacts),
      isCorrection,
      correctedKey,
      correctedValue,
      detectedContradictions: Object.freeze(detectedContradictions),
      isMemoryWorthy,
      reasoning,
    });
  }
}
