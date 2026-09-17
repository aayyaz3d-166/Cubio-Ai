/**
 * 3D Memory Studio — Funnel 63
 * Three.js 3D Cube Geometry & Materials
 */

import * as THREE from 'three';
import { CubeFaceId } from '../types';

export interface FaceMaterialSet {
  faceId: CubeFaceId;
  baseColor: number;
  hoverColor: number;
  activeColor: number;
  material: THREE.MeshStandardMaterial;
}

export class LandingCubeGeometryFactory {
  private boxGeometry: THREE.BoxGeometry | null = null;
  private wireframeGeometry: THREE.EdgesGeometry | null = null;
  private materials: THREE.MeshStandardMaterial[] = [];
  private wireframeMaterial: THREE.LineBasicMaterial | null = null;

  public createCubeMesh(): {
    mesh: THREE.Mesh;
    edgesMesh: THREE.LineSegments;
    materials: THREE.MeshStandardMaterial[];
  } {
    // 60x60x60 Three.js Box Geometry
    if (!this.boxGeometry) {
      this.boxGeometry = new THREE.BoxGeometry(60, 60, 60);
    }

    if (this.materials.length === 0) {
      const faceColors = [
        0x00f2ff, // Right (+X): DATA (Cyan)
        0x14b8a6, // Left (-X): GRAPH (Teal)
        0xd946ef, // Top (+Y): CLUSTER (Fuchsia)
        0xf59e0b, // Bottom (-Y): DIMENSION (Amber)
        0x8b5cf6, // Front (+Z): AI (Purple)
        0x3b82f6, // Back (-Z): STUDIO (Blue)
      ];

      for (let i = 0; i < 6; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: faceColors[i],
          roughness: 0.25,
          metalness: 0.75,
          transparent: true,
          opacity: 0.85,
        });
        this.materials.push(mat);
      }
    }

    const mesh = new THREE.Mesh(this.boxGeometry, this.materials);
    mesh.name = 'LandingCubeMesh';

    // Edges geometry
    if (!this.wireframeGeometry) {
      this.wireframeGeometry = new THREE.EdgesGeometry(this.boxGeometry);
    }
    if (!this.wireframeMaterial) {
      this.wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.4,
      });
    }

    const edgesMesh = new THREE.LineSegments(this.wireframeGeometry, this.wireframeMaterial);
    edgesMesh.name = 'LandingCubeEdges';

    return {
      mesh,
      edgesMesh,
      materials: this.materials,
    };
  }

  public dispose(): void {
    if (this.boxGeometry) {
      this.boxGeometry.dispose();
      this.boxGeometry = null;
    }
    if (this.wireframeGeometry) {
      this.wireframeGeometry.dispose();
      this.wireframeGeometry = null;
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];
    if (this.wireframeMaterial) {
      this.wireframeMaterial.dispose();
      this.wireframeMaterial = null;
    }
  }
}
