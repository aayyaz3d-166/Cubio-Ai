/**
 * 3D Memory Studio — Funnel 61
 * Camera Target Manager & F47 Security Enforcement
 */

import { CameraTargetInfo, CameraTargetType } from '../types';

export class CameraTargetManager {
  private activeTarget: CameraTargetInfo | null = null;

  public setTarget(target: CameraTargetInfo): boolean {
    // F47 Security Enforcement: RED records can NEVER become camera targets
    if (target.classification === 'RED') {
      return false;
    }

    this.activeTarget = target;
    return true;
  }

  public getTarget(): CameraTargetInfo | null {
    return this.activeTarget;
  }

  public clearTarget(): void {
    this.activeTarget = null;
  }

  public get isTargetSet(): boolean {
    return this.activeTarget !== null;
  }
}
