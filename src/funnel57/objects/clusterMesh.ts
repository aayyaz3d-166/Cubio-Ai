/**
 * 3D Memory Studio — Funnel 57
 * Three.js Semantic Cluster Mesh
 */

import * as THREE from 'three';
import { BaseMeshObject } from './meshObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { ClusterSceneObject } from '../../funnel56/objects/clusterSceneObject';

export class ClusterMesh extends BaseMeshObject {
  private ringMesh: THREE.Mesh;

  constructor(
    clusterSceneObj: ClusterSceneObject,
    geometryFactory: GeometryFactory,
    materialFactory: MaterialFactory
  ) {
    const geo = geometryFactory.getOrCreateClusterRing(clusterSceneObj.radius, 48);
    const mat = materialFactory.getOrCreateClusterMaterial(clusterSceneObj.colorHex, 0.25);
    const mesh = new THREE.Mesh(geo, mat);

    super(clusterSceneObj.id, mesh, clusterSceneObj);
    this.ringMesh = mesh;
  }
}
