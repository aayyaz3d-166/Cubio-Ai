/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: World Model Diff Engine
 *
 * Compares two World Model versions to track entity and relationship diffs.
 */

import { WorldModel, WorldModelDiff, EntityChange, RelationChange } from './types';
import { deterministicHash } from './determinism';

export class F11WorldModelDiff {
  public static compare(prevModel: WorldModel, currentModel: WorldModel): WorldModelDiff {
    const entityChanges: EntityChange[] = [];
    const relationChanges: RelationChange[] = [];

    const prevEntities = prevModel.entities;
    const currEntities = currentModel.entities;

    const allEntityIds = new Set([...Object.keys(prevEntities), ...Object.keys(currEntities)]);

    for (const entId of allEntityIds) {
      if (!prevEntities[entId] && currEntities[entId]) {
        entityChanges.push({ entityId: entId, changeType: 'CREATED', details: `Entity ${currEntities[entId].name} created` });
      } else if (prevEntities[entId] && !currEntities[entId]) {
        entityChanges.push({ entityId: entId, changeType: 'REMOVED', details: `Entity ${prevEntities[entId].name} removed` });
      } else if (prevEntities[entId] && currEntities[entId]) {
        const isChanged = prevEntities[entId].entityChecksum !== currEntities[entId].entityChecksum;
        entityChanges.push({
          entityId: entId,
          changeType: isChanged ? 'CHANGED' : 'UNCHANGED',
          details: isChanged ? 'Entity transform or properties modified' : undefined,
        });
      }
    }

    const prevRelMap = new Map(prevModel.relations.map((r) => [r.relationChecksum, r]));
    const currRelMap = new Map(currentModel.relations.map((r) => [r.relationChecksum, r]));

    for (const [cs, r] of currRelMap.entries()) {
      if (!prevRelMap.has(cs)) {
        relationChanges.push({ relationId: r.relationId, changeType: 'CREATED', details: `${r.relationType} established` });
      } else {
        relationChanges.push({ relationId: r.relationId, changeType: 'UNCHANGED' });
      }
    }

    for (const [cs, r] of prevRelMap.entries()) {
      if (!currRelMap.has(cs)) {
        relationChanges.push({ relationId: r.relationId, changeType: 'REMOVED', details: `${r.relationType} revoked` });
      }
    }

    const isIdentical =
      entityChanges.every((e) => e.changeType === 'UNCHANGED') &&
      relationChanges.every((r) => r.changeType === 'UNCHANGED');

    const diffId = `DIFF_${deterministicHash(`${prevModel.version}:${currentModel.version}:${isIdentical}`)}`;

    return {
      diffId,
      previousVersion: prevModel.version,
      currentVersion: currentModel.version,
      entityChanges: Object.freeze(entityChanges),
      relationChanges: Object.freeze(relationChanges),
      isIdentical,
    };
  }
}
