/**
 * 3D Memory Studio — Funnel 58
 * Edge Material Vocabulary & Factory Binding
 */

import * as THREE from 'three';
import { MaterialFactory } from '../../funnel57/materials/materialFactory';
import { GraphRelationshipType } from '../types';

export class EdgeMaterialManager {
  private materialFactory: MaterialFactory;
  private customMaterialMap: Map<string, THREE.LineBasicMaterial> = new Map();

  constructor(materialFactory: MaterialFactory) {
    this.materialFactory = materialFactory;
  }

  public getMaterialForType(
    type: GraphRelationshipType,
    strength = 0.5,
    highlighted = false,
    selected = false
  ): THREE.Material {
    if (selected) {
      return this.getOrCreateCachedMaterial('MAT_GRAPH_SELECTED', 0xe879f9, 0.95);
    }
    if (highlighted) {
      return this.getOrCreateCachedMaterial('MAT_GRAPH_HIGHLIGHTED', 0xfacc15, 0.9);
    }

    const opacity = Math.max(0.2, Math.min(0.85, strength * 0.8));

    switch (type) {
      case 'SEMANTIC':
        return this.getOrCreateCachedMaterial(`MAT_REL_SEMANTIC_${opacity}`, 0x38bdf8, opacity);
      case 'DOMAIN':
        return this.getOrCreateCachedMaterial(`MAT_REL_DOMAIN_${opacity}`, 0xa855f7, opacity);
      case 'CATEGORY':
        return this.getOrCreateCachedMaterial(`MAT_REL_CATEGORY_${opacity}`, 0x34d399, opacity);
      case 'SOURCE':
        return this.getOrCreateCachedMaterial(`MAT_REL_SOURCE_${opacity}`, 0xfbbf24, opacity);
      case 'SEQUENCE':
        return this.getOrCreateCachedMaterial(`MAT_REL_SEQUENCE_${opacity}`, 0x60a5fa, opacity);
      case 'COORDINATE':
      default:
        return this.getOrCreateCachedMaterial(`MAT_REL_COORD_${opacity}`, 0xfb7185, opacity);
    }
  }

  private getOrCreateCachedMaterial(
    key: string,
    colorHex: number,
    opacity: number
  ): THREE.LineBasicMaterial {
    let mat = this.customMaterialMap.get(key);
    if (!mat) {
      mat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
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
