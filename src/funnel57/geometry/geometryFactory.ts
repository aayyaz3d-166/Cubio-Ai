/**
 * 3D Memory Studio — Funnel 57
 * Geometry Factory with Automated Registry Caching
 */

import * as THREE from 'three';
import { GeometryRegistry } from './geometryRegistry';
import { GeometryQualityLevel } from '../types';

export class GeometryFactory {
  private registry: GeometryRegistry;

  constructor(registry: GeometryRegistry) {
    this.registry = registry;
  }

  public getOrCreateCoreSphere(radius = 16, quality: GeometryQualityLevel = 'MEDIUM'): THREE.BufferGeometry {
    const segments = quality === 'HIGH' ? 32 : quality === 'MEDIUM' ? 24 : 16;
    const id = `GEO_CORE_SPHERE_${radius}_${segments}`;

    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    const geo = new THREE.SphereGeometry(radius, segments, segments);
    this.registry.register(id, 'CORE_SPHERE', geo);
    return geo;
  }

  public getOrCreateCoreTorus(
    radius = 28,
    tube = 1.2,
    type: 'INNER' | 'OUTER' = 'INNER',
    quality: GeometryQualityLevel = 'MEDIUM'
  ): THREE.BufferGeometry {
    const radial = quality === 'HIGH' ? 16 : 12;
    const tubular = quality === 'HIGH' ? 48 : 32;
    const id = `GEO_CORE_TORUS_${type}_${radius}_${tube}`;

    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    const geo = new THREE.TorusGeometry(radius, tube, radial, tubular);
    this.registry.register(
      id,
      type === 'INNER' ? 'CORE_TORUS_INNER' : 'CORE_TORUS_OUTER',
      geo
    );
    return geo;
  }

  public getOrCreateStateGeometry(
    lod: 'LOD_HIGH' | 'LOD_MED' | 'LOD_LOW' = 'LOD_MED',
    radius = 5
  ): THREE.BufferGeometry {
    const id = `GEO_STATE_${lod}_${radius}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    let geo: THREE.BufferGeometry;
    if (lod === 'LOD_HIGH') {
      geo = new THREE.IcosahedronGeometry(radius, 2);
      this.registry.register(id, 'STATE_SPHERE_HIGH', geo);
    } else if (lod === 'LOD_MED') {
      geo = new THREE.IcosahedronGeometry(radius, 1);
      this.registry.register(id, 'STATE_SPHERE_MED', geo);
    } else {
      geo = new THREE.SphereGeometry(radius, 8, 8);
      this.registry.register(id, 'STATE_SPHERE_LOW', geo);
    }

    return geo;
  }

  public createRelationshipGeometry(
    src: [number, number, number],
    tgt: [number, number, number]
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      src[0], src[1], src[2],
      tgt[0], tgt[1], tgt[2],
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }

  public getOrCreateClusterRing(radius = 60, segments = 48): THREE.BufferGeometry {
    const id = `GEO_CLUSTER_RING_${radius}_${segments}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    const geo = new THREE.RingGeometry(radius - 0.5, radius + 0.5, segments);
    this.registry.register(id, 'CLUSTER_RING', geo);
    return geo;
  }

  public getOrCreateDimensionGrid(size = 400, divisions = 20): THREE.BufferGeometry {
    const id = `GEO_DIMENSION_GRID_${size}_${divisions}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    const grid = new THREE.GridHelper(size, divisions);
    const geo = grid.geometry.clone();
    grid.geometry.dispose();

    this.registry.register(id, 'DIMENSION_GRID', geo);
    return geo;
  }

  public getOrCreateSelectionHalo(radius = 8): THREE.BufferGeometry {
    const id = `GEO_SELECTION_HALO_${radius}`;
    const existing = this.registry.get(id);
    if (existing) {
      this.registry.retain(id);
      return existing.geometry;
    }

    const geo = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 32);
    this.registry.register(id, 'SELECTION_HALO', geo);
    return geo;
  }
}
