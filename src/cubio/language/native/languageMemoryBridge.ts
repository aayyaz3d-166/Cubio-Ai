/**
 * CUBiO AI — Phase 6: Task 74
 * Native Language Representation Layer
 * src/cubio/language/native/languageMemoryBridge.ts
 *
 * Bridge connecting Native Language Representation to Native Information Objects
 * and Native Sparse Memory Store.
 * Guarantees zero parallel identity systems, strict tenant isolation,
 * and multi-cell spatial grounding in the 343-cell lattice.
 */

import { DEFAULT_TENANT_ID, CanonicalDomain } from '../../core/canonicalIdentity';
import { NativeSparseMemoryStore } from '../../memory/native/sparseMemoryStore';
import { NativeInformationEngine } from '../../information/native/nativeInformationEngine';
import {
  NativeInformationObject,
  CreateInformationOptions,
} from '../../information/native/infoTypes';
import {
  NativeLanguageSequence,
  TenantLanguageMismatchError,
  LanguageRepresentationError,
} from './languageTypes';
import { NativeTokenizer } from './nativeTokenizer';

export class LanguageMemoryBridge {
  private readonly _infoEngine: NativeInformationEngine;
  private readonly _store: NativeSparseMemoryStore;
  private readonly _tokenizer: NativeTokenizer;

  constructor(
    infoEngine: NativeInformationEngine,
    store?: NativeSparseMemoryStore,
    tokenizer?: NativeTokenizer
  ) {
    this._infoEngine = infoEngine;
    this._store = store ?? infoEngine.store;
    this._tokenizer = tokenizer ?? new NativeTokenizer();
  }

  public get infoEngine(): NativeInformationEngine {
    return this._infoEngine;
  }

  public get store(): NativeSparseMemoryStore {
    return this._store;
  }

  /**
   * Converts a NativeLanguageSequence into a NativeInformationObject and persists it in Sparse Memory.
   */
  public persistLanguageSequence(
    sequence: NativeLanguageSequence,
    tenantId = DEFAULT_TENANT_ID
  ): NativeInformationObject {
    if (sequence.tenantId !== tenantId) {
      throw new TenantLanguageMismatchError(
        `Cross-tenant mutation prohibited. Sequence tenant: ${sequence.tenantId}, Caller tenant: ${tenantId}`
      );
    }

    const options: CreateInformationOptions = {
      objectId: sequence.objectId,
      tenantId: sequence.tenantId,
      domain: sequence.domain,
      cellId: sequence.spatialCellIds.length > 0 ? sequence.spatialCellIds[0] : 0,
      metadata: {
        sequenceId: sequence.sequenceId,
        length: sequence.length,
        epistemicStatus: sequence.epistemicStatus,
        vocabVersion: sequence.vocabVersion,
        vocabChecksum: sequence.vocabChecksum,
        provenanceId: sequence.provenanceId,
        spatialCellIds: sequence.spatialCellIds.join(','),
      },
    };

    const textPayload = {
      modality: 'TEXT' as const,
      content: sequence.rawText,
      charCount: sequence.rawText.length,
      encoding: 'utf-8' as const,
      tokensCount: sequence.length,
      language: 'native',
    };

    // Store in NativeInformationEngine
    const infoObj = this._infoEngine.createInformation(options, textPayload);

    return infoObj;
  }

  /**
   * Retrieves a stored language sequence by objectId and tenantId.
   */
  public retrieveLanguageSequence(
    objectId: string,
    tenantId = DEFAULT_TENANT_ID
  ): NativeLanguageSequence | null {
    const infoObj = this._infoEngine.getInformation(objectId, tenantId);
    if (!infoObj) {
      return null;
    }

    if (infoObj.identity.tenantId !== tenantId) {
      throw new TenantLanguageMismatchError(
        `Cross-tenant access prohibited. Record tenant: ${infoObj.identity.tenantId}, Caller tenant: ${tenantId}`
      );
    }

    if (infoObj.modality !== 'TEXT' || !('content' in infoObj.payload)) {
      throw new LanguageRepresentationError(
        `Stored object ${objectId} is not a valid text modality`
      );
    }

    const content = (infoObj.payload as any).content as string;
    const meta = infoObj.metadata || {};

    return this._tokenizer.tokenize(content, {
      tenantId: infoObj.identity.tenantId,
      domain: infoObj.identity.domain,
      objectId: infoObj.identity.objectId,
      epistemicStatus: meta.epistemicStatus as any,
      provenanceId: meta.provenanceId as any,
    });
  }

  /**
   * Finds all language sequences grounded in a specific spatial cell.
   */
  public findSequencesByCell(cellId: number, tenantId = DEFAULT_TENANT_ID): string[] {
    const memoryRecords = this._store.getByCell(cellId, tenantId);
    return memoryRecords.map((r) => r.identity.objectId);
  }
}
