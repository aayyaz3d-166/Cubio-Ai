/**
 * 3D Memory Studio — Funnel 56
 * Semantic Cluster Scene Object
 */

import { BaseSceneObject } from './sceneObject';

export class ClusterSceneObject extends BaseSceneObject {
  public readonly clusterId: string;
  public readonly clusterType: string;
  public radius: number;
  public memberStateIds: readonly string[];
  public colorHex: string;

  constructor(
    clusterId: string,
    clusterType: string,
    center: [number, number, number] = [0, 0, 0],
    radius = 60,
    memberStateIds: readonly string[] = [],
    colorHex = '#38bdf8'
  ) {
    super(clusterId, 'CLUSTER', 'CLUSTER_LAYER', { position: center });
    this.clusterId = clusterId;
    this.clusterType = clusterType;
    this.radius = radius;
    this.memberStateIds = [...memberStateIds];
    this.colorHex = colorHex;
  }

  protected onRender(context: unknown): void {
    if (!this.visible) return;
    if (context && typeof (context as CanvasRenderingContext2D).arc === 'function') {
      const ctx = context as CanvasRenderingContext2D;
      const [wx, wy] = this.worldTransform.position;
      const scale = this.worldTransform.scale[0];

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, this.opacity * 0.25);
      ctx.strokeStyle = this.colorHex;
      ctx.lineWidth = 1.5;
      if (typeof ctx.setLineDash === 'function') {
        ctx.setLineDash([4, 4]);
      }
      ctx.beginPath();
      ctx.arc(wx, wy, this.radius * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
