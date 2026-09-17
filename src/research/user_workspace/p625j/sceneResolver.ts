/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-J: Scene Resolver & Space-Scene Isolation
 *
 * Resolves authoritative workspace-bound geometry scenes per Space.
 * Enforces mutual space isolation and prevents cross-space cross-user leakage.
 */

import {
  WorkspaceBoundGeometryScene,
  WorkspaceBoundGeometryObject,
} from './types';
import { GeometryBindingLayer } from './geometryBinding';
import { LiveSpaceState, WorkspaceUserContext } from '../p625i/types';

export class SceneResolver {
  private static sceneRegistry: Map<string, WorkspaceBoundGeometryScene> = new Map();

  public static resolveSceneForSpace(
    space: LiveSpaceState,
    userContext: WorkspaceUserContext
  ): WorkspaceBoundGeometryScene | null {
    if (space.isDeleted) {
      return null;
    }

    if (!userContext.isAuthenticated || userContext.userRole === 'NO_ACCESS') {
      return null;
    }

    // Check if cached scene exists
    let scene = SceneResolver.sceneRegistry.get(space.spaceId);
    if (!scene) {
      scene = GeometryBindingLayer.createDefaultSpaceScene(
        space.spaceId,
        space.ownerId,
        space.currentCoordinates,
        space.currentDimensions
      );
      SceneResolver.sceneRegistry.set(space.spaceId, scene);
    } else {
      // Validate ownership match
      if (scene.ownerId !== userContext.userId && userContext.userRole !== 'OWNER' && userContext.userRole !== 'EDITOR') {
        return null;
      }
    }

    return scene;
  }

  public static updateScene(scene: WorkspaceBoundGeometryScene): void {
    SceneResolver.sceneRegistry.set(scene.spaceId, scene);
  }

  public static removeSceneForSpace(spaceId: string): void {
    SceneResolver.sceneRegistry.delete(spaceId);
  }

  public static clearRegistry(): void {
    SceneResolver.sceneRegistry.clear();
  }
}
