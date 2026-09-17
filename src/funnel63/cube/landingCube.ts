/**
 * 3D Memory Studio — Funnel 63
 * Master Landing Cube Object Coordinator
 */

import * as THREE from 'three';
import { CubeState, CubeFaceId } from '../types';
import { createInitialCubeState } from './cubeState';
import { LandingCubeGeometryFactory } from './cubeGeometry';
import { CubeFaceManager } from './cubeFaceManager';
import { CubeInteractionController } from './cubeInteraction';

export class LandingCube {
  public readonly state: CubeState;
  public readonly group: THREE.Group;
  public readonly geometryFactory: LandingCubeGeometryFactory;
  public readonly faceManager: CubeFaceManager;
  public readonly interaction: CubeInteractionController;

  private mesh: THREE.Mesh | null = null;
  private edgesMesh: THREE.LineSegments | null = null;
  private materials: THREE.MeshStandardMaterial[] = [];
  private isDisposed = false;

  constructor() {
    this.state = createInitialCubeState();
    this.group = new THREE.Group();
    this.group.name = 'LandingCubeGroup';
    this.geometryFactory = new LandingCubeGeometryFactory();
    this.faceManager = new CubeFaceManager();
    this.interaction = new CubeInteractionController();

    this.initializeMesh();
  }

  private initializeMesh(): void {
    const { mesh, edgesMesh, materials } = this.geometryFactory.createCubeMesh();
    this.mesh = mesh;
    this.edgesMesh = edgesMesh;
    this.materials = materials;

    this.group.add(this.mesh);
    this.group.add(this.edgesMesh);
    this.syncTransform();
  }

  public update(deltaSeconds: number): void {
    if (this.isDisposed) return;
    this.interaction.updateAutoRotation(this.state, deltaSeconds);
    this.syncTransform();
  }

  public syncTransform(): void {
    if (!this.mesh) return;

    const radX = THREE.MathUtils.degToRad(this.state.rotationX);
    const radY = THREE.MathUtils.degToRad(this.state.rotationY);
    const radZ = THREE.MathUtils.degToRad(this.state.rotationZ);

    this.group.rotation.set(radX, radY, radZ);
    this.group.scale.setScalar(this.state.scale);
  }

  public raycastFace(raycaster: THREE.Raycaster): CubeFaceId | null {
    if (!this.mesh || this.isDisposed) return null;

    const intersects = raycaster.intersectObject(this.mesh, false);
    if (intersects.length > 0) {
      const faceIndex = intersects[0].face?.materialIndex ?? 0;
      const faceIds: CubeFaceId[] = ['DATA', 'GRAPH', 'CLUSTER', 'DIMENSION', 'AI', 'STUDIO'];
      return faceIds[faceIndex] ?? null;
    }
    return null;
  }

  public onPointerHover(faceId: CubeFaceId | null): void {
    this.state.hoveredFace = faceId;
    this.faceManager.setHoveredFace(faceId);
    this.updateMaterialEmissives();
  }

  public onPointerClick(faceId: CubeFaceId | null): void {
    this.state.activeFace = faceId;
    this.faceManager.selectFace(faceId);
    this.updateMaterialEmissives();
  }

  private updateMaterialEmissives(): void {
    const faces = this.faceManager.getAllFaces();
    for (let i = 0; i < Math.min(faces.length, this.materials.length); i++) {
      const face = faces[i];
      const mat = this.materials[i];
      if (face.state === 'SELECTED') {
        mat.emissive.setHex(face.colorHex);
        mat.emissiveIntensity = 0.6;
        mat.opacity = 1.0;
      } else if (face.state === 'HOVERED') {
        mat.emissive.setHex(face.colorHex);
        mat.emissiveIntensity = 0.3;
        mat.opacity = 0.95;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
        mat.opacity = 0.85;
      }
    }
  }

  public reset(): void {
    this.interaction.reset(this.state);
    this.faceManager.reset();
    this.updateMaterialEmissives();
    this.syncTransform();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh = null;
    }
    if (this.edgesMesh) {
      this.group.remove(this.edgesMesh);
      this.edgesMesh = null;
    }
    this.geometryFactory.dispose();
    this.materials = [];
  }
}
