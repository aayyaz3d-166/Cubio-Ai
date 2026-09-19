/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 499: SUBMOTHER FORMULA REGISTRY
 * src/cubio/submother/phase31SubmotherFormulaRegistry.ts
 * ============================================================================
 *
 * Canonical registry for approved procedural Submother formulas and transformations.
 *
 * Requirements & Invariants:
 *   1. Every formula strictly references Mother Core authority (`delegatesTo: 'MOTHER_CORE'`).
 *   2. Purely procedural, deterministic, bounded, auditable, and non-trainable.
 *   3. Zero trainable weights, zero independent model parameters (`trainableWeights: 0`).
 *   4. Formula schema definitions include:
 *      - Formula ID, version, description, category
 *      - Input parameter schema (types, min/max bounds, default values)
 *      - Output contract
 *      - Lifecycle status: ACTIVE, DEPRECATED, or EXPERIMENTAL
 *      - Provenance hash computed over specification definition
 *   5. Fail-Closed Security:
 *      - Rejects unknown, unregistered, unauthorized, or malformed formulas.
 *      - Rejects attempts to dynamically register mutable, trainable, or external models.
 *      - Prevents duplicate registration collisions.
 *   6. Deterministic Execution:
 *      - Given identical inputs, produces identical outputs (0 delta).
 *   7. Permanent Invariants:
 *      - IS_ACTUATION_BLOCKED === true
 *      - OFFLINE_ISOLATED === true
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import { CUBIO_NATIVE_MODEL_ID } from '../model/native_foundation/native_model_types';
import { TOTAL_NATIVE_PARAMETERS } from '../core/nativeTrainingIntegration';

// ============================================================================
// CONSTANTS
// ============================================================================

export const FORMULA_REGISTRY_VERSION = '31.499.0';
export const FORMULA_REGISTRY_ID = 'CUBIO_SUBMOTHER_FORMULA_REGISTRY';

export type FormulaLifecycleStatus = 'ACTIVE' | 'DEPRECATED' | 'EXPERIMENTAL';

export type FormulaCategory =
  | 'SPATIAL_GEOMETRY'
  | 'RECURSIVE_EXPANSION'
  | 'SYMBOLIC_LOGIC'
  | 'MATHEMATICAL_TRANSFORM'
  | 'EPISTEMIC_VERIFICATION';

export interface ParameterContract {
  readonly name: string;
  readonly type: 'number' | 'string' | 'boolean';
  readonly required: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly allowedValues?: readonly string[];
  readonly defaultValue?: number | string | boolean;
}

export interface FormulaDefinition {
  readonly formulaId: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly category: FormulaCategory;
  readonly lifecycleStatus: FormulaLifecycleStatus;
  readonly inputSchema: readonly ParameterContract[];
  readonly outputContract: {
    readonly requiredFields: readonly string[];
    readonly delegatesTo: 'MOTHER_CORE';
  };
  readonly trainableWeights: 0;
  readonly allowsDynamicLearning: false;
  readonly provenanceDigest: string;
  readonly registeredAt: string;
  readonly compute: (params: Record<string, any>) => Record<string, any>;
}

export interface FormulaExecutionResult {
  readonly formulaId: string;
  readonly version: string;
  readonly status: 'SUCCESS' | 'REJECTED';
  readonly output: Record<string, any>;
  readonly outputDigest: string;
  readonly latencyMs: number;
  readonly delegatedToMotherCore: true;
  readonly independentWeightsCreated: false;
  readonly rejectionReason?: string;
  readonly timestamp: string;
}

export interface RegistryAuditRecord {
  readonly auditId: string;
  readonly action: 'REGISTER' | 'EXECUTE' | 'REJECT';
  readonly formulaId: string;
  readonly reason?: string;
  readonly auditHash: string;
  readonly timestamp: string;
}

// ============================================================================
// CANONICAL FORMULA REGISTRY IMPLEMENTATION
// ============================================================================

export class Phase31SubmotherFormulaRegistry {
  private static instance: Phase31SubmotherFormulaRegistry | null = null;

