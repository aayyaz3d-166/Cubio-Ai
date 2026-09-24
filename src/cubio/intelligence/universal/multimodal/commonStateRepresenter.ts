/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F48: Universal Common Multimodal State Representer
 *
 * Fuses heterogeneous sensory modalities (Text, Image, Audio, Video, Geometry, Structured)
 * into a canonical CubiOCommonMultimodalState across D0 through D8+.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiODimension } from '../../../types';
import { DimensionalStateLevel } from '../universalTypes';
import {
  MultimodalInputBundle,
  UniversalInputModality,
  ModalityFeatureTensor,
  CubiOCommonMultimodalState,
  SpatiotemporalTrajectory,
} from './types';
import {
  encodeText,
  encodeImage,
  encodeAudio,
  encodeVideo,
  encodeGeometry,
  encodeStructured,
} from './modalityEncoders';
import { extractSpatiotemporalTrajectory } from './videoProcessor';

/**
 * Maps multi-sensory input bundle into canonical CubiOCommonMultimodalState.
 */
export function buildCommonMultimodalState(
  bundle: MultimodalInputBundle
): Readonly<CubiOCommonMultimodalState> {
  const activeModalities: UniversalInputModality[] = [];
  const modalityFeatures: Partial<Record<UniversalInputModality, ModalityFeatureTensor>> = {};

  // 1. Ingest Text
  if (bundle.text && bundle.text.text) {
    const feature = encodeText(bundle.text);
    activeModalities.push('TEXT');
    modalityFeatures['TEXT'] = feature;
  }

  // 2. Ingest Image
  if (bundle.image) {
    const feature = encodeImage(bundle.image);
    activeModalities.push('IMAGE');
    modalityFeatures['IMAGE'] = feature;
  }

  // 3. Ingest Audio
  if (bundle.audio) {
    const feature = encodeAudio(bundle.audio);
    activeModalities.push('AUDIO');
    modalityFeatures['AUDIO'] = feature;
  }

  // 4. Ingest Video
  let trajectory: SpatiotemporalTrajectory | undefined;
  if (bundle.video) {
    const feature = encodeVideo(bundle.video);
    activeModalities.push('VIDEO');
    modalityFeatures['VIDEO'] = feature;
    trajectory = extractSpatiotemporalTrajectory(bundle.video);
  }

  // 5. Ingest Geometry
  if (bundle.geometry) {
    const feature = encodeGeometry(bundle.geometry);
    activeModalities.push('GEOMETRY_3D');
    modalityFeatures['GEOMETRY_3D'] = feature;
  }

  // 6. Ingest Structured Data
  if (bundle.structuredData && Object.keys(bundle.structuredData).length > 0) {
    const feature = encodeStructured(bundle.structuredData);
    activeModalities.push('STRUCTURED');
    modalityFeatures['STRUCTURED'] = feature;
  }

  // If no modalities active, default to empty TEXT
  if (activeModalities.length === 0) {
    const feature = encodeText({ text: '' });
    activeModalities.push('TEXT');
    modalityFeatures['TEXT'] = feature;
  }

  // ─── 7. CROSS-MODAL FUSION TENSOR COMPUTATION ────────────────────────────
  const fusedTensor = [0, 0, 0, 0, 0, 0, 0, 0];
  let totalEnergy = 0;

  for (const mod of activeModalities) {
    const feat = modalityFeatures[mod]!;
    for (let i = 0; i < 8; i++) {
      fusedTensor[i] += feat.tensor[i];
    }
    totalEnergy += feat.energy;
  }

  const modCount = activeModalities.length;
  for (let i = 0; i < 8; i++) {
    fusedTensor[i] = Number((fusedTensor[i] / modCount).toFixed(4));
  }

  // ─── 8. CROSS-MODAL COHERENCE & RESONANCE SCORE ──────────────────────────
  let crossModalCoherence = 1.0;
  if (modCount > 1) {
    // Calculate variance across modality tensors
    let totalVar = 0;
    for (let i = 0; i < 8; i++) {
      let mean = fusedTensor[i];
      let varSum = 0;
      for (const mod of activeModalities) {
        const diff = modalityFeatures[mod]!.tensor[i] - mean;
        varSum += diff * diff;
      }
      totalVar += varSum / modCount;
    }
    crossModalCoherence = Number(Math.max(0.7, Math.min(1.0, 1.0 - totalVar * 0.1)).toFixed(4));
  }

  const overallResonanceScore = Number((95.0 + crossModalCoherence * 4.8).toFixed(2));

  // ─── 9. SPATIAL GROUNDING COORDINATES [X, Y, Z] ──────────────────────────
  const spatialCoordinates: readonly [number, number, number] = Object.freeze([
    Number((fusedTensor[0] * 3.69).toFixed(4)),
    Number((fusedTensor[1] * 6.39).toFixed(4)),
    Number((fusedTensor[2] * 9.63).toFixed(4)),
  ]);

  // ─── 10. DIMENSIONAL LEVEL MAPPING ───────────────────────────────────────
  const targetDimension: CubiODimension = bundle.targetDimension || 'D3';
  let dimensionalLevel: DimensionalStateLevel = 'D3_SEMANTIC_SPATIAL';

  if (activeModalities.includes('VIDEO')) {
    dimensionalLevel = 'D6_WORKFLOW_AGENT';
  } else if (activeModalities.includes('GEOMETRY_3D')) {
    dimensionalLevel = 'D3_SEMANTIC_SPATIAL';
  } else if (modCount >= 3) {
    dimensionalLevel = 'D4_RELATIONSHIP';
  }

  const summaries = activeModalities.map((m) => modalityFeatures[m]!.rawSummary).join('; ');
  const semanticDescription = `Fused ${modCount} active modalities (${activeModalities.join(', ')}) into canonical state coordinates [${spatialCoordinates.join(', ')}] with ${(crossModalCoherence * 100).toFixed(2)}% coherence in dimension ${targetDimension}`;

  const stateChecksum = deterministicHash(
    `COMMON_STATE:${targetDimension}:${activeModalities.join('+')}:${JSON.stringify(fusedTensor)}:${spatialCoordinates.join(',')}`
  );
  const commonStateId = `CMS_${stateChecksum.slice(2, 12)}`;

  return Object.freeze({
    commonStateId,
    activeModalities: Object.freeze(activeModalities),
    modalityFeatures: Object.freeze(modalityFeatures),
    fusedTensor: Object.freeze(fusedTensor),
    crossModalCoherence,
    overallResonanceScore,
    spatialCoordinates,
    spatiotemporalTrajectory: trajectory,
    targetDimension,
    dimensionalLevel,
    semanticDescription,
    stateChecksum,
    timestamp: Date.now(),
  });
}
