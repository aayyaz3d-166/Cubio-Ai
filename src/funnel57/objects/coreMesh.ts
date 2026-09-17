/**
 * 3D Memory Studio — Funnel 57
 * Three.js Memory Core Multi-Ring Mesh
 */

import * as THREE from 'three';
import { BaseMeshObject } from './meshObject';
import { GeometryFactory } from '../geometry/geometryFactory';
import { MaterialFactory } from '../materials/materialFactory';
import { CoreSceneObject } from '../../funnel56/objects/coreSceneObject';

export class CoreMesh extends BaseMeshObject {
  private innerTorus: THREE.Mesh;
  private outerTorus: THREE.Mesh;
  private nucleus: THREE.Mesh;

  constructor(
    coreSceneObj: CoreSceneObject,
    geometryFactory: GeometryFactory,
    materialFactory: MaterialFactory
  ) {
    const group = new THREE.Group();

    // 1. Central Nucleus Sphere
    const sphereGeo = geometryFactory.getOrCreateCoreSphere(16, 'MEDIUM');
    const sphereMat = materialFactory.getOrCreateCoreMaterial();
    const nucleus = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(nucleus);

    // 2. Inner Rotating Torus
    const innerGeo = geometryFactory.getOrCreateCoreTorus(28, 1.2, 'INNER', 'MEDIUM');
    const innerTorus = new THREE.Mesh(innerGeo, sphereMat);
    group.add(innerTorus);

    // 3. Outer Counter-Rotating Torus
    const outerGeo = geometryFactory.getOrCreateCoreTorus(40, 0.8, 'OUTER', 'MEDIUM');
    const outerTorus = new THREE.Mesh(outerGeo, sphereMat);
    group.add(outerTorus);

    super(coreSceneObj.id, group, coreSceneObj);
    this.nucleus = nucleus;
    this.innerTorus = innerTorus;
    this.outerTorus = outerTorus;
  }

  public update(_deltaMs: number, timeMs: number): void {
    // Concentric ring counter-rotations
    this.innerTorus.rotation.x = timeMs * 0.001;
    this.innerTorus.rotation.y = timeMs * 0.0012;

    this.outerTorus.rotation.x = -timeMs * 0.0007;
    this.outerTorus.rotation.z = timeMs * 0.0009;
  }
}
