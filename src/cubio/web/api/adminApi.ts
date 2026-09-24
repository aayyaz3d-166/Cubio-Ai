/**
 * CUBiO AI — Phase 28 Task 450: Web Studio Admin API Client
 * src/cubio/web/api/adminApi.ts
 *
 * Client methods for administrative operations on /api/v1/admin/*
 */

import { CubiOApiClient } from './apiClient';
import {
  AdminChildRecord,
  AdminPermissionsResponse,
  AdminModelAvailabilityResponse,
} from '../types';

export interface AdminChildrenResponse {
  readonly success: boolean;
  readonly count: number;
  readonly children: readonly AdminChildRecord[];
  readonly timestamp: string;
}

export interface AdminLifecycleRequest {
  readonly action: 'ACTIVATE' | 'DISABLE' | 'UPDATE' | 'RETIRE' | 'INSTALL';
  readonly childId: string;
  readonly patch?: {
    readonly agentName?: string;
    readonly semanticVersion?: string;
    readonly description?: string;
  };
  readonly config?: {
    readonly childId: string;
    readonly agentName: string;
    readonly semanticVersion: string;
    readonly role: string;
    readonly description: string;
    readonly customMaxTokens?: number;
  };
}

export interface AdminLifecycleResponse {
  readonly success: boolean;
  readonly action: string;
  readonly child: AdminChildRecord;
  readonly timestamp: string;
}

export async function fetchAdminChildren(client: CubiOApiClient): Promise<AdminChildrenResponse> {
  return client.request<AdminChildrenResponse>('/admin/children', {
    method: 'GET',
  });
}

export async function mutateChildLifecycle(
  client: CubiOApiClient,
  req: AdminLifecycleRequest
): Promise<AdminLifecycleResponse> {
  return client.request<AdminLifecycleResponse>('/admin/children/lifecycle', {
    method: 'POST',
    body: req,
  });
}

export async function fetchAdminPermissions(client: CubiOApiClient): Promise<AdminPermissionsResponse> {
  return client.request<AdminPermissionsResponse>('/admin/permissions', {
    method: 'GET',
  });
}

export async function updateModelAvailability(
  client: CubiOApiClient,
  modelId: string,
  operationalState?: string,
  isAvailable?: boolean
): Promise<AdminModelAvailabilityResponse> {
  return client.request<AdminModelAvailabilityResponse>('/admin/models/availability', {
    method: 'POST',
    body: { modelId, operationalState, isAvailable },
  });
}

export interface AdminInstallChildRequest {
  readonly childId: string;
  readonly agentName: string;
  readonly semanticVersion: string;
  readonly role: string;
  readonly description: string;
  readonly wireProtocolVersion?: string;
  readonly permittedCapabilities?: readonly string[];
  readonly customMaxTokens?: number;
  readonly autoActivate?: boolean;
}

export interface AdminInstallChildResponse {
  readonly success: boolean;
  readonly stage: string;
  readonly child?: AdminChildRecord;
  readonly validationReport: {
    readonly isValid: boolean;
    readonly protocolCompatible: boolean;
    readonly semverValid: boolean;
    readonly roleValid: boolean;
    readonly capabilitiesPermitted: boolean;
    readonly duplicateDetected: boolean;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
  };
  readonly transactionId: string;
  readonly timestamp: string;
  readonly error?: string;
}

export async function installChildMvp(
  client: CubiOApiClient,
  req: AdminInstallChildRequest
): Promise<AdminInstallChildResponse> {
  return client.request<AdminInstallChildResponse>('/admin/children/install', {
    method: 'POST',
    body: req,
  });
}

export async function fetchChildModelPolicies(
  client: CubiOApiClient,
  childId?: string
): Promise<{ policies?: any[]; policy?: any; models?: any[]; timestamp: string }> {
  const query = childId ? `?childId=${encodeURIComponent(childId)}` : '';
  return client.request(`/admin/children/models${query}`);
}

export async function updateChildModelPolicy(
  client: CubiOApiClient,
  payload: { childId: string; allowedModelIds: string[]; defaultModelId: string }
): Promise<{ success: boolean; policy: any; timestamp: string }> {
  return client.request('/admin/children/models', {
    method: 'POST',
    body: payload,
  });
}

