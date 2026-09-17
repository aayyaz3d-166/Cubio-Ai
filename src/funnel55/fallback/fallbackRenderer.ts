/**
 * 3D Memory Studio — Funnel 55
 * 2D Canvas Fallback Renderer Backend
 *
 * Lightweight, deterministic fallback for environments where WebGL is unavailable.
 * Implements full 3D View-Projection and Screen-Space Collision Handling.
 */

import { ICamera } from '../camera/cameraTypes';
import { RendererViewport, ProjectedObjectDiagnostic } from '../types';

export class FallbackCanvas2DRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDisposed = false;
  private lastDiagnostics: readonly ProjectedObjectDiagnostic[] = [];

  public initialize(canvas: unknown): boolean {
    if (!canvas || typeof (canvas as HTMLCanvasElement).getContext !== 'function') {
      return false;
    }
    this.canvas = canvas as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    return this.ctx !== null;
  }

  public resize(viewport: RendererViewport): void {
    if (!this.canvas) return;
    this.canvas.width = Math.floor(viewport.width * viewport.dpr);
    this.canvas.height = Math.floor(viewport.height * viewport.dpr);
  }

  public clear(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public getDiagnostics(): readonly ProjectedObjectDiagnostic[] {
    return this.lastDiagnostics;
  }

  public render(scene: any, camera?: any): void {
    if (!this.ctx || !this.canvas || this.isDisposed) return;

    // Synchronize canvas backing buffer dimensions with CSS layout dimensions
    if (typeof this.canvas.getBoundingClientRect === 'function') {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return; // Canvas is not yet visible / 0x0 layout
      }
      const targetW = Math.max(1, Math.round(rect.width));
      const targetH = Math.max(1, Math.round(rect.height));
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
    }

    this.clear();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w <= 0 || h <= 0) return;

    // 1. Camera parameters
    const camPos: [number, number, number] = camera?.position
      ? [camera.position[0] || 0, camera.position[1] || 0, camera.position[2] || 0]
      : [0, 80, 260];
    const camTarget: [number, number, number] = camera?.target
      ? [camera.target[0] || 0, camera.target[1] || 0, camera.target[2] || 0]
      : [0, 0, 0];
    const camUp: [number, number, number] = camera?.up
      ? [camera.up[0] || 0, camera.up[1] || 0, camera.up[2] || 0]
      : [0, 1, 0];
    const fov = camera?.fov || 60;
    const zoom =
      camera?.zoom && camera.zoom !== 1.0
        ? camera.zoom
        : camera?.distance
          ? 90 / camera.distance
          : camera?.state?.distance
            ? 90 / camera.state.distance
            : 1.0;
    const aspect = w / h;

    // 2. View Matrix vectors
    let fx = camTarget[0] - camPos[0];
    let fy = camTarget[1] - camPos[1];
    let fz = camTarget[2] - camPos[2];
    const fLen = Math.hypot(fx, fy, fz) || 1;
    fx /= fLen;
    fy /= fLen;
    fz /= fLen;

    let ux = camUp[0];
    let uy = camUp[1];
    let uz = camUp[2];

    let rx = fy * uz - fz * uy;
    let ry = fz * ux - fx * uz;
    let rz = fx * uy - fy * ux;
    let rLen = Math.hypot(rx, ry, rz);

    if (rLen < 1e-4) {
      if (Math.abs(fy) > 0.9) {
        ux = 0;
        uy = 0;
        uz = -1;
      } else {
        ux = 0;
        uy = 1;
        uz = 0;
      }
      rx = fy * uz - fz * uy;
      ry = fz * ux - fx * uz;
      rz = fx * uy - fy * ux;
      rLen = Math.hypot(rx, ry, rz) || 1;
    }
    rx /= rLen;
    ry /= rLen;
    rz /= rLen;

    const tux = ry * fz - rz * fy;
    const tuy = rz * fx - rx * fz;
    const tuz = rx * fy - ry * fx;

    // Live viewport projection parameters (never cached/stale)
    const centerX = w / 2;
    const centerY = h / 2;
    const tanHalfFov = Math.tan((fov * Math.PI) / 360) || 0.577;
    const focalLength = h / 2 / tanHalfFov;

    // Canonical 3D View-Projection math:
    // viewMatrix = lookAt(camera.position, camera.target, camera.up)
    // viewPos    = viewMatrix × worldPos
    // depth      = -viewPos.z (camera se actual optical axis distance, NOT camera.position length)
    // screenX    = centerX + (viewPos.x / depth) × focalLength × zoom
    // screenY    = centerY - (viewPos.y / depth) × focalLength × zoom
    const projectPoint = (pos: readonly [number, number, number]): [number, number] => {
      const dx = pos[0] - camPos[0];
      const dy = pos[1] - camPos[1];
      const dz = pos[2] - camPos[2];

      const viewPosX = dx * rx + dy * ry + dz * rz;
      const viewPosY = dx * tux + dy * tuy + dz * tuz;
      const depth = Math.max(0.1, dx * fx + dy * fy + dz * fz); // -viewPos.z along optical axis

      const screenX = centerX + (viewPosX / depth) * focalLength * zoom;
      const screenY = centerY - (viewPosY / depth) * focalLength * zoom;
      return [screenX, screenY];
    };

    // 3. Collect all renderable scene objects
    let objects: any[] = [];
    if (scene && scene.registry && typeof scene.registry.getAll === 'function') {
      objects = scene.registry.getAll();
    } else if (scene && scene.graph && scene.graph.statesNode) {
      objects = scene.graph.statesNode.children || [];
    }

    const stateObjects = objects.filter(
      (o: any) => o.layerId === 'STATE_LAYER' || (o.id && o.id.startsWith('STATE49:'))
    );

    // 4. Collision Detection and Cluster Grouping
    const clusters = new Map<string, any[]>();
    for (const obj of stateObjects) {
      const [wx, wy, wz] = obj.worldTransform?.position || [0, 0, 0];
      const [baseX, baseY] = projectPoint([wx, wy, wz]);
      const key = `${Math.round(baseX / 25)}_${Math.round(baseY / 25)}`;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)!.push({ obj, wx, wy, wz, baseX, baseY });
    }

    const diagnosticsList: ProjectedObjectDiagnostic[] = [];

    ctx.save();

    // 5. Draw background guides / center anchor
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Draw cluster boundaries if present
    const clusterObjects = objects.filter(
      (o: any) => o.layerId === 'CLUSTER_LAYER' || (o.id && typeof o.id === 'string' && o.id.startsWith('CLUSTER_'))
    );
    for (const cl of clusterObjects) {
      const [cx, cy, cz] = cl.worldTransform?.position || [0, 0, 0];
      const [scx, scy] = projectPoint([cx, cy, cz]);
      const radius = Math.max(30, (cl.radius || 40) * (zoom || 1.0));
      ctx.save();
      ctx.strokeStyle = cl.colorHex || 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      if (typeof ctx.setLineDash === 'function') {
        ctx.setLineDash([4, 6]);
      }
      ctx.beginPath();
      ctx.arc(scx, scy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Render each state cluster with deterministic collision offsets
    for (const [, group] of clusters.entries()) {
      group.sort((a: any, b: any) => a.obj.id.localeCompare(b.obj.id));
      const count = group.length;
      const baseX = group[0].baseX;
      const baseY = group[0].baseY;

      // Draw cluster centroid anchor if multiple objects collide
      if (count > 1) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(baseX, baseY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        if (typeof ctx.setLineDash === 'function') {
          ctx.setLineDash([2, 4]);
        }
        ctx.beginPath();
        ctx.arc(baseX, baseY, 50, 0, Math.PI * 2);
        ctx.stroke();
        if (typeof ctx.setLineDash === 'function') {
          ctx.setLineDash([]);
        }
      }

      for (let i = 0; i < count; i++) {
        const item = group[i];
        const obj = item.obj;
        let offsetX = 0;
        let offsetY = 0;

        if (count > 1) {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          const radius = 50;
          offsetX = Number((Math.cos(angle) * radius).toFixed(2));
          offsetY = Number((Math.sin(angle) * radius).toFixed(2));
        }

        const screenX = Number((baseX + offsetX).toFixed(2));
        const screenY = Number((baseY + offsetY).toFixed(2));

        const isSelected = !!obj.isSelected;
        const isHighlighted = !!obj.isHighlighted;

        diagnosticsList.push({
          objectId: obj.id,
          authoritativePosition: [item.wx, item.wy, item.wz],
          projectedWorldPosition: [item.wx, item.wy, item.wz],
          screenPosition: [screenX, screenY],
          collisionOffset: [offsetX, offsetY],
          visible: obj.visible !== false,
          selected: isSelected,
        });

        if (!obj.visible && obj.visible !== undefined) continue;

        // Draw connector spoke from anchor to collided node
        if (count > 1) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(screenX, screenY);
          ctx.stroke();
        }

        // Draw selection halo
        if (isSelected || isHighlighted) {
          ctx.strokeStyle = isSelected ? '#a855f7' : '#eab308';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(234, 179, 8, 0.25)';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw node disc
        ctx.fillStyle = isSelected ? '#c084fc' : '#06b6d4';
        ctx.strokeStyle = isSelected ? '#a855f7' : '#0891b2';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw legible text label with high-contrast pill
        if (typeof ctx.fillText === 'function') {
          const rawLabel = obj.id
            .replace(/^STATE49:REC_/, '')
            .replace(/^STATE49:LLM_/, '')
            .replace(/^STATE49:/, '');
          ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace';
          const textWidth =
            typeof ctx.measureText === 'function'
              ? ctx.measureText(rawLabel).width
              : rawLabel.length * 6;

          ctx.fillStyle = isSelected ? 'rgba(88, 28, 135, 0.85)' : 'rgba(24, 24, 27, 0.75)';
          if (typeof (ctx as any).roundRect === 'function') {
            ctx.beginPath();
            (ctx as any).roundRect(screenX + 10, screenY - 8, textWidth + 8, 16, 4);
            ctx.fill();
          } else if (typeof ctx.rect === 'function') {
            ctx.beginPath();
            ctx.rect(screenX + 10, screenY - 8, textWidth + 8, 16);
            ctx.fill();
          } else if (typeof (ctx as any).fillRect === 'function') {
            (ctx as any).fillRect(screenX + 10, screenY - 8, textWidth + 8, 16);
          }

          ctx.fillStyle = isSelected ? '#ffffff' : '#e4e4e7';
          ctx.fillText(rawLabel, screenX + 14, screenY + 4);
        }
      }
    }

    ctx.restore();
    this.lastDiagnostics = Object.freeze(diagnosticsList);
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.canvas = null;
    this.ctx = null;
    this.lastDiagnostics = [];
  }
}
