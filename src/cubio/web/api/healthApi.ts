/**
 * CUBiO AI — Phase 11: Web Studio Health, Readiness, Models, and Usage API
 * src/cubio/web/api/healthApi.ts
 */

import { CubiOApiClient } from './apiClient';
import { SystemModelStatus, SystemReadiness, UserUsageMetrics } from '../types';

export interface HealthStatusResponse {
  readonly status: 'ok';
  readonly uptime: number;
  readonly timestamp: string;
}

export async function fetchHealth(client: CubiOApiClient): Promise<HealthStatusResponse> {
  return client.request<HealthStatusResponse>('/health', {
    overrideToken: null, // Public probe
  });
}

export async function fetchReadiness(client: CubiOApiClient): Promise<SystemReadiness> {
  return client.request<SystemReadiness>('/readiness', {
    overrideToken: null, // Public probe
  });
}

export async function fetchModels(client: CubiOApiClient): Promise<SystemModelStatus> {
  return client.request<SystemModelStatus>('/models', {
    overrideToken: null, // Public metadata
  });
}

export async function fetchUsage(client: CubiOApiClient): Promise<UserUsageMetrics> {
  return client.request<UserUsageMetrics>('/usage');
}
