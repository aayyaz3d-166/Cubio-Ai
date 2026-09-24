/**
 * CUBiO AI — Phase 6: Task 87
 * Native Language + Spatial Intelligence Layer
 * src/cubio/language/native/spatial/nativeSpatialLanguageEngine.ts
 *
 * Master facade engine integrating natural language spatial parsing,
 * deterministic 3D lattice reasoning, canonical memory grounding,
 * strict multi-tenant isolation, and fail-closed hardware actuation lockout.
 */

import { Coordinate3D } from '../../../../types/memory';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  validateCoordinate,
  validateCellId,
  validateAddress,
  TOTAL_SPATIAL_CELLS,
  DIMENSION,
} from '../../../../core/address369';
import { NativeSparseMemoryStore } from '../../../memory/native/sparseMemoryStore';
import {
  SpatialLanguageParser,
  ParsedStepResult,
} from './spatialLanguageParser';
import {
  SpatialReasoningEngine,
  MultiStepNavigationInstruction,
} from './spatialReasoningEngine';
import {
  SpatialDirection,
  SpatialRelationType,
  SpatialEpistemicStatus,
  CanonicalSpatialReference,
  SpatialLanguageQuery,
  SpatialLanguageResponse,
  SpatialReasoningTrace,
  SpatialProvenance,
  SpatialActuationBlockedError,
  OutOfBoundsSpatialError,
  AmbiguousSpatialQueryError,
  UnresolvedSpatialEntityError,
} from './spatialLanguageTypes';
import crypto from 'crypto';

const DEFAULT_TENANT_ID = 'tenant_default_spatial';

export class NativeSpatialLanguageEngine {
  private readonly _parser: SpatialLanguageParser;
  private readonly _reasoningEngine: SpatialReasoningEngine;
  private readonly _store: NativeSparseMemoryStore;

  constructor(
    store?: NativeSparseMemoryStore,
    parser?: SpatialLanguageParser,
    reasoningEngine?: SpatialReasoningEngine
  ) {
    this._store = store ?? new NativeSparseMemoryStore();
    this._parser = parser ?? new SpatialLanguageParser();
    this._reasoningEngine = reasoningEngine ?? new SpatialReasoningEngine();
  }

  public get parser(): SpatialLanguageParser {
    return this._parser;
  }

  public get reasoningEngine(): SpatialReasoningEngine {
    return this._reasoningEngine;
  }

  public get store(): NativeSparseMemoryStore {
    return this._store;
  }

  public get actuationState(): string {
    return 'PERMANENTLY_BLOCKED';
  }

  public attemptActuation(): never {
    throw new SpatialActuationBlockedError();
  }

  // ===========================================================================
  // CANONICAL SPATIAL MEMORY RESOLUTION
  // ===========================================================================

  /**
   * Resolves an entity string to a canonical spatial reference in memory.
   * Enforces strict tenant isolation.
   */
  public resolveEntitySpatialReference(
    entityName: string,
    tenantId = DEFAULT_TENANT_ID
  ): CanonicalSpatialReference | null {
    const rawClean = (entityName || '').replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
    if (!rawClean) return null;
    const normSearch = rawClean.replace(/[\s_\-]+/g, '');

    const records = this._store.query({ tenantId });
    for (const rec of records) {
      const objId = rec.identity.objectId.toLowerCase();
      const normObjId = objId.replace(/[\s_\-]+/g, '');

      const label = ((rec.metadata.label ?? '') + ' ' + (rec.metadata.attributes?.label ?? '')).toLowerCase();
      const normLabel = label.replace(/[\s_\-]+/g, '');

      const desc = ((rec.metadata.description ?? '') + ' ' + (rec.metadata.attributes?.description ?? '')).toLowerCase();
      const normDesc = desc.replace(/[\s_\-]+/g, '');

      if (
        normObjId.includes(normSearch) ||
        normSearch.includes(normObjId) ||
        normLabel.includes(normSearch) ||
        normSearch.includes(normLabel) ||
        normDesc.includes(normSearch)
      ) {
        const cellId = rec.identity.cellId;
        if (cellId === undefined || cellId === null) continue;

        try {
          validateCellId(cellId);
        } catch {
          continue;
        }

        const coordinate = cellIdToCoordinate(cellId);
        const address369 = cellIdToAddress369(cellId);

        const provenance: SpatialProvenance = Object.freeze({
          tenantId,
          sourceObjectId: rec.identity.objectId,
          sourceCellId: cellId,
          sourceAddress369: address369,
          stateVersion: rec.identity.stateVersion,
          recordChecksum: rec.integrity.checksum,
          timestamp: rec.metadata?.createdAt ?? Date.now(),
        });

        const effectiveLabel = rec.metadata.attributes?.label?.toString() ?? rec.metadata.label ?? rec.identity.objectId;

        return Object.freeze({
          objectId: rec.identity.objectId,
          tenantId,
          cellId,
          address369,
          coordinate,
          label: effectiveLabel,
          checksum: rec.integrity.checksum,
          provenance,
        });
      }
    }

    return null;
  }

