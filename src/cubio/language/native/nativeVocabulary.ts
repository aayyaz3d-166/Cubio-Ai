/**
 * CUBiO AI — Phase 6: Task 74 & 75
 * Native Language Representation & Vocabulary Expansion Layer
 * src/cubio/language/native/nativeVocabulary.ts
 *
 * Sovereign Native Vocabulary with Controlled Monotonic Expansion.
 * Guarantees:
 * 1. Strict monotonic token ID preservation across version upgrades.
 * 2. Immutable token positions once committed.
 * 3. Provenance tracking for newly learned tokens.
 * 4. Merkle root integrity chaining linking parent and child versions.
 * 5. Full checkpoint serialization and deserialization.
 */

import * as crypto from 'crypto';
import {
  NativeVocabularyMetadata,
  SpecialTokensMap,
  VocabularyExhaustedError,
  DEFAULT_LANGUAGE_BUDGET,
} from './languageTypes';
import {
  TokenProvenance,
  VocabularyCheckpoint,
  InvalidCheckpointError,
  VocabularyExpansionError,
} from './expansionTypes';

export const SPECIAL_TOKENS: SpecialTokensMap = Object.freeze({
  PAD: 0,
  UNK: 1,
  BOS: 2,
  EOS: 3,
  FACT: 4,
  EVIDENCE: 5,
  HYPOTHESIS: 6,
  UNKNOWN: 7,
  MASK: 8,
});

export const SPECIAL_TOKEN_SYMBOLS: readonly string[] = Object.freeze([
  '<pad>',
  '<unk>',
  '<bos>',
  '<eos>',
  '<fact>',
  '<evidence>',
  '<hypothesis>',
  '<unknown>',
  '<mask>',
]);

/**
 * Generates the canonical byte fallback tokens: <0x00> through <0xFF>
 */
export function generateByteFallbackTokens(): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < 256; i++) {
    const hex = i.toString(16).padStart(2, '0').toUpperCase();
    tokens.push(`<0x${hex}>`);
  }
  return tokens;
}

/**
 * Canonical native vocabulary seed list.
 */
