/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: Standard Test Fixtures & Initial Nodes
 *
 * Deterministic test fixtures for standard CubiO services:
 * - TERMINAL
 * - MAIL
 * - INTELLIGENCE
 * - STORAGE
 * - API
 */

import { CubiONodeRegistry } from './registry';
import { CubiONetworkNode } from './types';

export const STANDARD_TEST_NODES: readonly CubiONetworkNode[] = Object.freeze([
  Object.freeze({
    coordinate: Object.freeze({
      network: 'CUBIO',
      dimension: 0,
      zone: 1,
      node: 1,
      service: 'TERMINAL',
    }),
    uri: 'CUBIO://NETWORK/0/01/00001/TERMINAL',
    nodeName: 'Primary Terminal Console Node',
    service: 'TERMINAL',
    status: 'ACTIVE',
    registeredAt: 1700000001000,
    metadata: Object.freeze({ role: 'CORE_CONSOLE', version: '1.0.0' }),
  }),
  Object.freeze({
    coordinate: Object.freeze({
      network: 'CUBIO',
      dimension: 0,
      zone: 1,
      node: 2,
      service: 'MAIL',
    }),
    uri: 'CUBIO://NETWORK/0/01/00002/MAIL',
    nodeName: 'CubiO Sovereign Mail Post Office',
    service: 'MAIL',
    status: 'ACTIVE',
    registeredAt: 1700000002000,
    metadata: Object.freeze({ role: 'MAIL_GATEWAY', version: '1.0.0' }),
  }),
  Object.freeze({
    coordinate: Object.freeze({
      network: 'CUBIO',
      dimension: 0,
      zone: 1,
      node: 3,
      service: 'INTELLIGENCE',
    }),
    uri: 'CUBIO://NETWORK/0/01/00003/INTELLIGENCE',
    nodeName: 'CubiO Spatial Reasoning Engine Hub',
    service: 'INTELLIGENCE',
    status: 'ACTIVE',
    registeredAt: 1700000003000,
    metadata: Object.freeze({ role: 'REASONING_COGNITION', version: '1.0.0' }),
  }),
  Object.freeze({
    coordinate: Object.freeze({
      network: 'CUBIO',
      dimension: 0,
      zone: 1,
      node: 4,
      service: 'STORAGE',
    }),
    uri: 'CUBIO://NETWORK/0/01/00004/STORAGE',
    nodeName: 'CubiO CAS Spatial Storage Cluster',
    service: 'STORAGE',
    status: 'ACTIVE',
    registeredAt: 1700000004000,
    metadata: Object.freeze({ role: 'CONTENT_ADDRESSABLE_STORE', version: '1.0.0' }),
  }),
  Object.freeze({
    coordinate: Object.freeze({
      network: 'CUBIO',
      dimension: 0,
      zone: 1,
      node: 5,
      service: 'API',
    }),
    uri: 'CUBIO://NETWORK/0/01/00005/API',
    nodeName: 'CubiO Universal RPC Gateway',
    service: 'API',
    status: 'ACTIVE',
    registeredAt: 1700000005000,
    metadata: Object.freeze({ role: 'RPC_DISPATCH', version: '1.0.0' }),
  }),
]);

/**
 * Creates and initializes a registry populated with the 5 standard test fixture nodes.
 */
export function createStandardTestRegistry(): CubiONodeRegistry {
  const registry = new CubiONodeRegistry();
  for (const node of STANDARD_TEST_NODES) {
    registry.register(node);
  }
  return registry;
}
