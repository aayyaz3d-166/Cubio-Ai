/**
 * CUBiO AI — Phase 9: Chat & Context Engine
 * chatSession.ts
 *
 * Canonical Conversation & Session State Manager:
 * - Governs strict monotonic, gapless turn sequencing (1, 2, 3...)
 * - Enforces session, tenant, and user isolation
 * - Tracks user constraints with provenance and contradiction supersession
 * - Enforces immutability and cryptographic sealing of turns
 */

import {
  CanonicalTurn,
  TurnRole,
  VALID_TURN_ROLES,
  UserConstraint,
  ContextCompactionRecord,
  ConversationStateSnapshot,
  ChatEngineError,
  ChatErrorType,
  CHAT_ENGINE_VERSION,
} from './chatEngineContract';
import { ContextIntegrity } from './contextIntegrity';
import { PersistedMemoryEntry } from './memory/memoryTypes';

export interface AppendTurnParams {
  readonly turnId: string;
  readonly role: TurnRole;
  readonly input: string;
  readonly output: string;
  readonly contextReferences?: readonly string[];
  readonly memoryReferences?: readonly string[];
  readonly intent?: string;
  readonly reasoningReference?: string;
  readonly toolReferences?: readonly string[];
  readonly epistemicState?: import('../../model/native_foundation/native_model_types').EpistemicStatus;
  readonly safetyStatus?: boolean;
}

export class ChatSession {
  public readonly conversationId: string;
  public readonly sessionId: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly createdAt: number;
  public updatedAt: number;

  private readonly turns: CanonicalTurn[] = [];
  private readonly turnIdSet: Set<string> = new Set();
  private readonly constraints: UserConstraint[] = [];
  private readonly compactions: ContextCompactionRecord[] = [];
  private readonly memoryStore: Map<string, string> = new Map();
  private readonly intelligentMemoryStore: Map<string, PersistedMemoryEntry> = new Map();

  constructor(
    conversationId: string,
    sessionId: string,
    tenantId: string = 'tenant_default',
    userId: string = 'user_default',
    createdAt?: number
  ) {
    this.conversationId = conversationId;
    this.sessionId = sessionId;
    this.tenantId = tenantId;
    this.userId = userId;
    this.createdAt = createdAt ?? Date.now();
    this.updatedAt = this.createdAt;
  }

  public getTurnCount(): number {
    return this.turns.length;
  }

  public getTurns(): readonly CanonicalTurn[] {
    return Object.freeze([...this.turns]);
  }

  public getRecentTurns(count: number = 20): readonly CanonicalTurn[] {
    const slice = this.turns.slice(-count);
    return Object.freeze([...slice]);
  }

  public getTurn(turnId: string): CanonicalTurn | undefined {
    return this.turns.find((t) => t.turnId === turnId);
  }

  /**
   * Appends a new turn to the session with strict monotonic, gapless sequencing.
   */
  public appendTurn(params: AppendTurnParams): CanonicalTurn {
    // 1. Role validation
    if (!VALID_TURN_ROLES.includes(params.role)) {
      throw new ChatEngineError(
        `Invalid turn role '${params.role}'. Must be one of: ${VALID_TURN_ROLES.join(', ')}`,
        ChatErrorType.INVALID_ROLE
      );
    }

    // 2. Duplicate turn ID protection
    if (this.turnIdSet.has(params.turnId)) {
      throw new ChatEngineError(
        `Duplicate turn ID '${params.turnId}' already committed in conversation ${this.conversationId}`,
        ChatErrorType.DUPLICATE_TURN
      );
    }

    // 3. Monotonic, gapless sequence enforcement
    const nextSequence = this.turns.length + 1;
    const now = Date.now();

    const partialTurn: Omit<CanonicalTurn, 'integrityHash'> = {
      turnId: params.turnId,
      conversationId: this.conversationId,
      sessionId: this.sessionId,
      sequence: nextSequence,
      role: params.role,
      input: params.input,
      output: params.output,
      timestamp: now,
      contextReferences: Object.freeze(params.contextReferences ? [...params.contextReferences] : []),
      memoryReferences: Object.freeze(params.memoryReferences ? [...params.memoryReferences] : []),
      intent: params.intent || 'GENERAL',
      reasoningReference: params.reasoningReference,
      toolReferences: Object.freeze(params.toolReferences ? [...params.toolReferences] : []),
      epistemicState:
        params.epistemicState ??
        ('OBSERVATION' as import('../../model/native_foundation/native_model_types').EpistemicStatus),
      safetyStatus: params.safetyStatus ?? true,
    };

    const integrityHash = ContextIntegrity.computeTurnHash(partialTurn);

    const canonicalTurn: CanonicalTurn = Object.freeze({
      ...partialTurn,
      integrityHash,
    });

    this.turns.push(canonicalTurn);
    this.turnIdSet.add(canonicalTurn.turnId);
    this.updatedAt = now;

    return canonicalTurn;
  }

