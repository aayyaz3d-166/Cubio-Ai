/**
 * CUBiO AI — Task 31: Native Information Representation Layer
 * Phase 3 — Information Intelligence
 * src/cubio/information/native/stateMapper.ts
 *
 * Deterministic bidirectional mapping between high-level InformationPayloads
 * and Phase 1 DeterministicState mathematical objects.
 * Guarantees 100% bit-exact round-trip preservation.
 */

import { DeterministicState } from '../../math/engine/types';
import { createInitialState } from '../../math';
import { createScalar, createVector } from '../../math/primitives';
import { NativeMathScalar, NativeMathVector, NativeMathValue } from '../../math/types';
import { Spatial343Mapping } from '../../math/spatial/types';
import {
  InformationModality,
  InformationPayload,
  NativeTextPayload,
  NativeNumericPayload,
  NativeCategoricalPayload,
  NativeStructuredPayload,
} from './infoTypes';
import { NativeInformationValidationError } from './infoValidation';
import { canonicalJsonStringify } from './infoSerialization';

const MODALITY_TAGS: Record<InformationModality, number> = {
  TEXT: 1,
  NUMERIC: 2,
  CATEGORICAL: 3,
  STRUCTURED: 4,
};

const REVERSE_MODALITY_TAGS: Record<number, InformationModality> = {
  1: 'TEXT',
  2: 'NUMERIC',
  3: 'CATEGORICAL',
  4: 'STRUCTURED',
};

/**
 * Maps any InformationPayload into an immutable Phase 1 DeterministicState.
 */
export function informationPayloadToDeterministicState(
  stateId: string,
  payload: InformationPayload,
  options?: {
    spatialRef?: Spatial343Mapping;
    version?: number;
    parentChecksum?: string;
  }
): DeterministicState {
  const values: Record<string, NativeMathValue> = {
    _modality: createScalar(MODALITY_TAGS[payload.modality]),
  };

  switch (payload.modality) {
    case 'TEXT': {
      const p = payload as NativeTextPayload;
      const textBytes = Array.from(Buffer.from(p.content, 'utf8'));
      values['text_bytes'] = createVector(textBytes.length > 0 ? textBytes : [0]);
      values['has_content'] = createScalar(textBytes.length > 0 ? 1 : 0);
      values['char_count'] = createScalar(p.charCount);
      if (p.tokensCount !== undefined) {
        values['tokens_count'] = createScalar(p.tokensCount);
      }
      if (p.language) {
        values['lang_bytes'] = createVector(Array.from(Buffer.from(p.language, 'utf8')));
      }
      break;
    }
    case 'NUMERIC': {
      const p = payload as NativeNumericPayload;
      switch (p.kind) {
        case 'SCALAR': {
          values['num_kind'] = createScalar(1);
          values['num_val'] = createScalar(p.value as number);
          break;
        }
        case 'VECTOR': {
          values['num_kind'] = createScalar(2);
          values['num_val'] = createVector(p.value as readonly number[]);
          break;
        }
        case 'TENSOR': {
          values['num_kind'] = createScalar(3);
          const raw = p.value as readonly (readonly number[])[];
          const rows = raw.length;
          const cols = raw[0].length;
          const flat: number[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              flat.push(raw[r][c]);
            }
          }
          values['tensor_shape'] = createVector([rows, cols]);
          values['num_val'] = createVector(flat);
          break;
        }
      }
      if (p.min !== undefined) values['num_min'] = createScalar(p.min);
      if (p.max !== undefined) values['num_max'] = createScalar(p.max);
      if (p.unit) {
        values['unit_bytes'] = createVector(Array.from(Buffer.from(p.unit, 'utf8')));
      }
      break;
    }
    case 'CATEGORICAL': {
      const p = payload as NativeCategoricalPayload;
      values['cat_bytes'] = createVector(Array.from(Buffer.from(p.category, 'utf8')));
      values['label_bytes'] = createVector(Array.from(Buffer.from(p.label, 'utf8')));
      if (p.confidence !== undefined) {
        values['confidence'] = createScalar(p.confidence);
      }
      if (p.vocabularyId) {
        values['vocab_bytes'] = createVector(Array.from(Buffer.from(p.vocabularyId, 'utf8')));
      }
      if (p.attributes) {
        const attrJson = canonicalJsonStringify(p.attributes);
        values['attr_bytes'] = createVector(Array.from(Buffer.from(attrJson, 'utf8')));
      }
      break;
    }
    case 'STRUCTURED': {
      const p = payload as NativeStructuredPayload;
      const fieldsJson = canonicalJsonStringify(p.fields);
      values['fields_bytes'] = createVector(Array.from(Buffer.from(fieldsJson, 'utf8')));
      if (p.schemaUri) {
        values['schema_bytes'] = createVector(Array.from(Buffer.from(p.schemaUri, 'utf8')));
      }
      break;
    }
    default: {
      throw new NativeInformationValidationError(`Unsupported modality for state mapping: ${(payload as any).modality}`);
    }
  }

  return createInitialState(stateId, {
    values,
    spatialRef: options?.spatialRef,
  });
}

/**
 * Reconstructs the exact InformationPayload from a Phase 1 DeterministicState.
 */
