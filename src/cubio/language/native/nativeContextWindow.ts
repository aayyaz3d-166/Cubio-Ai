/**
 * CUBiO AI — Phase 6: Task 76
 * Context Window & Sequence Learning Layer
 * src/cubio/language/native/nativeContextWindow.ts
 *
 * Native Bounded Context Window with Sparse Memory Referral.
 * Prevents full-VDB context dumping by maintaining an active token window
 * and seamlessly transferring out-of-window tokens into NativeSparseMemoryStore
 * as lightweight content-addressable ContextMemoryReferences.
 */

import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID, CanonicalDomain } from '../../core/canonicalIdentity';
import { NativeSparseMemoryStore } from '../../memory/native/sparseMemoryStore';
import { NativeInformationEngine } from '../../information/native/nativeInformationEngine';
import { NativeToken } from './languageTypes';
import {
  ContextWindowConfig,
  DEFAULT_CONTEXT_CONFIG,
  ContextMemoryBlock,
  ContextMemoryReference,
  SequenceStateSnapshot,
  ContextOverflowBudgetError,
  TenantContextMismatchError,
} from './contextTypes';
import { LanguageMemoryBridge } from './languageMemoryBridge';
import { NativeTokenizer } from './nativeTokenizer';

export class NativeContextWindow {
  private readonly _tenantId: string;
  private readonly _domain: CanonicalDomain;
  private readonly _config: ContextWindowConfig;
  private readonly _store: NativeSparseMemoryStore;
  private readonly _infoEngine: NativeInformationEngine;
  private readonly _bridge: LanguageMemoryBridge;
  private readonly _tokenizer: NativeTokenizer;

  private _activeTokens: NativeToken[] = [];
  private _references: ContextMemoryReference[] = [];
  private _totalTokensIngested = 0;
  private _stateVersion = 1;

  constructor(
    tenantId: string = DEFAULT_TENANT_ID,
    store?: NativeSparseMemoryStore,
    infoEngine?: NativeInformationEngine,
    config?: Partial<ContextWindowConfig>,
    domain: CanonicalDomain = 'KNOWLEDGE'
  ) {
    this._tenantId = tenantId.trim() || DEFAULT_TENANT_ID;
    this._domain = domain;
    this._config = Object.freeze({
      maxActiveTokens: config?.maxActiveTokens ?? DEFAULT_CONTEXT_CONFIG.maxActiveTokens,
      maxExtendedTokens: config?.maxExtendedTokens ?? DEFAULT_CONTEXT_CONFIG.maxExtendedTokens,
      chunkSize: config?.chunkSize ?? DEFAULT_CONTEXT_CONFIG.chunkSize,
      maxHeapBytes: config?.maxHeapBytes ?? DEFAULT_CONTEXT_CONFIG.maxHeapBytes,
      allowMemoryReferral: config?.allowMemoryReferral ?? DEFAULT_CONTEXT_CONFIG.allowMemoryReferral,
    });

    this._store = store ?? new NativeSparseMemoryStore();
    this._infoEngine = infoEngine ?? new NativeInformationEngine(this._store);
    this._tokenizer = new NativeTokenizer();
    this._bridge = new LanguageMemoryBridge(this._infoEngine, this._store, this._tokenizer);
  }

  public get tenantId(): string {
    return this._tenantId;
  }

  public get config(): ContextWindowConfig {
    return this._config;
  }

  public get activeTokenCount(): number {
    return this._activeTokens.length;
  }

  public get totalTokensIngested(): number {
    return this._totalTokensIngested;
  }

  public get referenceCount(): number {
    return this._references.length;
  }

  public get activeTokens(): readonly NativeToken[] {
    return Object.freeze([...this._activeTokens]);
  }

  public get references(): readonly ContextMemoryReference[] {
    return Object.freeze([...this._references]);
  }

