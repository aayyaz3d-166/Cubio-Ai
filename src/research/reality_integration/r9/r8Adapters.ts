/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: R8 → R9 Read-Only Adapters
 *
 * Consumes R8 interaction state WITHOUT mutating R8 authority.
 */

import {
  RealityInteractionSession,
  InteractionTarget,
  InteractionSelection,
  WorkspaceTransform,
  InteractionHistoryEntry,
  InteractionStaleState,
} from '../r8/types';
import { RealityObjectCertainty, RealityObjectOrigin } from '../r4/types';
import { RealityGeometryReference } from './types';

export interface R8GeometryBinding {
  readonly interactionSessionId: string;
  readonly realityStateId: string;
  readonly workspaceId: string;
  readonly targets: Readonly<Record<string, InteractionTarget>>;
  readonly selection: InteractionSelection;
  readonly realityChecksum: string;
  readonly workspaceChecksum: string;
}

export class R8GeometryAdapter {
  /** Read-only extraction of R8 session into R9 binding */
  public static extractBinding(
    session: RealityInteractionSession,
    realityChecksum: string,
    workspaceChecksum: string
  ): R8GeometryBinding {
    return Object.freeze({
      interactionSessionId: session.sessionId,
      realityStateId: session.realityStateId,
      workspaceId: session.workspaceId,
      targets: session.targets,
      selection: session.selection,
      realityChecksum,
      workspaceChecksum,
    });
  }

  /** Build Reality reference from R8 interaction target (read-only) */
  public static extractRealityReference(
    target: InteractionTarget,
    realityChecksum: string
  ): RealityGeometryReference {
    return Object.freeze({
      realityObjectId: target.realityObjectId,
      realityStateId: target.realityStateId,
      realityCoordinates: target.realityCoordinates,
      realityCertainty: target.certainty,
      realityOrigin: target.origin,
      realityChecksum,
    });
  }

  /** Read R8 workspace transform (never mutate) */
  public static readWorkspaceTransform(target: InteractionTarget): WorkspaceTransform {
    return target.workspaceTransform;
  }

  /** Read R8 selection */
  public static readSelection(session: RealityInteractionSession): InteractionSelection {
    return session.selection;
  }

  /** Read R8 history */
  public static readHistory(session: RealityInteractionSession): readonly InteractionHistoryEntry[] {
    return session.history;
  }

  /** Read R8 reality state ID */
  public static readRealityStateId(session: RealityInteractionSession): string {
    return session.realityStateId;
  }

  /** Get all target visual object IDs */
  public static listTargetIds(session: RealityInteractionSession): readonly string[] {
    return Object.freeze(Object.keys(session.targets));
  }
}