  // ===========================================================================
  // NATURAL LANGUAGE SPATIAL QUERY EVALUATION
  // ===========================================================================

  /**
   * Evaluates a spatial query in natural language and produces a grounded response.
   */
  public evaluateSpatialQuery(query: SpatialLanguageQuery): SpatialLanguageResponse {
    const startTime = performance.now();
    const tenantId = query.tenantId ?? DEFAULT_TENANT_ID;
    const rawText = (query.queryText || '').trim();
    const responseId = `resp_sp_${crypto.randomBytes(4).toString('hex')}`;

    // 1. Hardware Actuation Guard
    if (this._detectSpatialActuation(rawText)) {
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: '[REFUSAL] Refusal: Spatial hardware actuation is permanently blocked in CUBiO AI sovereign runtime. Advisory output only.',
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 2. Parse Claim from text
    const claim = this._parser.extractSpatialClaim(rawText);

    // 3. Reject Out-Of-Bounds fail-closed
    if (claim.isOutOfBounds) {
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: '[OUT_OF_BOUNDS] Error: Spatial coordinates or cell ID violate Formula A bounds [0..6] / [0..342].',
        epistemicStatus: 'OUT_OF_BOUNDS',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 4. Reject Ambiguity
    if (claim.isAmbiguous) {
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: '[UNKNOWN] Ambiguous spatial query: Phrase contains underspecified spatial relation without concrete coordinate bounds.',
        epistemicStatus: 'AMBIGUOUS_SPATIAL',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 5. Multi-Step Navigation Check (e.g. "Start at (1,2,3), move 2 steps east, then 1 step north")
    if (this._isMultiStepNavigationQuery(rawText)) {
      return this._handleMultiStepQuery(rawText, tenantId, responseId, startTime);
    }

    // 6. Relational Query Check (e.g. "Is Sensor A north of Sensor B?" or "Is Tokamak adjacent to ReactorCore?")
    if (claim.relation && claim.targetEntity) {
      return this._handleRelationalQuery(claim, tenantId, responseId, startTime);
    }

    // 7. Entity Location Query (e.g. "Where is Tokamak?", "What is the cell of ReactorCore?")
    if (claim.subjectEntity && claim.subjectEntity !== 'unknown_entity') {
      const entityRef = this.resolveEntitySpatialReference(claim.subjectEntity, tenantId);
      if (entityRef) {
        const text = `[CANONICAL_FACT] ${entityRef.label ?? entityRef.objectId} is located at coordinate (${entityRef.coordinate.x}, ${entityRef.coordinate.y}, ${entityRef.coordinate.z}) [Cell ID: ${entityRef.cellId}, Address 369: ${entityRef.address369}].`;
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          generatedText: text,
          epistemicStatus: 'OBSERVED_FACT',
          confidence: 1.0,
          isGrounded: true,
          targetCellId: entityRef.cellId,
          targetAddress369: entityRef.address369,
          targetCoordinate: entityRef.coordinate,
          provenance: entityRef.provenance,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      } else {
        // Ungrounded entity -> UNKNOWN
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          generatedText: `[UNKNOWN] Insufficient evidence: Spatial entity "${claim.subjectEntity}" is not grounded in canonical memory for tenant "${tenantId}".`,
          epistemicStatus: 'EPISTEMIC_UNKNOWN',
          confidence: 0.0,
          isGrounded: false,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }
    }

    // 8. Explicit Coordinate/Cell Query without entity (e.g. "What is the cell for (3, 4, 1)?")
    if (claim.explicitCoordinate) {
      const cellId = coordinateToCellId(claim.explicitCoordinate.x, claim.explicitCoordinate.y, claim.explicitCoordinate.z);
      const address369 = cellIdToAddress369(cellId);
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: `[CANONICAL_FACT] Coordinate (${claim.explicitCoordinate.x}, ${claim.explicitCoordinate.y}, ${claim.explicitCoordinate.z}) maps to Cell ID ${cellId} [Address 369: ${address369}].`,
        epistemicStatus: 'OBSERVED_FACT',
        confidence: 1.0,
        isGrounded: true,
        targetCellId: cellId,
        targetAddress369: address369,
        targetCoordinate: claim.explicitCoordinate,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    if (claim.explicitCellId !== undefined) {
      const coord = cellIdToCoordinate(claim.explicitCellId);
      const address369 = cellIdToAddress369(claim.explicitCellId);
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: `[CANONICAL_FACT] Cell ID ${claim.explicitCellId} maps to coordinate (${coord.x}, ${coord.y}, ${coord.z}) [Address 369: ${address369}].`,
        epistemicStatus: 'OBSERVED_FACT',
        confidence: 1.0,
        isGrounded: true,
        targetCellId: claim.explicitCellId,
        targetAddress369: address369,
        targetCoordinate: coord,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // Fallback: ungrounded spatial statement
    return Object.freeze({
      responseId,
      queryText: rawText,
      tenantId,
      generatedText: '[UNKNOWN] Insufficient evidence: Spatial proposition cannot be grounded in canonical lattice coordinates.',
      epistemicStatus: 'EPISTEMIC_UNKNOWN',
      confidence: 0.0,
      isGrounded: false,
      durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
    });
  }

  // ===========================================================================
  // PRIVATE QUERY HANDLERS
  // ===========================================================================

  private _detectSpatialActuation(text: string): boolean {
    const lower = text.toLowerCase();
    return /\b(?:actuate hardware|move robotic arm|execute physical motor|drive motor to|trigger actuator)\b/i.test(lower);
  }

  private _isMultiStepNavigationQuery(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      /\b(?:start at|starting from|navigate|move\s+\d+|step\s+\d+|then move|then step)\b/i.test(lower) &&
      /(?:east|west|north|south|above|below|up|down)/i.test(lower)
    );
  }

  private _handleMultiStepQuery(
    text: string,
    tenantId: string,
    responseId: string,
    startTime: number
  ): SpatialLanguageResponse {
    // 1. Resolve origin
    let origin: Coordinate3D | null = null;
    const coordMatch = this._parser.parseExplicitCoordinates(text);
    if (coordMatch.coordinate) {
      origin = coordMatch.coordinate;
    } else {
      const cellMatch = this._parser.parseExplicitCellId(text);
      if (cellMatch.coordinate) {
        origin = cellMatch.coordinate;
      } else {
        // Check for entity name in start
        const startEntityMatch = text.match(/(?:start at|starting from)\s+([A-Za-z0-9_\-\s]+?)(?:,|\.|\band\b|then)/i);
        if (startEntityMatch) {
          const ref = this.resolveEntitySpatialReference(startEntityMatch[1].trim(), tenantId);
          if (ref) origin = ref.coordinate;
        }
      }
    }

    if (!origin) {
      return Object.freeze({
        responseId,
        queryText: text,
        tenantId,
        generatedText: '[UNKNOWN] Insufficient evidence: Navigation origin could not be resolved to a valid canonical coordinate.',
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 2. Extract step instructions
    const instructions: MultiStepNavigationInstruction[] = [];
    const stepRegex = /(?:then\s+|and\s+)?(?:move|step|go)?\s*(\d+)?\s*(?:steps?|units?|cells?)?\s*(east|west|north|south|above|below|up|down|\+x|-x|\+y|-y|\+z|-z)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = stepRegex.exec(text)) !== null) {
      const dist = match[1] ? parseInt(match[1], 10) : 1;
      const rawDir = match[2].toLowerCase();
      let dir: SpatialDirection = 'EAST';
      if (rawDir === 'east' || rawDir === '+x') dir = 'EAST';
      else if (rawDir === 'west' || rawDir === '-x') dir = 'WEST';
      else if (rawDir === 'north' || rawDir === '+y') dir = 'NORTH';
      else if (rawDir === 'south' || rawDir === '-y') dir = 'SOUTH';
      else if (rawDir === 'above' || rawDir === 'up' || rawDir === '+z') dir = 'ABOVE';
      else if (rawDir === 'below' || rawDir === 'down' || rawDir === '-z') dir = 'BELOW';

      instructions.push({ direction: dir, distance: dist });
    }

    if (instructions.length === 0) {
      return Object.freeze({
        responseId,
        queryText: text,
        tenantId,
        generatedText: '[UNKNOWN] Insufficient evidence: No directional navigation steps could be parsed from instruction.',
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    try {
      const trace = this._reasoningEngine.traceMultiStepReasoning(origin, instructions, text);
      const textOut = `[INFERRED_RELATIONSHIP] Deductive navigation completed across ${instructions.length} step(s). Final destination: (${trace.provenCoordinate?.x}, ${trace.provenCoordinate?.y}, ${trace.provenCoordinate?.z}) [Cell ID: ${trace.provenCellId}, Address 369: ${trace.provenAddress369}].`;

      return Object.freeze({
        responseId,
        queryText: text,
        tenantId,
        generatedText: textOut,
        epistemicStatus: 'INFERRED_RELATIONSHIP',
        confidence: 1.0,
        isGrounded: true,
        targetCellId: trace.provenCellId,
        targetAddress369: trace.provenAddress369,
        targetCoordinate: trace.provenCoordinate,
        reasoningTrace: trace,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    } catch (err: any) {
      if (err instanceof OutOfBoundsSpatialError) {
        return Object.freeze({
          responseId,
          queryText: text,
          tenantId,
          generatedText: `[OUT_OF_BOUNDS] Error: Navigation step exceeds lattice boundary: ${err.message}`,
          epistemicStatus: 'OUT_OF_BOUNDS',
          confidence: 0.0,
          isGrounded: false,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }
      throw err;
    }
  }

  private _handleRelationalQuery(
    claim: any,
    tenantId: string,
    responseId: string,
    startTime: number
  ): SpatialLanguageResponse {
    const subRef = this.resolveEntitySpatialReference(claim.subjectEntity, tenantId);
    const tgtRef = this.resolveEntitySpatialReference(claim.targetEntity, tenantId);

    if (!subRef) {
      return Object.freeze({
        responseId,
        queryText: claim.rawText,
        tenantId,
        generatedText: `[UNKNOWN] Insufficient evidence: Subject entity "${claim.subjectEntity}" is not grounded in canonical memory for tenant "${tenantId}".`,
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    if (!tgtRef) {
      return Object.freeze({
        responseId,
        queryText: claim.rawText,
        tenantId,
        generatedText: `[UNKNOWN] Insufficient evidence: Target entity "${claim.targetEntity}" is not grounded in canonical memory for tenant "${tenantId}".`,
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    const relHolds = this._reasoningEngine.evaluateRelation(subRef.coordinate, tgtRef.coordinate, claim.relation);
    const relationName = claim.relation.replace('_', ' ').toLowerCase();

    const premise = `Geometric evaluation: Subject (${subRef.coordinate.x}, ${subRef.coordinate.y}, ${subRef.coordinate.z}) vs Target (${tgtRef.coordinate.x}, ${tgtRef.coordinate.y}, ${tgtRef.coordinate.z})`;
    const conclusion = relHolds
      ? `Verified: "${subRef.label ?? subRef.objectId}" is ${relationName} "${tgtRef.label ?? tgtRef.objectId}".`
      : `Refuted: "${subRef.label ?? subRef.objectId}" is NOT ${relationName} "${tgtRef.label ?? tgtRef.objectId}".`;

    const trace: SpatialReasoningTrace = Object.freeze({
      traceId: `trace_rel_${crypto.randomBytes(4).toString('hex')}`,
      query: claim.rawText,
      steps: Object.freeze([
        Object.freeze({
          stepIndex: 1,
          premise,
          ruleId: `GEOMETRIC_RELATION_TEST_${claim.relation}`,
          intermediateCoordinate: subRef.coordinate,
          intermediateCellId: subRef.cellId,
          intermediateAddress369: subRef.address369,
          confidence: 1.0,
        }),
      ]),
      finalConclusion: conclusion,
      reasoningDepth: 1,
      provenCoordinate: subRef.coordinate,
      provenCellId: subRef.cellId,
      provenAddress369: subRef.address369,
      epistemicStatus: 'INFERRED_RELATIONSHIP',
      confidence: 1.0,
      isSound: true,
      traceChecksum: crypto.createHash('sha256').update(`${subRef.cellId}:${tgtRef.cellId}:${claim.relation}:${relHolds}`, 'utf8').digest('hex'),
    });

    const textOut = `[INFERRED_RELATIONSHIP] ${conclusion}`;

    return Object.freeze({
      responseId,
      queryText: claim.rawText,
      tenantId,
      generatedText: textOut,
      epistemicStatus: 'INFERRED_RELATIONSHIP',
      confidence: 1.0,
      isGrounded: true,
      targetCellId: subRef.cellId,
      targetAddress369: subRef.address369,
      targetCoordinate: subRef.coordinate,
      reasoningTrace: trace,
      provenance: subRef.provenance,
      durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
    });
  }
}
