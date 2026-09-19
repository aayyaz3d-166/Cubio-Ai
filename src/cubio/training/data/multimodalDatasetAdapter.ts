/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Multimodal Dataset Adapter
 *
 * Adapts normalized dataset records into native Step 41 LargeScaleSample objects,
 * attaching 369 harmonic states and CAS payload CIDs.
 */

import {
  NormalizedDatasetRecord,
} from './types';
import { LargeScaleSample } from '../../large_scale_training/types';
import { CubiOMultimodalCore } from '../../multimodal/cubioMultimodalCore';
import { CubiOMultimodalState } from '../../multimodal/types';

export class MultimodalDatasetAdapter {
  private mmCore: CubiOMultimodalCore;

  constructor(mmCore?: CubiOMultimodalCore) {
    this.mmCore = mmCore || new CubiOMultimodalCore({ edgeProfile: 'CUBIO_EDGE_2GB' });
  }

  /**
   * Adapts a NormalizedDatasetRecord into a native LargeScaleSample.
   */
  public adaptToTrainingSample(record: NormalizedDatasetRecord): LargeScaleSample {
    let chosenTarget: any;
    switch (record.modality) {
      case 'TEXT':
        chosenTarget = record.normalizedContent;
        break;
      case 'IMAGE':
        chosenTarget = record.normalizedContent;
        break;
      case 'AUDIO':
        chosenTarget = record.normalizedContent;
        break;
      case 'THREED':
        chosenTarget = record.normalizedContent;
        break;
    }

    return Object.freeze({
      sampleId: `LS_${record.recordId}`,
      promptModality: record.modality,
      targetModality: record.modality === 'TEXT' ? 'IMAGE' : 'TEXT',
      rawPrompt: record.semanticConcept,
      chosenTarget,
      casPayloadCid: record.casCid,
    });
  }

  /**
   * Encodes record directly into a CubiOMultimodalState.
   */
  public encodeToMultimodalState(record: NormalizedDatasetRecord): CubiOMultimodalState {
    switch (record.modality) {
      case 'TEXT':
        return this.mmCore.getTextEncoder().encode(record.normalizedContent, record.semanticConcept);
      case 'IMAGE':
        return this.mmCore.getImageEncoder().encode(record.normalizedContent, record.semanticConcept);
      case 'AUDIO':
        return this.mmCore.getAudioEncoder().encode(record.normalizedContent, record.semanticConcept);
      case 'THREED':
        return this.mmCore.getThreeDEncoder().encode(record.normalizedContent, record.semanticConcept);
    }
  }
}
