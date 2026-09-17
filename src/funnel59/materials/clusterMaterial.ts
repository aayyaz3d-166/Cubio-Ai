/**
 * 3D Memory Studio — Funnel 59
 * Cluster Material Manager
 */

import * as THREE from 'three';
import { MaterialFactory } from '../../funnel57/materials/materialFactory';
import { ClusterType } from '../types';

export class ClusterMaterialManager {
  private materialFactory: MaterialFactory;
  private customMaterialMap: Map<string, THREE.Material> = new Map();

  constructor(materialFactory: MaterialFactory) {
    this.materialFactory = materialFactory;
  }

  public getMaterialForCluster(
    type: ClusterType,
    colorHex: string,
    highlighted = false,
    selected = false
  ): THREE.Material {
    if (selected) {
      return this.getOrCreateCachedMaterial('MAT_CLUSTER_SELECTED', 0xe879f9, 0.5, true);
    }
    if (highlighted) {
      return this.getOrCreateCachedMaterial('MAT_CLUSTER_HIGHLIGHTED', 0xfacc15, 0.45, true);
    }

    return this.getOrCreateCachedMaterial(
      `MAT_CLUSTER_${type}_${colorHex}`,
      new THREE.Color(colorHex).getHex(),
      0.2,
      true
    );
  }

  private getOrCreateCachedMaterial(
    key: string,
    colorHex: number,
    opacity: number,
    wireframe = false
  ): THREE.Material {
    let mat = this.customMaterialMap.get(key);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        wireframe,
        side: THREE.DoubleSide,
      });
      this.customMaterialMap.set(key, mat);
    }
    return mat;
  }

  public dispose(): void {
    for (const mat of this.customMaterialMap.values()) {
      mat.dispose();
    }
    this.customMaterialMap.clear();
  }
}