export function deterministicStateToInformationPayload(state: DeterministicState): InformationPayload {
  if (!state || state.mathType !== 'DETERMINISTIC_STATE') {
    throw new NativeInformationValidationError('Input must be a valid DeterministicState');
  }

  const modalityScalar = state.values['_modality'] as NativeMathScalar | undefined;
  if (!modalityScalar || modalityScalar.mathType !== 'SCALAR') {
    throw new NativeInformationValidationError('DeterministicState is missing valid _modality scalar');
  }

  const modality = REVERSE_MODALITY_TAGS[modalityScalar.value];
  if (!modality) {
    throw new NativeInformationValidationError(`Unknown modality tag: ${modalityScalar.value}`);
  }

  switch (modality) {
    case 'TEXT': {
      const textVec = state.values['text_bytes'] as NativeMathVector;
      const hasContent = ((state.values['has_content'] as NativeMathScalar)?.value ?? 1) === 1;
      const charCount = (state.values['char_count'] as NativeMathScalar)?.value ?? 0;
      const tokensScalar = state.values['tokens_count'] as NativeMathScalar | undefined;
      const tokensCount = tokensScalar !== undefined ? tokensScalar.value : undefined;
      const langVec = state.values['lang_bytes'] as NativeMathVector | undefined;

      const content = hasContent ? Buffer.from(textVec.values).toString('utf8') : '';
      const language = langVec ? Buffer.from(langVec.values).toString('utf8') : undefined;

      const payload: NativeTextPayload = {
        modality: 'TEXT',
        content,
        charCount,
        encoding: 'utf-8',
        ...(language !== undefined ? { language } : {}),
        ...(tokensCount !== undefined ? { tokensCount } : {}),
      };
      return Object.freeze(payload);
    }
    case 'NUMERIC': {
      const kindScalar = state.values['num_kind'] as NativeMathScalar;
      const numVal = state.values['num_val'];
      const minScalar = state.values['num_min'] as NativeMathScalar | undefined;
      const maxScalar = state.values['num_max'] as NativeMathScalar | undefined;
      const unitVec = state.values['unit_bytes'] as NativeMathVector | undefined;

      let kind: 'SCALAR' | 'VECTOR' | 'TENSOR';
      let value: number | readonly number[] | readonly (readonly number[])[];
      let shape: readonly number[];

      if (kindScalar.value === 1) {
        kind = 'SCALAR';
        value = (numVal as NativeMathScalar).value;
        shape = Object.freeze([1]);
      } else if (kindScalar.value === 2) {
        kind = 'VECTOR';
        const vec = numVal as NativeMathVector;
        value = Object.freeze([...vec.values]);
        shape = Object.freeze([vec.values.length]);
      } else if (kindScalar.value === 3) {
        kind = 'TENSOR';
        const shapeVec = state.values['tensor_shape'] as NativeMathVector;
        const rows = shapeVec.values[0];
        const cols = shapeVec.values[1];
        const numVec = numVal as NativeMathVector;
        const matrix: number[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: number[] = [];
          for (let c = 0; c < cols; c++) {
            row.push(numVec.values[r * cols + c]);
          }
          matrix.push(Object.freeze(row) as any);
        }
        value = Object.freeze(matrix as any);
        shape = Object.freeze([rows, cols]);
      } else {
        throw new NativeInformationValidationError(`Corrupted num_kind: ${kindScalar.value}`);
      }

      const unit = unitVec ? Buffer.from(unitVec.values).toString('utf8') : undefined;

      const payload: NativeNumericPayload = {
        modality: 'NUMERIC',
        kind,
        value,
        shape,
        ...(minScalar !== undefined ? { min: minScalar.value } : {}),
        ...(maxScalar !== undefined ? { max: maxScalar.value } : {}),
        ...(unit !== undefined ? { unit } : {}),
      };
      return Object.freeze(payload);
    }
    case 'CATEGORICAL': {
      const catVec = state.values['cat_bytes'] as NativeMathVector;
      const labelVec = state.values['label_bytes'] as NativeMathVector;
      const confScalar = state.values['confidence'] as NativeMathScalar | undefined;
      const vocabVec = state.values['vocab_bytes'] as NativeMathVector | undefined;
      const attrVec = state.values['attr_bytes'] as NativeMathVector | undefined;

      const category = Buffer.from(catVec.values).toString('utf8');
      const label = Buffer.from(labelVec.values).toString('utf8');
      const vocabularyId = vocabVec ? Buffer.from(vocabVec.values).toString('utf8') : undefined;
      const attributes = attrVec ? JSON.parse(Buffer.from(attrVec.values).toString('utf8')) : undefined;

      const payload: NativeCategoricalPayload = {
        modality: 'CATEGORICAL',
        category,
        label,
        ...(confScalar !== undefined ? { confidence: confScalar.value } : {}),
        ...(vocabularyId !== undefined ? { vocabularyId } : {}),
        ...(attributes !== undefined ? { attributes: Object.freeze(attributes) } : {}),
      };
      return Object.freeze(payload);
    }
    case 'STRUCTURED': {
      const fieldsVec = state.values['fields_bytes'] as NativeMathVector;
      const schemaVec = state.values['schema_bytes'] as NativeMathVector | undefined;

      const fieldsJson = Buffer.from(fieldsVec.values).toString('utf8');
      const fields = JSON.parse(fieldsJson);
      const schemaUri = schemaVec ? Buffer.from(schemaVec.values).toString('utf8') : undefined;

      const payload: NativeStructuredPayload = {
        modality: 'STRUCTURED',
        fields: Object.freeze(fields),
        ...(schemaUri !== undefined ? { schemaUri } : {}),
      };
      return Object.freeze(payload);
    }
    default: {
      throw new NativeInformationValidationError(`Unsupported modality in state reconstruction: ${modality}`);
    }
  }
}
