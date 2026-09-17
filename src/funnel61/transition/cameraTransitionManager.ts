/**
 * 3D Memory Studio — Funnel 61
 * Camera Transition Manager
 *
 * Smooth, frame-rate independent, interruptible camera transitions.
 */

import { CameraState } from '../types';
import { setOrbitYawPitch } from '../camera/orbitController';
import { setCameraDistance } from '../camera/zoomController';
import { panTo } from '../camera/panController';

interface TransitionTarget {
  target: [number, number, number];
  yaw: number;
  pitch: number;
  distance: number;
  durationMs: number;
  elapsedMs: number;
  startTarget: [number, number, number];
  startYaw: number;
  startPitch: number;
  startDistance: number;
}

export class CameraTransitionManager {
  private activeTransition: TransitionTarget | null = null;

  public startTransition(
    state: CameraState,
    target: [number, number, number],
    yaw: number,
    pitch: number,
    distance: number,
    durationMs = 400
  ): void {
    state.isTransitioning = true;
    this.activeTransition = {
      target: [...target],
      yaw,
      pitch,
      distance,
      durationMs: Math.max(50, durationMs),
      elapsedMs: 0,
      startTarget: [...state.target],
      startYaw: state.yaw,
      startPitch: state.pitch,
      startDistance: state.distance,
    };
  }

  public update(state: CameraState, deltaSeconds: number): boolean {
    if (!this.activeTransition) {
      state.isTransitioning = false;
      return false;
    }

    const t = this.activeTransition;
    t.elapsedMs += deltaSeconds * 1000;
    const progress = Math.min(1.0, t.elapsedMs / t.durationMs);

    // Smoothstep cubic easing: 3p^2 - 2p^3
    const ease = progress * progress * (3 - 2 * progress);

    const curTarget: [number, number, number] = [
      t.startTarget[0] + (t.target[0] - t.startTarget[0]) * ease,
      t.startTarget[1] + (t.target[1] - t.startTarget[1]) * ease,
      t.startTarget[2] + (t.target[2] - t.startTarget[2]) * ease,
    ];
    const curYaw = t.startYaw + (t.yaw - t.startYaw) * ease;
    const curPitch = t.startPitch + (t.pitch - t.startPitch) * ease;
    const curDist = t.startDistance + (t.distance - t.startDistance) * ease;

    panTo(state, curTarget);
    setOrbitYawPitch(state, curYaw, curPitch);
    setCameraDistance(state, curDist);

    if (progress >= 1.0) {
      this.activeTransition = null;
      state.isTransitioning = false;
      return true; // Completed
    }

    return false;
  }

  public cancel(state?: CameraState): void {
    this.activeTransition = null;
    if (state) state.isTransitioning = false;
  }

  public get isTransitioning(): boolean {
    return this.activeTransition !== null;
  }
}
