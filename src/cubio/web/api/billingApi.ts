/**
 * CUBiO AI — Phase 12: Web Studio Billing & Account API Client
 * src/cubio/web/api/billingApi.ts
 */

import { CubiOApiClient } from './apiClient';
import { AccountResponse, PlanInfo } from '../types';

export async function fetchAccount(client: CubiOApiClient): Promise<AccountResponse> {
  const res = await client.get<AccountResponse>('/account');
  if (res.error || !res.data) {
    throw new Error(res.error?.detail || 'Failed to retrieve account and subscription state.');
  }
  return res.data;
}

export async function fetchPlans(client: CubiOApiClient): Promise<PlanInfo[]> {
  const res = await client.get<{ plans: PlanInfo[] }>('/billing/plans');
  if (res.error || !res.data) {
    throw new Error(res.error?.detail || 'Failed to retrieve canonical plan catalog.');
  }
  return res.data.plans;
}

export async function initiateCheckout(
  client: CubiOApiClient,
  planId: string
): Promise<{ checkoutUrl: string; tenantId: string; planId: string }> {
  const res = await client.post<{ checkoutUrl: string; tenantId: string; planId: string }>(
    '/billing/checkout',
    { planId }
  );
  if (res.error || !res.data) {
    throw new Error(res.error?.detail || 'Failed to initiate checkout session.');
  }
  return res.data;
}