export const CANONICAL_VOCAB_SEEDS: readonly string[] = Object.freeze([
  // Whitespace and punctuation
  ' ', '\n', '\t', '.', ',', '?', '!', ':', ';', '-', '_', '(', ')', '[', ']', '{', '}',
  '"', "'", '`', '/', '\\', '@', '#', '$', '%', '^', '&', '*', '+', '=', '<', '>', '~', '|',
  // Digits
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  // Basic alphabet
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  // Common grammatical and functional words
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
  'and', 'or', 'not', 'but', 'if', 'then', 'else', 'when', 'while', 'where', 'why', 'how', 'which', 'what', 'who', 'whom', 'this', 'that', 'these', 'those',
  'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'their', 'our',
  // Logic, reasoning, and epistemic terms
  'fact', 'evidence', 'hypothesis', 'unknown', 'assumption', 'proof', 'axiom', 'theorem', 'premise', 'inference', 'deduction', 'contradiction', 'truth', 'falsehood', 'valid', 'invalid', 'consistent', 'inconsistent', 'provable', 'unprovable', 'certain', 'uncertain', 'confidence', 'support', 'refute', 'neutral', 'state', 'rule', 'predicate', 'subject', 'object', 'relation', 'property', 'entropy', 'probability', 'distribution', 'sample', 'dimension', 'lattice', 'vector', 'matrix', 'tensor', 'spatial', 'cell', 'coordinate', 'manifold', 'curvature', 'topology', 'node', 'edge', 'graph', 'tree', 'dag', 'checksum', 'hash', 'signature', 'version', 'tenant', 'memory', 'sparse', 'dense', 'cluster', 'index', 'retrieval', 'learning', 'adaptation', 'gradient', 'loss', 'weight', 'parameter', 'optimization', 'convergence', 'regularization', 'fisher', 'replay', 'consolidation', 'retention', 'forgetting', 'transfer', 'generalization', 'capacity', 'scaling', 'model', 'agent', 'engine', 'runtime', 'client', 'server', 'protocol', 'message', 'event', 'signal', 'actuation', 'boundary', 'safety', 'deterministic', 'stochastic', 'canonical', 'sovereign', 'multimodal', 'audio', 'vision', 'text', 'numeric', 'categorical', 'structured', 'system', 'subsystem', 'core', 'native',
  // Physical & empirical concepts
  'mass', 'energy', 'light', 'speed', 'gravity', 'velocity', 'acceleration', 'force', 'momentum', 'charge', 'field', 'potential', 'wave', 'particle', 'frequency', 'wavelength', 'amplitude', 'quantum', 'spin', 'boson', 'fermion', 'atom', 'molecule', 'electron', 'proton', 'neutron', 'photon', 'sun', 'earth', 'moon', 'star', 'planet', 'orbit', 'temperature', 'kelvin', 'celsius', 'heat', 'pressure', 'volume', 'density', 'fluid', 'solid', 'gas', 'plasma', 'time', 'second', 'meter', 'kilogram', 'joule', 'watt', 'hertz', 'volt', 'ampere',
  // Common actions and states
  'has', 'have', 'had', 'do', 'does', 'did', 'make', 'made', 'get', 'got', 'give', 'given', 'take', 'taken', 'see', 'seen', 'know', 'known', 'think', 'thought', 'find', 'found', 'say', 'said', 'call', 'called', 'use', 'used', 'create', 'update', 'delete', 'store', 'load', 'execute', 'run', 'test', 'verify', 'certify', 'measure', 'record', 'track', 'detect', 'project', 'ground', 'bind', 'contain', 'include', 'exclude', 'equal', 'greater', 'less', 'high', 'low', 'increase', 'decrease', 'positive', 'negative', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  // Multilingual indicators / script tokens
  'urdu', 'arabic', 'chinese', 'latin', 'unicode', 'utf8', 'token', 'sequence', 'symbol', 'word', 'subword',
]);

export class NativeVocabulary {
  private static _instance: NativeVocabulary | null = null;

  private readonly _vocabId: string;
  private readonly _version: string;
  private readonly _parentVersion?: string;
  private readonly _parentMerkleRoot?: string;
  private readonly _idToSymbol: readonly string[];
  private readonly _symbolToId: ReadonlyMap<string, number>;
  private readonly _provenanceMap: ReadonlyMap<number, TokenProvenance>;
  private readonly _merkleRoot: string;
  private readonly _createdAt: number;

  constructor(
    customWordsOrAllSymbols: readonly string[] = [],
    version = '1.0.0',
    vocabId = 'cubio-native-vocab-v1',
    parentVersion?: string,
    parentMerkleRoot?: string,
    provenanceMap?: ReadonlyMap<number, TokenProvenance> | Record<number, TokenProvenance>,
    isFullSymbolList = false
  ) {
    this._vocabId = vocabId;
    this._version = version;
    this._parentVersion = parentVersion;
    this._parentMerkleRoot = parentMerkleRoot;
    this._createdAt = 1700000000000;

    const symbols: string[] = [];
    const seen = new Set<string>();

    if (isFullSymbolList) {
      for (const sym of customWordsOrAllSymbols) {
        symbols.push(sym);
        seen.add(sym);
      }
    } else {
      // 1. Special tokens (strictly 0..8)
      for (const sym of SPECIAL_TOKEN_SYMBOLS) {
        symbols.push(sym);
        seen.add(sym);
      }

      // 2. Byte fallback tokens (strictly 9..264)
      for (const byteSym of generateByteFallbackTokens()) {
        symbols.push(byteSym);
        seen.add(byteSym);
      }

      // 3. Canonical seeds
      for (const seed of CANONICAL_VOCAB_SEEDS) {
        if (!seen.has(seed)) {
          symbols.push(seed);
          seen.add(seed);
        }
      }

      // 4. Custom additional words (deterministic order)
      for (const word of customWordsOrAllSymbols) {
        if (!seen.has(word)) {
          symbols.push(word);
          seen.add(word);
        }
      }
    }

    this._idToSymbol = Object.freeze([...symbols]);

    const symbolMap = new Map<string, number>();
    for (let i = 0; i < symbols.length; i++) {
      symbolMap.set(symbols[i], i);
    }
    this._symbolToId = Object.freeze(symbolMap);

    // Provenance map
    const provMap = new Map<number, TokenProvenance>();
    if (provenanceMap) {
      if (provenanceMap instanceof Map) {
        for (const [k, v] of provenanceMap.entries()) {
          provMap.set(k, v);
        }
      } else {
        for (const [k, v] of Object.entries(provenanceMap)) {
          provMap.set(Number(k), v);
        }
      }
    }
    this._provenanceMap = Object.freeze(provMap);

    // Compute Merkle Root
    this._merkleRoot = this._computeMerkleRoot(this._idToSymbol, this._parentMerkleRoot);
  }

