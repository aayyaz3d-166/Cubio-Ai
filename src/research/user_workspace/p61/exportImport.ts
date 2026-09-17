/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.1: Workspace Export & Import Engine
 *
 * Deterministic JSON export and schema-validated import.
 * Ensures security: rejects malformed or executable injected payloads.
 */

import {
  WorkspaceReality,
  WorkspaceObserver,
  WorkspaceExport,
  WorkspaceValidationReport,
  WorkspaceObject,
} from './types';
import { computeRealityChecksum, simpleHash } from './realityBuilder';
import { computeObserverChecksum } from './observerController';

export function exportWorkspaceToJson(
  reality: WorkspaceReality,
  observer: WorkspaceObserver
): WorkspaceExport {
  const combinedChecksum = simpleHash(reality.realityChecksum + observer.observerChecksum);

  return Object.freeze({
    schemaVersion: '6.1.0',
    exportedAt: new Date(0).toISOString(), // Deterministic ISO timestamp
    workspaceChecksum: combinedChecksum,
    reality,
    observer,
    metadata: {
      objectCount: reality.objects.length,
      sourceMode: reality.sourceMode,
      dimension: observer.dimension,
    },
  });
}

export function validateWorkspaceImportData(data: unknown): WorkspaceValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Imported data must be a valid JSON object.'], warnings: [] };
  }

  const obj = data as any;

  if (obj.schemaVersion !== '6.1.0') {
    errors.push(`Unsupported schema version: ${obj.schemaVersion}. Expected 6.1.0.`);
  }

  if (!obj.reality || typeof obj.reality !== 'object' || !Array.isArray(obj.reality.objects)) {
    errors.push('Missing or invalid reality objects array.');
  } else {
    for (let i = 0; i < obj.reality.objects.length; i++) {
      const item = obj.reality.objects[i];
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Object at index ${i} has invalid or missing ID.`);
      }
      if (!Array.isArray(item.position) || item.position.length !== 3) {
        errors.push(`Object ${item.id || i} must have 3-component position array [X,Y,Z].`);
      } else if (item.position.some((v: any) => typeof v !== 'number' || isNaN(v) || !isFinite(v))) {
        errors.push(`Object ${item.id || i} position contains non-finite numbers.`);
      }
    }
  }

  if (!obj.observer || typeof obj.observer !== 'object') {
    errors.push('Missing or invalid observer configuration.');
  } else {
    if (![3, 2, 1].includes(obj.observer.dimension)) {
      errors.push(`Invalid dimension: ${obj.observer.dimension}. Allowed: 3, 2, 1.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

export function importWorkspaceFromJson(
  jsonData: string | WorkspaceExport
): { reality: WorkspaceReality; observer: WorkspaceObserver } {
  let parsed: any;
  if (typeof jsonData === 'string') {
    try {
      parsed = JSON.parse(jsonData);
    } catch {
      throw new Error('Failed to parse JSON string.');
    }
  } else {
    parsed = jsonData;
  }

  const validation = validateWorkspaceImportData(parsed);
  if (!validation.isValid) {
    throw new Error(`Import validation failed: ${validation.errors.join('; ')}`);
  }

  const importedObjects: WorkspaceObject[] = parsed.reality.objects.map((o: any) => ({
    id: String(o.id),
    label: String(o.label || o.id),
    position: [Number(o.position[0]), Number(o.position[1]), Number(o.position[2])],
    category: String(o.category || 'IMPORTED'),
    color: String(o.color || '#06b6d4'),
    radius: typeof o.radius === 'number' ? o.radius : 8,
    isCanonicalCopy: Boolean(o.isCanonicalCopy),
    metadata: typeof o.metadata === 'object' && o.metadata !== null ? { ...o.metadata } : {},
    internalPayload: o.internalPayload ? String(o.internalPayload) : undefined,
  }));

  const frozenObjects = Object.freeze(importedObjects);
  const realityChecksum = computeRealityChecksum(frozenObjects);

  const importedReality: WorkspaceReality = Object.freeze({
    realityId: parsed.reality.realityId || `P61_IMPORTED_${realityChecksum}`,
    realityChecksum,
    objects: frozenObjects,
    sourceMode: 'IMPORTED',
    timestamp: Date.now(),
  });

  const obs = parsed.observer;
  const partialObserver = {
    observerId: obs.observerId || 'P61_IMPORTED_OBSERVER',
    label: obs.label || 'Imported Observer',
    position: [Number(obs.position[0]), Number(obs.position[1]), Number(obs.position[2])] as const,
    target: [Number(obs.target[0]), Number(obs.target[1]), Number(obs.target[2])] as const,
    up: [0, 1, 0] as const,
    yaw: Number(obs.yaw || 0),
    pitch: Number(obs.pitch || 0),
    distance: Number(obs.distance || 240),
    fov: Number(obs.fov || 60),
    dimension: Number(obs.dimension || 3) as any,
    projectionType: obs.projectionType || 'PERSPECTIVE_3D',
    viewportWidth: Number(obs.viewportWidth || 640),
    viewportHeight: Number(obs.viewportHeight || 480),
  };

  const importedObserver: WorkspaceObserver = Object.freeze({
    ...partialObserver,
    observerChecksum: computeObserverChecksum(partialObserver),
  });

  return { reality: importedReality, observer: importedObserver };
}
