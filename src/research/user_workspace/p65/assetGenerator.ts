/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Asset Generator
 *
 * Coordinates generating multi-format export asset bundles for a ModelScene3D.
 */

import { ModelScene3D, ExportAssetBundle } from './types';
import { ModelExportEngine } from './modelExport';
import { deterministicHash } from './determinism';

export class AssetGenerator {
  public static generateAllAssetBundles(scene: ModelScene3D): readonly ExportAssetBundle[] {
    const objBundle = ModelExportEngine.exportToObj(scene);
    const stlBundle = ModelExportEngine.exportToStl(scene);

    const jsonContent = JSON.stringify(scene, null, 2);
    const jsonBundle: ExportAssetBundle = Object.freeze({
      format: 'JSON_SCENE',
      filename: `${scene.sceneId}.json`,
      content: jsonContent,
      checksum: deterministicHash(jsonContent),
      classification: 'RESEARCH_EXPORT_READY',
    });

    const bundleContent = JSON.stringify({
      sceneId: scene.sceneId,
      formats: ['JSON', 'OBJ', 'STL'],
      totalVertices: scene.totalVertices,
      totalFaces: scene.totalFaces,
    });
    const researchBundle: ExportAssetBundle = Object.freeze({
      format: 'RESEARCH_EXPORT_BUNDLE',
      filename: `${scene.sceneId}_bundle.meta`,
      content: bundleContent,
      checksum: deterministicHash(bundleContent),
      classification: 'RESEARCH_EXPORT_READY',
    });

    return Object.freeze([jsonBundle, objBundle, stlBundle, researchBundle]);
  }
}
