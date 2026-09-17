import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConversationState } from './conversationState';

export class ContextManager {
  public static readonly DEFAULT_STORAGE_PATH = path.resolve(process.cwd(), 'data', 'cubio_sessions.json');
  private static instance: ContextManager | null = null;
  private readonly sessions: Map<string, ConversationState> = new Map();
  private readonly tenantMemories: Map<string, Map<string, string>> = new Map();

  public static getInstance(autoload: boolean = true): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
      if (autoload) {
        try {
          ContextManager.instance.loadFromDisk();
        } catch {}
      }
    }
    return ContextManager.instance;
  }

  public getOrCreateSession(sessionId: string, tenantId: string = 'tenant_default'): ConversationState {
    let session = this.sessions.get(sessionId);
    if (session) {
      // Strict Cryptographic Tenant Isolation
      if (session.tenantId !== tenantId) {
        throw new Error(`ACCESS_DENIED: Tenant isolation violation. Session ${sessionId} belongs to tenant ${session.tenantId}, requested by ${tenantId}.`);
      }
      if (session.isDeleted) {
        session.restore();
      }
      return session;
    }

    session = new ConversationState(sessionId, tenantId);
    // Pre-populate with existing tenant memory if available
    const tenantMem = this.tenantMemories.get(tenantId);
    if (tenantMem) {
      for (const [k, v] of tenantMem.entries()) {
        session.setMemory(k, v);
      }
    }
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string, tenantId: string = 'tenant_default'): ConversationState | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.tenantId !== tenantId) {
      throw new Error(`ACCESS_DENIED: Tenant isolation violation. Session ${sessionId} belongs to tenant ${session.tenantId}, requested by ${tenantId}.`);
    }
    if (session.isDeleted) return undefined;
    return session;
  }

  public setTenantMemory(tenantId: string, key: string, value: string): void {
    let mem = this.tenantMemories.get(tenantId);
    if (!mem) {
      mem = new Map();
      this.tenantMemories.set(tenantId, mem);
    }
    mem.set(key, value);

    // Synchronize active sessions for this tenant
    for (const session of this.sessions.values()) {
      if (session.tenantId === tenantId && !session.isDeleted) {
        session.setMemory(key, value);
      }
    }
  }

  public getTenantMemory(tenantId: string, key: string): string | undefined {
    return this.tenantMemories.get(tenantId)?.get(key);
  }

  public deleteSession(sessionId: string, tenantId: string = 'tenant_default', softDelete: boolean = true): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    if (session.tenantId !== tenantId) {
      throw new Error(`ACCESS_DENIED: Tenant isolation violation during deletion.`);
    }
    if (softDelete) {
      session.softDelete();
      return true;
    }
    return this.sessions.delete(sessionId);
  }

  public getActiveSessionCount(tenantId?: string): number {
    if (!tenantId) {
      return Array.from(this.sessions.values()).filter(s => !s.isDeleted).length;
    }
    return Array.from(this.sessions.values()).filter(s => s.tenantId === tenantId && !s.isDeleted).length;
  }

  public saveToDisk(filepath: string = ContextManager.DEFAULT_STORAGE_PATH): void {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload: Record<string, any> = {
      version: '1.0.0',
      timestamp: Date.now(),
      sessions: Array.from(this.sessions.values()).map(s => s.toJSON()),
      tenantMemories: {},
    };

    for (const [tId, memMap] of this.tenantMemories.entries()) {
      const memObj: Record<string, string> = {};
      for (const [k, v] of memMap.entries()) {
        memObj[k] = v;
      }
      payload.tenantMemories[tId] = memObj;
    }

    const jsonStr = JSON.stringify(payload, null, 2);
    const checksum = crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
    const finalWrapper = JSON.stringify({ checksum, data: payload }, null, 2);

    fs.writeFileSync(filepath, finalWrapper, 'utf8');
  }

  public loadFromDisk(filepath: string = ContextManager.DEFAULT_STORAGE_PATH): boolean {
    if (!fs.existsSync(filepath)) return false;
    try {
      const raw = fs.readFileSync(filepath, 'utf8');
      const wrapper = JSON.parse(raw);
      const computedChecksum = crypto.createHash('sha256').update(JSON.stringify(wrapper.data, null, 2), 'utf8').digest('hex');

      if (wrapper.checksum && wrapper.checksum !== computedChecksum) {
        throw new Error('CORRUPTION_DETECTED: State checksum mismatch during cold restart load.');
      }

      this.clear();
      const payload = wrapper.data;

      if (Array.isArray(payload.sessions)) {
        for (const sData of payload.sessions) {
          const session = ConversationState.fromJSON(sData);
          this.sessions.set(session.sessionId, session);
        }
      }

      if (payload.tenantMemories && typeof payload.tenantMemories === 'object') {
        for (const [tId, memObj] of Object.entries(payload.tenantMemories)) {
          const map = new Map<string, string>();
          for (const [k, v] of Object.entries(memObj as Record<string, string>)) {
            map.set(k, String(v));
          }
          this.tenantMemories.set(tId, map);
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  public clear(): void {
    this.sessions.clear();
    this.tenantMemories.clear();
  }
}

