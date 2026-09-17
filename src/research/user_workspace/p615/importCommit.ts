/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Transactional Atomic Import Engine
 *
 * Enforces atomic 5-stage import pipeline:
 * 1. Parse
 * 2. Validate
 * 3. Preview
 * 4. Resolve conflicts
 * 5. Commit
 *
 * If any stage fails, NO partial import is committed.
 */

import {
  WorkspaceExportPackage,
  PortabilityAccessContext,
  ImportResolution,
  PortableSpace,
  PortableExperiment,
  PortableSavedState,
  PortableVersion,
  PortableGeometry,
} from './types';
import { ImportPackageParser } from './importParser';
import { PortabilityValidator } from './importValidator';
import { ImportPreviewEngine } from './importPreview';
import { ConflictResolver } from './conflictResolver';
import {
  generateDeterministicImportId,
  deterministicHash,
} from './determinism';

export interface ImportCommitResult {
  readonly success: boolean;
  readonly importId?: string;
  readonly committedSpaces: readonly PortableSpace[];
  readonly committedExperiments: readonly PortableExperiment[];
  readonly committedStates: readonly PortableSavedState[];
  readonly committedVersions: readonly PortableVersion[];
  readonly committedGeometries: readonly PortableGeometry[];
  readonly skippedEntityIds: readonly string[];
  readonly resolutions: readonly ImportResolution[];
  readonly importChecksum?: string;
  readonly error?: string;
}

