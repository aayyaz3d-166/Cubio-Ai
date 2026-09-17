/**
 * 3D Memory Studio — Funnel 57
 * Material Factory with Automated Registry Caching
 */

import * as THREE from 'three';
import { MaterialRegistry } from './materialRegistry';

export class MaterialFactory {
  private registry: MaterialRegistry;

  constructor(registry: MaterialRegistry) {
    this.registry = registry;
  }

  public getOrCreateCoreMaterial(): THREE.Material {
    const id = 'MAT_MEMORY_CORE';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: false,
    });
    this.registry.register(id, 'MEMORY_CORE', mat);
    return mat;
  }

  public getOrCreateStateMaterial(colorHex = '#06b6d4'): THREE.Material {
    const id = `MAT_STATE_${colorHex.replace('#', '')}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
    });
    this.registry.register(id, 'STATE_DEFAULT', mat);
    return mat;
  }

  public getOrCreateSelectedStateMaterial(): THREE.Material {
    const id = 'MAT_STATE_SELECTED';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
    });
    this.registry.register(id, 'STATE_SELECTED', mat);
    return mat;
  }

  public getOrCreateHighlightedStateMaterial(): THREE.Material {
    const id = 'MAT_STATE_HIGHLIGHTED';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
    });
    this.registry.register(id, 'STATE_HIGHLIGHTED', mat);
    return mat;
  }

  public getOrCreateRelationshipMaterial(opacity = 0.4): THREE.Material {
    const id = `MAT_RELATIONSHIP_${opacity}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity,
    });
    this.registry.register(id, 'RELATIONSHIP_DEFAULT', mat);
    return mat;
  }

  public getOrCreateClusterMaterial(colorHex = '#38bdf8', opacity = 0.25): THREE.Material {
    const id = `MAT_CLUSTER_${colorHex.replace('#', '')}_${opacity}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    });
    this.registry.register(id, 'CLUSTER_BOUNDARY', mat);
    return mat;
  }

  public getOrCreateDimensionMaterial(): THREE.Material {
    const id = 'MAT_DIMENSION_GUIDE';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.LineBasicMaterial({
      color: 0x27272a,
      transparent: true,
      opacity: 0.5,
    });
    this.registry.register(id, 'DIMENSION_GUIDE', mat);
    return mat;
  }

  public getOrCreateSelectionHaloMaterial(): THREE.Material {
    const id = 'MAT_SELECTION_HALO';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.registry.register(id, 'STATE_SELECTED', mat);
    return mat;
  }

  public getOrCreateRestrictedIndicatorMaterial(): THREE.Material {
    const id = 'MAT_RESTRICTED_INDICATOR';
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.material;
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
    });
    this.registry.register(id, 'RESTRICTED_INDICATOR', mat);
    return mat;
  }
}
