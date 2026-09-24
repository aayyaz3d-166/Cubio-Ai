/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-20: In-Memory Developer Repository
 */

import { DeveloperProject, ApiKeyRecord } from '../types';
import { IDeveloperRepository } from './types';

export class MemoryDeveloperRepository implements IDeveloperRepository {
  private projects: Map<string, DeveloperProject> = new Map();
  private keysById: Map<string, ApiKeyRecord> = new Map();
  private keysByPrefix: Map<string, ApiKeyRecord> = new Map();

  // Sliding window rate limit map: keyId -> Array of timestamps
  private rateLimitTimestamps: Map<string, number[]> = new Map();

  // --- PROJECTS ---

  public async saveProject(project: DeveloperProject): Promise<void> {
    this.projects.set(project.projectId, Object.freeze({ ...project }));
  }

  public async getProject(projectId: string): Promise<DeveloperProject | undefined> {
    return this.projects.get(projectId);
  }

  public async listProjects(developerCubId?: string): Promise<readonly DeveloperProject[]> {
    let list = Array.from(this.projects.values());
    if (developerCubId) {
      list = list.filter((p) => p.developerCubId === developerCubId);
    }
    return Object.freeze(list);
  }

  // --- API KEYS ---

  public async saveApiKey(keyRecord: ApiKeyRecord): Promise<void> {
    const frozen = Object.freeze({ ...keyRecord });
    this.keysById.set(keyRecord.keyId, frozen);
    this.keysByPrefix.set(keyRecord.keyPrefix, frozen);
  }

  public async getApiKey(keyId: string): Promise<ApiKeyRecord | undefined> {
    return this.keysById.get(keyId);
  }

  public async getApiKeyByPrefix(prefix: string): Promise<ApiKeyRecord | undefined> {
    return this.keysByPrefix.get(prefix);
  }

  public async listApiKeys(projectId: string): Promise<readonly ApiKeyRecord[]> {
    const list = Array.from(this.keysById.values()).filter((k) => k.projectId === projectId);
    return Object.freeze(list);
  }

  // --- RATE LIMITING ---

  public async recordUsage(
    keyId: string,
    limitPerMin: number
  ): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    let timestamps = this.rateLimitTimestamps.get(keyId) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limitPerMin) {
      this.rateLimitTimestamps.set(keyId, timestamps);
      return { allowed: false, currentCount: timestamps.length, limit: limitPerMin };
    }

    timestamps.push(now);
    this.rateLimitTimestamps.set(keyId, timestamps);
    return { allowed: true, currentCount: timestamps.length, limit: limitPerMin };
  }
}
