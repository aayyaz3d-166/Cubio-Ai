/**
 * 3D Memory Studio — Funnel 57
 * Geometry Scene Adapter
 *
 * Synchronizes F56 SceneGraph into Three.js Mesh objects.
 */

import * as THREE from 'three';
import { SceneEngine } from '../../funnel56/scene/sceneEngine';
import { CoreSceneObject } from '../../funnel56/objects/coreSceneObject';
import { StateSceneObject } from '../../funnel56/objects/stateSceneObject';
import { RelationshipSceneObject } from '../../funnel56/objects/relationshipSceneObject';
import { ClusterSceneObject } from '../../funnel56/objects/clusterSceneObject';
import { DimensionSceneObject } from '../../funnel56/objects/dimensionSceneObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { IMeshObject } from '../types';
import { CoreMesh } from '../objects/coreMesh';
import { createSecureStateMesh } from './securityGeometryAdapter';
import { RelationshipMesh } from '../objects/relationshipMesh';
import { ClusterMesh } from '../objects/clusterMesh';
import { DimensionMesh } from '../objects/dimensionMesh';

export class GeometrySceneAdapter {
  public readonly rootGroup: THREE.Group;
  private meshMap: Map<string, IMeshObject> = new Map();
  private geometryFactory: GeometryFactory;
  private materialFactory: MaterialFactory;
  private isDisposed = false;

  constructor(geometryFactory: GeometryFactory, materialFactory: MaterialFactory) {
    this.rootGroup = new THREE.Group();
    this.geometryFactory = geometryFactory;
    this.materialFactory = materialFactory;
  }

  public synchronizeScene(sceneEngine: SceneEngine): void {
    if (this.isDisposed) return;

    // 1. Clear previous meshes from group
    this.clear();

    // 2. Synchronize Core
    const coreObj = sceneEngine.graph.coreNode;
    const coreMesh = new CoreMesh(coreObj, this.geometryFactory, this.materialFactory);
    this.addMesh(coreMesh);

    // 3. Synchronize Dimension
    const dimObjects = sceneEngine.registry.getByType('DIMENSION') as DimensionSceneObject[];
    for (const dimObj of dimObjects) {
      const dimMesh = new DimensionMesh(dimObj, this.geometryFactory, this.materialFactory);
      this.addMesh(dimMesh);
    }

    // 4. Synchronize Clusters
    const clusterObjects = sceneEngine.registry.getByType('CLUSTER') as ClusterSceneObject[];
    for (const clusterObj of clusterObjects) {
      const clusterMesh = new ClusterMesh(clusterObj, this.geometryFactory, this.materialFactory);
      this.addMesh(clusterMesh);
    }

    // 5. Synchronize State Nodes (GREEN only)
    const stateObjects = sceneEngine.registry.getByType('STATE') as StateSceneObject[];
    for (const stateObj of stateObjects) {
      const stateMesh = createSecureStateMesh(stateObj, this.geometryFactory, this.materialFactory);
      if (stateMesh) {
        this.addMesh(stateMesh);
      }
    }

    // 6. Synchronize Relationships
    const relObjects = sceneEngine.registry.getByType('RELATIONSHIP') as RelationshipSceneObject[];
    for (const relObj of relObjects) {
      const relMesh = new RelationshipMesh(relObj, this.geometryFactory, this.materialFactory);
      this.addMesh(relMesh);
    }

    // 7. Initial transform synchronization
    this.syncTransforms(sceneEngine);
  }

  public syncTransforms(sceneEngine: SceneEngine): void {
    if (this.isDisposed) return;

    for (const [id, meshObj] of this.meshMap.entries()) {
      const sceneObj = sceneEngine.registry.get(id);
      if (sceneObj) {
        meshObj.syncFromSceneObject(sceneObj);
      }
    }
  }

  public update(deltaMs: number, timeMs: number): void {
    if (this.isDisposed) return;
    for (const meshObj of this.meshMap.values()) {
      meshObj.update(deltaMs, timeMs);
    }
  }

  private addMesh(meshObj: IMeshObject): void {
    this.meshMap.set(meshObj.id, meshObj);
    this.rootGroup.add(meshObj.threeObject);
  }

  public getMesh(id: string): IMeshObject | undefined {
    return this.meshMap.get(id);
  }

  public get meshCount(): number {
    return this.meshMap.size;
  }

  public clear(): void {
    for (const meshObj of this.meshMap.values()) {
      this.rootGroup.remove(meshObj.threeObject);
      meshObj.dispose();
    }
    this.meshMap.clear();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clear();
  }
}
