/**
 * 3D Memory Studio — Funnel 60
 * Three.js Dimension Grid & Projection Guides Geometry
 */

import * as THREE from 'three';
import { SimulationDimension } from '../../funnel52/types';
import { DimensionId } from '../types';

export class DimensionVisualGroup {
  public readonly groupObject: THREE.Group;
  private gridHelper: THREE.GridHelper;
  private axesHelper: THREE.AxesHelper;
  private isDisposed = false;

  constructor(dimension: SimulationDimension = 3) {
    this.groupObject = new THREE.Group();

    // 1. Grid
    const size = 600;
    const divisions = 20;
    const gridColor = dimension > 3 ? 0x701a75 : 0x1e293b;
    const centerLineColor = dimension > 3 ? 0xc026d3 : 0x0ea5e9;

    this.gridHelper = new THREE.GridHelper(size, divisions, centerLineColor, gridColor);
    this.gridHelper.position.y = -50;
    this.groupObject.add(this.gridHelper);

    // 2. Axes
    this.axesHelper = new THREE.AxesHelper(150);
    this.groupObject.add(this.axesHelper);
  }

  public updateDimension(dimension: SimulationDimension): void {
    if (this.isDisposed) return;
    // Dimension visuals update
    this.axesHelper.visible = true;
    this.gridHelper.visible = true;
  }

  public setGridVisible(val: boolean): void {
    this.gridHelper.visible = val;
  }

  public setAxesVisible(val: boolean): void {
    this.axesHelper.visible = val;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.gridHelper.geometry.dispose();
    (this.gridHelper.material as THREE.Material).dispose();
    this.axesHelper.geometry.dispose();
    (this.axesHelper.material as THREE.Material).dispose();
  }
}
