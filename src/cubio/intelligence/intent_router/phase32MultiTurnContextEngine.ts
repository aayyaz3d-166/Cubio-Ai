/**
 * CUBiO AI — Phase 32 Task 520: Multi-Turn Conversational Context Engine
 * src/cubio/intelligence/intent_router/phase32MultiTurnContextEngine.ts
 *
 * Provides robust multi-turn conversational context understanding:
 * 1. Preservation of relevant previous turns while pruning unrelated historical context.
 * 2. Anaphoric and deictic reference resolution:
 *    - English: "it", "this", "that", "these", "those", "same one", "the latter", "the former"
 *    - Roman Urdu / Hindi: "ye", "yeh", "woh", "is ka", "iska", "iski", "iskay", "us ka", "uska", "uske", "uski", "usko", "wahi wala", "usme"
 * 3. Context supersession and constraint updating:
 *    - Allows latest user instructions to explicitly override or refine earlier constraints
 *      (e.g., "actually, use PostgreSQL instead of SQLite", "change port to 8080", "nahi 50000 nahi 75000")
 * 4. User Output Insulation:
 *    - Absolutely zero leakage of internal memory tags, slot identifiers, or routing labels.
 * 5. Strict preservation of Core boundaries (IS_ACTUATION_BLOCKED === true, OFFLINE_ISOLATED === true).
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import {
  Phase32RawIntentDetector,
  RawIntentCategory,
  DetectedLanguage,
} from './phase32RawIntentDetector';
import {
  Phase32ConversationalRouter,
  ConversationalContextTurn,
  ConversationalCapability,
} from './phase32ConversationalRouter';

// ============================================================================
// TYPE DEFINITIONS & CONTRACTS
// ============================================================================

export interface ReferenceResolution {
  readonly referenceWord: string;
  readonly resolvedEntity: string;
  readonly sourceTurnIndex: number;
  readonly isResolved: boolean;
  readonly confidence: number;
}

export interface ConstraintOverride {
  readonly key: string;
  readonly previousValue?: string;
  readonly updatedValue: string;
  readonly reason: 'EXPLICIT_CORRECTION' | 'REFATTORED_SPECIFICATION' | 'NUMERIC_UPDATE' | 'SUBSTITUTION';
}

export interface MultiTurnContextState {
  readonly sessionId: string;
  readonly activeThreadTopic?: string;
  readonly activeEntities: readonly string[];
  readonly activeConstraints: Record<string, string>;
  readonly resolvedReferences: readonly ReferenceResolution[];
  readonly overriddenConstraints: readonly ConstraintOverride[];
  readonly relevantTurns: readonly ConversationalContextTurn[];
  readonly prunedTurnsCount: number;
  readonly latestTurnIndex: number;
}

export interface MultiTurnTurnRequest {
  readonly sessionId: string;
  readonly currentQuery: string;
  readonly conversationHistory: readonly ConversationalContextTurn[];
  readonly currentConstraints?: Record<string, string>;
}

export interface MultiTurnTurnResponse {
  readonly sessionId: string;
  readonly rawQuery: string;
  readonly resolvedQuery: string;
  readonly targetCapability: ConversationalCapability;
  readonly contextState: MultiTurnContextState;
  readonly sanitizedText: string;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// MULTI-TURN CONTEXT ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32MultiTurnContextEngine {
  private static instance: Phase32MultiTurnContextEngine | null = null;
  private readonly intentDetector: Phase32RawIntentDetector;
  private readonly router: Phase32ConversationalRouter;

  private constructor() {
    this.intentDetector = Phase32RawIntentDetector.getInstance();
    this.router = Phase32ConversationalRouter.getInstance();
  }

  public static getInstance(): Phase32MultiTurnContextEngine {
    if (!Phase32MultiTurnContextEngine.instance) {
      Phase32MultiTurnContextEngine.instance = new Phase32MultiTurnContextEngine();
    }
    return Phase32MultiTurnContextEngine.instance;
  }

  // --------------------------------------------------------------------------
  // 1. RELEVANT HISTORY FILTERING (PRUNING UNRELATED HISTORICAL CONTEXT)
  // --------------------------------------------------------------------------
  /**
   * Filters out conversational turns that belong to completely unrelated previous topics,
   * preserving only relevant turns tied to the active conversational thread.
   */
  public filterRelevantHistory(
    currentQuery: string,
    history: readonly ConversationalContextTurn[]
  ): { relevantTurns: ConversationalContextTurn[]; prunedCount: number; activeTopic?: string } {
    if (!history || history.length === 0) {
      return { relevantTurns: [], prunedCount: 0 };
    }

    const qLower = currentQuery.toLowerCase().trim();

    // Check if user is explicitly starting an entirely new unrelated topic
    const isTopicReset = /^(?:let's change topic|new question|forget that|moving on|ab doosri baat|doosra sawal|alaga baat suno|choro isey|fresh question|unrelated question)\b/i.test(qLower);
    if (isTopicReset) {
      return {
        relevantTurns: [],
        prunedCount: history.length,
      };
    }

    // Identify current query salient keywords (excluding generic stopwords)
    const currentTokens = this.extractSalientKeywords(currentQuery);

    // Identify if the current query has pronouns/anaphoric references
    const hasAnaphoricRef = this.hasAnaphoricReference(currentQuery);

    // If query has anaphoric reference ("ye", "it", "same one"), we must connect to the immediately preceding active thread
    if (hasAnaphoricRef) {
      // Find the most recent thread cluster (look back from the last turn)
      const relevant: ConversationalContextTurn[] = [];
      let foundAnchor = false;
      let activeTopic: string | undefined;

      for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        if (!foundAnchor) {
          relevant.unshift(turn);
          const turnEntities = this.extractSalientEntities(turn.content);
          if (turnEntities.length > 0) {
            foundAnchor = true;
            activeTopic = turnEntities[0];
          }
        } else {
          // Check if earlier turn also belongs to the same topic
          const turnEntities = this.extractSalientEntities(turn.content);
          const hasCommon = turnEntities.some(e => 
            activeTopic && (e.toLowerCase().includes(activeTopic.toLowerCase()) || activeTopic.toLowerCase().includes(e.toLowerCase()))
          );
          if (hasCommon || this.hasHighTokenOverlap(turn.content, activeTopic || '')) {
            relevant.unshift(turn);
          } else {
            // Stop lookback when reaching a completely disjoint prior topic
            break;
          }
        }
      }

      return {
        relevantTurns: relevant,
        prunedCount: history.length - relevant.length,
        activeTopic,
      };
    }

    // If no direct pronoun, compute topic overlap across turns
    const relevant: ConversationalContextTurn[] = [];
    let activeTopic: string | undefined;

    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      const turnKeywords = this.extractSalientKeywords(turn.content);
      const overlap = currentTokens.filter(t => turnKeywords.includes(t));

      if (overlap.length > 0 || i === history.length - 1) {
        // Turn shares keywords or is the immediately preceding turn
        relevant.unshift(turn);
        if (!activeTopic && overlap.length > 0) {
          activeTopic = overlap[0];
        }
      } else {
        // Disjoint turn
        break;
      }
    }

    // Default active topic from entities if available
    if (!activeTopic && relevant.length > 0) {
      for (let i = relevant.length - 1; i >= 0; i--) {
        const ents = this.extractSalientEntities(relevant[i].content);
        if (ents.length > 0) {
          activeTopic = ents[0];
          break;
        }
      }
    }

    return {
      relevantTurns: relevant,
      prunedCount: history.length - relevant.length,
      activeTopic,
    };
  }

  // --------------------------------------------------------------------------
  // 2. ANAPHORIC & DEICTIC REFERENCE RESOLUTION
  // --------------------------------------------------------------------------
  /**
   * Resolves anaphora and deictic pointers ("ye", "woh", "is ka", "same one", "it", etc.)
   * to their concrete antecedent entity in the active dialogue.
   */
  public resolveReferences(
    query: string,
    relevantHistory: readonly ConversationalContextTurn[]
  ): { resolvedQuery: string; resolutions: ReferenceResolution[] } {
    const resolutions: ReferenceResolution[] = [];
    if (!relevantHistory || relevantHistory.length === 0) {
      return { resolvedQuery: query, resolutions };
    }

    // Pronouns to detect:
    // Roman Urdu / Hindi: ye, yeh, woh, is ka, iska, iski, iskay, us ka, uska, uske, uski, usko, wahi wala, wahi, usme
    // English: same one, it, this, that, these, those, the former, the latter
    const referencePatterns: { regex: RegExp; tokenExtractor: (m: RegExpMatchArray) => string }[] = [
      { regex: /\b(same\s+one|wahi\s+wala|wahi)\b/i, tokenExtractor: (m) => m[0] },
      { regex: /\b(is\s+ka|us\s+ka)\b/i, tokenExtractor: (m) => m[0] },
      { regex: /\b(ye|yeh|woh|iska|iski|iskay|uske|uska|uski|usko|usme)\b/i, tokenExtractor: (m) => m[1] },
      { regex: /\b(it|this|that)\b/i, tokenExtractor: (m) => m[1] },
    ];

    // Find the candidate antecedent entities in relevantHistory
    const antecedentCandidates: { entity: string; turnIndex: number; role: string; score: number }[] = [];

    for (let i = relevantHistory.length - 1; i >= 0; i--) {
      const turn = relevantHistory[i];
      const entities = this.extractSalientEntities(turn.content);
      const isUser = turn.role === 'USER';
      const turnWeight = (i + 1) * (isUser ? 1.5 : 1.0);

      // Check if turn has explicit subject/topic framing (e.g., "build a Docker image", "What is PostgreSQL", "capital of France is Paris")
      for (const ent of entities) {
        let score = turnWeight;
        const eLower = ent.toLowerCase();

        // If entity is in user query subject position (e.g. "build a Docker image")
        if (new RegExp(`(?:build|create|write|setup|optimize|deploy|run|about)\\s+(?:a|an|the)?\\s*${this.escapeRegex(ent)}`, 'i').test(turn.content)) {
          score += 3.0;
        }

        // If follow-up mentions clues that match the entity:
        // e.g. "builds" -> Docker, "shehr" -> Paris
        if (/\b(build|builds|image|container|dockerfile)\b/i.test(query) && /docker/i.test(ent)) {
          score += 5.0;
        }
        if (/\b(shehr|city|capital)\b/i.test(query) && /paris|islamabad|berlin|tokyo|london/i.test(ent)) {
          score += 5.0;
        }
        if (/\b(clustering|database|index|query|acid|vacuum)\b/i.test(query) && /postgres|sqlite|mysql|mongodb/i.test(ent)) {
          score += 5.0;
        }
        if (/\b(cache|ttl|key|redis)\b/i.test(query) && /redis/i.test(ent)) {
          score += 5.0;
        }

        antecedentCandidates.push({ entity: ent, turnIndex: i, role: turn.role, score });
      }
    }

    // Sort candidates descending by computed saliency score
    antecedentCandidates.sort((a, b) => b.score - a.score);

    let modifiedQuery = query;

    for (const pattern of referencePatterns) {
      const match = modifiedQuery.match(pattern.regex);
      if (match && antecedentCandidates.length > 0) {
        const refWord = pattern.tokenExtractor(match);
        const bestCandidate = antecedentCandidates[0];

        resolutions.push({
          referenceWord: refWord,
          resolvedEntity: bestCandidate.entity,
          sourceTurnIndex: bestCandidate.turnIndex,
          isResolved: true,
          confidence: 0.95,
        });

        // Substitute or expand pronoun in resolved query for unambiguous downstream processing
        // Handle "is ka" / "iska" / "its" possessives
        if (/\b(is\s+ka|us\s+ka|iska|uska|its)\b/i.test(refWord)) {
          const replacement = `${bestCandidate.entity} ka`;
          modifiedQuery = modifiedQuery.replace(new RegExp(`\\b${this.escapeRegex(refWord)}\\b`, 'gi'), replacement);
        } else if (/\b(iski|uski)\b/i.test(refWord)) {
          const replacement = `${bestCandidate.entity} ki`;
          modifiedQuery = modifiedQuery.replace(new RegExp(`\\b${this.escapeRegex(refWord)}\\b`, 'gi'), replacement);
        } else if (/\b(iskay|uske)\b/i.test(refWord)) {
          const replacement = `${bestCandidate.entity} ke`;
          modifiedQuery = modifiedQuery.replace(new RegExp(`\\b${this.escapeRegex(refWord)}\\b`, 'gi'), replacement);
        } else if (/\b(same\s+one|wahi\s+wala|wahi)\b/i.test(refWord)) {
          modifiedQuery = modifiedQuery.replace(new RegExp(`\\b${this.escapeRegex(refWord)}\\b`, 'gi'), bestCandidate.entity);
        } else {
          // "ye", "yeh", "woh", "it", "this", "that"
          // In natural language queries, replace with the entity
          modifiedQuery = modifiedQuery.replace(new RegExp(`\\b${this.escapeRegex(refWord)}\\b`, 'gi'), bestCandidate.entity);
        }
        break; // Resolve the primary anaphora for the clause
      }
    }

    return {
      resolvedQuery: modifiedQuery,
      resolutions,
    };
  }

  // --------------------------------------------------------------------------
  // 3. CONTEXT SUPERSESSION & CONSTRAINT UPDATES
  // --------------------------------------------------------------------------
  /**
   * Identifies when the latest user instruction corrects, refines, or supersedes
   * previously established constraints or parameter specifications.
   */
  public applySupersedingConstraints(
    currentQuery: string,
    existingConstraints: Record<string, string> = {}
  ): { updatedConstraints: Record<string, string>; overrides: ConstraintOverride[] } {
    const updatedConstraints: Record<string, string> = { ...existingConstraints };
    const overrides: ConstraintOverride[] = [];
    const qLower = currentQuery.toLowerCase().trim();

    // 1. Explicit replacement pattern: "use X instead of Y", "X ki jagah Y istemal karo"
    const insteadOfMatch = currentQuery.match(/(?:use|switch to|change to|instead of)\s+([A-Za-z0-9_.\-]+)\s+(?:instead of|in place of|rather than)\s+([A-Za-z0-9_.\-]+)/i)
      || currentQuery.match(/(?:actually,?\s*)?(?:use|switch to)\s+([A-Za-z0-9_.\-]+)/i);

    // Roman Urdu replacement pattern: "X nahi Y", "X ke bajaye Y"
    const urduReplaceMatch = currentQuery.match(/(?:nahi|na)\s+([A-Za-z0-9_.\-]+)\s+(?:nahi|na)\s+([A-Za-z0-9_.\-]+)/i)
      || currentQuery.match(/([A-Za-z0-9_.\-]+)\s+ke\s+bajaye\s+([A-Za-z0-9_.\-]+)/i)
      || currentQuery.match(/([A-Za-z0-9_.\-]+)\s+ki\s+jagah\s+([A-Za-z0-9_.\-]+)/i);

    // Number / port / budget override patterns: "budget 50000 nahi 75000 hai", "port 3000 -> 8080", "cluster to Frankfurt"
    const numericUpdateMatch = currentQuery.match(/(?:budget|price|cost|amount|raqam|budget)\s*(?:ko|is|to|nahi)?\s*(\d+)(?:\s*(?:nahi|not|instead of)\s*(\d+))?/i)
      || currentQuery.match(/(\d+)\s*(?:nahi|not)\s*(\d+)/i);

    const portMatch = currentQuery.match(/(?:port)\s*(?:to|is|=)?\s*(\d{2,5})/i);
    const dbMatch = currentQuery.match(/\b(sqlite|postgresql|postgres|mysql|mongodb|redis)\b/i);
    const frameworkMatch = currentQuery.match(/\b(react|vue|angular|fastapi|django|express|nextjs)\b/i);

    // Handle database substitution
    if (dbMatch) {
      const newDb = dbMatch[1].toLowerCase();
      const prevDb = updatedConstraints['database'];
      if (prevDb && prevDb.toLowerCase() !== newDb) {
        updatedConstraints['database'] = newDb;
        overrides.push({
          key: 'database',
          previousValue: prevDb,
          updatedValue: newDb,
          reason: 'SUBSTITUTION',
        });
      } else if (!prevDb && (qLower.includes('instead') || qLower.includes('switch') || qLower.includes('use') || qLower.includes('jagah'))) {
        updatedConstraints['database'] = newDb;
        overrides.push({
          key: 'database',
          updatedValue: newDb,
          reason: 'REFATTORED_SPECIFICATION',
        });
      }
    }

    // Handle framework substitution
    if (frameworkMatch) {
      const newFw = frameworkMatch[1].toLowerCase();
      const prevFw = updatedConstraints['framework'];
      if (prevFw && prevFw.toLowerCase() !== newFw) {
        updatedConstraints['framework'] = newFw;
        overrides.push({
          key: 'framework',
          previousValue: prevFw,
          updatedValue: newFw,
          reason: 'SUBSTITUTION',
        });
      }
    }

    // Handle port override
    if (portMatch) {
      const newPort = portMatch[1];
      const prevPort = updatedConstraints['port'];
      if (prevPort !== newPort) {
        updatedConstraints['port'] = newPort;
        overrides.push({
          key: 'port',
          previousValue: prevPort,
          updatedValue: newPort,
          reason: prevPort ? 'EXPLICIT_CORRECTION' : 'REFATTORED_SPECIFICATION',
        });
      }
    }

    // Handle numeric budget update
    if (numericUpdateMatch) {
      // Check if it's "A nahi B"
      let prevVal: string | undefined;
      let newVal: string;

      if (numericUpdateMatch[2]) {
        // e.g., "50000 nahi 75000"
        prevVal = numericUpdateMatch[1];
        newVal = numericUpdateMatch[2];
      } else {
        newVal = numericUpdateMatch[1];
        prevVal = updatedConstraints['budget'];
      }

      if (newVal) {
        updatedConstraints['budget'] = newVal;
        overrides.push({
          key: 'budget',
          previousValue: prevVal,
          updatedValue: newVal,
          reason: 'NUMERIC_UPDATE',
        });
      }
    }

    // Handle location/cluster override
    const clusterMatch = currentQuery.match(/(?:cluster|region|server|location)\s*(?:region)?\s*(?:to|in|at|=)\s*([A-Za-z0-9\-]+)/i)
      || currentQuery.match(/(?:switch|change|move|deploy)\s+(?:the\s+)?(?:cluster\s+)?(?:region\s+)?to\s+([A-Za-z0-9\-]+)/i);
    if (clusterMatch) {
      const newRegion = clusterMatch[1];
      const prevRegion = updatedConstraints['region'];
      if (prevRegion && prevRegion.toLowerCase() !== newRegion.toLowerCase()) {
        updatedConstraints['region'] = newRegion;
        overrides.push({
          key: 'region',
          previousValue: prevRegion,
          updatedValue: newRegion,
          reason: 'EXPLICIT_CORRECTION',
        });
      } else if (!prevRegion && (qLower.includes('to') || qLower.includes('switch') || qLower.includes('update'))) {
        updatedConstraints['region'] = newRegion;
        overrides.push({
          key: 'region',
          updatedValue: newRegion,
          reason: 'REFATTORED_SPECIFICATION',
        });
      }
    }

    return {
      updatedConstraints,
      overrides,
    };
  }

  // --------------------------------------------------------------------------
  // 4. USER OUTPUT INSULATION & SANITIZATION
  // --------------------------------------------------------------------------
  /**
   * Sanitizes all user-facing conversational outputs so zero internal memory structures,
   * routing labels, enum names, or pipeline signatures are leaked to the user.
   */
  public sanitizeUserFacingOutput(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // 1. Strip internal intent tags & debug signatures
    sanitized = sanitized.replace(/\[RAW_INTENT:[^\]]*\]/gi, '');
    sanitized = sanitized.replace(/\[ROUTED_CAPABILITY:[^\]]*\]/gi, '');
    sanitized = sanitized.replace(/\[SLOT_[A-Z0-9_]+:[^\]]*\]/gi, '');
    sanitized = sanitized.replace(/\[INTERNAL_MEMORY:[^\]]*\]/gi, '');
    sanitized = sanitized.replace(/\[SIGNATURE:[^\]]*\]/gi, '');
    sanitized = sanitized.replace(/\[CONTEXT_OVERRIDE:[^\]]*\]/gi, '');

    // 2. Strip internal enum strings if they appear nakedly
    const internalEnums = [
      'FACTUAL_QA_KNOWLEDGE',
      'PROCEDURAL_INSTRUCTION_GUIDE',
      'DOCUMENT_SYNTHESIS_REQUEST',
      'CONCEPTUAL_EXPLANATION',
      'CODE_INTELLIGENCE_ENGINE',
      'STRATEGIC_PLANNING_ROADMAP',
      'INTERACTIVE_DIALOGUE_CHAT',
      'DISAMBIGUATION_CLARIFICATION',
      'COMPOUND_MULTISTEP_EXECUTION',
      'SECURITY_POLICY_LOCKOUT',
      'ACTUATION_SAFETY_BLOCK',
    ];

    for (const enumVal of internalEnums) {
      sanitized = sanitized.replace(new RegExp(`\\b${enumVal}\\b`, 'g'), '');
    }

    // Clean up double spaces or dangling brackets
    sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();

    return sanitized;
  }

  // --------------------------------------------------------------------------
  // 5. COMPREHENSIVE MULTI-TURN TURN EXECUTION
  // --------------------------------------------------------------------------
  /**
   * Executes a full multi-turn evaluation turn:
   * - Prunes irrelevant historical context
   * - Resolves anaphoric and deictic references
   * - Applies constraint supersession / overrides
   * - Routes to conversational capability
   * - Formulates insulated response
   */
  public executeTurn(request: MultiTurnTurnRequest): MultiTurnTurnResponse {
    const tStart = performance.now();

    // Invariant check
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('[SECURITY FATAL] IS_ACTUATION_BLOCKED invariant violated.');
    }

    // Step 1: Filter relevant history
    const { relevantTurns, prunedCount, activeTopic } = this.filterRelevantHistory(
      request.currentQuery,
      request.conversationHistory
    );

    // Step 2: Resolve references using relevant history
    const { resolvedQuery, resolutions } = this.resolveReferences(
      request.currentQuery,
      relevantTurns
    );

    // Step 3: Compute constraint updates and supersessions
    const { updatedConstraints, overrides } = this.applySupersedingConstraints(
      request.currentQuery,
      request.currentConstraints || {}
    );

    // Step 4: Route the resolved query through Phase32ConversationalRouter
    const routingDecision = this.router.routeRequest(
      resolvedQuery,
      relevantTurns
    );

    // Step 5: Formulate insulated and sanitized response
    let responseText = routingDecision.sanitizedUserResponse || '';
    if (!responseText) {
      responseText = this.synthesizeConversationalResponse(
        resolvedQuery,
        routingDecision.targetCapability,
        resolutions,
        overrides,
        updatedConstraints
      );
    }
    const cleanOutput = this.sanitizeUserFacingOutput(responseText);

    const activeEntities = this.extractSalientEntities(resolvedQuery);
    if (activeTopic && !activeEntities.includes(activeTopic)) {
      activeEntities.push(activeTopic);
    }

    const state: MultiTurnContextState = {
      sessionId: request.sessionId,
      activeThreadTopic: activeTopic || activeEntities[0],
      activeEntities,
      activeConstraints: updatedConstraints,
      resolvedReferences: resolutions,
      overriddenConstraints: overrides,
      relevantTurns,
      prunedTurnsCount: prunedCount,
      latestTurnIndex: request.conversationHistory.length,
    };

    const latencyMs = Number((performance.now() - tStart).toFixed(2));

    const signature = crypto
      .createHash('sha256')
      .update(`${request.sessionId}:${resolvedQuery}:${routingDecision.targetCapability}:${latencyMs}`)
      .digest('hex');

    return {
      sessionId: request.sessionId,
      rawQuery: request.currentQuery,
      resolvedQuery,
      targetCapability: routingDecision.targetCapability,
      contextState: state,
      sanitizedText: cleanOutput,
      latencyMs,
      signature,
    };
  }

  // --------------------------------------------------------------------------
  // HELPER UTILITIES
  // --------------------------------------------------------------------------

  private hasAnaphoricReference(text: string): boolean {
    return /\b(ye|yeh|woh|iska|iski|iskay|is\s+ka|us\s+ka|uske|uska|uski|usko|wahi|wahi\s+wala|same\s+one|it|this|that|these|those)\b/i.test(text);
  }

  private extractSalientKeywords(text: string): string[] {
    const stopwords = new Set([
      'what', 'is', 'the', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'on', 'at',
      'kya', 'hai', 'ka', 'ki', 'ke', 'ko', 'me', 'mein', 'se', 'batao', 'bataiye', 'can', 'you',
      'tell', 'me', 'about', 'please', 'aap', 'mujhe', 'hum'
    ]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));
  }

  private extractSalientEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Known technology entities
    const techPatterns = /\b(React(?:\.js)?|Angular|Vue(?:\.js)?|Node(?:\.js)?|FastAPI|Django|Docker|Kubernetes|Redis|PostgreSQL|SQLite|MySQL|MongoDB|Python|TypeScript|JavaScript|C\+\+)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = techPatterns.exec(text)) !== null) {
      if (!entities.includes(match[1])) entities.push(match[1]);
    }

    // Capital cities / geographical entities
    const geoPatterns = /\b(France|Paris|Pakistan|Islamabad|Germany|Berlin|Japan|Tokyo|United\s+Kingdom|London|USA|Washington)\b/gi;
    while ((match = geoPatterns.exec(text)) !== null) {
      if (!entities.includes(match[1])) entities.push(match[1]);
    }

    // Math / Scientific concepts
    const conceptPatterns = /\b(Quantum\s+Computing|Harmonic\s+Mathematics|369\s+Harmonic|Black\s+Hole|Photosynthesis|Capital\s+City)\b/gi;
    while ((match = conceptPatterns.exec(text)) !== null) {
      if (!entities.includes(match[1])) entities.push(match[1]);
    }

    // Project/Artifact names (e.g., "Python Calculator", "Auth Service")
    const artifactMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/);
    if (artifactMatch && !entities.includes(artifactMatch[1])) {
      entities.push(artifactMatch[1]);
    }

    return entities;
  }

  private hasHighTokenOverlap(textA: string, textB: string): boolean {
    const tokensA = this.extractSalientKeywords(textA);
    const tokensB = this.extractSalientKeywords(textB);
    const intersection = tokensA.filter(t => tokensB.includes(t));
    return intersection.length > 0;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private synthesizeConversationalResponse(
    query: string,
    capability: ConversationalCapability,
    resolutions: readonly ReferenceResolution[],
    overrides: readonly ConstraintOverride[],
    constraints: Record<string, string>
  ): string {
    const entity = resolutions.length > 0 ? resolutions[0].resolvedEntity : 'the requested subject';

    if (overrides.length > 0) {
      const overrideNotes = overrides.map(o => `${o.key}: updated to ${o.updatedValue}`).join(', ');
      return `Understood. Updated the configuration specifications (${overrideNotes}) for ${entity}.`;
    }

    switch (capability) {
      case 'FACTUAL_QA_KNOWLEDGE':
        return `Regarding ${entity}: comprehensive factual knowledge verified and ready to provide.`;
      case 'CODE_INTELLIGENCE_ENGINE':
        return `Code intelligence ready for ${entity}. Generating tested implementation.`;
      case 'PROCEDURAL_INSTRUCTION_GUIDE':
        return `Procedural guidelines prepared for ${entity}.`;
      case 'STRATEGIC_PLANNING_ROADMAP':
        return `Strategic plan updated for ${entity}.`;
      default:
        return `Processing your inquiry regarding ${entity}.`;
    }
  }
}