export class ImportCommitEngine {
  public static executeImport(
    jsonPayload: string,
    targetContext: PortabilityAccessContext,
    existingEntities: ReadonlyMap<string, { checksum: string; lineageId: string; ownerId: string }> = new Map(),
    conflictStrategies: ReadonlyMap<string, 'REJECT' | 'SKIP' | 'CREATE_NEW_LINEAGE'> = new Map()
  ): ImportCommitResult {
    // Stage 1: Parse
    const parseResult = ImportPackageParser.parse(jsonPayload);
    if (!parseResult.success || !parseResult.package) {
      return {
        success: false,
        committedSpaces: [],
        committedExperiments: [],
        committedStates: [],
        committedVersions: [],
        committedGeometries: [],
        skippedEntityIds: [],
        resolutions: [],
        error: `Import Stage 1 (Parse) Failed: ${parseResult.error}`,
      };
    }
    const pkg = parseResult.package;

    // Stage 2: Validate
    const validation = PortabilityValidator.validatePackage(pkg, targetContext);
    if (!validation.isValid) {
      return {
        success: false,
        committedSpaces: [],
        committedExperiments: [],
        committedStates: [],
        committedVersions: [],
        committedGeometries: [],
        skippedEntityIds: [],
        resolutions: [],
        error: `Import Stage 2 (Validation) Failed: ${validation.issues.join('; ')}`,
      };
    }

    // Stage 3: Preview & Detect Conflicts
    const preview = ImportPreviewEngine.generatePreview(pkg, targetContext, existingEntities);

    // Stage 4: Conflict Resolution
    const resolutions: ImportResolution[] = [];
    const resolvedNewEntities = new Map<string, { newEntityId: string; newLineageId: string }>();
    const skippedIds = new Set<string>();

    for (const conflict of preview.conflicts) {
      const strategy = conflictStrategies.get(conflict.entityId) ?? 'REJECT';

      if (strategy === 'REJECT') {
        // Atomic abort!
        return {
          success: false,
          committedSpaces: [],
          committedExperiments: [],
          committedStates: [],
          committedVersions: [],
          committedGeometries: [],
          skippedEntityIds: [],
          resolutions: [],
          error: `Import Stage 4 (Conflict Resolution) Aborted: Unresolved conflict on entity ${conflict.entityId} (Strategy: REJECT)`,
        };
      }

      const resolution = ConflictResolver.resolveConflict(
        conflict,
        strategy,
        targetContext.workspaceId,
        'LIN_SOURCE_DEFAULT'
      );
      resolutions.push(resolution);

      if (strategy === 'SKIP') {
        skippedIds.add(conflict.entityId);
      } else if (strategy === 'CREATE_NEW_LINEAGE' && resolution.newEntityId && resolution.newLineageId) {
        resolvedNewEntities.set(conflict.entityId, {
          newEntityId: resolution.newEntityId,
          newLineageId: resolution.newLineageId,
        });
      }
    }

    // Stage 5: Commit Execution
    const committedSpaces: PortableSpace[] = [];
    const committedExperiments: PortableExperiment[] = [];
    const committedStates: PortableSavedState[] = [];
    const committedVersions: PortableVersion[] = [];
    const committedGeometries: PortableGeometry[] = [];

    // Process Spaces
    for (const space of pkg.spaces ?? []) {
      if (skippedIds.has(space.spaceId)) continue;
      const remapped = resolvedNewEntities.get(space.spaceId);
      committedSpaces.push(
        Object.freeze({
          ...space,
          spaceId: remapped?.newEntityId ?? space.spaceId,
          lineageId: remapped?.newLineageId ?? space.lineageId,
          workspaceId: targetContext.workspaceId,
          ownerId: targetContext.userId,
        })
      );
    }

    // Process Experiments
    for (const exp of pkg.experiments ?? []) {
      if (skippedIds.has(exp.experimentId)) continue;
      const remapped = resolvedNewEntities.get(exp.experimentId);
      committedExperiments.push(
        Object.freeze({
          ...exp,
          experimentId: remapped?.newEntityId ?? exp.experimentId,
          lineageId: remapped?.newLineageId ?? exp.lineageId,
          workspaceId: targetContext.workspaceId,
          ownerId: targetContext.userId,
        })
      );
    }

    // Process Saved States
    for (const st of pkg.savedStates ?? []) {
      if (skippedIds.has(st.stateId)) continue;
      const remapped = resolvedNewEntities.get(st.stateId);
      committedStates.push(
        Object.freeze({
          ...st,
          stateId: remapped?.newEntityId ?? st.stateId,
          lineageId: remapped?.newLineageId ?? st.lineageId,
          workspaceId: targetContext.workspaceId,
          ownerId: targetContext.userId,
        })
      );
    }

    // Process Versions
    for (const v of pkg.versions ?? []) {
      if (skippedIds.has(v.versionId)) continue;
      const remapped = resolvedNewEntities.get(v.versionId);
      committedVersions.push(
        Object.freeze({
          ...v,
          versionId: remapped?.newEntityId ?? v.versionId,
          lineageId: remapped?.newLineageId ?? v.lineageId,
          workspaceId: targetContext.workspaceId,
          ownerId: targetContext.userId,
        })
      );
    }

    // Process Geometries (Strict Canonical [5,3,6] Preservation)
    for (const g of pkg.geometries ?? []) {
      if (skippedIds.has(g.geometryId)) continue;
      const remapped = resolvedNewEntities.get(g.geometryId);
      committedGeometries.push(
        Object.freeze({
          ...g,
          geometryId: remapped?.newEntityId ?? g.geometryId,
          lineageId: remapped?.newLineageId ?? g.lineageId,
          workspaceId: targetContext.workspaceId,
          coordinates: Object.freeze([...g.coordinates]) as [number, number, number],
        })
      );
    }

    const importId = generateDeterministicImportId(targetContext.workspaceId, pkg.packageChecksum);
    const rawCommit = JSON.stringify([
      importId,
      targetContext.workspaceId,
      committedSpaces.map((s) => s.spaceId),
      committedExperiments.map((e) => e.experimentId),
      committedStates.map((st) => st.stateId),
      committedGeometries.map((g) => g.geometryId),
    ]);
    const importChecksum = deterministicHash(rawCommit);

    return Object.freeze({
      success: true,
      importId,
      committedSpaces: Object.freeze(committedSpaces),
      committedExperiments: Object.freeze(committedExperiments),
      committedStates: Object.freeze(committedStates),
      committedVersions: Object.freeze(committedVersions),
      committedGeometries: Object.freeze(committedGeometries),
      skippedEntityIds: Object.freeze([...skippedIds]),
      resolutions: Object.freeze(resolutions),
      importChecksum,
    });
  }
}
