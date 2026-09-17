/**
 * 3D Memory Studio — Funnel 63
 * Renderer Landing Adapter
 *
 * Attaches the LandingCube to the Three.js scene and synchronizes with F55.
 */

import * as THREE from 'three';
import { MemoryRendererHost } from '../../funnel55/renderer/rendererHost';
import { LandingCube } from '../cube/landingCube';

export class RendererLandingAdapter {
  private scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.name = 'LandingScene';
    this.addLighting();
  }

  private addLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(100, 150, 200);

    const pointLight = new THREE.PointLight(0x00f2ff, 1.5, 300);
    pointLight.position.set(-80, 50, 100);

    this.scene.add(ambient);
    this.scene.add(directional);
    this.scene.add(pointLight);
  }

  public attachCube(cube: LandingCube): void {
    this.scene.add(cube.group);
  }

  public detachCube(cube: LandingCube): void {
    this.scene.remove(cube.group);
  }

  public getThreeScene(): THREE.Scene {
    return this.scene;
  }

  public dispose(): void {
    this.scene.clear();
  }
}
