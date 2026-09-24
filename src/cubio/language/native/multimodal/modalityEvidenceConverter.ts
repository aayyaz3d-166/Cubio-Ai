/**
 * CUBiO AI — Phase 6: Task 88
 * Native Language + Multimodal Intelligence Layer
 * src/cubio/language/native/multimodal/modalityEvidenceConverter.ts
 *
 * Converts CanonicalMultimodalEntity facets into discrete, strongly typed
 * native MultimodalEvidenceObject instances without foreign ML models.
 */

import {
  CanonicalMultimodalEntity,
  ModalityFacet,
  NativeAudioFacetPayload,
  NativeVisualFacetPayload,
  NativeStructuredFacetPayload,
  NativeNumericFacetPayload,
  NativeTextFacetPayload,
} from '../../../information/native/multimodal/multimodalTypes';
import {
  MultimodalEvidenceObject,
} from './multimodalLanguageTypes';
import crypto from 'crypto';

export class ModalityEvidenceConverter {
  /**
   * Converts all facets of a canonical entity into discrete evidence objects.
   */
  public static convertEntityToEvidences(
    entity: CanonicalMultimodalEntity
  ): readonly MultimodalEvidenceObject[] {
    const evidences: MultimodalEvidenceObject[] = [];

    for (const facet of Object.values(entity.facets)) {
      const facetEvidences = this.convertFacetToEvidences(entity, facet);
      evidences.push(...facetEvidences);
    }

    return Object.freeze(evidences);
  }

  /**
   * Converts a single modality facet into discrete evidence objects.
   */
  public static convertFacetToEvidences(
    entity: CanonicalMultimodalEntity,
    facet: ModalityFacet
  ): readonly MultimodalEvidenceObject[] {
    const list: MultimodalEvidenceObject[] = [];
    const baseId = `evi_${entity.objectId}_${facet.modality.toLowerCase()}`;

    const makeEvidence = (
      featureKey: string,
      observedValue: number | string | boolean | readonly number[],
      unit?: string,
      isObserved = true,
      spatialCellId?: number
    ): MultimodalEvidenceObject => {
      const evidenceId = `${baseId}_${featureKey}_${crypto.randomBytes(3).toString('hex')}`;
      return Object.freeze({
        evidenceId,
        objectId: entity.objectId,
        tenantId: entity.tenantId,
        facetId: facet.facetId,
        modality: facet.modality,
        featureKey,
        observedValue,
        unit,
        spatialCellId: spatialCellId ?? facet.reference.cellId,
        provenance: Object.freeze([...entity.provenance, facet.facetId]),
        recordChecksum: facet.checksum,
        isObservedFeature: isObserved,
        epistemicStatus: isObserved ? 'OBSERVED_FACT' : 'SUPPORTED_HYPOTHESIS',
        confidence: isObserved ? 1.0 : 0.70,
      });
    };

    // 1. TEXT MODALITY
    if (facet.modality === 'TEXT') {
      const payload = facet.loadedPayload as NativeTextFacetPayload | undefined;
      const content = payload?.content ?? (facet.descriptors.contentSnippet as string) ?? '';
      list.push(makeEvidence('textContent', content, undefined, true));
      if (payload?.charCount !== undefined) {
        list.push(makeEvidence('charCount', payload.charCount, 'chars', true));
      }
    }

    // 2. NUMERIC MODALITY
    else if (facet.modality === 'NUMERIC') {
      const payload = facet.loadedPayload as NativeNumericFacetPayload | undefined;
      const val = payload?.value ?? (facet.descriptors.scalarValue as number) ?? 0;
      const unit = payload?.unit ?? (facet.descriptors.unit as string);
      list.push(makeEvidence('numericValue', val as any, unit, true));
    }

    // 3. STRUCTURED MODALITY
    else if (facet.modality === 'STRUCTURED') {
      const payload = facet.loadedPayload as NativeStructuredFacetPayload | undefined;
      const fields = payload?.fields ?? (facet.descriptors as any) ?? {};
      for (const [k, v] of Object.entries(fields)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          list.push(makeEvidence(k, v, undefined, true));
        }
      }
    }

    // 4. AUDIO MODALITY (Task 67 analytical features)
    else if (facet.modality === 'AUDIO') {
      const payload = facet.loadedPayload as NativeAudioFacetPayload | undefined;
      const features = payload?.features;
      const rms = features?.rmsEnergy ?? (facet.descriptors.rmsEnergy as number) ?? 0;
      const peakFreq = features?.peakFrequency ?? (facet.descriptors.peakFrequency as number) ?? 0;
      const spectralCentroid = features?.spectralCentroid ?? (facet.descriptors.spectralCentroid as number) ?? 0;
      const zcr = features?.zeroCrossingRate ?? (facet.descriptors.zeroCrossingRate as number) ?? 0;

      list.push(makeEvidence('rmsEnergy', rms, 'rms', true));
      list.push(makeEvidence('peakFrequency', peakFreq, 'Hz', true));
      list.push(makeEvidence('spectralCentroid', spectralCentroid, 'Hz', true));
      list.push(makeEvidence('zeroCrossingRate', zcr, 'ratio', true));

      if (payload?.sampleRate) {
        list.push(makeEvidence('sampleRate', payload.sampleRate, 'Hz', true));
      }
      if (payload?.durationMs) {
        list.push(makeEvidence('durationMs', payload.durationMs, 'ms', true));
      }
    }

    // 5. VISUAL MODALITY (Task 68 analytical features)
    else if (facet.modality === 'VISUAL') {
      const payload = facet.loadedPayload as NativeVisualFacetPayload | undefined;
      const features = payload?.features;
      const lumMean = features?.luminanceMean ?? (facet.descriptors.luminanceMean as number) ?? 0;
      const lumStd = features?.luminanceStdDev ?? (facet.descriptors.luminanceStdDev as number) ?? 0;
      const colorSpace = payload?.colorSpace ?? (facet.descriptors.colorSpace as string) ?? 'RGB';

      list.push(makeEvidence('luminanceMean', lumMean, 'luminance', true));
      list.push(makeEvidence('luminanceStdDev', lumStd, 'stdDev', true));
      list.push(makeEvidence('colorSpace', colorSpace, undefined, true));

      if (payload?.width && payload?.height) {
        list.push(makeEvidence('dimensions', `${payload.width}x${payload.height}`, 'pixels', true));
      }
      if (facet.reference.cellId !== undefined) {
        list.push(makeEvidence('latticeCellId', facet.reference.cellId, 'cell', true, facet.reference.cellId));
      }
    }

    return Object.freeze(list);
  }
}