  public static getInstance(): NativeVocabulary {
    if (!NativeVocabulary._instance) {
      NativeVocabulary._instance = new NativeVocabulary();
    }
    return NativeVocabulary._instance;
  }

  public static setInstance(vocab: NativeVocabulary): void {
    NativeVocabulary._instance = vocab;
  }

  public get vocabId(): string {
    return this._vocabId;
  }

  public get version(): string {
    return this._version;
  }

  public get parentVersion(): string | undefined {
    return this._parentVersion;
  }

  public get parentMerkleRoot(): string | undefined {
    return this._parentMerkleRoot;
  }

  public get size(): number {
    return this._idToSymbol.length;
  }

  public get merkleRoot(): string {
    return this._merkleRoot;
  }

  public get specialTokens(): SpecialTokensMap {
    return SPECIAL_TOKENS;
  }

  public get symbols(): readonly string[] {
    return this._idToSymbol;
  }

  public getMetadata(): NativeVocabularyMetadata {
    return Object.freeze({
      vocabId: this._vocabId,
      version: this._version,
      size: this._idToSymbol.length,
      merkleRoot: this._merkleRoot,
      createdAt: this._createdAt,
      specialTokens: SPECIAL_TOKENS,
    });
  }

  public getId(symbol: string): number {
    const id = this._symbolToId.get(symbol);
    if (id !== undefined) {
      return id;
    }
    return SPECIAL_TOKENS.UNK;
  }

  public getSymbol(id: number): string {
    if (id >= 0 && id < this._idToSymbol.length) {
      return this._idToSymbol[id];
    }
    return SPECIAL_TOKEN_SYMBOLS[SPECIAL_TOKENS.UNK];
  }

  public has(symbol: string): boolean {
    return this._symbolToId.has(symbol);
  }

  public getByteToken(byteVal: number): string {
    const clamped = Math.max(0, Math.min(255, byteVal & 0xff));
    const hex = clamped.toString(16).padStart(2, '0').toUpperCase();
    return `<0x${hex}>`;
  }

  public getByteTokenId(byteVal: number): number {
    const sym = this.getByteToken(byteVal);
    return this._symbolToId.get(sym) ?? SPECIAL_TOKENS.UNK;
  }

  public getProvenance(tokenId: number): TokenProvenance | undefined {
    return this._provenanceMap.get(tokenId);
  }

  public getAllProvenance(): ReadonlyMap<number, TokenProvenance> {
    return this._provenanceMap;
  }

