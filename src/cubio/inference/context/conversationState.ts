/**
 * CubiO — Step 87 Conversation State
 */

import { ChatMessage } from '../types';

export class ConversationState {
  public readonly sessionId: string;
  public readonly tenantId: string;
  public readonly createdAt: number;
  public updatedAt: number;
  public isDeleted: boolean = false;
  public deletedAt?: number;
  private readonly history: ChatMessage[] = [];
  private readonly memoryStore: Map<string, string> = new Map();

  constructor(sessionId: string, tenantId: string = 'tenant_default', createdAt?: number) {
    this.sessionId = sessionId;
    this.tenantId = tenantId;
    this.createdAt = createdAt || Date.now();
    this.updatedAt = this.createdAt;
  }

  public addMessage(message: ChatMessage): void {
    if (this.isDeleted) {
      throw new Error(`Cannot add message to deleted session: ${this.sessionId}`);
    }
    this.history.push(message);
    this.updatedAt = Date.now();
  }

  public getHistory(): readonly ChatMessage[] {
    if (this.isDeleted) {
      return Object.freeze([]);
    }
    return Object.freeze([...this.history]);
  }

  public setMemory(key: string, value: string): void {
    if (this.isDeleted) {
      throw new Error(`Cannot set memory in deleted session: ${this.sessionId}`);
    }
    this.memoryStore.set(key, value);
    this.updatedAt = Date.now();
  }

  public getMemory(key: string): string | undefined {
    if (this.isDeleted) {
      return undefined;
    }
    return this.memoryStore.get(key);
  }

  public deleteMemory(key: string): boolean {
    if (this.isDeleted) {
      return false;
    }
    const result = this.memoryStore.delete(key);
    if (result) this.updatedAt = Date.now();
    return result;
  }

  public getAllMemory(): Record<string, string> {
    if (this.isDeleted) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of this.memoryStore.entries()) {
      out[k] = v;
    }
    return out;
  }

  public softDelete(): void {
    this.isDeleted = true;
    this.deletedAt = Date.now();
    this.updatedAt = Date.now();
  }

  public restore(): void {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.updatedAt = Date.now();
  }

  public toJSON(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
      history: this.history,
      memoryStore: this.getAllMemory(),
    };
  }

  public static fromJSON(data: any): ConversationState {
    const session = new ConversationState(data.sessionId, data.tenantId || 'tenant_default', data.createdAt);
    session.updatedAt = data.updatedAt || session.createdAt;
    session.isDeleted = !!data.isDeleted;
    session.deletedAt = data.deletedAt;
    if (Array.isArray(data.history)) {
      for (const msg of data.history) {
        session.history.push(msg);
      }
    }
    if (data.memoryStore && typeof data.memoryStore === 'object') {
      for (const [k, v] of Object.entries(data.memoryStore)) {
        session.memoryStore.set(k, String(v));
      }
    }
    return session;
  }
}
