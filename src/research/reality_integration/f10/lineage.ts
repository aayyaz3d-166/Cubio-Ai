/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Multi-Hop Lineage Engine
 *
 * Reconstructs queryable lineage from Conversation → User Message → Intent → Plan → Operation → Geometry.
 */

import { SpatialCommandPlan, F10LineageTrace, F10LineageHop } from './types';
import { deterministicHash } from './determinism';

export class F10LineageEngine {
  public static traceLineage(
    commandId: string,
    plan: SpatialCommandPlan,
    geometryId: string | null
  ): F10LineageTrace {
    const hops: F10LineageHop[] = [
      {
        hopIndex: 1,
        stage: 'CONVERSATION',
        entityId: plan.sessionId,
        description: `Session conversation container`,
      },
      {
        hopIndex: 2,
        stage: 'USER_MESSAGE',
        entityId: commandId,
        description: `Utterance: "${plan.sourceText}"`,
      },
      {
        hopIndex: 3,
        stage: 'INTENT',
        entityId: `INTENT_${plan.intent}`,
        description: `Extracted intent ${plan.intent}`,
      },
      {
        hopIndex: 4,
        stage: 'COMMAND_PLAN',
        entityId: plan.planId,
        description: `Structured plan with ${plan.operations.length} operation(s)`,
      },
      {
        hopIndex: 5,
        stage: 'WORKSPACE_OP',
        entityId: plan.operations[0]?.operationType || 'NO_OP',
        description: plan.summary,
      },
    ];

    if (geometryId) {
      hops.push({
        hopIndex: 6,
        stage: 'GEOMETRY',
        entityId: geometryId,
        description: `Downstream workspace geometry (${plan.operations[0]?.resultingOrigin || 'USER_CONSTRUCTED'})`,
      });
    }

    const lineageChecksum = `CS_F10_LIN_${deterministicHash(hops.map((h) => h.entityId).join(':'))}`;

    return {
      commandId,
      geometryId,
      hops: Object.freeze(hops),
      isRootedInReality: true,
      lineageChecksum,
    };
  }
}
