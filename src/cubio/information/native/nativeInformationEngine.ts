/**
 * CUBiO AI — Task 31: Native Information Representation Layer
 * Phase 3 — Information Intelligence
 * src/cubio/information/native/nativeInformationEngine.ts
 *
 * Master orchestration engine for Native Information Objects.
 * Manages the lifecycle of multi-modal information with Phase 1 mathematical states,
 * Phase 2 sparse memory persistence, multi-axis indexing, and content-addressable deduplication.
 */

import {
  DEFAULT_TENANT_ID,
  CanonicalDomain,
} from '../../core/canonicalIdentity';
import {
  assertValidObjectId,
  assertValidTenantId,
} from '../../memory/native/validation';
import { NativeSparseMemoryStore } from '../../memory/native/sparseMemoryStore';
import { NativeMemoryIndex } from '../../memory/native/memoryIndex';
import { NativeStateBridge } from '../../memory/native/stateBridge/nativeStateBridge';
import { DeterministicState } from '../../math/engine/types';
import {
  InformationPayload,
  NativeInformationObject,
  CanonicalInformationIdentity,
  CreateInformationOptions,
  InformationReference,
} from './infoTypes';
import {
  assertValidInformationPayload,
  NativeInformationValidationError,
} from './infoValidation';
import {
  computeInformationContentHash,
  computeInformationChecksum,
  deepFreeze,
} from './infoSerialization';
import {
  informationPayloadToDeterministicState,
  deterministicStateToInformationPayload,
} from './stateMapper';

export class NativeInformationEngine {
  private readonly _store: NativeSparseMemoryStore;
  private readonly _index: NativeMemoryIndex;
  private readonly _bridge: NativeStateBridge;

  /** Content-addressable hash table: ${tenantId}:${contentHash} -> canonical objectId */
  private readonly _contentMap = new Map<string, string>();

  public constructor(
    store: NativeSparseMemoryStore,
    index?: NativeMemoryIndex,
    bridge?: NativeStateBridge
  ) {
    if (!store || !(store instanceof NativeSparseMemoryStore)) {
      throw new NativeInformationValidationError('NativeInformationEngine requires a valid NativeSparseMemoryStore');
    }
    this._store = store;
    this._index = index ?? new NativeMemoryIndex();
    this._bridge = bridge ?? new NativeStateBridge(this._store, this._index);
  }

  public get store(): NativeSparseMemoryStore {
    return this._store;
  }

  public get index(): NativeMemoryIndex {
    return this._index;
  }

  public get bridge(): NativeStateBridge {
    return this._bridge;
  }

  /**
   * Creates, validates, mathematically binds, and stores a new NativeInformationObject.
   */
  public createInformation(
    options: CreateInformationOptions,
    payload: InformationPayload
  ): NativeInformationObject {
    if (!options || typeof options !== 'object') {
      throw new NativeInformationValidationError('Create options must be a valid object');
    }
    assertValidObjectId(options.objectId);
    const tenantId = options.tenantId?.trim() || DEFAULT_TENANT_ID;
    assertValidTenantId(tenantId);
    const domain: CanonicalDomain = options.domain ?? 'KNOWLEDGE';

    // 1. Strict fail-closed payload validation
    assertValidInformationPayload(payload.modality, payload);

    // 2. Check for conflicting existing objectId
    if (this._store.has(options.objectId, tenantId)) {
      throw new NativeInformationValidationError(
        `Object "${options.objectId}" already exists for tenant "${tenantId}". Use updateInformation() instead.`
      );
    }

    // 3. Cryptographic digest computations
    const contentHash = computeInformationContentHash(payload);
    const checksum = computeInformationChecksum(
      {
        objectId: options.objectId,
        tenantId,
        domain,
        stateVersion: 1,
      },
      payload
    );

    // 4. Map into Phase 1 DeterministicState
    const mathState = informationPayloadToDeterministicState(options.objectId, payload);

    // 5. Store into Phase 2 NativeSparseMemoryStore via NativeStateBridge
    const binding = this._bridge.store(mathState, {
      tenantId,
      domain,
      cellId: options.cellId,
      tags: [payload.modality.toLowerCase(), 'information-payload'],
      label: `Information [${payload.modality}] ${options.objectId}`,
      attributes: {
        infoChecksum: checksum,
        infoModality: payload.modality,
        ...(options.metadata || {}),
      },
    });

    // 6. Record index reference
    const indexRef = this._index.lookupByObjectId(options.objectId, tenantId) ?? undefined;

    // 7. Register content hash in deduplication map
    const contentKey = `${tenantId}:${contentHash}`;
    if (!this._contentMap.has(contentKey)) {
      this._contentMap.set(contentKey, options.objectId);
    }

    const now = (options as any)?.timestamp ?? Date.now();
    const identity: CanonicalInformationIdentity = {
      objectId: options.objectId,
      tenantId,
      storageKey: `${tenantId}:${options.objectId}`,
      domain,
      stateVersion: 1,
      checksum,
      contentHash,
    };

    const infoObject: NativeInformationObject = {
      mathType: 'NATIVE_INFORMATION_OBJECT',
      identity,
      modality: payload.modality,
      payload,
      stateBinding: binding,
      indexReference: indexRef,
      timestamps: {
        createdAt: now,
        updatedAt: now,
      },
      metadata: options.metadata,
    };

    return deepFreeze(infoObject);
  }

