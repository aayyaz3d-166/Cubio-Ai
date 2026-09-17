/**
 * 3D Memory Studio — Funnel 63
 * Cube Face Manager
 *
 * Tracks 6 face identities (DATA, GRAPH, CLUSTER, DIMENSION, AI, STUDIO)
 * and their visual hover/selection states.
 */

import { CubeFaceId, CubeFaceInfo } from '../types';

export const CUBE_FACES: readonly CubeFaceInfo[] = [
  { id: 'DATA', label: 'DATA', normal: [1, 0, 0], colorHex: 0x00f2ff, state: 'IDLE' },
  { id: 'GRAPH', label: 'GRAPH', normal: [-1, 0, 0], colorHex: 0x14b8a6, state: 'IDLE' },
  { id: 'CLUSTER', label: 'CLUSTER', normal: [0, 1, 0], colorHex: 0xd946ef, state: 'IDLE' },
  { id: 'DIMENSION', label: 'DIMENSION', normal: [0, -1, 0], colorHex: 0xf59e0b, state: 'IDLE' },
  { id: 'AI', label: 'AI HUB', normal: [0, 0, 1], colorHex: 0x8b5cf6, state: 'IDLE' },
  { id: 'STUDIO', label: 'STUDIO', normal: [0, 0, -1], colorHex: 0x3b82f6, state: 'IDLE' },
];

export class CubeFaceManager {
  private faces: Map<CubeFaceId, CubeFaceInfo> = new Map();
  private activeFaceId: CubeFaceId | null = null;
  private hoveredFaceId: CubeFaceId | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.faces.clear();
    for (const f of CUBE_FACES) {
      this.faces.set(f.id, { ...f });
    }
    this.activeFaceId = null;
    this.hoveredFaceId = null;
  }

  public getFace(id: CubeFaceId): CubeFaceInfo | undefined {
    return this.faces.get(id);
  }

  public getAllFaces(): readonly CubeFaceInfo[] {
    return Array.from(this.faces.values());
  }

  public setHoveredFace(faceId: CubeFaceId | null): void {
    this.hoveredFaceId = faceId;
    for (const [id, f] of this.faces) {
      if (id === this.activeFaceId) {
        f.state = 'SELECTED';
      } else if (id === faceId) {
        f.state = 'HOVERED';
      } else {
        f.state = 'IDLE';
      }
    }
  }

  public selectFace(faceId: CubeFaceId | null): void {
    this.activeFaceId = faceId;
    for (const [id, f] of this.faces) {
      if (id === faceId) {
        f.state = 'SELECTED';
      } else if (id === this.hoveredFaceId) {
        f.state = 'HOVERED';
      } else {
        f.state = 'IDLE';
      }
    }
  }

  public get currentActiveFace(): CubeFaceId | null {
    return this.activeFaceId;
  }

  public get currentHoveredFace(): CubeFaceId | null {
    return this.hoveredFaceId;
  }
}
