/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.6: Advanced Geometry Export Engine
 *
 * Generates verified Wavefront OBJ (.obj), STL (.stl), and JSON formats with validation gating.
 */

import { AdvancedGeometryScene } from './types';
import { GeometryValidator } from './geometryValidator';
import { deterministicHash } from './determinism';

export interface P66ExportBundle {
  readonly format: 'JSON_SCENE' | 'OBJ_MESH' | 'STL_MESH' | 'META_BUNDLE';
  readonly filename: string;
  readonly content: string;
  readonly checksum: string;
  readonly classification: 'RESEARCH_EXPORT_READY' | 'RESEARCH_EXPORT_BLOCKED';
  readonly validationIssues: readonly string[];
}

export class GeometryExportEngine {
  public static exportToObj(scene: AdvancedGeometryScene): P66ExportBundle {
    const report = GeometryValidator.validateScene(scene);
    if (!report.isValid) {
      return {
        format: 'OBJ_MESH',
        filename: `${scene.sceneId}.obj`,
        content: `# EXPORT BLOCKED: ${report.issues.join('; ')}`,
        checksum: '00000000',
        classification: 'RESEARCH_EXPORT_BLOCKED',
        validationIssues: report.issues,
      };
    }

    const objLines: string[] = [
      `# 3D Memory Studio — Funnel P6.6 Advanced Geometry OBJ Export`,
      `# Scene ID: ${scene.sceneId}`,
      `# Objects: ${scene.objects.length}`,
      ``,
    ];

    let vertexOffset = 1;

    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      objLines.push(`o ${obj.name.replace(/\s+/g, '_')}_${obj.id}`);

      for (const [vx, vy, vz] of obj.mesh.vertices) {
        objLines.push(`v ${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}`);
      }
      for (const [nx, ny, nz] of obj.mesh.normals) {
        objLines.push(`vn ${nx.toFixed(4)} ${ny.toFixed(4)} ${nz.toFixed(4)}`);
      }
      for (const [f0, f1, f2] of obj.mesh.faces) {
        objLines.push(`f ${vertexOffset + f0} ${vertexOffset + f1} ${vertexOffset + f2}`);
      }
      vertexOffset += obj.mesh.vertices.length;
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
      validationIssues: Object.freeze([]),
    });
  }

  public static exportToStl(scene: AdvancedGeometryScene): P66ExportBundle {
    const report = GeometryValidator.validateScene(scene);
    if (!report.isValid) {
      return {
        format: 'STL_MESH',
        filename: `${scene.sceneId}.stl`,
        content: `solid ${scene.sceneId}\nendsolid ${scene.sceneId}`,
        checksum: '00000000',
        classification: 'RESEARCH_EXPORT_BLOCKED',
        validationIssues: report.issues,
      };
    }

    const stlLines: string[] = [`solid ${scene.sceneId}`];

    for (const obj of scene.objects) {
      if (!obj.visible) continue;
      for (let i = 0; i < obj.mesh.faces.length; i++) {
        const [f0, f1, f2] = obj.mesh.faces[i];
        const normal = obj.mesh.normals[i % obj.mesh.normals.length] || [0, 1, 0];

        const v0 = obj.mesh.vertices[f0];
        const v1 = obj.mesh.vertices[f1];
        const v2 = obj.mesh.vertices[f2];

        if (v0 && v1 && v2) {
          stlLines.push(`  facet normal ${normal[0].toFixed(4)} ${normal[1].toFixed(4)} ${normal[2].toFixed(4)}`);
          stlLines.push(`    outer loop`);
          stlLines.push(`      vertex ${v0[0].toFixed(4)} ${v0[1].toFixed(4)} ${v0[2].toFixed(4)}`);
          stlLines.push(`      vertex ${v1[0].toFixed(4)} ${v1[1].toFixed(4)} ${v1[2].toFixed(4)}`);
          stlLines.push(`      vertex ${v2[0].toFixed(4)} ${v2[1].toFixed(4)} ${v2[2].toFixed(4)}`);
          stlLines.push(`    endloop`);
          stlLines.push(`  endfacet`);
        }
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
      validationIssues: Object.freeze([]),
    });
  }
}
