/**
 * 3D Memory Studio — Funnel 63
 * Master Gesture Controller
 */

import { LandingCube } from '../cube/landingCube';
import { PointerAdapter } from './pointerAdapter';
import { TouchAdapter } from './touchAdapter';

export class GestureController {
  public readonly pointer: PointerAdapter;
  public readonly touch: TouchAdapter;

  constructor() {
    this.pointer = new PointerAdapter();
    this.touch = new TouchAdapter();
  }

  public handlePointerDown(x: number, y: number, cube: LandingCube): void {
    this.pointer.onPointerDown(x, y);
    cube.state.isDragging = true;
  }

  public handlePointerMove(x: number, y: number, cube: LandingCube): void {
    const drag = this.pointer.onPointerMove(x, y);
    if (drag) {
      cube.interaction.applyDragRotation(cube.state, drag.deltaX, drag.deltaY);
      cube.syncTransform();
    }
  }

  public handlePointerUp(cube: LandingCube): void {
    this.pointer.onPointerUp();
    cube.state.isDragging = false;
  }

  public handleTouchStart(x: number, y: number, cube: LandingCube): void {
    this.touch.onTouchStart(x, y);
    cube.state.isDragging = true;
  }

  public handleTouchMove(x: number, y: number, cube: LandingCube): void {
    const drag = this.touch.onTouchMove(x, y);
    if (drag) {
      cube.interaction.applyDragRotation(cube.state, drag.deltaX, drag.deltaY);
      cube.syncTransform();
    }
  }

  public handleTouchEnd(cube: LandingCube): void {
    this.touch.onTouchEnd();
    cube.state.isDragging = false;
  }

  public handleWheel(deltaY: number, cube: LandingCube): void {
    const zoomDelta = deltaY > 0 ? -0.05 : 0.05;
    cube.interaction.applyZoom(cube.state, zoomDelta);
    cube.syncTransform();
  }
}