  /**
   * Explicit User Constraint management with provenance and supersession.
   */
  public addConstraint(key: string, value: string, provenance: string = 'USER_EXPLICIT'): UserConstraint {
    const currentSeq = this.turns.length;

    // If existing active constraint exists, mark superseded
    for (let i = 0; i < this.constraints.length; i++) {
      if (this.constraints[i].key === key && this.constraints[i].active) {
        this.constraints[i] = {
          ...this.constraints[i],
          active: false,
          supersededByTurnSequence: currentSeq,
        };
      }
    }

    const constraint: UserConstraint = Object.freeze({
      constraintId: `CST_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      key,
      value,
      setInTurnSequence: currentSeq,
      provenance,
      timestamp: Date.now(),
      active: true,
    });

    this.constraints.push(constraint);
    this.updatedAt = Date.now();
    return constraint;
  }

  public getActiveConstraints(): readonly UserConstraint[] {
    const activeList = this.constraints.filter((c) => c.active);
    return Object.freeze(activeList);
  }

  public getAllConstraints(): readonly UserConstraint[] {
    return Object.freeze([...this.constraints]);
  }

  public addCompaction(record: ContextCompactionRecord): void {
    this.compactions.push(record);
    this.updatedAt = Date.now();
  }

  public getCompactions(): readonly ContextCompactionRecord[] {
    return Object.freeze([...this.compactions]);
  }

  public setMemory(key: string, value: string): void {
    this.memoryStore.set(key, value);
    this.updatedAt = Date.now();
  }

  public getMemory(key: string): string | undefined {
    return this.memoryStore.get(key);
  }

  public getAllMemory(): Readonly<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.memoryStore.entries()) {
      out[k] = v;
    }
    // Also include any active intelligent memories
    for (const im of this.intelligentMemoryStore.values()) {
      if (im.status === 'ACTIVE' && !(im.key in out)) {
        out[im.key] = im.value;
      }
    }
    return Object.freeze(out);
  }

  // --- Phase 21 Intelligent Memory Methods ---

  public addIntelligentMemory(entry: PersistedMemoryEntry): void {
    this.intelligentMemoryStore.set(entry.memoryId, entry);
    if (entry.status === 'ACTIVE') {
      this.memoryStore.set(entry.key, entry.value);
    }
    this.updatedAt = Date.now();
  }

  public getIntelligentMemory(memoryId: string): PersistedMemoryEntry | undefined {
    return this.intelligentMemoryStore.get(memoryId);
  }

  public getAllIntelligentMemories(): readonly PersistedMemoryEntry[] {
    return Object.freeze(Array.from(this.intelligentMemoryStore.values()));
  }

  public getActiveIntelligentMemories(): readonly PersistedMemoryEntry[] {
    return Object.freeze(
      Array.from(this.intelligentMemoryStore.values()).filter((m) => m.status === 'ACTIVE')
    );
  }

  public replaceIntelligentMemories(memories: readonly PersistedMemoryEntry[]): void {
    this.intelligentMemoryStore.clear();
    for (const m of memories) {
      this.intelligentMemoryStore.set(m.memoryId, m);
      if (m.status === 'ACTIVE') {
        this.memoryStore.set(m.key, m.value);
      }
    }
    this.updatedAt = Date.now();
  }

  /**
   * Serializes session to a cryptographic, tamper-evident ConversationStateSnapshot.
   */
  public toSnapshot(): ConversationStateSnapshot {
    const intelligentMemories = this.getAllIntelligentMemories();
    const snapshotBase: Omit<ConversationStateSnapshot, 'integrityChecksum'> = {
      version: CHAT_ENGINE_VERSION,
      conversationId: this.conversationId,
      tenantId: this.tenantId,
      userId: this.userId,
      activeSessionId: this.sessionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      turns: this.turns,
      constraints: [...this.constraints],
      compactions: this.compactions,
      memoryStore: this.getAllMemory(),
      ...(intelligentMemories.length > 0 ? { intelligentMemories } : {}),
    };

    const integrityChecksum = ContextIntegrity.computeSnapshotChecksum(snapshotBase);

    return Object.freeze({
      ...snapshotBase,
      integrityChecksum,
    });
  }

  /**
   * Restores a ChatSession from a verified ConversationStateSnapshot.
   */
  public static fromSnapshot(snapshot: ConversationStateSnapshot): ChatSession {
    ContextIntegrity.assertSnapshotIntegrity(snapshot);

    const session = new ChatSession(
      snapshot.conversationId,
      snapshot.activeSessionId,
      snapshot.tenantId,
      snapshot.userId,
      snapshot.createdAt
    );

    session.updatedAt = snapshot.updatedAt;

    for (const turn of snapshot.turns) {
      session.turns.push(turn);
      session.turnIdSet.add(turn.turnId);
    }

    for (const constraint of snapshot.constraints) {
      session.constraints.push(constraint);
    }

    for (const compaction of snapshot.compactions) {
      session.compactions.push(compaction);
    }

    for (const [k, v] of Object.entries(snapshot.memoryStore)) {
      session.memoryStore.set(k, v);
    }

    if (snapshot.intelligentMemories && Array.isArray(snapshot.intelligentMemories)) {
      for (const im of snapshot.intelligentMemories) {
        session.intelligentMemoryStore.set(im.memoryId, im);
      }
    }

    return session;
  }
}
