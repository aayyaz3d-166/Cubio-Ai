/**
 * 3D Memory Studio — Funnel 57
 * Three.js Information State Mesh
 */

import * as THREE from 'three';
import { BaseMeshObject } from './meshObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { StateSceneObject } from '../../funnel56/objects/stateSceneObject';

export class StateMesh extends BaseMeshObject {
  private baseMesh: THREE.Mesh;
  private haloMesh: THREE.Mesh;
  private normalMaterial: THREE.Material;
  private selectedMaterial: THREE.Material;
  private highlightedMaterial: THREE.Material;
  private stateSceneObject: StateSceneObject;

  constructor(
    stateSceneObj: StateSceneObject,
    geometryFactory: GeometryFactory,
    materialFactory: MaterialFactory,
    lod: 'LOD_HIGH' | 'LOD_MED' | 'LOD_LOW' = 'LOD_MED'
  ) {
    const group = new THREE.Group();

    // 1. Node Geometry & Materials
    const stateGeo = geometryFactory.getOrCreateStateGeometry(lod, 5);
    const normalMat = materialFactory.getOrCreateStateMaterial('#06b6d4');
    const selectedMat = materialFactory.getOrCreateSelectedStateMaterial();
    const highlightedMat = materialFactory.getOrCreateHighlightedStateMaterial();

    const baseMesh = new THREE.Mesh(stateGeo, normalMat);
    group.add(baseMesh);

    // 2. Selection Halo (initially hidden)
    const haloGeo = geometryFactory.getOrCreateSelectionHalo(8);
    const haloMat = materialFactory.getOrCreateSelectionHaloMaterial();
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    group.add(haloMesh);

    super(stateSceneObj.id, group, stateSceneObj);
    this.baseMesh = baseMesh;
    this.haloMesh = haloMesh;
    this.normalMaterial = normalMat;
    this.selectedMaterial = selectedMat;
    this.highlightedMaterial = highlightedMat;
    this.stateSceneObject = stateSceneObj;
  }

  public syncFromSceneObject(sceneObj: StateSceneObject): void {
    super.syncFromSceneObject(sceneObj);

    if (sceneObj.isSelected) {
      this.baseMesh.material = this.selectedMaterial;
      this.haloMesh.visible = true;
    } else if (sceneObj.isHighlighted) {
      this.baseMesh.material = this.highlightedMaterial;
      this.haloMesh.visible = false;
    } else {
      this.baseMesh.material = this.normalMaterial;
      this.haloMesh.visible = false;
    }
  }
}
