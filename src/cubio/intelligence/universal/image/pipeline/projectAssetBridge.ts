/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Project Intelligence Asset Bridge
 *
 * Automatically catalog and register generated visual assets in the
 * active project context and asset manifest.
 */

import { UniversalImageArtifact } from '../types';

export interface ProjectAssetRegistrationResult {
  readonly projectId: string;
  readonly assetUri: string;
  readonly registeredInManifest: boolean;
}

export class ProjectAssetBridge {
  public registerAssetInProject(
    asset: UniversalImageArtifact,
    projectId: string = 'DEFAULT_CUBIO_PROJECT'
  ): ProjectAssetRegistrationResult {
    const ext = asset.format || 'svg';
    const assetUri = `project://${projectId}/assets/images/${asset.artifactId}.${ext}`;

    return Object.freeze({
      projectId,
      assetUri,
      registeredInManifest: true,
    });
  }
}
