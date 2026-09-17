/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Space Manager
 *
 * Implements high-level lifecycle operations for Personal Spaces:
 * Create, Open, Save, Save As (Duplicate), Reset, Delete, Rename.
 */

import { createDefaultExperimentalReality } from '../p61/realityBuilder';
import { ModelRepresentationEngine } from '../p65/modelRepresentation';
import { P65BridgeAdapter } from '../p66/p65Bridge';
import { P66BridgeAdapter as P67Bridge } from '../p67/p66Bridge';
import { WorkspaceReality } from '../p61/types';
import {
  PersonalSpace,
  ObserverConfigRecord,
  DimensionStateRecord,
  ViewStateRecord,
  SpaceMetadata,
} from './types';
import { SpaceRepository } from './spaceRepository';
import {
  deterministicHash,
  generateDeterministicSpaceId,
  generateDeterministicLineageId,
} from './determinism';

export class SpaceManager {
  private repository: SpaceRepository;
  private spaceCounter = 0;

  constructor(repository = new SpaceRepository()) {
    this.repository = repository;
  }

  public getRepository(): SpaceRepository {
    return this.repository;
  }

  public static calculateChecksum(space: Omit<PersonalSpace, 'spaceChecksum'>): string {
    const raw = JSON.stringify([
      space.spaceId,
      space.name,
      space.reality.realityChecksum,
      space.modelScene.modelChecksum,
      space.geometryScene.sceneChecksum,
      space.featureGraph?.checksum || '00000000',
      space.observers.length,
      space.dimension.dimensionType,
      space.view.viewportMode,
      space.metadata.ownerUserId,
    ]);
    return deterministicHash(raw);
  }

  public createSpace(
    userId = 'USR_DEFAULT_01',
    name = 'New Personal Space',
    description = 'Isolated Research Environment',
    customReality?: WorkspaceReality
  ): PersonalSpace {
    this.spaceCounter++;
    const spaceId = generateDeterministicSpaceId(userId, this.spaceCounter);

    const reality = customReality || createDefaultExperimentalReality();
    const modelScene = ModelRepresentationEngine.buildSceneFromReality(reality);
    const geometryScene = P65BridgeAdapter.adaptScene(modelScene);
    const featureGraph = P67Bridge.adaptSceneToGraph(geometryScene);

    const observers: ObserverConfigRecord[] = [
      Object.freeze({
        observerId: 'OBS_P68_01',
        position: [10, 10, 10] as const,
        target: [0, 0, 0] as const,
        fov: 60,
        certainty: 'EXACT' as const,
      }),
    ];

    const dimension: DimensionStateRecord = Object.freeze({
      dimensionType: '3D',
      activeDimensions: 3,
      projectionSignature: 'IDENTITY_3X3',
    });

    const view: ViewStateRecord = Object.freeze({
      cameraPosition: [15, 15, 15] as const,
      cameraTarget: [0, 0, 0] as const,
      zoom: 1.0,
      viewportMode: 'PERSPECTIVE',
      selectedObjectId: null,
    });

    const metadata: SpaceMetadata = Object.freeze({
      ownerUserId: userId,
      author: userId,
      description,
      tags: Object.freeze(['research', 'p68', 'space']),
      lineageId: null,
      sourceSpaceIdRef: null,
    });

    const baseData = {
      spaceId,
      name,
      status: 'ACTIVE' as const,
      schemaVersion: '6.8.0' as const,
      reality,
      modelScene,
      geometryScene,
      featureGraph,
      observers: Object.freeze(observers),
      dimension,
      view,
      metadata,
      createdAt: 0,
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    const space: PersonalSpace = Object.freeze({
      ...baseData,
      spaceChecksum,
    });

    this.repository.create(space);
    return space;
  }

  public openSpace(spaceId: string): PersonalSpace {
    const space = this.repository.get(spaceId);
    if (!space) {
      throw new Error(`Space ${spaceId} not found.`);
    }
    return space;
  }

  public saveSpace(space: PersonalSpace): PersonalSpace {
    const spaceChecksum = SpaceManager.calculateChecksum(space);
    const updated: PersonalSpace = Object.freeze({
      ...space,
      spaceChecksum,
      updatedAt: 0,
    });
    this.repository.update(updated);
    return updated;
  }

  public saveAs(sourceSpace: PersonalSpace, newName: string): PersonalSpace {
    this.spaceCounter++;
    const newSpaceId = generateDeterministicSpaceId(sourceSpace.metadata.ownerUserId, this.spaceCounter);
    const lineageId = generateDeterministicLineageId(sourceSpace.spaceId, this.spaceCounter);

    const newMetadata: SpaceMetadata = Object.freeze({
      ...sourceSpace.metadata,
      lineageId,
      sourceSpaceIdRef: sourceSpace.spaceId,
    });

    const baseData = {
      ...sourceSpace,
      spaceId: newSpaceId,
      name: newName,
      reality: Object.freeze({
        ...sourceSpace.reality,
        objects: Object.freeze(sourceSpace.reality.objects.map((o) => Object.freeze({ ...o }))),
      }),
      metadata: newMetadata,
      createdAt: 0,
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    const duplicatedSpace: PersonalSpace = Object.freeze({
      ...baseData,
      spaceChecksum,
    });

    this.repository.create(duplicatedSpace);
    return duplicatedSpace;
  }

  public resetSpace(space: PersonalSpace): PersonalSpace {
    const defaultReality = createDefaultExperimentalReality();
    const modelScene = ModelRepresentationEngine.buildSceneFromReality(defaultReality);
    const geometryScene = P65BridgeAdapter.adaptScene(modelScene);
    const featureGraph = P67Bridge.adaptSceneToGraph(geometryScene);

    const baseData = {
      ...space,
      reality: defaultReality,
      modelScene,
      geometryScene,
      featureGraph,
      observers: Object.freeze([
        Object.freeze({
          observerId: 'OBS_P68_01',
          position: [10, 10, 10] as const,
          target: [0, 0, 0] as const,
          fov: 60,
          certainty: 'EXACT' as const,
        }),
      ]),
      view: Object.freeze({
        cameraPosition: [15, 15, 15] as const,
        cameraTarget: [0, 0, 0] as const,
        zoom: 1.0,
        viewportMode: 'PERSPECTIVE' as const,
        selectedObjectId: null,
      }),
      updatedAt: 0,
    };

    const spaceChecksum = SpaceManager.calculateChecksum(baseData);
    const resetSpace: PersonalSpace = Object.freeze({
      ...baseData,
      spaceChecksum,
    });

    this.repository.update(resetSpace);
    return resetSpace;
  }

  public deleteSpace(spaceId: string): boolean {
    return this.repository.delete(spaceId);
  }

  public renameSpace(space: PersonalSpace, newName: string): PersonalSpace {
    const updated: PersonalSpace = Object.freeze({
      ...space,
      name: newName,
      updatedAt: 0,
    });
    this.repository.update(updated);
    return updated;
  }
}