  /**
   * Expands this vocabulary monotonically with new tokens.
   * INVARIANT: All existing token IDs (0..K-1) remain completely identical and frozen.
   * New tokens receive strictly sequential IDs starting at K.
   */
  public expand(
    newItems: readonly { symbol: string; provenance: TokenProvenance }[],
    newVersion: string
  ): NativeVocabulary {
    if (!newVersion || newVersion === this._version) {
      throw new VocabularyExpansionError(
        `Expanded vocabulary must receive a distinct new version. Current: ${this._version}, Proposed: ${newVersion}`
      );
    }

    const currentSize = this._idToSymbol.length;
    const maxCapacity = DEFAULT_LANGUAGE_BUDGET.maxVocabularySize;

    if (currentSize + newItems.length > maxCapacity) {
      throw new VocabularyExhaustedError(
        `Vocabulary expansion would exceed capacity (${currentSize + newItems.length} > ${maxCapacity})`
      );
    }

    const updatedSymbols = [...this._idToSymbol];
    const updatedProvMap = new Map<number, TokenProvenance>(this._provenanceMap);

    let nextId = currentSize;
    for (const item of newItems) {
      if (this.has(item.symbol)) {
        continue; // Skip existing tokens without modifying existing IDs
      }

      const assignedId = nextId++;
      updatedSymbols.push(item.symbol);

      const prov: TokenProvenance = {
        ...item.provenance,
        tokenId: assignedId,
        addedInVersion: newVersion,
      };
      updatedProvMap.set(assignedId, prov);
    }

    return new NativeVocabulary(
      updatedSymbols,
      newVersion,
      this._vocabId,
      this._version,
      this._merkleRoot,
      updatedProvMap,
      true // isFullSymbolList = true
    );
  }

  /**
   * Serializes current vocabulary state into an exportable checkpoint.
   */
  public exportCheckpoint(): VocabularyCheckpoint {
    const provRecord: Record<number, TokenProvenance> = {};
    for (const [k, v] of this._provenanceMap.entries()) {
      provRecord[k] = v;
    }

    return Object.freeze({
      vocabId: this._vocabId,
      version: this._version,
      parentVersion: this._parentVersion,
      merkleRoot: this._merkleRoot,
      parentMerkleRoot: this._parentMerkleRoot,
      tokens: this._idToSymbol,
      provenanceMap: Object.freeze(provRecord),
      size: this._idToSymbol.length,
      createdAt: this._createdAt,
    });
  }

  /**
   * Recreates a NativeVocabulary instance from a valid checkpoint.
   */
  public static fromCheckpoint(checkpoint: VocabularyCheckpoint): NativeVocabulary {
    if (!checkpoint || !checkpoint.tokens || !checkpoint.version || !checkpoint.merkleRoot) {
      throw new InvalidCheckpointError('Malformed checkpoint payload');
    }

    const vocab = new NativeVocabulary(
      checkpoint.tokens,
      checkpoint.version,
      checkpoint.vocabId,
      checkpoint.parentVersion,
      checkpoint.parentMerkleRoot,
      checkpoint.provenanceMap,
      true // isFullSymbolList = true
    );

    if (vocab.merkleRoot !== checkpoint.merkleRoot) {
      throw new InvalidCheckpointError(
        `Checkpoint Merkle root mismatch: expected ${checkpoint.merkleRoot}, computed ${vocab.merkleRoot}`
      );
    }

    return vocab;
  }

  /**
   * Computes a cryptographic Merkle tree root over all vocabulary entries, chained with parentMerkleRoot.
   */
  private _computeMerkleRoot(entries: readonly string[], parentRoot?: string): string {
    if (entries.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_VOCAB').digest('hex');
    }

    let hashes = entries.map((entry, idx) => {
      return crypto
        .createHash('sha256')
        .update(`${idx}:${entry}`, 'utf8')
        .digest('hex');
    });

    if (parentRoot) {
      // Chain parent Merkle root into genesis node
      hashes.unshift(crypto.createHash('sha256').update(`PARENT:${parentRoot}`).digest('hex'));
    }

    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          const combined = hashes[i] + hashes[i + 1];
          nextLevel.push(crypto.createHash('sha256').update(combined, 'utf8').digest('hex'));
        } else {
          // Odd element chained with itself
          const combined = hashes[i] + hashes[i];
          nextLevel.push(crypto.createHash('sha256').update(combined, 'utf8').digest('hex'));
        }
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }
}
