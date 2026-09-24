/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-20: Developer Repository Interfaces
 */

import { DeveloperProject, ApiKeyRecord } from '../types';

export interface IDeveloperRepository {
  // Projects
  saveProject(project: DeveloperProject): Promise<void>;
  getProject(projectId: string): Promise<DeveloperProject | undefined>;
  listProjects(developerCubId?: string): Promise<readonly DeveloperProject[]>;

  // API Keys
  saveApiKey(keyRecord: ApiKeyRecord): Promise<void>;
  getApiKey(keyId: string): Promise<ApiKeyRecord | undefined>;
  getApiKeyByPrefix(prefix: string): Promise<ApiKeyRecord | undefined>;
  listApiKeys(projectId: string): Promise<readonly ApiKeyRecord[]>;

  // Rate Limiting
  recordUsage(keyId: string, limitPerMin: number): Promise<{ allowed: boolean; currentCount: number; limit: number }>;
}