  /**
   * Appends ordered tokens to the context window.
   * If the active window capacity is exceeded, automatically spills older tokens
   * into Sparse Memory as chunked ContextMemoryBlocks and retains lightweight references.
   */
  public appendTokens(tokens: readonly NativeToken[], rawTextChunk?: string): void {
    if (!tokens || tokens.length === 0) return;

    if (this._totalTokensIngested + tokens.length > this._config.maxExtendedTokens) {
      throw new ContextOverflowBudgetError(
        `Extended context capacity exceeded (${this._totalTokensIngested + tokens.length} > ${this._config.maxExtendedTokens})`
      );
    }

    // Check active window budget
    if (!this._config.allowMemoryReferral && this._activeTokens.length + tokens.length > this._config.maxActiveTokens) {
      throw new ContextOverflowBudgetError(
        `Active context window overflow (${this._activeTokens.length + tokens.length} > ${this._config.maxActiveTokens}) and memory referral is disabled`
      );
    }

    // Evict oldest chunk from active buffer while total exceeds capacity
    while (this._activeTokens.length > 0 && this._activeTokens.length + tokens.length > this._config.maxActiveTokens) {
      const evictCount = Math.min(this._config.chunkSize, this._activeTokens.length);
      const evictedTokens = this._activeTokens.splice(0, evictCount);
      this._spillToSparseMemory(evictedTokens);
    }

    // If incoming tokens alone exceed capacity, spill front chunks of incoming tokens directly
    let incoming = [...tokens];
    while (incoming.length > this._config.maxActiveTokens) {
      const spillCount = Math.min(this._config.chunkSize, incoming.length);
      const spilled = incoming.splice(0, spillCount);
      this._spillToSparseMemory(spilled);
    }

    // Append remaining tokens
    for (const t of incoming) {
      this._activeTokens.push(t);
    }
    this._totalTokensIngested += tokens.length;
    this._stateVersion++;
  }

  /**
   * Appends raw text directly to context window.
   */
  public appendText(text: string): void {
    const seq = this._tokenizer.tokenize(text, {
      tenantId: this._tenantId,
      domain: this._domain,
      maxSequenceLength: this._config.maxExtendedTokens,
    });
    this.appendTokens(seq.tokens, text);
  }

  /**
   * Queries context without loading entire database:
   * First checks active token window; then checks lightweight reference pointers.
   */
  public queryContext(keyword: string): {
    matchedActiveTokens: readonly NativeToken[];
    matchedReferences: readonly ContextMemoryReference[];
  } {
    const cleanKw = keyword.toLowerCase().trim();
    const matchedActive: NativeToken[] = [];

    // Reconstruct text from active buffer to reliably match multi-token keywords
    const activeText = this._tokenizer.detokenize(this._activeTokens).toLowerCase();
    if (activeText.includes(cleanKw)) {
      for (const t of this._activeTokens) {
        const sym = t.symbol.toLowerCase();
        if (cleanKw.includes(sym) || sym.includes(cleanKw)) {
          matchedActive.push(t);
        }
      }
      if (matchedActive.length === 0 && this._activeTokens.length > 0) {
        matchedActive.push(this._activeTokens[0]);
      }
    }

    const matchedRefs: ContextMemoryReference[] = [];
    let prevContent = '';
    let prevRef: ContextMemoryReference | null = null;

    for (const ref of this._references) {
      // Check if the referenced block in Sparse Memory contains matching text
      const stored = this._infoEngine.getInformation(ref.objectId, this._tenantId);
      if (stored && stored.modality === 'TEXT') {
        const content = (stored.payload as any).content as string;
        if (content.toLowerCase().includes(cleanKw)) {
          matchedRefs.push(ref);
        } else if (prevContent && (prevContent + content).toLowerCase().includes(cleanKw)) {
          // Boundary match across adjacent chunk partition
          if (prevRef && !matchedRefs.includes(prevRef)) {
            matchedRefs.push(prevRef);
          }
          if (!matchedRefs.includes(ref)) {
            matchedRefs.push(ref);
          }
        }
        prevContent = content;
        prevRef = ref;
      }
    }

    // Boundary match between last reference and active buffer
    if (prevContent && (prevContent + activeText).includes(cleanKw)) {
      if (prevRef && !matchedRefs.includes(prevRef)) {
        matchedRefs.push(prevRef);
      }
      if (matchedActive.length === 0 && this._activeTokens.length > 0) {
        matchedActive.push(this._activeTokens[0]);
      }
    }

    return Object.freeze({
      matchedActiveTokens: Object.freeze(matchedActive),
      matchedReferences: Object.freeze(matchedRefs),
    });
  }

