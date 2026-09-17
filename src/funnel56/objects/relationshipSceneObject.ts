/**
 * 3D Memory Studio — Funnel 56
 * Relationship / Graph Edge Scene Object
 */

import { BaseSceneObject } from './sceneObject';
import { RelationshipType } from '../types';

export class RelationshipSceneObject extends BaseSceneObject {
  public readonly sourceStateId: string;
  public readonly targetStateId: string;
  public readonly relationshipType: RelationshipType;
  public strength: number;
  public sourcePos: [number, number, number] = [0, 0, 0];
  public targetPos: [number, number, number] = [0, 0, 0];

  constructor(
    id: string,
    sourceStateId: string,
    targetStateId: string,
    relationshipType: RelationshipType = 'SEMANTIC',
    strength = 1.0
  ) {
    super(id, 'RELATIONSHIP', 'RELATIONSHIP_LAYER');
    this.sourceStateId = sourceStateId;
    this.targetStateId = targetStateId;
    this.relationshipType = relationshipType;
    this.strength = strength;
  }

  public setEndpoints(src: [number, number, number], tgt: [number, number, number]): void {
    this.sourcePos = [...src];
    this.targetPos = [...tgt];
  }

  protected onRender(context: unknown): void {
    if (!this.visible) return;
    if (context && typeof (context as CanvasRenderingContext2D).lineTo === 'function') {
      const ctx = context as CanvasRenderingContext2D;
      const [x1, y1] = this.sourcePos;
      const [x2, y2] = this.targetPos;

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, this.opacity * 0.4 * this.strength);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
