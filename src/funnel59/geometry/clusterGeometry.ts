/**
 * 3D Memory Studio — Funnel 59
 * Three.js Cluster Mesh & Boundary Geometry
 */

import * as THREE from 'three';
import { IClusterMesh, Cluster } from '../types';
import { ClusterMaterialManager } from '../materials/clusterMaterial';

export class ClusterMeshWrapper implements IClusterMesh {
  public readonly id: string;
  public readonly cluster: Cluster;
  public readonly groupObject: THREE.Group;
  private ringMesh: THREE.Mesh;
  private centerMarker: THREE.Mesh;
  private materialManager: ClusterMaterialManager;
  private isDisposed = false;

  constructor(cluster: Cluster, materialManager: ClusterMaterialManager) {
    this.id = cluster.clusterId;
    this.cluster = cluster;
    this.materialManager = materialManager;
    this.groupObject = new THREE.Group();

    // 1. Boundary Ring
    const ringGeo = new THREE.RingGeometry(
      Math.max(1, cluster.radius - 1),
      cluster.radius + 1,
      48
    );
    const mat = materialManager.getMaterialForCluster(
      cluster.clusterType,
      cluster.colorHex,
      cluster.highlighted,
      cluster.selected
    );
    this.ringMesh = new THREE.Mesh(ringGeo, mat);
    this.ringMesh.rotation.x = Math.PI / 2; // Flat on XZ plane
    this.groupObject.add(this.ringMesh);

    // 2. Center Point Marker
    const centerGeo = new THREE.SphereGeometry(3, 12, 12);
    const centerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cluster.colorHex),
    });
    this.centerMarker = new THREE.Mesh(centerGeo, centerMat);
    this.groupObject.add(this.centerMarker);

    // Set initial position
    this.groupObject.position.set(cluster.center[0], cluster.center[1], cluster.center[2]);
    this.groupObject.visible = cluster.visible;
  }

  public get visible(): boolean {
    return this.groupObject.visible;
  }

  public set visible(val: boolean) {
    this.groupObject.visible = val;
    this.cluster.visible = val;
  }

  public updateGeometry(center: [number, number, number], radius: number): void {
    if (this.isDisposed) return;
    this.cluster.center = [...center];
    this.cluster.radius = radius;
    this.groupObject.position.set(center[0], center[1], center[2]);

    this.ringMesh.geometry.dispose();
    this.ringMesh.geometry = new THREE.RingGeometry(
      Math.max(1, radius - 1),
      radius + 1,
      48
    );
  }

  public setHighlighted(highlighted: boolean): void {
    if (this.isDisposed) return;
    this.cluster.highlighted = highlighted;
    this.ringMesh.material = this.materialManager.getMaterialForCluster(
      this.cluster.clusterType,
      this.cluster.colorHex,
      highlighted,
      this.cluster.selected
    );
  }

  public setSelected(selected: boolean): void {
    if (this.isDisposed) return;
    this.cluster.selected = selected;
    this.ringMesh.material = this.materialManager.getMaterialForCluster(
      this.cluster.clusterType,
      this.cluster.colorHex,
      this.cluster.highlighted,
      selected
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.ringMesh.geometry.dispose();
    this.centerMarker.geometry.dispose();
    (this.centerMarker.material as THREE.Material).dispose();
  }
}
