/**
 * CUBiO AI — Phase 6: Task 88
 * Native Language + Multimodal Intelligence Layer
 * src/cubio/language/native/multimodal/nativeMultimodalLanguageEngine.ts
 *
 * Master facade integrating natural language query processing with
 * validated multimodal evidence objects, cross-modal contradiction detection,
 * tenant isolation, and fail-closed hardware actuation lockout.
 */

import {
  CanonicalModality,
  CanonicalMultimodalEntity,
} from '../../../information/native/multimodal/multimodalTypes';
import {
  MultimodalLanguageQuery,
  MultimodalLanguageResponse,
  MultimodalEvidenceObject,
  CrossModalContradiction,
  MultimodalEpistemicStatus,
  MultimodalActuationBlockedError,
} from './multimodalLanguageTypes';
import { ModalityEvidenceConverter } from './modalityEvidenceConverter';
import { CrossModalConsistencyChecker } from './crossModalConsistencyChecker';
import crypto from 'crypto';

const DEFAULT_TENANT_ID = 'tenant_default_multimodal';

export class NativeMultimodalLanguageEngine {
  private readonly _entities: Map<string, CanonicalMultimodalEntity> = new Map();

  public get actuationState(): string {
    return 'PERMANENTLY_BLOCKED';
  }

  public attemptActuation(): never {
    throw new MultimodalActuationBlockedError();
  }

  // ===========================================================================
  // ENTITY REGISTRATION & STORAGE
  // ===========================================================================

  public registerEntity(entity: CanonicalMultimodalEntity): void {
    const key = `${entity.tenantId}:${entity.objectId}`;
    this._entities.set(key, entity);
  }

  public getEntity(objectId: string, tenantId = DEFAULT_TENANT_ID): CanonicalMultimodalEntity | null {
    const key = `${tenantId}:${objectId}`;
    return this._entities.get(key) ?? null;
  }

  public getAllEntities(tenantId = DEFAULT_TENANT_ID): readonly CanonicalMultimodalEntity[] {
    const list: CanonicalMultimodalEntity[] = [];
    for (const [k, e] of this._entities.entries()) {
      if (e.tenantId === tenantId) list.push(e);
    }
    return Object.freeze(list);
  }

  // ===========================================================================
  // MULTIMODAL LANGUAGE QUERY EVALUATION
  // ===========================================================================

