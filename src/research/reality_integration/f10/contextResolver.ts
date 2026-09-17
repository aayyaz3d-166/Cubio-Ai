/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Spatial Context Resolution Engine
 *
 * Deterministically resolves natural language object references ("it", "the sphere", "the cube on the left", etc.)
 * to concrete WorkspaceGeometry IDs without guessing.
 */

import { WorkspaceGeometry } from '../r9/types';
import { ResolvedContextReference, ContextResolutionStatus } from './types';
import { SemanticSlots } from './languageTypes';
import { deterministicHash } from './determinism';

export class F10ContextResolver {
  public static resolveTarget(
    slots: SemanticSlots,
    rawText: string,
    geometries: Readonly<Record<string, WorkspaceGeometry>>,
    activeTargetId: string | null,
    lastCreatedId: string | null,
    commandId: string
  ): ResolvedContextReference {
    const geoList = Object.values(geometries);
    const normalized = rawText.toLowerCase();

    // 1. Explicit Pronoun Resolution ("it", "that", "this")
    if (slots.pronoun === 'IT' || slots.pronoun === 'THAT' || slots.pronoun === 'THIS') {
      const targetId = activeTargetId || lastCreatedId || (geoList.length > 0 ? geoList[geoList.length - 1].geometryId : null);
      if (targetId && geometries[targetId]) {
        const geo = geometries[targetId];
        return {
          referenceText: slots.pronoun,
          targetGeometryId: geo.geometryId,
          workspaceObjectId: geo.workspaceObjectId || null,
          resolvedName: geo.identity.name,
          resolutionMethod: 'RESOLVED_PRONOUN',
          confidence: 0.95,
          resolutionDetails: `Pronoun '${slots.pronoun}' resolved to active target '${geo.identity.name}' (${geo.geometryId})`,
          contextChecksum: `CS_CTX_${deterministicHash(geo.geometryId + slots.pronoun)}`,
        };
      }
    }

    // 2. Active Selection Reference ("the selected object", "selected", "active")
    if (/\b(selected|active|current)\b/.test(normalized)) {
      if (activeTargetId && geometries[activeTargetId]) {
        const geo = geometries[activeTargetId];
        return {
          referenceText: 'selected object',
          targetGeometryId: geo.geometryId,
          workspaceObjectId: geo.workspaceObjectId || null,
          resolvedName: geo.identity.name,
          resolutionMethod: 'RESOLVED_ACTIVE_SELECTION',
          confidence: 1.0,
          resolutionDetails: `Resolved to currently selected object '${geo.identity.name}'`,
          contextChecksum: `CS_CTX_${deterministicHash(geo.geometryId + 'SEL')}`,
        };
      }
    }

    // 3. Spatial Superlative Reference ("on the left", "on the right", "on top", "the first", "the last")
    if (/\b(on the left|leftmost)\b/.test(normalized) && geoList.length > 0) {
      const leftmost = [...geoList].sort((a, b) => a.transform.translation[0] - b.transform.translation[0])[0];
      return {
        referenceText: 'object on the left',
        targetGeometryId: leftmost.geometryId,
        workspaceObjectId: leftmost.workspaceObjectId || null,
        resolvedName: leftmost.identity.name,
        resolutionMethod: 'RESOLVED_SPATIAL',
        confidence: 0.9,
        resolutionDetails: `Resolved to leftmost object '${leftmost.identity.name}' at X=${leftmost.transform.translation[0]}`,
        contextChecksum: `CS_CTX_${deterministicHash(leftmost.geometryId + 'LEFT')}`,
      };
    }

    if (/\b(on the right|rightmost)\b/.test(normalized) && geoList.length > 0) {
      const rightmost = [...geoList].sort((a, b) => b.transform.translation[0] - a.transform.translation[0])[0];
      return {
        referenceText: 'object on the right',
        targetGeometryId: rightmost.geometryId,
        workspaceObjectId: rightmost.workspaceObjectId || null,
        resolvedName: rightmost.identity.name,
        resolutionMethod: 'RESOLVED_SPATIAL',
        confidence: 0.9,
        resolutionDetails: `Resolved to rightmost object '${rightmost.identity.name}' at X=${rightmost.transform.translation[0]}`,
        contextChecksum: `CS_CTX_${deterministicHash(rightmost.geometryId + 'RIGHT')}`,
      };
    }

    if (/\b(first|earliest)\b/.test(normalized) && geoList.length > 0) {
      const first = geoList[0];
      return {
        referenceText: 'first object',
        targetGeometryId: first.geometryId,
        workspaceObjectId: first.workspaceObjectId || null,
        resolvedName: first.identity.name,
        resolutionMethod: 'RESOLVED_CONTEXTUAL',
        confidence: 0.95,
        resolutionDetails: `Resolved to first created object '${first.identity.name}'`,
        contextChecksum: `CS_CTX_${deterministicHash(first.geometryId + 'FIRST')}`,
      };
    }

    if (/\b(last|newest|recent|object i created)\b/.test(normalized) && geoList.length > 0) {
      const targetId = lastCreatedId || geoList[geoList.length - 1].geometryId;
      const last = geometries[targetId] || geoList[geoList.length - 1];
      return {
        referenceText: 'last created object',
        targetGeometryId: last.geometryId,
        workspaceObjectId: last.workspaceObjectId || null,
        resolvedName: last.identity.name,
        resolutionMethod: 'RESOLVED_CONTEXTUAL',
        confidence: 0.95,
        resolutionDetails: `Resolved to last created object '${last.identity.name}'`,
        contextChecksum: `CS_CTX_${deterministicHash(last.geometryId + 'LAST')}`,
      };
    }

    // 4. Primitive Type Matching ("the sphere", "the cube", "the cylinder")
    if (slots.targetNoun) {
      const matches = geoList.filter((g) => g.identity.geometryType === slots.targetNoun || g.identity.name.toUpperCase().includes(slots.targetNoun));
      if (matches.length === 1) {
        const geo = matches[0];
        return {
          referenceText: slots.targetNoun,
          targetGeometryId: geo.geometryId,
          workspaceObjectId: geo.workspaceObjectId || null,
          resolvedName: geo.identity.name,
          resolutionMethod: 'RESOLVED_EXACT',
          confidence: 1.0,
          resolutionDetails: `Exact unique match for '${slots.targetNoun}' → '${geo.identity.name}'`,
          contextChecksum: `CS_CTX_${deterministicHash(geo.geometryId + slots.targetNoun)}`,
        };
      } else if (matches.length > 1) {
        // If one of the matches is the active target, prefer it with contextual confidence
        const activeMatch = matches.find((m) => m.geometryId === activeTargetId);
        if (activeMatch) {
          return {
            referenceText: slots.targetNoun,
            targetGeometryId: activeMatch.geometryId,
            workspaceObjectId: activeMatch.workspaceObjectId || null,
            resolvedName: activeMatch.identity.name,
            resolutionMethod: 'RESOLVED_CONTEXTUAL',
            confidence: 0.85,
            resolutionDetails: `Resolved to active selected match '${activeMatch.identity.name}' among ${matches.length} candidates`,
            contextChecksum: `CS_CTX_${deterministicHash(activeMatch.geometryId + 'ACT_MATCH')}`,
          };
        }
        // Ambiguous match across multiple identical primitive types
        return {
          referenceText: slots.targetNoun,
          targetGeometryId: matches[0].geometryId, // Default to first with AMBIGUOUS flag
          workspaceObjectId: matches[0].workspaceObjectId || null,
          resolvedName: matches[0].identity.name,
          resolutionMethod: 'AMBIGUOUS',
          confidence: 0.5,
          resolutionDetails: `Ambiguous reference '${slots.targetNoun}': ${matches.length} objects match (${matches.map((m) => m.identity.name).join(', ')})`,
          contextChecksum: `CS_CTX_${deterministicHash(slots.targetNoun + 'AMBIG')}`,
        };
      }
    }

    // 5. Fallback to active selection if available
    if (activeTargetId && geometries[activeTargetId]) {
      const geo = geometries[activeTargetId];
      return {
        referenceText: 'active selection',
        targetGeometryId: geo.geometryId,
        workspaceObjectId: geo.workspaceObjectId || null,
        resolvedName: geo.identity.name,
        resolutionMethod: 'RESOLVED_ACTIVE_SELECTION',
        confidence: 0.75,
        resolutionDetails: `Fallback to active target '${geo.identity.name}'`,
        contextChecksum: `CS_CTX_${deterministicHash(geo.geometryId + 'FB')}`,
      };
    }

    // 6. Not Found
    return {
      referenceText: rawText,
      targetGeometryId: null,
      workspaceObjectId: null,
      resolvedName: null,
      resolutionMethod: 'NOT_FOUND',
      confidence: 0.0,
      resolutionDetails: `No target geometry could be resolved for '${rawText}'`,
      contextChecksum: `CS_CTX_${deterministicHash(rawText + 'NONE')}`,
    };
  }

  public static resolveReferenceTarget(
    referenceNoun: string | undefined,
    geometries: Readonly<Record<string, WorkspaceGeometry>>
  ): WorkspaceGeometry | null {
    if (!referenceNoun) return null;
    const geoList = Object.values(geometries);
    const match = geoList.find((g) => g.identity.geometryType === referenceNoun || g.identity.name.toUpperCase().includes(referenceNoun));
    return match || null;
  }
}