  /**
   * Retrieves a specific out-of-window block by its reference objectId on demand.
   */
  public retrieveBlock(referenceObjectId: string): NativeToken[] | null {
    if (!this._store.has(referenceObjectId, this._tenantId)) {
      // Cross-tenant safety check: if entity exists under any other tenant, throw TenantContextMismatchError
      const allInfo = this._infoEngine.getAllInformation();
      for (const item of allInfo) {
        if (item.identity.objectId === referenceObjectId && item.identity.tenantId !== this._tenantId) {
          throw new TenantContextMismatchError(
            `Cross-tenant access prohibited. Block ${referenceObjectId} belongs to ${item.identity.tenantId}, caller is ${this._tenantId}`
          );
        }
      }
      return null;
    }
    const seq = this._bridge.retrieveLanguageSequence(referenceObjectId, this._tenantId);
    return seq ? [...seq.tokens] : null;
  }

  /**
   * Resets active context and references.
   */
  public clear(): void {
    this._activeTokens = [];
    this._references = [];
    this._totalTokensIngested = 0;
    this._stateVersion++;
  }

  /**
   * Serializes current context state into an immutable snapshot.
   */
  public exportState(hiddenState: Float32Array): SequenceStateSnapshot {
    const snapId = `snap_${crypto.randomBytes(8).toString('hex')}`;
    const now = Date.now();

    const checksum = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          tenantId: this._tenantId,
          activeCount: this._activeTokens.length,
          totalIngested: this._totalTokensIngested,
          stateVersion: this._stateVersion,
          refCount: this._references.length,
        })
      )
      .digest('hex');

    return Object.freeze({
      snapshotId: snapId,
      tenantId: this._tenantId,
      activeTokens: Object.freeze([...this._activeTokens]),
      hiddenState: new Float32Array(hiddenState),
      references: Object.freeze([...this._references]),
      totalTokensProcessed: this._totalTokensIngested,
      stateVersion: this._stateVersion,
      checksum,
      timestamp: now,
    });
  }

  /**
   * Restores context state from an export snapshot with strict tenant verification.
   */
  public restoreState(snapshot: SequenceStateSnapshot): void {
    if (snapshot.tenantId !== this._tenantId) {
      throw new TenantContextMismatchError(
        `Snapshot tenant (${snapshot.tenantId}) does not match window tenant (${this._tenantId})`
      );
    }

    this._activeTokens = [...snapshot.activeTokens];
    this._references = [...snapshot.references];
    this._totalTokensIngested = snapshot.totalTokensProcessed;
    this._stateVersion = snapshot.stateVersion;
  }

  /**
   * Persists evicted tokens into Sparse Memory and records a ContextMemoryReference pointer.
   */
  private _spillToSparseMemory(tokens: NativeToken[]): void {
    if (tokens.length === 0) return;

    const blockText = this._tokenizer.detokenize(tokens);
    const blockHash = crypto.createHash('sha256').update(blockText, 'utf8').digest('hex');
    const objectId = `ctx_block_${blockHash.slice(0, 10)}_${this._references.length}`;

    // Compute summary embedding (mean of tokens)
    const summaryEmbed = new Float32Array(16);
    const cellSet = new Set<number>();
    for (const t of tokens) {
      summaryEmbed[t.spatialCellId % 16] += 1.0 / tokens.length;
      cellSet.add(t.spatialCellId);
    }

    // Persist to Sparse Memory through LanguageMemoryBridge if not already stored
    if (!this._store.has(objectId, this._tenantId)) {
      const seq = this._tokenizer.tokenize(blockText, {
        tenantId: this._tenantId,
        domain: this._domain,
        objectId,
      });
      this._bridge.persistLanguageSequence(seq, this._tenantId);
    }

    // Record lightweight reference
    const ref: ContextMemoryReference = Object.freeze({
      referenceId: `ref_${blockHash.slice(0, 12)}`,
      objectId,
      tenantId: this._tenantId,
      tokenRange: Object.freeze({
        start: this._totalTokensIngested - this._activeTokens.length - tokens.length,
        end: this._totalTokensIngested - this._activeTokens.length,
      }),
      tokenCount: tokens.length,
      summaryEmbedding: summaryEmbed,
      spatialCellIds: Object.freeze(Array.from(cellSet).sort((a, b) => a - b)),
      checksum: blockHash,
      timestamp: Date.now(),
    });

    this._references.push(ref);
  }
}
