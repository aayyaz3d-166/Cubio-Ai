/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/testDiscovery.ts
 *
 * Targeted test and gate discovery engine.
 * Maps task scope, subsystems, and touched files to exact required test suites
 * and architectural acceptance gates without scanning the whole repository.
 */

import { TGATaskScope, TGAGateDefinition } from './types';
import { ProjectNavigator, SubsystemDefinition } from '../../language/native/pma/projectNavigator';

export class TGATestDiscoveryEngine {
  private readonly projectNavigator: ProjectNavigator;

  constructor(customNavigator?: ProjectNavigator) {
    this.projectNavigator = customNavigator || new ProjectNavigator();
  }

  /**
   * Discovers all required gates and test suites for a task before execution.
   */
  public discoverRequiredGates(scope: TGATaskScope): readonly TGAGateDefinition[] {
    const gates: TGAGateDefinition[] = [];
    const gateIdSet = new Set<string>();

    const addGate = (gate: TGAGateDefinition) => {
      if (!gateIdSet.has(gate.gateId)) {
        gateIdSet.add(gate.gateId);
        gates.push(Object.freeze(gate));
      }
    };

    // 1. Mandatory Invariant & Prerequisite Gates (Always Required)
    addGate({
      gateId: 'GATE_ACTUATION_SAFETY',
      name: 'Permanent Hardware Actuation Lockout Invariant',
      category: 'INVARIANT',
      isMandatory: true,
      timeoutMs: 1000,
      description: 'Asserts that is_actuation_blocked === true permanently across all execution paths.',
    });

    addGate({
      gateId: 'GATE_BOUNDARY_PROTECTION',
      name: 'Protected Authority Boundary Enforcement',
      category: 'SECURITY',
      isMandatory: true,
      timeoutMs: 1000,
      description: 'Verifies that development did not mutate or stage unauthorized protected files.',
    });

    addGate({
      gateId: 'GATE_PHASE8_REGRESSION_LOCK',
      name: 'Phase 8 Certified Baseline Regression Lock',
      category: 'REGRESSION',
      testPath: 'src/test_phase8_regression_lock.ts',
      isMandatory: true,
      timeoutMs: 15000,
      description: 'Verifies bitwise preservation of certified subsystem checksums, database, and spatial core.',
    });

    // 2. Discover Target Subsystems from Scope and Touched Files
    const targetSubsystems = new Set<string>(scope.targetSubsystems || []);

    // Invert lookup from touched files if any
    const allDefs = this.getAllSubsystemDefinitions();
    if (scope.touchedFiles && scope.touchedFiles.length > 0) {
      for (const file of scope.touchedFiles) {
        const normFile = file.replace(/\\/g, '/').toLowerCase();
        for (const def of allDefs) {
          if (
            normFile.includes(def.primaryDir.toLowerCase()) ||
            def.keyFiles.some((kf) => normFile.includes(kf.toLowerCase()))
          ) {
            targetSubsystems.add(def.id);
          }
        }
      }
    }

    // Also match prompt keywords if no subsystems specified
    if (targetSubsystems.size === 0 && scope.objective) {
      const objLower = scope.objective.toLowerCase();
      for (const def of allDefs) {
        if (def.keywords.some((kw) => objLower.includes(kw.toLowerCase()))) {
          targetSubsystems.add(def.id);
        }
      }
    }

    // 3. Subsystem-Specific Test Suites
    const defMap = new Map<string, SubsystemDefinition>(allDefs.map((d) => [d.id, d]));
    for (const subId of Array.from(targetSubsystems).sort()) {
      const def = defMap.get(subId);
      if (!def) continue;

      for (const testPath of def.tests) {
        const cleanName = testPath
          .replace(/^src\//, '')
          .replace(/\.tsx?$/, '')
          .replace(/test_/, '')
          .replace(/_/g, ' ');

        addGate({
          gateId: `GATE_${subId}_${cleanName.toUpperCase().replace(/\s+/g, '_')}`,
          name: `Subsystem Test [${subId}]: ${cleanName}`,
          category: def.isFrozen ? 'INTEGRATION' : 'UNIT',
          testPath,
          isMandatory: true,
          timeoutMs: 30000,
          description: `Required targeted verification suite for subsystem ${def.name}.`,
        });
      }
    }

    // 4. Special Invariant Gates if Spatial or DB touched
    if (
      targetSubsystems.has('SPATIAL_369') ||
      scope.touchedFiles?.some((f) => f.includes('369') || f.includes('address'))
    ) {
      addGate({
        gateId: 'GATE_SPATIAL_369_INVARIANT',
        name: 'Spatial 369 Canonical Mathematics Invariance',
        category: 'INVARIANT',
        testPath: 'src/test_spatial_343_369_mapping.ts',
        isMandatory: true,
        timeoutMs: 10000,
        description: 'Bitwise validation of Formula A coordinateToCellId and address369 lattice mapping.',
      });
    }

    if (
      targetSubsystems.has('DATABASE_VDB') ||
      scope.touchedFiles?.some((f) => f.includes('cubio_studio.db'))
    ) {
      addGate({
        gateId: 'GATE_DATABASE_CANONICAL_INVARIANT',
        name: 'Canonical Sparse Memory Database Invariance',
        category: 'INVARIANT',
        isMandatory: true,
        timeoutMs: 5000,
        description: 'Bitwise validation of data/cubio_studio.db (77,824 B, SHA-256 E8CB4147...).',
      });
    }

    return Object.freeze(gates);
  }

  private getAllSubsystemDefinitions(): SubsystemDefinition[] {
    const navAny = this.projectNavigator as any;
    const list: SubsystemDefinition[] = [];
    if (navAny.subsystems && typeof navAny.subsystems.values === 'function') {
      for (const def of navAny.subsystems.values()) {
        list.push(def);
      }
    }
    return list;
  }
}