  private readonly registry: Map<string, FormulaDefinition> = new Map();
  private readonly auditLedger: RegistryAuditRecord[] = [];
  private totalExecutions = 0;
  private totalRejections = 0;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P31-FORMULA-REGISTRY');

    this.registerCanonicalFormulas();
  }

  public static getInstance(): Phase31SubmotherFormulaRegistry {
    if (!this.instance) {
      this.instance = new Phase31SubmotherFormulaRegistry();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Registers all canonical, approved formulas upon initialization.
   */
  private registerCanonicalFormulas(): void {
    const PHI = (1 + Math.sqrt(5)) / 2;

    // 1. SPATIAL_PROJECTION
    this.registerApprovedFormula({
      formulaId: 'FORMULA_SPATIAL_PROJECTION',
      version: '1.0.0',
      name: 'Spatial Projection Formula A',
      description: 'Maps cell ID to Address369 space and 3D discrete grid coordinates',
      category: 'SPATIAL_GEOMETRY',
      lifecycleStatus: 'ACTIVE',
      inputSchema: [
        { name: 'cellId', type: 'number', required: true, min: 0, max: 342, defaultValue: 0 },
      ],
      outputContract: {
        requiredFields: ['source', 'delegatedTo', 'cellId', 'address369', 'coords'],
        delegatesTo: 'MOTHER_CORE',
      },
      trainableWeights: 0,
      allowsDynamicLearning: false,
      compute: (params) => {
        const cell = Number(params.cellId ?? 0);
        return {
          source: 'SUBMOTHER_FORMULA',
          delegatedTo: 'MOTHER_CORE',
          cellId: cell,
          address369: 26 + (cell % 343),
          coords: {
            x: cell % 7,
            y: Math.floor(cell / 7) % 7,
            z: Math.floor(cell / 49) % 7,
          },
          motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        };
      },
    });

    // 2. EXPANSION_RULE
    this.registerApprovedFormula({
      formulaId: 'FORMULA_EXPANSION_RULE',
      version: '1.0.0',
      name: 'Recursive Expansion Rule',
      description: 'Calculates bounded geometric scaling factors based on golden ratio recursion',
      category: 'RECURSIVE_EXPANSION',
      lifecycleStatus: 'ACTIVE',
      inputSchema: [
        { name: 'depth', type: 'number', required: true, min: 1, max: 3, defaultValue: 1 },
      ],
      outputContract: {
        requiredFields: ['source', 'delegatedTo', 'depth', 'phiFactor'],
        delegatesTo: 'MOTHER_CORE',
      },
      trainableWeights: 0,
      allowsDynamicLearning: false,
      compute: (params) => {
        const depth = Number(params.depth ?? 1);
        return {
          source: 'SUBMOTHER_FORMULA',
          delegatedTo: 'MOTHER_CORE',
          depth,
          phiFactor: Number(Math.pow(PHI, depth).toFixed(6)),
          motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        };
      },
    });

    // 3. DOMAIN_DELEGATION
    this.registerApprovedFormula({
      formulaId: 'FORMULA_DOMAIN_DELEGATION',
      version: '1.0.0',
      name: 'Domain Delegation Resolution',
      description: 'Resolves domain-scoped authority routing back to Mother Core',
      category: 'SYMBOLIC_LOGIC',
      lifecycleStatus: 'ACTIVE',
      inputSchema: [
        {
          name: 'domain',
          type: 'string',
          required: true,
          allowedValues: ['REASONING', 'CODING', 'MATHEMATICS', 'LANGUAGE', 'MEMORY', 'PROBLEM_SOLVING'],
          defaultValue: 'REASONING',
        },
      ],
      outputContract: {
        requiredFields: ['source', 'delegatedTo', 'domain', 'resolved'],
        delegatesTo: 'MOTHER_CORE',
      },
      trainableWeights: 0,
      allowsDynamicLearning: false,
      compute: (params) => {
        return {
          source: 'SUBMOTHER_FORMULA',
          delegatedTo: 'MOTHER_CORE',
          domain: String(params.domain ?? 'REASONING'),
          resolved: true,
          motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        };
      },
    });

    // 4. PHI_TRANSFORM
    this.registerApprovedFormula({
      formulaId: 'FORMULA_PHI_TRANSFORM',
      version: '1.0.0',
      name: 'Phi Harmonic Transformation',
      description: 'Calculates golden ratio harmonic powers and angular projections',
      category: 'MATHEMATICAL_TRANSFORM',
      lifecycleStatus: 'ACTIVE',
      inputSchema: [
        { name: 'power', type: 'number', required: true, min: 1, max: 12, defaultValue: 1 },
      ],
      outputContract: {
        requiredFields: ['source', 'delegatedTo', 'power', 'phiPower', 'transformResult'],
        delegatesTo: 'MOTHER_CORE',
      },
      trainableWeights: 0,
      allowsDynamicLearning: false,
      compute: (params) => {
        const power = Number(params.power ?? 1);
        const angle = (2 * Math.PI) / (PHI * PHI);
        const result = Math.pow(PHI, power) * Math.cos(angle * power);
        return {
          source: 'SUBMOTHER_FORMULA',
          delegatedTo: 'MOTHER_CORE',
          power,
          phiPower: Number(Math.pow(PHI, power).toFixed(6)),
          transformResult: Number(result.toFixed(6)),
          motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        };
      },
    });

    // 5. EPISTEMIC_VERIFICATION
    this.registerApprovedFormula({
      formulaId: 'FORMULA_EPISTEMIC_BOUND',
      version: '1.0.0',
      name: 'Epistemic Calibration Boundary',
      description: 'Evaluates epistemic discipline boundaries (Fact vs Hypothesis vs Refusal)',
      category: 'EPISTEMIC_VERIFICATION',
      lifecycleStatus: 'ACTIVE',
      inputSchema: [
        { name: 'confidenceScore', type: 'number', required: true, min: 0.0, max: 1.0, defaultValue: 0.5 },
      ],
      outputContract: {
        requiredFields: ['source', 'delegatedTo', 'classification', 'confidenceScore'],
        delegatesTo: 'MOTHER_CORE',
      },
      trainableWeights: 0,
      allowsDynamicLearning: false,
      compute: (params) => {
        const score = Number(params.confidenceScore ?? 0.5);
        let classification: 'FACT' | 'HYPOTHESIS' | 'REFUSAL';
        if (score >= 0.8) classification = 'FACT';
        else if (score >= 0.4) classification = 'HYPOTHESIS';
        else classification = 'REFUSAL';

        return {
          source: 'SUBMOTHER_FORMULA',
          delegatedTo: 'MOTHER_CORE',
          classification,
          confidenceScore: score,
          allowsFabrication: false,
          motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        };
      },
    });
  }

  /**
   * Internal registration helper with provenance stamping and strict guards.
   */
  public registerApprovedFormula(
    spec: Omit<FormulaDefinition, 'provenanceDigest' | 'registeredAt'>
  ): { success: boolean; reason?: string } {
    // GUARD 1: Prevent duplicate formula registration
    if (this.registry.has(spec.formulaId)) {
      this.recordAudit('REJECT', spec.formulaId, `DUPLICATE_REGISTRATION: Formula ${spec.formulaId} already registered`);
      return { success: false, reason: `DUPLICATE_REGISTRATION: Formula ${spec.formulaId} already exists` };
    }

    // GUARD 2: Invariant Check — Must have 0 trainable weights
    if (spec.trainableWeights !== 0 || spec.allowsDynamicLearning !== false) {
      this.recordAudit('REJECT', spec.formulaId, 'TRAINABLE_INVARIANT_VIOLATION: Submother formulas cannot possess trainable weights');
      return { success: false, reason: 'TRAINABLE_INVARIANT_VIOLATION: Formulas must have 0 weights' };
    }

    // GUARD 3: Must delegate to MOTHER_CORE
    if (spec.outputContract.delegatesTo !== 'MOTHER_CORE') {
      this.recordAudit('REJECT', spec.formulaId, 'AUTHORITY_VIOLATION: Must delegate to MOTHER_CORE');
      return { success: false, reason: 'AUTHORITY_VIOLATION: DelegatesTo must be MOTHER_CORE' };
    }

    // Compute deterministic provenance hash
    const provSeed = `${spec.formulaId}:${spec.version}:${spec.category}:${JSON.stringify(spec.inputSchema)}:${spec.trainableWeights}`;
    const provenanceDigest = crypto.createHash('sha256').update(provSeed).digest('hex');

    const fullDefinition: FormulaDefinition = {
      ...spec,
      provenanceDigest,
      registeredAt: new Date().toISOString(),
    };

    this.registry.set(spec.formulaId, fullDefinition);
    this.recordAudit('REGISTER', spec.formulaId, `Registered canonical formula version ${spec.version}`);
    return { success: true };
  }

  /**
   * Executes an approved formula deterministically.
   */
  public executeFormula(formulaId: string, params: Record<string, any>): FormulaExecutionResult {
    const startTime = performance.now();
    this.totalExecutions++;

    // ── GUARD 1: Formula Exists ──
    const def = this.registry.get(formulaId);
    if (!def) {
      this.totalRejections++;
      this.recordAudit('REJECT', formulaId, `UNKNOWN_FORMULA: ${formulaId} not found in registry`);
      return {
        formulaId,
        version: 'UNKNOWN',
        status: 'REJECTED',
        output: {},
        outputDigest: 'REJECTED_NO_OUTPUT',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        rejectionReason: `UNKNOWN_FORMULA: Formula '${formulaId}' is not registered`,
        timestamp: new Date().toISOString(),
      };
    }

    // ── GUARD 2: Lifecycle Status Active ──
    if (def.lifecycleStatus !== 'ACTIVE') {
      this.totalRejections++;
      this.recordAudit('REJECT', formulaId, `INACTIVE_LIFECYCLE: Status is ${def.lifecycleStatus}`);
      return {
        formulaId,
        version: def.version,
        status: 'REJECTED',
        output: {},
        outputDigest: 'REJECTED_NO_OUTPUT',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        rejectionReason: `INACTIVE_LIFECYCLE: Formula '${formulaId}' is ${def.lifecycleStatus}`,
        timestamp: new Date().toISOString(),
      };
    }

    // ── GUARD 3: Input Schema Validation ──
    for (const schema of def.inputSchema) {
      const val = params[schema.name];

      // Required check
      if (schema.required && (val === undefined || val === null)) {
        this.totalRejections++;
        const reason = `MISSING_REQUIRED_PARAM: '${schema.name}' is required for ${formulaId}`;
        this.recordAudit('REJECT', formulaId, reason);
        return {
          formulaId,
          version: def.version,
          status: 'REJECTED',
          output: {},
          outputDigest: 'REJECTED_NO_OUTPUT',
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
          delegatedToMotherCore: true,
          independentWeightsCreated: false,
          rejectionReason: reason,
          timestamp: new Date().toISOString(),
        };
      }

      if (val !== undefined && val !== null) {
        // Type check
        if (typeof val !== schema.type) {
          this.totalRejections++;
          const reason = `TYPE_MISMATCH: '${schema.name}' expected ${schema.type}, got ${typeof val}`;
          this.recordAudit('REJECT', formulaId, reason);
          return {
            formulaId,
            version: def.version,
            status: 'REJECTED',
            output: {},
            outputDigest: 'REJECTED_NO_OUTPUT',
            latencyMs: Number((performance.now() - startTime).toFixed(2)),
            delegatedToMotherCore: true,
            independentWeightsCreated: false,
            rejectionReason: reason,
            timestamp: new Date().toISOString(),
          };
        }

        // Bounds check (numbers)
        if (schema.type === 'number') {
          if (schema.min !== undefined && val < schema.min) {
            this.totalRejections++;
            const reason = `BOUNDS_VIOLATION: '${schema.name}' value ${val} < min ${schema.min}`;
            this.recordAudit('REJECT', formulaId, reason);
            return {
              formulaId,
              version: def.version,
              status: 'REJECTED',
              output: {},
              outputDigest: 'REJECTED_NO_OUTPUT',
              latencyMs: Number((performance.now() - startTime).toFixed(2)),
              delegatedToMotherCore: true,
              independentWeightsCreated: false,
              rejectionReason: reason,
              timestamp: new Date().toISOString(),
            };
          }
          if (schema.max !== undefined && val > schema.max) {
            this.totalRejections++;
            const reason = `BOUNDS_VIOLATION: '${schema.name}' value ${val} > max ${schema.max}`;
            this.recordAudit('REJECT', formulaId, reason);
            return {
              formulaId,
              version: def.version,
              status: 'REJECTED',
              output: {},
              outputDigest: 'REJECTED_NO_OUTPUT',
              latencyMs: Number((performance.now() - startTime).toFixed(2)),
              delegatedToMotherCore: true,
              independentWeightsCreated: false,
              rejectionReason: reason,
              timestamp: new Date().toISOString(),
            };
          }
        }

        // Allowed values check (strings)
        if (schema.type === 'string' && schema.allowedValues) {
          if (!schema.allowedValues.includes(val)) {
            this.totalRejections++;
            const reason = `DISALLOWED_VALUE: '${schema.name}' value '${val}' not in allowed set`;
            this.recordAudit('REJECT', formulaId, reason);
            return {
              formulaId,
              version: def.version,
              status: 'REJECTED',
              output: {},
              outputDigest: 'REJECTED_NO_OUTPUT',
              latencyMs: Number((performance.now() - startTime).toFixed(2)),
              delegatedToMotherCore: true,
              independentWeightsCreated: false,
              rejectionReason: reason,
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    }

    // ── DETERMINISTIC COMPUTATION ──
    let rawOutput: Record<string, any>;
    try {
      rawOutput = def.compute(params);
    } catch (err: any) {
      this.totalRejections++;
      const reason = `EXECUTION_ERROR: ${err.message}`;
      this.recordAudit('REJECT', formulaId, reason);
      return {
        formulaId,
        version: def.version,
        status: 'REJECTED',
        output: {},
        outputDigest: 'REJECTED_NO_OUTPUT',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        rejectionReason: reason,
        timestamp: new Date().toISOString(),
      };
    }

    // Output contract verification
    for (const field of def.outputContract.requiredFields) {
      if (rawOutput[field] === undefined) {
        this.totalRejections++;
        const reason = `OUTPUT_CONTRACT_VIOLATION: Missing required field '${field}'`;
        this.recordAudit('REJECT', formulaId, reason);
        return {
          formulaId,
          version: def.version,
          status: 'REJECTED',
          output: {},
          outputDigest: 'REJECTED_NO_OUTPUT',
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
          delegatedToMotherCore: true,
          independentWeightsCreated: false,
          rejectionReason: reason,
          timestamp: new Date().toISOString(),
        };
      }
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    const outputDigest = crypto.createHash('sha256').update(JSON.stringify(rawOutput)).digest('hex');

    this.recordAudit('EXECUTE', formulaId, `Executed in ${latencyMs}ms`);

    return {
      formulaId,
      version: def.version,
      status: 'SUCCESS',
      output: rawOutput,
      outputDigest,
      latencyMs,
      delegatedToMotherCore: true,
      independentWeightsCreated: false,
      timestamp: new Date().toISOString(),
    };
  }

  public getFormula(formulaId: string): FormulaDefinition | undefined {
    return this.registry.get(formulaId);
  }

  public listRegisteredFormulas(): readonly FormulaDefinition[] {
    return Array.from(this.registry.values());
  }

  public getAuditLedger(): readonly RegistryAuditRecord[] {
    return Object.freeze([...this.auditLedger]);
  }

  private recordAudit(action: RegistryAuditRecord['action'], formulaId: string, reason?: string): void {
    const auditId = `REG_AUDIT_${this.auditLedger.length + 1}_${Date.now()}`;
    const hashSeed = `${auditId}|${action}|${formulaId}|${reason || ''}`;
    const auditHash = crypto.createHash('sha256').update(hashSeed).digest('hex');

    this.auditLedger.push({
      auditId,
      action,
      formulaId,
      reason,
      auditHash,
      timestamp: new Date().toISOString(),
    });
  }
}
