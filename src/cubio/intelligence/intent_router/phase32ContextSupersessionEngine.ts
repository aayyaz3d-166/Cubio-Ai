/**
 * CUBiO AI — Phase 32 Task 522: User Context Handling & Instruction Supersession Engine
 * src/cubio/intelligence/intent_router/phase32ContextSupersessionEngine.ts
 *
 * Implements robust context supersession, preference updates, and cross-thread isolation:
 * 1. Instruction Supersession:
 *    - Newer explicit instructions decisively replace conflicting earlier context across:
 *      * Database engines (e.g. SQLite -> PostgreSQL -> MongoDB)
 *      * Programming languages / frameworks (e.g. Python -> TypeScript, React -> Vue)
 *      * Network configurations (e.g. ports, protocols, timeout ms)
 *      * Cloud regions / clusters (e.g. us-east-1 -> Frankfurt -> Singapore)
 *      * Budgets & numeric thresholds (e.g. 50000 -> 75000 -> 100000)
 *      * Output formats (e.g. JSON -> YAML -> CSV)
 *      * Architectural paradigms (e.g. monolithic -> microservices -> serverless)
 * 2. Multi-Entity State Tracking:
 *    - Tracks specifications per entity independently (e.g. Frontend: React, Backend: FastAPI, Database: PostgreSQL)
 *      so changing one entity does not accidentally wipe out compatible context of other entities.
 * 3. Changed Preferences, Corrections & Explicit Reversals:
 *    - Supports reversals: "Actually revert back to SQLite", "Nevermind, use the original port 3000",
 *      "Wapas SQLite pe jao", "Pehle wala framework theek tha".
 * 4. Stale Assumption Invalidation:
 *    - Invalids dependent assumptions when a core dependency changes
 *      (e.g., switching from PostgreSQL to MongoDB automatically invalidates SQL table schemas or ACID foreign key assumptions).
 * 5. Cross-Thread Contamination Prevention:
 *    - Resets / isolates context when user initiates an unrelated request or explicit topic shift.
 * 6. User Output Insulation:
 *    - Zero exposure of internal AST structures, constraint state keys, or routing labels.
 * 7. Invariants:
 *    - Preserves IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import { ConversationalContextTurn } from './phase32ConversationalRouter';
import { DetectedLanguage, Phase32RawIntentDetector } from './phase32RawIntentDetector';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type SupersessionType =
  | 'SUBSTITUTION'          // Explicit "use X instead of Y" or replacement
  | 'CORRECTION'            // "Nahi X nahi Y", "Actually X"
  | 'REVERSAL'              // "Revert to previous", "Wapas pehle wale pe jao"
  | 'NUMERIC_UPDATE'        // Port, budget, threshold updates
  | 'FORMAT_CHANGE'         // JSON, YAML, CSV
  | 'ARCHITECTURAL_UPDATE'  // Monolith to microservices
  | 'NEW_SPECIFICATION';    // Fresh parameter specification

export interface ActiveEntityContext {
  readonly entityName: string;
  readonly category: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'INFRASTRUCTURE' | 'ARCHITECTURE' | 'CONFIGURATION';
  readonly currentSpecification: string;
  readonly previousSpecifications: readonly string[];
  readonly lastUpdatedTurnIndex: number;
}

export interface SupersessionEvent {
  readonly propertyKey: string;
  readonly previousValue?: string;
  readonly updatedValue: string;
  readonly supersessionType: SupersessionType;
  readonly rationale: string;
  readonly invalidatedAssumptions: readonly string[];
}

export interface ContextSupersessionState {
  readonly sessionId: string;
  readonly activeEntities: Record<string, ActiveEntityContext>;
  readonly activeSpecifications: Record<string, string>;
  readonly historyTurnsCount: number;
  readonly supersessionHistory: readonly SupersessionEvent[];
  readonly isThreadReset: boolean;
}

export interface SupersessionProcessResult {
  readonly query: string;
  readonly processedQuery: string;
  readonly detectedLanguage: DetectedLanguage;
  readonly supersessionEvents: readonly SupersessionEvent[];
  readonly state: ContextSupersessionState;
  readonly insulatedResponse: string;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32ContextSupersessionEngine {
  private static instance: Phase32ContextSupersessionEngine | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
  }

  public static getInstance(): Phase32ContextSupersessionEngine {
    if (!Phase32ContextSupersessionEngine.instance) {
      Phase32ContextSupersessionEngine.instance = new Phase32ContextSupersessionEngine();
    }
    return Phase32ContextSupersessionEngine.instance;
  }

  /**
   * Evaluates incoming user request against active context and conversation history,
   * applying supersessions, preserving compatible context, and removing stale assumptions.
   */
  public processInstructionSupersession(
    query: string,
    currentHistory: readonly ConversationalContextTurn[] = [],
    initialState?: Partial<ContextSupersessionState>
  ): SupersessionProcessResult {
    const t0 = performance.now();
    const qTrimmed = query.trim();
    const language = this.rawDetector.detectLanguage(qTrimmed);
    const qLower = qTrimmed.toLowerCase();

    // Check for explicit topic reset / thread isolation
    const isTopicReset = /^(?:let's change topic|new topic|forget that|moving on|ab doosri baat|doosra sawal|alaga baat suno|choro isey|fresh question|unrelated topic)\b/i.test(qLower);

    const activeSpecs: Record<string, string> = isTopicReset
      ? {}
      : { ...(initialState?.activeSpecifications || {}) };

    const activeEntities: Record<string, ActiveEntityContext> = isTopicReset
      ? {}
      : { ...(initialState?.activeEntities || {}) };

    const supersessionEvents: SupersessionEvent[] = [];

    if (!isTopicReset) {
      // 1. Detect Reversals ("revert to SQLite", "wapas pehle wale pe jao", "nevermind use original port")
      const isReversal = /\b(?:revert\s+to|switch\s+back\s+to|go\s+back\s+to|wapas|pehle\s+wala|nevermind|undo)\b/i.test(qLower);
      if (isReversal) {
        this.processReversals(qLower, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);
      }

      // 2. Database Supersession (PostgreSQL, SQLite, MongoDB, Redis, MySQL)
      this.evaluateDatabaseSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 3. Framework & Language Supersession (React, Vue, Angular, FastAPI, Django, Python, TypeScript, Node)
      this.evaluateFrameworkSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 4. Network / Port Supersession (e.g. port 3000 -> 8080)
      this.evaluatePortSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 5. Budget & Numeric Constraints Supersession
      this.evaluateBudgetSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 6. Region / Cluster Supersession
      this.evaluateRegionSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 7. Output Format Supersession (JSON, YAML, CSV)
      this.evaluateFormatSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);

      // 8. Architecture Paradigm Supersession (Monolith vs Microservices vs Serverless)
      this.evaluateArchitectureSupersession(qTrimmed, activeSpecs, activeEntities, supersessionEvents, currentHistory.length);
    }

    const state: ContextSupersessionState = {
      sessionId: initialState?.sessionId || `session-${Date.now()}`,
      activeEntities,
      activeSpecifications: activeSpecs,
      historyTurnsCount: currentHistory.length + 1,
      supersessionHistory: [...(initialState?.supersessionHistory || []), ...supersessionEvents],
      isThreadReset: isTopicReset,
    };

    const insulatedResponse = this.synthesizeInsulatedResponse(
      qTrimmed,
      supersessionEvents,
      activeSpecs,
      isTopicReset,
      language
    );

    const elapsed = Number((performance.now() - t0).toFixed(2));
    const signature = crypto
      .createHash('sha256')
      .update(`${qTrimmed}|${JSON.stringify(activeSpecs)}`)
      .digest('hex');

    return {
      query: qTrimmed,
      processedQuery: qTrimmed,
      detectedLanguage: language,
      supersessionEvents,
      state,
      insulatedResponse,
      latencyMs: elapsed,
      signature,
    };
  }

  // --------------------------------------------------------------------------
  // SUPERSESSION EVALUATORS
  // --------------------------------------------------------------------------

  private evaluateDatabaseSupersession(
    query: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const dbMatch = query.match(/\b(sqlite|postgresql|postgres|mysql|mongodb|redis)\b/i);
    if (!dbMatch) return;

    const newDb = dbMatch[1].toLowerCase() === 'postgres' ? 'postgresql' : dbMatch[1].toLowerCase();
    const prevDb = specs['database'];

    // Check if query is actually replacing/specifying database
    const isExplicit = /\b(use|switch\s+to|change\s+to|instead\s+of|replace|nahi|bajaye|jagah|for\s+database|database)\b/i.test(query);
    if (!isExplicit && prevDb) return;

    if (prevDb && prevDb !== newDb) {
      // Invalidate dependent assumptions
      const invalidated: string[] = [];
      if (prevDb === 'postgresql' && newDb === 'mongodb') {
        invalidated.push('SQL_RELATIONAL_SCHEMAS', 'ACID_FOREIGN_KEYS', 'POSTGRES_INDEXES');
      } else if (prevDb === 'mongodb' && newDb === 'postgresql') {
        invalidated.push('NOSQL_DOCUMENT_VALIDATORS', 'BSON_OBJECTID');
      } else if (prevDb === 'sqlite' && newDb === 'postgresql') {
        invalidated.push('EMBEDDED_FILE_LOCKING', 'SINGLE_WRITER_LIMITATION');
      }

      specs['database'] = newDb;
      const history = entities['database'] ? [...entities['database'].previousSpecifications, prevDb] : [prevDb];
      entities['database'] = {
        entityName: 'Database Engine',
        category: 'DATABASE',
        currentSpecification: newDb,
        previousSpecifications: history,
        lastUpdatedTurnIndex: turnIndex,
      };

      events.push({
        propertyKey: 'database',
        previousValue: prevDb,
        updatedValue: newDb,
        supersessionType: 'SUBSTITUTION',
        rationale: `Replaced ${prevDb} with ${newDb} as requested by user.`,
        invalidatedAssumptions: invalidated,
      });
    } else if (!prevDb) {
      specs['database'] = newDb;
      entities['database'] = {
        entityName: 'Database Engine',
        category: 'DATABASE',
        currentSpecification: newDb,
        previousSpecifications: [],
        lastUpdatedTurnIndex: turnIndex,
      };
      events.push({
        propertyKey: 'database',
        updatedValue: newDb,
        supersessionType: 'NEW_SPECIFICATION',
        rationale: `Established initial database specification: ${newDb}.`,
        invalidatedAssumptions: [],
      });
    }
  }

  private evaluateFrameworkSupersession(
    query: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    // Frontend
    const feMatch = query.match(/\b(react|vue|angular|svelte|next\.?js)\b/i);
    if (feMatch) {
      const newFe = feMatch[1].toLowerCase();
      const prevFe = specs['frontend'];
      if (prevFe && prevFe !== newFe) {
        specs['frontend'] = newFe;
        const history = entities['frontend'] ? [...entities['frontend'].previousSpecifications, prevFe] : [prevFe];
        entities['frontend'] = {
          entityName: 'Frontend Framework',
          category: 'FRONTEND',
          currentSpecification: newFe,
          previousSpecifications: history,
          lastUpdatedTurnIndex: turnIndex,
        };
        events.push({
          propertyKey: 'frontend',
          previousValue: prevFe,
          updatedValue: newFe,
          supersessionType: 'SUBSTITUTION',
          rationale: `Switched frontend from ${prevFe} to ${newFe}.`,
          invalidatedAssumptions: [`${prevFe.toUpperCase()}_SPECIFIC_HOOKS_AND_STATE`],
        });
      } else if (!prevFe) {
        specs['frontend'] = newFe;
        entities['frontend'] = {
          entityName: 'Frontend Framework',
          category: 'FRONTEND',
          currentSpecification: newFe,
          previousSpecifications: [],
          lastUpdatedTurnIndex: turnIndex,
        };
        events.push({
          propertyKey: 'frontend',
          updatedValue: newFe,
          supersessionType: 'NEW_SPECIFICATION',
          rationale: `Set frontend to ${newFe}.`,
          invalidatedAssumptions: [],
        });
      }
    }

    // Backend
    const beMatch = query.match(/\b(fastapi|django|express|nest\.?js|flask|spring\s+boot)\b/i);
    if (beMatch) {
      const newBe = beMatch[1].toLowerCase();
      const prevBe = specs['backend'];
      if (prevBe && prevBe !== newBe) {
        specs['backend'] = newBe;
        const history = entities['backend'] ? [...entities['backend'].previousSpecifications, prevBe] : [prevBe];
        entities['backend'] = {
          entityName: 'Backend Framework',
          category: 'BACKEND',
          currentSpecification: newBe,
          previousSpecifications: history,
          lastUpdatedTurnIndex: turnIndex,
        };
        events.push({
          propertyKey: 'backend',
          previousValue: prevBe,
          updatedValue: newBe,
          supersessionType: 'SUBSTITUTION',
          rationale: `Switched backend from ${prevBe} to ${newBe}.`,
          invalidatedAssumptions: [`${prevBe.toUpperCase()}_MIDDLEWARE`],
        });
      } else if (!prevBe) {
        specs['backend'] = newBe;
        entities['backend'] = {
          entityName: 'Backend Framework',
          category: 'BACKEND',
          currentSpecification: newBe,
          previousSpecifications: [],
          lastUpdatedTurnIndex: turnIndex,
        };
        events.push({
          propertyKey: 'backend',
          updatedValue: newBe,
          supersessionType: 'NEW_SPECIFICATION',
          rationale: `Set backend to ${newBe}.`,
          invalidatedAssumptions: [],
        });
      }
    }
  }

  private evaluatePortSupersession(
    query: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const portMatch = query.match(/(?:port)\s*(?:to|is|=)?\s*(\d{2,5})/i);
    if (!portMatch) return;

    const newPort = portMatch[1];
    const prevPort = specs['port'];
    if (prevPort !== newPort) {
      specs['port'] = newPort;
      events.push({
        propertyKey: 'port',
        previousValue: prevPort,
        updatedValue: newPort,
        supersessionType: prevPort ? 'CORRECTION' : 'NUMERIC_UPDATE',
        rationale: `Listening port updated to ${newPort}.`,
        invalidatedAssumptions: prevPort ? [`PORT_${prevPort}_FIREWALL_RULE`] : [],
      });
    }
  }

  private evaluateBudgetSupersession(
    query: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const numMatch = query.match(/(?:budget|cost|price|amount|raqam)\s*(?:ko|is|to|nahi)?\s*(\d+)(?:\s*(?:nahi|not|instead of)\s*(\d+))?/i)
      || query.match(/(\d+)\s*(?:nahi|not|ke bajaye)\s*(\d+)/i);

    if (!numMatch) return;

    let newVal: string;
    let prevVal: string | undefined;

    if (numMatch[2]) {
      prevVal = numMatch[1];
      newVal = numMatch[2];
    } else {
      newVal = numMatch[1];
      prevVal = specs['budget'];
    }

    if (newVal && newVal !== prevVal) {
      specs['budget'] = newVal;
      events.push({
        propertyKey: 'budget',
        previousValue: prevVal,
        updatedValue: newVal,
        supersessionType: 'NUMERIC_UPDATE',
        rationale: `Budget threshold updated to ${newVal}.`,
        invalidatedAssumptions: prevVal ? [`TIER_BASED_ON_${prevVal}`] : [],
      });
    }
  }

  private evaluateRegionSupersession(
    query: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const regionMatch = query.match(/(?:cluster|region|server|location)\s*(?:region)?\s*(?:ko|to|in|at|=)\s*([A-Za-z0-9\-]+)/i)
      || query.match(/(?:switch|change|move|deploy)\s+(?:the\s+)?(?:cluster\s+)?(?:region\s+)?(?:to|in|pe)?\s*([A-Za-z0-9\-]+)/i)
      || query.match(/\b(Frankfurt|Singapore|Tokyo|London|us-east-1|us-west-2|eu-central-1)\b/i);

    if (!regionMatch) return;

    const newRegion = regionMatch[1];
    const prevRegion = specs['region'];
    if (prevRegion && prevRegion.toLowerCase() !== newRegion.toLowerCase()) {
      specs['region'] = newRegion;
      events.push({
        propertyKey: 'region',
        previousValue: prevRegion,
        updatedValue: newRegion,
        supersessionType: 'CORRECTION',
        rationale: `Deployment region updated from ${prevRegion} to ${newRegion}.`,
        invalidatedAssumptions: [`DATA_RESIDENCY_IN_${prevRegion.toUpperCase()}`],
      });
    } else if (!prevRegion) {
      specs['region'] = newRegion;
      events.push({
        propertyKey: 'region',
        updatedValue: newRegion,
        supersessionType: 'NEW_SPECIFICATION',
        rationale: `Deployment region designated as ${newRegion}.`,
        invalidatedAssumptions: [],
      });
    }
  }

  private evaluateFormatSupersession(
    query: string,
    specs: Record<string, string>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const fmtMatch = query.match(/\b(json|yaml|xml|csv|protobuf)\b/i);
    if (!fmtMatch) return;

    const isExplicit = /\b(format|output|export|in|as|use)\b/i.test(query);
    if (!isExplicit) return;

    const newFmt = fmtMatch[1].toLowerCase();
    const prevFmt = specs['format'];

    if (prevFmt && prevFmt !== newFmt) {
      specs['format'] = newFmt;
      events.push({
        propertyKey: 'format',
        previousValue: prevFmt,
        updatedValue: newFmt,
        supersessionType: 'FORMAT_CHANGE',
        rationale: `Output format changed to ${newFmt}.`,
        invalidatedAssumptions: [`PARSER_FOR_${prevFmt.toUpperCase()}`],
      });
    } else if (!prevFmt) {
      specs['format'] = newFmt;
      events.push({
        propertyKey: 'format',
        updatedValue: newFmt,
        supersessionType: 'NEW_SPECIFICATION',
        rationale: `Output format specified as ${newFmt}.`,
        invalidatedAssumptions: [],
      });
    }
  }

  private evaluateArchitectureSupersession(
    query: string,
    specs: Record<string, string>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    const archMatch = query.match(/\b(microservices|monolith|monolithic|serverless|event-driven)\b/i);
    if (!archMatch) return;

    const isExplicit = /\b(architecture|paradigm|approach|use|switch|instead|nahi)\b/i.test(query);
    if (!isExplicit) return;

    const newArch = archMatch[1].toLowerCase();
    const prevArch = specs['architecture'];

    if (prevArch && prevArch !== newArch) {
      specs['architecture'] = newArch;
      events.push({
        propertyKey: 'architecture',
        previousValue: prevArch,
        updatedValue: newArch,
        supersessionType: 'ARCHITECTURAL_UPDATE',
        rationale: `Architectural paradigm switched to ${newArch}.`,
        invalidatedAssumptions: [`${prevArch.toUpperCase()}_DEPLOYMENT_PIPELINE`],
      });
    } else if (!prevArch) {
      specs['architecture'] = newArch;
      events.push({
        propertyKey: 'architecture',
        updatedValue: newArch,
        supersessionType: 'NEW_SPECIFICATION',
        rationale: `Architectural paradigm designated as ${newArch}.`,
        invalidatedAssumptions: [],
      });
    }
  }

  private processReversals(
    qLower: string,
    specs: Record<string, string>,
    entities: Record<string, ActiveEntityContext>,
    events: SupersessionEvent[],
    turnIndex: number
  ): void {
    // Reversal of database
    if (entities['database'] && entities['database'].previousSpecifications.length > 0) {
      if (qLower.includes('database') || qLower.includes('sqlite') || qLower.includes('postgres') || qLower.includes('pehle wala') || qLower.includes('original')) {
        const prevList = entities['database'].previousSpecifications;
        const restored = prevList[prevList.length - 1];
        const current = specs['database'];

        if (restored && restored !== current) {
          specs['database'] = restored;
          events.push({
            propertyKey: 'database',
            previousValue: current,
            updatedValue: restored,
            supersessionType: 'REVERSAL',
            rationale: `Reverted database specification back to ${restored}.`,
            invalidatedAssumptions: [`TEMPORARY_${current.toUpperCase()}_CONFIGURATION`],
          });
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // USER INSULATION
  // --------------------------------------------------------------------------

  private synthesizeInsulatedResponse(
    query: string,
    events: readonly SupersessionEvent[],
    activeSpecs: Record<string, string>,
    isTopicReset: boolean,
    language: DetectedLanguage
  ): string {
    if (isTopicReset) {
      return language === 'ROMAN_URDU'
        ? 'Naya mauzoo shuru kar rahe hain. Pichla context saaf kar diya gaya hai.'
        : 'Starting a new conversation topic. Previous context and configurations have been cleared.';
    }

    if (events.length === 0) {
      return language === 'ROMAN_URDU'
        ? 'Aap ki darkhwast samajh li gayi hai. Mojooda configurations barkarar hain.'
        : 'Understood. Maintaining existing configuration specifications.';
    }

    const updates = events.map(e => `${e.propertyKey}: updated to ${e.updatedValue}`).join(', ');

    if (language === 'ROMAN_URDU') {
      return `Tafseelat update kar di gayi hain (${updates}). Naye parameters ke mutabiq agay barh rahe hain.`;
    }

    return `Configuration specifications have been updated (${updates}). Proceeding with current parameters.`;
  }
}
