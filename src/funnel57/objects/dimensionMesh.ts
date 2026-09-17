/**
 * 3D Memory Studio — Funnel 57
 * Three.js Dimension Projection Mesh
 */

import * as THREE from 'three';
import { BaseMeshObject } from './meshObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { DimensionSceneObject } from '../../funnel56/objects/dimensionSceneObject';

export class DimensionMesh extends BaseMeshObject {
  private gridHelper: THREE.GridHelper;

  constructor(
    dimSceneObj: DimensionSceneObject,
    _geometryFactory: GeometryFactory,
    _materialFactory: MaterialFactory
  ) {
    const grid = new THREE.GridHelper(500, 25, 0x06b6d4, 0x27272a);
    grid.position.y = -50;

    super(dimSceneObj.id, grid, dimSceneObj);
    this.gridHelper = grid;
  }
}
