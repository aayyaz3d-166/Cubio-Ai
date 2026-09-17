/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: 3D Model Export Engine
 *
 * Generates verified, deterministic 3D asset files:
 * 1. JSON Scene Representation
 * 2. Wavefront OBJ (.obj) mesh format
 * 3. Stereolithography STL (.stl) mesh format
 * 4. Research Export Bundle
 */

import { ModelScene3D, ExportAssetBundle } from './types';
import { deterministicHash } from './determinism';

export class ModelExportEngine {
  public static exportToObj(scene: ModelScene3D): ExportAssetBundle {
    let objLines: string[] = [
      `# 3D Memory Studio — Funnel P6.5 OBJ Export`,
      `# Scene ID: ${scene.sceneId}`,
      `# Objects: ${scene.objects.length}`,
      `# Source Reality Checksum: ${scene.sourceRealityChecksum}`,
      ``,
    ];

    let vertexOffset = 1;

    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      objLines.push(`o ${obj.name.replace(/\s+/g, '_')}_${obj.modelObjectId}`);

      const [px, py, pz] = obj.transform.position;
      const [sx, sy, sz] = obj.transform.scale;

      // Write vertices
      for (const [vx, vy, vz] of obj.geometry.vertices) {
        const wx = (vx * sx + px).toFixed(4);
        const wy = (vy * sy + py).toFixed(4);
        const wz = (vz * sz + pz).toFixed(4);
        objLines.push(`v ${wx} ${wy} ${wz}`);
      }

      // Write normals
      for (const [nx, ny, nz] of obj.geometry.normals) {
        objLines.push(`vn ${nx.toFixed(4)} ${ny.toFixed(4)} ${nz.toFixed(4)}`);
      }

      // Write faces
      for (const [f1, f2, f3] of obj.geometry.faces) {
        const i1 = vertexOffset + f1;
        const i2 = vertexOffset + f2;
        const i3 = vertexOffset + f3;
        objLines.push(`f ${i1} ${i2} ${i3}`);
      }

      vertexOffset += obj.geometry.vertices.length;
      objLines.push(``);
    }

    const content = objLines.join('\n');
    const checksum = deterministicHash(content);

    return Object.freeze({
      format: 'OBJ_MESH',
      filename: `${scene.sceneId}.obj`,
      content,
      checksum,
      classification: 'RESEARCH_EXPORT_READY',
    });
  }

  public static exportToStl(scene: ModelScene3D): ExportAssetBundle {
    let stlLines: string[] = [
      `solid ${scene.sceneId}`,
    ];

    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      const [px, py, pz] = obj.transform.position;
      const [sx, sy, sz] = obj.transform.scale;

      for (let fi = 0; fi < obj.geometry.faces.length; fi++) {
        const [f1, f2, f3] = obj.geometry.faces[fi];
        const normal = obj.geometry.normals[fi % obj.geometry.normals.length] || [0, 1, 0];

        stlLines.push(`  facet normal ${normal[0].toFixed(4)} ${normal[1].toFixed(4)} ${normal[2].toFixed(4)}`);
        stlLines.push(`    outer loop`);

        const v1 = obj.geometry.vertices[f1];
        const v2 = obj.geometry.vertices[f2];
        const v3 = obj.geometry.vertices[f3];

        if (v1 && v2 && v3) {
          stlLines.push(`      vertex ${(v1[0] * sx + px).toFixed(4)} ${(v1[1] * sy + py).toFixed(4)} ${(v1[2] * sz + pz).toFixed(4)}`);
          stlLines.push(`      vertex ${(v2[0] * sx + px).toFixed(4)} ${(v2[1] * sy + py).toFixed(4)} ${(v2[2] * sz + pz).toFixed(4)}`);
          stlLines.push(`      vertex ${(v3[0] * sx + px).toFixed(4)} ${(v3[1] * sy + py).toFixed(4)} ${(v3[2] * sz + pz).toFixed(4)}`);
        }

        stlLines.push(`    endloop`);
        stlLines.push(`  endfacet`);
      }
    }

    stlLines.push(`endsolid ${scene.sceneId}`);

    const content = stlLines.join('\n');
    const checksum = deterministicHash(content);

    return Object.freeze({
      format: 'STL_MESH',
      filename: `${scene.sceneId}.stl`,
      content,
      checksum,
      classification: 'RESEARCH_EXPORT_READY',
    });
  }
}