  /**
   * Updates an existing NativeInformationObject, monotonically advancing its stateVersion and checksum lineage.
   */
  public updateInformation(
    objectId: string,
    payload: InformationPayload,
    tenantId = DEFAULT_TENANT_ID
  ): NativeInformationObject {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const existingRecord = this._store.get(objectId, tenantId);
    if (!existingRecord) {
      throw new NativeInformationValidationError(
        `Cannot update non-existent information object "${objectId}" in tenant "${tenantId}"`
      );
    }

    // 1. Validate payload
    assertValidInformationPayload(payload.modality, payload);

    // 2. Derive next version & lineage
    const nextVersion = existingRecord.identity.stateVersion + 1;
    const parentChecksum =
      (existingRecord.metadata.attributes?.infoChecksum as string | undefined) ??
      existingRecord.identity.checksum;
    const contentHash = computeInformationContentHash(payload);
    const checksum = computeInformationChecksum(
      {
        objectId,
        tenantId,
        domain: existingRecord.identity.domain,
        stateVersion: nextVersion,
        parentChecksum,
      },
      payload
    );

    // 3. Map to new DeterministicState
    const nextMathState = informationPayloadToDeterministicState(objectId, payload, {
      version: nextVersion,
      parentChecksum: (existingRecord.state as DeterministicState).checksum,
    });

    // 4. Update in store via StateBridge
    const binding = this._bridge.store(nextMathState, {
      tenantId,
      domain: existingRecord.identity.domain,
      cellId: existingRecord.identity.cellId,
      tags: [payload.modality.toLowerCase(), 'information-payload'],
      label: `Information [${payload.modality}] ${objectId} v${nextVersion}`,
      attributes: {
        infoChecksum: checksum,
        parentInfoChecksum: parentChecksum,
        infoModality: payload.modality,
      },
    });

    const indexRef = this._index.lookupByObjectId(objectId, tenantId) ?? undefined;

    // Update content hash map
    const contentKey = `${tenantId}:${contentHash}`;
    if (!this._contentMap.has(contentKey)) {
      this._contentMap.set(contentKey, objectId);
    }

    const now = Date.now();
    const identity: CanonicalInformationIdentity = {
      objectId,
      tenantId,
      storageKey: `${tenantId}:${objectId}`,
      domain: existingRecord.identity.domain,
      stateVersion: nextVersion,
      checksum,
      contentHash,
      parentChecksum,
    };

    const infoObject: NativeInformationObject = {
      mathType: 'NATIVE_INFORMATION_OBJECT',
      identity,
      modality: payload.modality,
      payload,
      stateBinding: binding,
      indexReference: indexRef,
      timestamps: {
        createdAt: existingRecord.metadata.createdAt,
        updatedAt: now,
      },
    };

    return deepFreeze(infoObject);
  }

