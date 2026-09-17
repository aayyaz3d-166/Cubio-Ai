/**
 * 3D Memory Studio — Funnel 56
 * Central Memory Core Scene Object
 */

import { BaseSceneObject } from './sceneObject';
import { SimulationDimension } from '../../funnel52/types';

export class CoreSceneObject extends BaseSceneObject {
  public dimension: SimulationDimension;
  public innerAngle = 0;
  public outerAngle = 0;

  constructor(id = 'MEMORY_CORE_00', dimension: SimulationDimension = 3) {
    super(id, 'CORE', 'CORE_LAYER', { position: [0, 0, 0] });
    this.dimension = dimension;
  }

  public update(
    deltaMs: number,
    timeMs: number,
    parentWorldTransform?: import('../types').WorldTransform3D
  ): void {
    super.update(deltaMs, timeMs, parentWorldTransform);
    // Subtle rotation of memory core concentric rings
    this.innerAngle = (timeMs * 0.001) % (Math.PI * 2);
    this.outerAngle = (-timeMs * 0.0006) % (Math.PI * 2);
    this.transform.rotation[1] = this.innerAngle;
  }

  protected onRender(context: unknown): void {
    if (!this.visible) return;
    if (context && typeof (context as CanvasRenderingContext2D).arc === 'function') {
      const ctx = context as CanvasRenderingContext2D;
      const [wx, wy] = this.worldTransform.position;
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(wx, wy, 16 * this.worldTransform.scale[0], 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
