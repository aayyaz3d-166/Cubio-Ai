/**
 * CUBiO AI — Phase 32 Task 521: Previous-Turn Reference Resolution Engine
 * src/cubio/intelligence/intent_router/phase32ReferenceResolutionEngine.ts
 *
 * Implements advanced previous-turn reference resolution for natural conversations:
 * 1. Pronouns:
 *    - English: "it", "this", "that", "these", "those", "its", "the former", "the latter", "same one"
 *    - Roman Urdu: "ye", "yeh", "woh", "is ka", "iska", "iski", "iskay", "us ka", "uska", "uske", "uski", "usko", "wahi wala", "wahi", "usme", "usmein"
 *    - Code-Mixed: "is service ka", "woh function", "same endpoint", "is component mein"
 * 2. Omitted Subjects / Elliptical References:
 *    - Subject ellipsis where verbs or descriptors lack overt nominals:
 *      e.g. "Can optimize for production?" -> subject inferred as preceding target entity (e.g. Dockerfile / Build script).
 *      e.g. "Scalable hai?" -> subject inferred as preceding architecture/DB.
 *      e.g. "Latency kya hogi?" -> tied to preceding service/system.
 * 3. Referenced Objects & Contextual Phrases:
 *    - "the second option", "pehla wala", "second method", "the function above", "last query", "previous configuration"
 * 4. Genuine Context Insufficiency Rejection:
 *    - If no antecedent candidates exist or dialogue history is disjoint/ambiguous,
 *      the engine rejects resolution gracefully with REJECTED_INSUFFICIENT_CONTEXT disposition,
 *      soliciting clean conversational clarification without leaking internal structures.
 * 5. Strict User Output Insulation:
 *    - Never expose internal context structures, AST keys, slot IDs, or routing labels.
 * 6. Preserves IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true invariants.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import { ConversationalContextTurn } from './phase32ConversationalRouter';
import { DetectedLanguage, Phase32RawIntentDetector } from './phase32RawIntentDetector';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type ReferenceType =
  | 'PRONOUN'               // "it", "ye", "woh", "this", "that"
  | 'POSSESSIVE_PRONOUN'    // "its", "is ka", "us ka", "iski", "uska"
  | 'OMITTED_SUBJECT'       // Verb/adjective without subject: "Scalable hai?", "Can optimize?"
  | 'CONTEXTUAL_PHRASE'     // "same one", "wahi wala", "pehla wala", "the second one", "previous approach"
  | 'DEICTIC_DEMONSTRATIVE' // "these options", "un logon", "ye steps"
  | 'UNKNOWN';

export type ResolutionStatus =
  | 'RESOLVED'
  | 'REJECTED_INSUFFICIENT_CONTEXT'
  | 'AMBIGUOUS_MULTIPLE_CANDIDATES'
  | 'NO_REFERENCE_DETECTED';

export interface ExtractedAntecedent {
  readonly entity: string;
  readonly entityType: 'TECHNOLOGY' | 'PROJECT_ARTIFACT' | 'GEOGRAPHIC' | 'CONCEPT' | 'METHOD' | 'GENERAL';
  readonly sourceTurnIndex: number;
  readonly role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly saliencyScore: number;
  readonly positionInTurn: 'SUBJECT' | 'OBJECT' | 'PREDICATE';
}

export interface ReferenceResolutionItem {
  readonly referenceType: ReferenceType;
  readonly rawReferencePhrase: string;
  readonly resolvedEntity?: string;
  readonly confidence: number;
  readonly resolutionStatus: ResolutionStatus;
  readonly sourceTurnIndex?: number;
  readonly clarificationPrompt?: string;
}

export interface ReferenceResolutionResult {
  readonly rawQuery: string;
  readonly resolvedQuery: string;
  readonly detectedLanguage: DetectedLanguage;
  readonly references: readonly ReferenceResolutionItem[];
  readonly status: ResolutionStatus;
  readonly insulatedClarificationPrompt?: string;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// REFERENCE RESOLUTION ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32ReferenceResolutionEngine {
  private static instance: Phase32ReferenceResolutionEngine | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
  }

  public static getInstance(): Phase32ReferenceResolutionEngine {
    if (!Phase32ReferenceResolutionEngine.instance) {
      Phase32ReferenceResolutionEngine.instance = new Phase32ReferenceResolutionEngine();
    }
    return Phase32ReferenceResolutionEngine.instance;
  }

  /**
   * Main resolution method: analyzes query in the context of previous conversation turns.
   */
  public resolveConversationReferences(
    query: string,
    history: readonly ConversationalContextTurn[] = []
  ): ReferenceResolutionResult {
    const t0 = performance.now();
    const qTrimmed = query.trim();
    const language = this.rawDetector.detectLanguage(qTrimmed);

    // Step 1: Detect references in query (pronouns, phrases, or omitted subjects)
    const detectedRefs = this.identifyReferencesInQuery(qTrimmed, language);

    // If no reference found, return as-is
    if (detectedRefs.length === 0) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      return {
        rawQuery: qTrimmed,
        resolvedQuery: qTrimmed,
        detectedLanguage: language,
        references: [],
        status: 'NO_REFERENCE_DETECTED',
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, qTrimmed, 'NO_REFERENCE_DETECTED'),
      };
    }

    // Step 2: Extract candidate antecedents from conversation history
    const candidates = this.extractAntecedentsFromHistory(history, qTrimmed);

    // Step 3: Handle genuinely insufficient context
    if (candidates.length === 0 || history.length === 0) {
      const refPhrase = detectedRefs[0].rawReferencePhrase;
      const clarification = this.generateInsufficientContextPrompt(refPhrase, language);
      const elapsed = Number((performance.now() - t0).toFixed(2));

      const rejectedItems: ReferenceResolutionItem[] = detectedRefs.map(r => ({
        referenceType: r.referenceType,
        rawReferencePhrase: r.rawReferencePhrase,
        confidence: 0.0,
        resolutionStatus: 'REJECTED_INSUFFICIENT_CONTEXT',
        clarificationPrompt: clarification,
      }));

      return {
        rawQuery: qTrimmed,
        resolvedQuery: qTrimmed,
        detectedLanguage: language,
        references: rejectedItems,
        status: 'REJECTED_INSUFFICIENT_CONTEXT',
        insulatedClarificationPrompt: clarification,
        latencyMs: elapsed,
        signature: this.computeSignature(qTrimmed, qTrimmed, 'REJECTED_INSUFFICIENT_CONTEXT'),
      };
    }

    // Step 4: Perform context-weighted resolution
    let currentResolvedQuery = qTrimmed;
    const resolvedItems: ReferenceResolutionItem[] = [];

    for (const ref of detectedRefs) {
      const bestCandidate = this.selectBestCandidate(ref, candidates, qTrimmed);

      if (!bestCandidate || bestCandidate.saliencyScore < 1.0) {
        // Insufficient context for this specific reference
        const clarification = this.generateInsufficientContextPrompt(ref.rawReferencePhrase, language);
        resolvedItems.push({
          referenceType: ref.referenceType,
          rawReferencePhrase: ref.rawReferencePhrase,
          confidence: 0.0,
          resolutionStatus: 'REJECTED_INSUFFICIENT_CONTEXT',
          clarificationPrompt: clarification,
        });
        continue;
      }

      resolvedItems.push({
        referenceType: ref.referenceType,
        rawReferencePhrase: ref.rawReferencePhrase,
        resolvedEntity: bestCandidate.entity,
        confidence: Number(Math.min(0.99, 0.85 + (bestCandidate.saliencyScore * 0.02)).toFixed(2)),
        resolutionStatus: 'RESOLVED',
        sourceTurnIndex: bestCandidate.sourceTurnIndex,
      });

      // Step 5: Construct resolved query string
      currentResolvedQuery = this.substituteReference(
        currentResolvedQuery,
        ref,
        bestCandidate.entity,
        language
      );
    }

    const overallStatus: ResolutionStatus = resolvedItems.every(r => r.resolutionStatus === 'RESOLVED')
      ? 'RESOLVED'
      : 'REJECTED_INSUFFICIENT_CONTEXT';

    const elapsed = Number((performance.now() - t0).toFixed(2));

    return {
      rawQuery: qTrimmed,
      resolvedQuery: currentResolvedQuery,
      detectedLanguage: language,
      references: resolvedItems,
      status: overallStatus,
      insulatedClarificationPrompt: overallStatus === 'REJECTED_INSUFFICIENT_CONTEXT'
        ? resolvedItems.find(r => r.clarificationPrompt)?.clarificationPrompt
        : undefined,
      latencyMs: elapsed,
      signature: this.computeSignature(qTrimmed, currentResolvedQuery, overallStatus),
    };
  }

  // --------------------------------------------------------------------------
  // REFERENCE IDENTIFICATION IN QUERY
  // --------------------------------------------------------------------------

  private identifyReferencesInQuery(
    query: string,
    language: DetectedLanguage
  ): { referenceType: ReferenceType; rawReferencePhrase: string }[] {
    const refs: { referenceType: ReferenceType; rawReferencePhrase: string }[] = [];
    const qLower = query.toLowerCase();

    // 1. Contextual Phrases ("same one", "same endpoint", "wahi wala", "pehla wala", "the second one", "previous approach")
    const contextualPatterns = [
      { regex: /\b(the\s+same\s+one|same\s+one|same\s+thing|same\s+[a-z0-9_\-]+|the\s+same)\b/i, type: 'CONTEXTUAL_PHRASE' as const },
      { regex: /\b(wahi\s+wala|wahi|pehla\s+wala|doosra\s+wala|teesra\s+wala)\b/i, type: 'CONTEXTUAL_PHRASE' as const },
      { regex: /\b(the\s+former|the\s+latter|the\s+first\s+one|the\s+second\s+one|previous\s+approach|last\s+one)\b/i, type: 'CONTEXTUAL_PHRASE' as const },
    ];
    for (const cp of contextualPatterns) {
      const match = query.match(cp.regex);
      if (match) {
        refs.push({ referenceType: cp.type, rawReferencePhrase: match[0] });
        return refs;
      }
    }

    // 2. Possessive Pronouns ("is ka", "us ka", "iska", "uska", "uski", "its", "their")
    const possessivePatterns = [
      { regex: /\b(is\s+ka|us\s+ka)\b/i, type: 'POSSESSIVE_PRONOUN' as const },
      { regex: /\b(iska|uska|iski|uski|iskay|uske|usko|usme|usmein)\b/i, type: 'POSSESSIVE_PRONOUN' as const },
      { regex: /\b(its|their)\b/i, type: 'POSSESSIVE_PRONOUN' as const },
    ];
    for (const pp of possessivePatterns) {
      const match = query.match(pp.regex);
      if (match) {
        refs.push({ referenceType: pp.type, rawReferencePhrase: match[0] });
        return refs;
      }
    }

    // 3. Pronouns / Deictic pointers ("ye", "yeh", "woh", "it", "this", "that")
    const pronounPatterns = [
      { regex: /\b(ye|yeh|woh)\b/i, type: 'PRONOUN' as const },
      { regex: /\b(it|this|that|these|those)\b/i, type: 'PRONOUN' as const },
    ];
    for (const pr of pronounPatterns) {
      const match = query.match(pr.regex);
      if (match) {
        refs.push({ referenceType: pr.type, rawReferencePhrase: match[0] });
        return refs;
      }
    }

    // 4. Code-Mixed Pointers ("is service ka", "woh function", "same endpoint", "is component mein")
    const codeMixedMatch = query.match(/\b(?:is|iss|uss|woh)\s+([a-zA-Z0-9_\-]+)\s*(?:ka|ki|ke|ko|mein|se)?\b/i);
    if (codeMixedMatch && !/^(kya|kyun|kaise|konsa|kahan)\b/i.test(codeMixedMatch[1])) {
      refs.push({ referenceType: 'PRONOUN', rawReferencePhrase: codeMixedMatch[0] });
      return refs;
    }

    // 5. Omitted Subject / Elliptical Sentences
    // e.g., "Scalable hai?", "Latency kitni hai?", "Can optimize for production?", "Production ready hai?"
    // User omitted the nominal entity because it is implied by context.
    const isEllipticalUrdu = /^(?:scalable|production\s+ready|fast|secure|acid\s+compliant)\s+(?:hai|hoga|hogi)\b/i.test(qLower)
      || /^(?:latency|throughput|cost|architecture|pricing|setup)\s+(?:kya\s+hai|kitni\s+hai|kaisa\s+hai)\b/i.test(qLower);

    const isEllipticalEnglish = /^(?:can\s+(?:you\s+)?)?(?:optimize|scale|test|deploy|dockerize|refactor)\s+(?:for\s+production|now)?\??$/i.test(qLower)
      || /^(?:is\s+it\s+)?(?:production\s+ready|thread-safe|acid\s+compliant|fast|scalable)\??$/i.test(qLower);

    if (isEllipticalUrdu || isEllipticalEnglish) {
      refs.push({ referenceType: 'OMITTED_SUBJECT', rawReferencePhrase: '[OMITTED_SUBJECT]' });
      return refs;
    }

    return refs;
  }

  // --------------------------------------------------------------------------
  // ANTECEDENT EXTRACTION & SALIENCY SCORING
  // --------------------------------------------------------------------------

  private extractAntecedentsFromHistory(
    history: readonly ConversationalContextTurn[],
    currentQuery: string
  ): ExtractedAntecedent[] {
    const antecedents: ExtractedAntecedent[] = [];
    if (!history || history.length === 0) return antecedents;

    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      const isUser = turn.role === 'USER';
      const recencyWeight = (i + 1) * 2.0; // Higher recency weight for newer turns

      const entities = this.extractAllEntitiesWithTypes(turn.content);

      for (const item of entities) {
        let score = recencyWeight;
        if (isUser) score += 2.0; // User focus is salient

        // Check positional priority
        if (item.position === 'SUBJECT') score += 3.0;

        // Contextual affinity matching with current query tokens
        const qLower = currentQuery.toLowerCase();
        const eLower = item.entity.toLowerCase();

        // Technical domain affinity
        if (/\b(docker|container|image|dockerfile|build)\b/i.test(qLower) && /docker/i.test(eLower)) score += 6.0;
        if (/\b(clustering|replica|sql|query|acid|vacuum|database)\b/i.test(qLower) && /postgres|sqlite|mysql|mongodb/i.test(eLower)) score += 6.0;
        if (/\b(cache|ttl|key|store|in-memory)\b/i.test(qLower) && /redis/i.test(eLower)) score += 6.0;
        if (/\b(shehr|city|darul\s+hukoomat|capital)\b/i.test(qLower) && /paris|islamabad|berlin|tokyo|london/i.test(eLower)) score += 6.0;
        if (/\b(quantum|qubit|superposition|physics)\b/i.test(qLower) && /quantum/i.test(eLower)) score += 6.0;
        if (/\b(component|state|props|hook|render)\b/i.test(qLower) && /react/i.test(eLower)) score += 6.0;
        if (/\b(microservices|concurrent|enterprise|scale)\b/i.test(qLower) && /postgres/i.test(eLower)) score += 6.0;

        antecedents.push({
          entity: item.entity,
          entityType: item.type,
          sourceTurnIndex: i,
          role: turn.role,
          saliencyScore: score,
          positionInTurn: item.position,
        });
      }
    }

    // Sort descending by saliency score
    antecedents.sort((a, b) => b.saliencyScore - a.saliencyScore);
    return antecedents;
  }

  private extractAllEntitiesWithTypes(text: string): { entity: string; type: ExtractedAntecedent['entityType']; position: 'SUBJECT' | 'OBJECT' | 'PREDICATE' }[] {
    const list: { entity: string; type: ExtractedAntecedent['entityType']; position: 'SUBJECT' | 'OBJECT' | 'PREDICATE' }[] = [];
    const seen = new Set<string>();

    const addEntity = (entity: string, type: ExtractedAntecedent['entityType'], position: 'SUBJECT' | 'OBJECT' | 'PREDICATE') => {
      const key = entity.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ entity, type, position });
      }
    };

    // 1. Technologies & Frameworks
    const techRegex = /\b(React(?:\.js)?|Angular|Vue(?:\.js)?|Node(?:\.js)?|FastAPI|Django|Docker|Kubernetes|Redis|PostgreSQL|SQLite|MySQL|MongoDB|Python|TypeScript|JavaScript|C\+\+)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = techRegex.exec(text)) !== null) {
      const pos = m.index < 30 ? 'SUBJECT' : 'OBJECT';
      addEntity(m[1], 'TECHNOLOGY', pos);
    }

    // 2. Geographic / Capital Entities
    const geoRegex = /\b(France|Paris|Pakistan|Islamabad|Germany|Berlin|Japan|Tokyo|United\s+Kingdom|London|USA|Washington)\b/gi;
    while ((m = geoRegex.exec(text)) !== null) {
      const pos = m.index < 30 ? 'SUBJECT' : 'OBJECT';
      addEntity(m[1], 'GEOGRAPHIC', pos);
    }

    // 3. Concepts
    const conceptRegex = /\b(Quantum\s+Computing|Harmonic\s+Mathematics|369\s+Harmonic|Black\s+Hole|Photosynthesis)\b/gi;
    while ((m = conceptRegex.exec(text)) !== null) {
      addEntity(m[1], 'CONCEPT', 'SUBJECT');
    }

    // 4. Project Artifacts
    const artifactRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    while ((m = artifactRegex.exec(text)) !== null) {
      if (!seen.has(m[1].toLowerCase())) {
        addEntity(m[1], 'PROJECT_ARTIFACT', 'OBJECT');
      }
    }

    return list;
  }

  // --------------------------------------------------------------------------
  // CANDIDATE SELECTION & PROSTITUTION
  // --------------------------------------------------------------------------

  private selectBestCandidate(
    ref: { referenceType: ReferenceType; rawReferencePhrase: string },
    candidates: ExtractedAntecedent[],
    query: string
  ): ExtractedAntecedent | undefined {
    if (candidates.length === 0) return undefined;

    // Collect distinct entities preserving chronological appearance order in dialogue (from earliest turn to latest)
    const chronologicalUnique: ExtractedAntecedent[] = [];
    const seenChronological = new Set<string>();

    const sortedChronological = [...candidates].sort((a, b) => a.sourceTurnIndex - b.sourceTurnIndex);
    for (const c of sortedChronological) {
      const key = c.entity.toLowerCase();
      if (!seenChronological.has(key)) {
        seenChronological.add(key);
        chronologicalUnique.push(c);
      }
    }

    // Handle ordinal contextual phrases: "pehla wala" / "the first one", "doosra wala" / "the second one"
    const pLower = ref.rawReferencePhrase.toLowerCase();
    if (/pehla|first|former/i.test(pLower)) {
      return chronologicalUnique[0];
    }
    if (/doosra|second|latter/i.test(pLower)) {
      if (chronologicalUnique.length > 1) {
        return chronologicalUnique[1];
      }
    }

    // Default to candidate with highest saliency score
    return candidates[0];
  }

  private substituteReference(
    query: string,
    ref: { referenceType: ReferenceType; rawReferencePhrase: string },
    entity: string,
    language: DetectedLanguage
  ): string {
    const raw = ref.rawReferencePhrase;

    // 1. Omitted Subject
    if (ref.referenceType === 'OMITTED_SUBJECT') {
      if (language === 'ROMAN_URDU') {
        return `Kya ${entity} ${query}`;
      } else {
        return `${query.replace(/\?$/, '')} for ${entity}?`;
      }
    }

    // 2. Possessive pronouns ("is ka", "us ka", "iska", "uska", "its")
    if (ref.referenceType === 'POSSESSIVE_PRONOUN') {
      if (/\b(is\s+ka|us\s+ka|iska|uska)\b/i.test(raw)) {
        return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), `${entity} ka`);
      } else if (/\b(iski|uski)\b/i.test(raw)) {
        return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), `${entity} ki`);
      } else if (/\b(iskay|uske)\b/i.test(raw)) {
        return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), `${entity} ke`);
      } else if (/\b(its)\b/i.test(raw)) {
        return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), `${entity}'s`);
      }
    }

    // 3. Pronoun / Contextual Phrase ("ye", "woh", "same one", "it", "this")
    if (ref.referenceType === 'PRONOUN' || ref.referenceType === 'CONTEXTUAL_PHRASE') {
      if (/\b(same\s+one|wahi\s+wala|wahi)\b/i.test(raw)) {
        return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), entity);
      }
      return query.replace(new RegExp(`\\b${this.escapeRegex(raw)}\\b`, 'gi'), entity);
    }

    return query;
  }

  // --------------------------------------------------------------------------
  // USER INSULATION & CLARIFICATION PROMPTS
  // --------------------------------------------------------------------------

  private generateInsufficientContextPrompt(rawPhrase: string, language: DetectedLanguage): string {
    if (language === 'ROMAN_URDU') {
      return 'Baraye meharbani wazahat farmayein ke aap kis cheez ya topic ki baat kar rahe hain? Pichle context mein koi mutalliqah reference mojood nahi hai.';
    }
    return 'Could you please clarify which subject or entity you are referring to? There is no prior context available for this reference.';
  }

  private computeSignature(raw: string, resolved: string, status: ResolutionStatus): string {
    return crypto
      .createHash('sha256')
      .update(`${raw}|${resolved}|${status}`)
      .digest('hex');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
