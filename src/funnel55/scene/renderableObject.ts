/**
 * 3D Memory Studio — Funnel 55
 * Generic Renderable Object Base Class
 */

import { RenderableObject, SceneLayerId } from '../types';
import { DimensionalInformationState } from '../../funnel49/types';

export abstract class BaseRenderableObject implements RenderableObject {
  public readonly id: string;
  public readonly layerId: SceneLayerId;
  public visible = true;
  public opacity = 1.0;
  public x = 0;
  public y = 0;
  public z = 0;
  public scale = 1.0;
  public readonly sourceState?: DimensionalInformationState;
  protected disposed = false;

  constructor(
    id: string,
    layerId: SceneLayerId,
    sourceState?: DimensionalInformationState
  ) {
    this.id = id;
    this.layerId = layerId;
    this.sourceState = sourceState;
  }

  public setTransform(x: number, y: number, z: number, scale = 1.0): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.scale = scale;
  }

  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  public abstract update(deltaMs: number, timeMs: number): void;

  public abstract render(context: unknown): void;

  public dispose(): void {
    this.disposed = true;
  }

  public get isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Concrete Lightweight Renderable Node representing a GREEN state in the scene
 */
export class RenderableStateNode extends BaseRenderableObject {
  public entityName: string;
  public category: string;
  public classification: 'GREEN' | 'RED';
  public sequence369: string | null;
  public colorHex: string;

  constructor(
    id: string,
    entityName: string,
    category: string,
    classification: 'GREEN' | 'RED',
    sequence369: string | null,
    colorHex = '#06b6d4',
    sourceState?: DimensionalInformationState
  ) {
    super(id, 'STATE_LAYER', sourceState);
    this.entityName = entityName;
    this.category = category;
    this.classification = classification;
    this.sequence369 = sequence369;
    this.colorHex = colorHex;
  }

  public update(_deltaMs: number, _timeMs: number): void {
    // Node update logic
  }

  public render(context: unknown): void {
    if (!this.visible || this.disposed) return;
    // Base 2D/3D render dispatch
    if (context && typeof (context as CanvasRenderingContext2D).arc === 'function') {
      const ctx = context as CanvasRenderingContext2D;
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.colorHex;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4 * this.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