  /**
   * Retrieves and reconstructs an immutable NativeInformationObject from persistent memory storage.
   */
  public getInformation(
    objectId: string,
    tenantId = DEFAULT_TENANT_ID
  ): NativeInformationObject | null {
    assertValidObjectId(objectId);
    assertValidTenantId(tenantId);

    const record = this._store.get(objectId, tenantId);
    if (!record) {
      return null;
    }

    if (!record.state || (record.state as DeterministicState).mathType !== 'DETERMINISTIC_STATE') {
      throw new NativeInformationValidationError(
        `Memory record "${objectId}" does not hold a valid DeterministicState`
      );
    }

    // Reconstruct payload from state
    const payload = deterministicStateToInformationPayload(record.state as DeterministicState);
    const contentHash = computeInformationContentHash(payload);
    const parentChecksum =
      (record.metadata.attributes?.parentInfoChecksum as string | undefined) ?? undefined;
    const checksum =
      (record.metadata.attributes?.infoChecksum as string | undefined) ??
      computeInformationChecksum(
        {
          objectId,
          tenantId,
          domain: record.identity.domain,
          stateVersion: record.identity.stateVersion,
          parentChecksum,
        },
        payload
      );

    const indexRef = this._index.lookupByObjectId(objectId, tenantId) ?? undefined;
    const binding = NativeStateBridge.createBinding(record.state as DeterministicState, record);

    const identity: CanonicalInformationIdentity = {
      objectId,
      tenantId,
      storageKey: record.storageKey,
      domain: record.identity.domain,
      stateVersion: record.identity.stateVersion,
      checksum,
      contentHash,
      parentChecksum,
    };

    const infoObject: NativeInformationObject = {
      mathType: 'NATIVE_INFORMATION_OBJECT',
      identity,
      modality: payload.modality,
      payload,
      stateBinding: binding,
      indexReference: indexRef,
      timestamps: {
        createdAt: record.metadata.createdAt,
        updatedAt: record.metadata.updatedAt,
      },
      metadata: record.metadata.attributes ? { ...record.metadata.attributes } : undefined,
    };

    return deepFreeze(infoObject);
  }

  /**
   * Checks if an identical payload already exists in memory storage.
   * If found, returns the canonical objectId to allow aliasing/referencing without duplication.
   */
  public deduplicate(
    payload: InformationPayload,
    tenantId = DEFAULT_TENANT_ID
  ): {
    readonly isDuplicate: boolean;
    readonly canonicalObjectId?: string;
    readonly contentHash: string;
  } {
    assertValidInformationPayload(payload.modality, payload);
    assertValidTenantId(tenantId);

    const contentHash = computeInformationContentHash(payload);
    const contentKey = `${tenantId}:${contentHash}`;
    const canonicalObjectId = this._contentMap.get(contentKey);

    return Object.freeze({
      isDuplicate: canonicalObjectId !== undefined,
      canonicalObjectId,
      contentHash,
    });
  }

  /**
   * Creates a lightweight alias reference pointer to an existing canonical information object.
   */
  public createReference(
    aliasObjectId: string,
    canonicalObjectId: string,
    tenantId = DEFAULT_TENANT_ID
  ): InformationReference {
    assertValidObjectId(aliasObjectId);
    assertValidObjectId(canonicalObjectId);
    assertValidTenantId(tenantId);

    const canonicalInfo = this.getInformation(canonicalObjectId, tenantId);
    if (!canonicalInfo) {
      throw new NativeInformationValidationError(
        `Cannot create alias: canonical object "${canonicalObjectId}" does not exist in tenant "${tenantId}"`
      );
    }

    const ref: InformationReference = {
      objectId: aliasObjectId,
      tenantId,
      storageKey: `${tenantId}:${aliasObjectId}`,
      contentHash: canonicalInfo.identity.contentHash,
      checksum: canonicalInfo.identity.checksum,
      isAlias: true,
      canonicalObjectId,
    };

    return Object.freeze(ref);
  }
}
