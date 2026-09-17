/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: Context & Entity Resolver
 *
 * Deterministically maps entity names, pronouns, spatial superlatives, and active selection
 * to concrete WorldEntity IDs without guessing.
 *
 * Invariant: Ambiguity returns status 'AMBIGUOUS' with all candidate IDs.
 */

import { WorldEntity } from './types';

export interface ResolvedEntityResult {
  readonly status: 'EXACT' | 'AMBIGUOUS' | 'NOT_FOUND';
  readonly resolvedEntityId: string | null;
  readonly candidateEntityIds: readonly string[];
  readonly resolutionDetails: string;
}

export class F11ContextResolver {
  public static resolveEntity(
    rawQueryText: string,
    entities: Readonly<Record<string, WorldEntity>>,
    activeSelectionId: string | null = null,
    lastCreatedId: string | null = null
  ): ResolvedEntityResult {
    const text = rawQueryText.toLowerCase().trim();
    const entityList = Object.values(entities);

    if (entityList.length === 0) {
      return {
        status: 'NOT_FOUND',
        resolvedEntityId: null,
        candidateEntityIds: [],
        resolutionDetails: 'World model has no entities.',
      };
    }

    // 1. Direct ID match
    if (entities[rawQueryText]) {
      return {
        status: 'EXACT',
        resolvedEntityId: rawQueryText,
        candidateEntityIds: [rawQueryText],
        resolutionDetails: `Direct entity ID match for '${rawQueryText}'`,
      };
    }

    // 2. Active Selection ("selected", "active", "focused", "this object")
    if (/\b(selected|active|current|focused)\b/.test(text) || (text === 'this' && activeSelectionId)) {
      if (activeSelectionId && entities[activeSelectionId]) {
        return {
          status: 'EXACT',
          resolvedEntityId: activeSelectionId,
          candidateEntityIds: [activeSelectionId],
          resolutionDetails: `Resolved to active selection '${entities[activeSelectionId].name}'`,
        };
      }
    }

    // 3. Pronouns ("it", "that", "this")
    if (/\b(it|that|this)\b/.test(text)) {
      const targetId = activeSelectionId || lastCreatedId;
      if (targetId && entities[targetId]) {
        return {
          status: 'EXACT',
          resolvedEntityId: targetId,
          candidateEntityIds: [targetId],
          resolutionDetails: `Pronoun resolved to active context '${entities[targetId].name}'`,
        };
      }
    }

    // 4. Superlatives (Leftmost, Rightmost, Highest, Lowest)
    if (/\b(leftmost|on the left|left object)\b/.test(text)) {
      const sorted = [...entityList].filter((e) => e.coordinates).sort((a, b) => a.coordinates![0] - b.coordinates![0]);
      if (sorted.length > 0) {
        return {
          status: 'EXACT',
          resolvedEntityId: sorted[0].entityId,
          candidateEntityIds: [sorted[0].entityId],
          resolutionDetails: `Resolved to leftmost entity '${sorted[0].name}' (X=${sorted[0].coordinates![0].toFixed(2)})`,
        };
      }
    }

    if (/\b(rightmost|on the right|right object)\b/.test(text)) {
      const sorted = [...entityList].filter((e) => e.coordinates).sort((a, b) => b.coordinates![0] - a.coordinates![0]);
      if (sorted.length > 0) {
        return {
          status: 'EXACT',
          resolvedEntityId: sorted[0].entityId,
          candidateEntityIds: [sorted[0].entityId],
          resolutionDetails: `Resolved to rightmost entity '${sorted[0].name}' (X=${sorted[0].coordinates![0].toFixed(2)})`,
        };
      }
    }

    if (/\b(highest|top|uppermost)\b/.test(text)) {
      const sorted = [...entityList].filter((e) => e.coordinates).sort((a, b) => b.coordinates![1] - a.coordinates![1]);
      if (sorted.length > 0) {
        return {
          status: 'EXACT',
          resolvedEntityId: sorted[0].entityId,
          candidateEntityIds: [sorted[0].entityId],
          resolutionDetails: `Resolved to highest entity '${sorted[0].name}' (Y=${sorted[0].coordinates![1].toFixed(2)})`,
        };
      }
    }

    if (/\b(lowest|bottom)\b/.test(text)) {
      const sorted = [...entityList].filter((e) => e.coordinates).sort((a, b) => a.coordinates![1] - b.coordinates![1]);
      if (sorted.length > 0) {
        return {
          status: 'EXACT',
          resolvedEntityId: sorted[0].entityId,
          candidateEntityIds: [sorted[0].entityId],
          resolutionDetails: `Resolved to lowest entity '${sorted[0].name}' (Y=${sorted[0].coordinates![1].toFixed(2)})`,
        };
      }
    }

    // 5. Name / Type substring matching
    const matches = entityList.filter((e) => {
      const name = e.name.toLowerCase();
      return name === text || name.includes(text) || text.includes(name);
    });

    if (matches.length === 1) {
      return {
        status: 'EXACT',
        resolvedEntityId: matches[0].entityId,
        candidateEntityIds: [matches[0].entityId],
        resolutionDetails: `Exact unique match for '${rawQueryText}' -> '${matches[0].name}'`,
      };
    } else if (matches.length > 1) {
      // If one of the matches matches active selection, prefer it
      const activeMatch = matches.find((m) => m.entityId === activeSelectionId);
      if (activeMatch) {
        return {
          status: 'EXACT',
          resolvedEntityId: activeMatch.entityId,
          candidateEntityIds: matches.map((m) => m.entityId),
          resolutionDetails: `Resolved to active selected candidate '${activeMatch.name}' among ${matches.length} matches`,
        };
      }

      // Ambiguous multiple matches
      return {
        status: 'AMBIGUOUS',
        resolvedEntityId: null,
        candidateEntityIds: Object.freeze(matches.map((m) => m.entityId)),
        resolutionDetails: `Ambiguous match for '${rawQueryText}': ${matches.map((m) => m.name).join(', ')}`,
      };
    }

    return {
      status: 'NOT_FOUND',
      resolvedEntityId: null,
      candidateEntityIds: [],
      resolutionDetails: `No entity matched '${rawQueryText}'`,
    };
  }
}
