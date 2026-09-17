/**
 * 3D Memory Studio — Funnel 57
 * Three.js Relational Graph Line Mesh
 */

import * as THREE from 'three';
import { BaseMeshObject } from './meshObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { RelationshipSceneObject } from '../../funnel56/objects/relationshipSceneObject';

export class RelationshipMesh extends BaseMeshObject {
  private line: THREE.Line;
  private geometryFactory: GeometryFactory;

  constructor(
    relSceneObj: RelationshipSceneObject,
    geometryFactory: GeometryFactory,
    materialFactory: MaterialFactory
  ) {
    const geo = geometryFactory.createRelationshipGeometry(
      relSceneObj.sourcePos,
      relSceneObj.targetPos
    );
    const mat = materialFactory.getOrCreateRelationshipMaterial(0.4);
    const line = new THREE.Line(geo, mat);

    super(relSceneObj.id, line, relSceneObj);
    this.line = line;
    this.geometryFactory = geometryFactory;
  }

  public updateEndpoints(
    src: [number, number, number],
    tgt: [number, number, number]
  ): void {
    const posAttr = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    if (posAttr && posAttr.array.length >= 6) {
      const arr = posAttr.array as Float32Array;
      arr[0] = src[0]; arr[1] = src[1]; arr[2] = src[2];
      arr[3] = tgt[0]; arr[4] = tgt[1]; arr[5] = tgt[2];
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    super.dispose();
    this.line.geometry.dispose();
  }
}