  /**
   * Answers natural language questions grounded in visual, audio, structured, and text modalities.
   */
  public evaluateQuery(query: MultimodalLanguageQuery): MultimodalLanguageResponse {
    const startTime = performance.now();
    const tenantId = query.tenantId ?? DEFAULT_TENANT_ID;
    const rawText = (query.queryText || '').trim();
    const responseId = `resp_mml_${crypto.createHash('sha256').update(`${tenantId}:${rawText}:${query.targetObjectId ?? ''}`).digest('hex').slice(0, 16)}`;

    // 1. Hardware Actuation Guard
    if (this._detectMultimodalActuation(rawText)) {
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: '[REFUSAL] Refusal: Multimodal hardware actuation is permanently blocked in CUBiO AI sovereign runtime. Advisory output only.',
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        citedEvidences: Object.freeze([]),
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 2. Resolve Target Entity
    const entity = this._resolveTargetEntity(rawText, tenantId, query.targetObjectId);
    if (!entity) {
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        generatedText: `[UNKNOWN] Insufficient evidence: Multimodal entity ungrounded in canonical memory for tenant "${tenantId}".`,
        epistemicStatus: 'EPISTEMIC_UNKNOWN',
        confidence: 0.0,
        isGrounded: false,
        citedEvidences: Object.freeze([]),
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 3. Convert Entity Facets to Evidence Objects
    const allEvidences = ModalityEvidenceConverter.convertEntityToEvidences(entity);

    // 4. Cross-Modal Consistency Check
    const contradictions = CrossModalConsistencyChecker.checkConsistency(allEvidences);

    // If query specifically asks about consistency or contradiction
    const asksAboutContradiction = /\b(?:contradiction|discrepancy|conflict|consistent|consistency|mismatch)\b/i.test(rawText);
    if (asksAboutContradiction) {
      if (contradictions.length > 0) {
        const c = contradictions[0];
        const out = `[CONTRADICTION] ${c.refutationText}`;
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: out,
          epistemicStatus: 'CROSS_MODAL_CONTRADICTION',
          confidence: 1.0,
          isGrounded: true,
          citedEvidences: allEvidences,
          contradictions,
          provenance: entity.provenance,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      } else {
        const out = `[CANONICAL_FACT] Cross-modal consistency verified across ${Object.keys(entity.facets).length} modalities for "${entity.objectId}". No contradictions detected.`;
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: out,
          epistemicStatus: 'CANONICAL_FACT',
          confidence: 1.0,
          isGrounded: true,
          citedEvidences: allEvidences,
          contradictions: Object.freeze([]),
          provenance: entity.provenance,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }
    }

    // If contradictions exist and query asks about status/operational state, surface the contradiction!
    if (contradictions.length > 0 && /\b(?:status|state|operating|condition)\b/i.test(rawText)) {
      const c = contradictions[0];
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        targetObjectId: entity.objectId,
        generatedText: `[CONTRADICTION] ${c.refutationText}`,
        epistemicStatus: 'CROSS_MODAL_CONTRADICTION',
        confidence: 1.0,
        isGrounded: true,
        citedEvidences: allEvidences,
        contradictions,
        provenance: entity.provenance,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // 5. Query Specific Modality Pathways
    const lower = rawText.toLowerCase();

    // A. Visual Questions (luminance, brightness, color, image dimension)
    if (/\b(?:luminance|brightness|glow|optical|color|visual|image|pixels?)\b/i.test(lower)) {
      const visualFacet = entity.facets['facet_visual'] ?? Object.values(entity.facets).find(f => f.modality === 'VISUAL');
      if (!visualFacet) {
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: `[UNKNOWN] Insufficient evidence: Entity "${entity.objectId}" has no validated VISUAL modality facet.`,
          epistemicStatus: 'EPISTEMIC_UNKNOWN',
          confidence: 0.0,
          isGrounded: false,
          citedEvidences: Object.freeze([]),
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }

      const visualEvidences = allEvidences.filter(e => e.modality === 'VISUAL');
      const lumEvi = visualEvidences.find(e => e.featureKey === 'luminanceMean');
      const lumVal = lumEvi ? (lumEvi.observedValue as number).toFixed(1) : 'unknown';
      const colorEvi = visualEvidences.find(e => e.featureKey === 'colorSpace');
      const colorVal = colorEvi ? colorEvi.observedValue : 'RGB';

      const out = `[CANONICAL_FACT] Visual scan of "${entity.objectId}" indicates mean luminance of ${lumVal} in ${colorVal} color space.`;
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        targetObjectId: entity.objectId,
        generatedText: out,
        epistemicStatus: 'CANONICAL_FACT',
        confidence: 1.0,
        isGrounded: true,
        citedEvidences: visualEvidences,
        provenance: entity.provenance,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // B. Audio Questions (frequency, acoustic, rms, sound, pitch, audio)
    if (/\b(?:frequency|acoustic|rms|sound|pitch|audio|decibel|noise|spectral)\b/i.test(lower)) {
      const audioFacet = entity.facets['facet_audio'] ?? Object.values(entity.facets).find(f => f.modality === 'AUDIO');
      if (!audioFacet) {
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: `[UNKNOWN] Insufficient evidence: Entity "${entity.objectId}" has no validated AUDIO modality facet.`,
          epistemicStatus: 'EPISTEMIC_UNKNOWN',
          confidence: 0.0,
          isGrounded: false,
          citedEvidences: Object.freeze([]),
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }

      const audioEvidences = allEvidences.filter(e => e.modality === 'AUDIO');
      const freqEvi = audioEvidences.find(e => e.featureKey === 'peakFrequency');
      const rmsEvi = audioEvidences.find(e => e.featureKey === 'rmsEnergy');
      const freqVal = freqEvi ? freqEvi.observedValue : 'unknown';
      const rmsVal = rmsEvi ? (rmsEvi.observedValue as number).toFixed(3) : 'unknown';

      const out = `[CANONICAL_FACT] Acoustic analysis of "${entity.objectId}" indicates peak frequency of ${freqVal} Hz with RMS energy of ${rmsVal}.`;
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        targetObjectId: entity.objectId,
        generatedText: out,
        epistemicStatus: 'CANONICAL_FACT',
        confidence: 1.0,
        isGrounded: true,
        citedEvidences: audioEvidences,
        provenance: entity.provenance,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // C. Structured Questions (telemetry, voltage, schema, temperature, fields)
    if (/\b(?:telemetry|voltage|temperature|structured|fields?|log|metadata)\b/i.test(lower)) {
      const structFacet = entity.facets['facet_structured'] ?? Object.values(entity.facets).find(f => f.modality === 'STRUCTURED');
      if (!structFacet) {
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: `[UNKNOWN] Insufficient evidence: Entity "${entity.objectId}" has no validated STRUCTURED modality facet.`,
          epistemicStatus: 'EPISTEMIC_UNKNOWN',
          confidence: 0.0,
          isGrounded: false,
          citedEvidences: Object.freeze([]),
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }

      const structEvidences = allEvidences.filter(e => e.modality === 'STRUCTURED');
      const summary = structEvidences.map(e => `${e.featureKey}=${e.observedValue}`).join(', ');

      const out = `[CANONICAL_FACT] Structured telemetry for "${entity.objectId}": ${summary}.`;
      return Object.freeze({
        responseId,
        queryText: rawText,
        tenantId,
        targetObjectId: entity.objectId,
        generatedText: out,
        epistemicStatus: 'CANONICAL_FACT',
        confidence: 1.0,
        isGrounded: true,
        citedEvidences: structEvidences,
        provenance: entity.provenance,
        durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
      });
    }

    // D. Text Questions (description, report, notes)
    if (/\b(?:text|description|report|notes?|summary|overview|statement)\b/i.test(lower)) {
      const textFacet = entity.facets['facet_text'] ?? Object.values(entity.facets).find(f => f.modality === 'TEXT');
      if (textFacet) {
        const textEvidences = allEvidences.filter(e => e.modality === 'TEXT');
        const contentEvi = textEvidences.find(e => e.featureKey === 'textContent');
        const contentVal = contentEvi ? contentEvi.observedValue : '';
        const out = `[CANONICAL_FACT] Text report for "${entity.objectId}": ${contentVal}`;
        return Object.freeze({
          responseId,
          queryText: rawText,
          tenantId,
          targetObjectId: entity.objectId,
          generatedText: out,
          epistemicStatus: 'CANONICAL_FACT',
          confidence: 1.0,
          isGrounded: true,
          citedEvidences: textEvidences,
          provenance: entity.provenance,
          durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
        });
      }
    }

    // E. Unsupported / Insufficient Modality Questions
    return Object.freeze({
      responseId,
      queryText: rawText,
      tenantId,
      targetObjectId: entity.objectId,
      generatedText: `[UNKNOWN] Insufficient evidence: Modality evidence cannot confirm requested property for "${entity.objectId}".`,
      epistemicStatus: 'EPISTEMIC_UNKNOWN',
      confidence: 0.0,
      isGrounded: false,
      citedEvidences: Object.freeze([]),
      durationMs: Math.round((performance.now() - startTime) * 1000) / 1000,
    });
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private _detectMultimodalActuation(text: string): boolean {
    const lower = text.toLowerCase();
    return /\b(?:actuate hardware|move robotic arm|drive motor|execute physical motor|switch optical circuit|fire acoustic transducer|trigger actuator)\b/i.test(lower);
  }

  private _resolveTargetEntity(
    text: string,
    tenantId: string,
    explicitId?: string
  ): CanonicalMultimodalEntity | null {
    if (explicitId) {
      return this.getEntity(explicitId, tenantId);
    }

    const normText = text.toLowerCase().replace(/[\s_\-]+/g, '');
    for (const [k, entity] of this._entities.entries()) {
      if (entity.tenantId !== tenantId) continue;
      const normObjId = entity.objectId.toLowerCase().replace(/[\s_\-]+/g, '');
      if (normText.includes(normObjId) || normObjId.includes(normText)) {
        return entity;
      }
    }

    return null;
  }
}
