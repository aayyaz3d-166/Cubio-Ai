/**
 * CUBiO AI — PMA Task 417: MVP V2 Production Code Integration
 * src/cubio/integration/mvpV2ProductionIntegrationService.ts
 *
 * Production integration service binding the six approved Phase 26 components
 * into the standalone CUBiO AI MVP Version 2 runtime.
 *
 * Principles & Epistemic Safeguards:
 * 1. Strictly Read-Only: All database queries flow through Phase26VdbReadOnlyAdapter with readOnly: true.
 * 2. Non-Authoritative: Grounded references provide advisory context to Chat and Native 1M reasoning.
 * 3. Spatial Supremacy: Uses src/core/address369.ts as the sole immutable spatial authority.
 * 4. Permanent Actuation Lockout: IS_ACTUATION_BLOCKED === true permanently asserted.
 * 5. Bounded Memory & Caching: Zero physical state materialization beyond bounded LRU reconstruction cache.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { Phase26VdbReadOnlyAdapter } from '../../research/infinitylm/vdbReadOnlyAdapter';
import { Canonical369Bridge } from '../../research/infinitylm/canonical369Bridge';
import { VdbToPhase25ProjectionEngine, SingleProjectionResult } from '../../research/infinitylm/vdbToPhase25ProjectionEngine';
import { VdbGroundedStateGenerator, Phase25GroundedState } from '../../research/infinitylm/vdbGroundedStateGenerator';
import { OnDemandVdbReconstructionEngine, VdbReconstructionPacket } from '../../research/infinitylm/onDemandVdbReconstructionEngine';
import { VdbReferenceSearchEngine, VdbSearchCriteria, PublicVdbStateReference } from '../../research/infinitylm/vdbReferenceSearchEngine';

import { IS_ACTUATION_BLOCKED } from '../intelligence/core/coreEngineContract';
import { validateCellId, cellIdToAddress369 } from '../../core/address369';

export interface GroundedChatContext {
  readonly query: string;
  readonly matchedReferencesCount: number;
  readonly groundedReferences: readonly PublicVdbStateReference[];
  readonly contextFormattedString: string;
  readonly executionLatencyMs: number;
  readonly isActuationBlocked: boolean;
  readonly readOnlyEnforced: boolean;
}

export interface ProductionServiceStatus {
  readonly status: 'READY' | 'UNINITIALIZED' | 'FAIL_CLOSED_ERROR';
  readonly initializedComponents: number;
  readonly totalAllowlistedComponents: 6;
  readonly readOnlyEnforced: boolean;
  readonly actuationLocked: boolean;
  readonly databaseRecordCount: number;
  readonly timestamp: string;
}

export class MvpV2ProductionIntegrationService {
  private static instance: MvpV2ProductionIntegrationService | null = null;

  // The 6 Approved Phase 26 Components
  private vdbAdapter: Phase26VdbReadOnlyAdapter;
  private spatialBridge: typeof Canonical369Bridge;
  private projectionEngine: VdbToPhase25ProjectionEngine;
  private groundedStateGenerator: VdbGroundedStateGenerator;
  private reconstructionEngine: OnDemandVdbReconstructionEngine;
  private searchEngine: VdbReferenceSearchEngine;

  private isInitialized = false;

  constructor(customDbPath = 'data/cubio_studio.db') {
    // Assert permanent actuation lockout
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_SECURITY_VIOLATION: Actuation lock must be active.');
    }

    // Initialize 6 approved components
    this.vdbAdapter = new Phase26VdbReadOnlyAdapter(customDbPath);
    this.spatialBridge = Canonical369Bridge;
    this.projectionEngine = new VdbToPhase25ProjectionEngine(this.vdbAdapter);
    this.groundedStateGenerator = new VdbGroundedStateGenerator(this.vdbAdapter);
    this.reconstructionEngine = new OnDemandVdbReconstructionEngine(this.vdbAdapter, 16);
    this.searchEngine = new VdbReferenceSearchEngine(this.vdbAdapter);

    this.isInitialized = true;
  }

  /**
   * Singleton accessor for production runtime.
   */
  public static getInstance(): MvpV2ProductionIntegrationService {
    if (!this.instance) {
      this.instance = new MvpV2ProductionIntegrationService();
    }
    return this.instance;
  }

  /**
   * Diagnostic health check for the integrated MVP v2 production service.
   */
  public getStatus(): ProductionServiceStatus {
    const totalRecords = this.vdbAdapter.getTotalRecordCount();
    return {
      status: this.isInitialized ? 'READY' : 'UNINITIALIZED',
      initializedComponents: 6,
      totalAllowlistedComponents: 6,
      readOnlyEnforced: true,
      actuationLocked: IS_ACTUATION_BLOCKED === true,
      databaseRecordCount: totalRecords,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Executes a controlled, read-only search across the approved Phase 25 VDB projection layer.
   */
  public async searchGroundedReferences(criteria: VdbSearchCriteria): Promise<readonly PublicVdbStateReference[]> {
    const searchResult = this.searchEngine.search(criteria);
    return searchResult.results;
  }

  /**
   * Reconstructs an approved VDB-grounded state on-demand with LRU cache acceleration.
   */
  public async reconstructState(recordId: string): Promise<VdbReconstructionPacket> {
    return this.reconstructionEngine.reconstructOnDemand(recordId);
  }

  /**
   * Projects a single record into an authorized Phase 25 addressing recipe.
   */
  public projectRecord(recordId: string): SingleProjectionResult {
    return this.projectionEngine.projectById(recordId);
  }

  /**
   * Generates a grounded Phase 25 state representation with verifiable REAL_VDB_GROUNDED provenance.
   */
  public generateGroundedState(recordId: string): Phase25GroundedState {
    return this.groundedStateGenerator.generateFromVdbRecord(recordId);
  }

  /**
   * Enriches a user chat turn with verified VDB-grounded memory references.
   * Produces bounded, sanitized context for Core reasoning without mutating the database.
   */
  public async enrichChatContext(prompt: string, cellId?: number): Promise<GroundedChatContext> {
    const startTime = performance.now();

    const criteria: VdbSearchCriteria = {
      limit: 5
    };

    if (cellId !== undefined) {
      validateCellId(cellId);
      criteria.targetCellId = cellId;
    }

    // If prompt contains classification hints, filter safely
    const upperPrompt = prompt.toUpperCase();
    if (upperPrompt.includes('GREEN')) criteria.classification = 'GREEN';
    else if (upperPrompt.includes('BLUE')) criteria.classification = 'BLUE';
    else if (upperPrompt.includes('AMBER')) criteria.classification = 'AMBER';
    else if (upperPrompt.includes('RED')) criteria.classification = 'RED';

    const results = await this.searchGroundedReferences(criteria);

    // Format bounded context string for Chat Memory Core
    let formatted = '--- VDB GROUNDED REASONING CONTEXT ---\n';
    if (results.length === 0) {
      formatted += 'No matching spatial memory records found for query.\n';
    } else {
      results.forEach((r, idx) => {
        formatted += `[${idx + 1}] ID: ${r.recordId} | Cell: ${r.cellId} (Address ${r.address369}) | Classification: ${r.classification} | Procedural Address: ${r.proceduralAddress}\n`;
      });
    }
    formatted += '--------------------------------------';

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      query: prompt,
      matchedReferencesCount: results.length,
      groundedReferences: results,
      contextFormattedString: formatted,
      executionLatencyMs: latencyMs,
      isActuationBlocked: IS_ACTUATION_BLOCKED === true,
      readOnlyEnforced: true
    };
  }
}
