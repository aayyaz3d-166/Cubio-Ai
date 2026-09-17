/**
 * 3D Memory Studio — Funnel 56
 * Information State Scene Object
 */

import { BaseSceneObject } from './sceneObject';
import { DimensionalInformationState } from '../../funnel49/types';

export class StateSceneObject extends BaseSceneObject {
  public readonly stateId: string;
  public readonly recordId: string;
  public readonly category: string;
  public readonly classification: 'GREEN' | 'RED';
  public readonly sequence369: string | null;
  public readonly checksum: string;
  public readonly sourceState: DimensionalInformationState;
  public isHighlighted = false;
  public isSelected = false;

  constructor(state: DimensionalInformationState, initialPos?: [number, number, number]) {
    super(state.stateId, 'STATE', 'STATE_LAYER', { position: initialPos || [0, 0, 0] });
    this.stateId = state.stateId;
    this.recordId = state.recordId;
    this.category = state.category;
    this.classification = state.classification;
    this.sequence369 = state.sequence369;
    this.checksum = state.payloadChecksum;
    this.sourceState = state;
  }

  protected onRender(context: unknown): void {
    if (!this.visible) return;
    if (context && typeof (context as CanvasRenderingContext2D).arc === 'function') {
      const ctx = context as CanvasRenderingContext2D;
      const [rawX, rawY] = this.worldTransform.position;
      const scale = this.worldTransform.scale[0];
      const wx = rawX * 25;
      const wy = -rawY * 25;

      ctx.save();
      ctx.globalAlpha = this.opacity;

      if (this.isSelected || this.isHighlighted) {
        ctx.strokeStyle = this.isSelected ? '#a855f7' : '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wx, wy, (8 + (this.isSelected ? 4 : 2)) * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = this.isSelected ? '#c084fc' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(wx, wy, (this.isSelected ? 8 : 6) * scale, 0, Math.PI * 2);
      ctx.fill();

      if (typeof ctx.fillText === 'function') {
        ctx.fillStyle = this.isSelected ? '#ffffff' : '#a1a1aa';
        ctx.font = '10px monospace';
        const label = this.stateId.replace('STATE49:', '');
        ctx.fillText(label, wx + 12, wy + 3);
      }

      ctx.restore();
    }
  }
}
