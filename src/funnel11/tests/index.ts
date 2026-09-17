/**
 * 3D Memory Studio - Funnel 11 Test Suite
 * 
 * Exports all test cases for Funnel 11:
 * - TC-F11-01: Repeated profitable composite
 * - TC-F11-02: Single occurrence evaluation
 * - TC-F11-03: Definition metadata cost
 * - TC-F11-04: Reference metadata cost
 * - TC-F11-05: No actual savings rejection
 * - TC-F11-06: 100% Deterministic execution
 * - TC-F11-07: High entropy & incompressible data
 * - TC-F11-08: Cross-block candidate rejection
 * - TC-F11-09: Overlap conflict resolution & coverage validation
 * - TC-F11-10: End-to-end integration with Funnel 10
 */

export * from './repeated-profitable.test';
export * from './single-occurrence.test';
export * from './definition-cost.test';
export * from './reference-cost.test';
export * from './rejection.test';
export * from './deterministic.test';
export * from './high-entropy.test';
export * from './cross-block.test';
export * from './coverage-conflict.test';
export * from './integration.test';
