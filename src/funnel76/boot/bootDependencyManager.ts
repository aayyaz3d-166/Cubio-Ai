/**
 * 3D Memory Studio — Funnel 76
 * Boot Dependency Manager
 */

import { BootDependency, BootDependencyId, BootDependencyState } from '../types';

export const INITIAL_DEPENDENCIES: readonly BootDependency[] = Object.freeze([
  { id: 'RENDERER', label: '3D Renderer Engine (F55)', required: true, state: 'PENDING' },
  { id: 'CAMERA', label: 'Spatial Camera Engine (F61)', required: true, state: 'PENDING' },
  { id: 'SCENE', label: 'Scene Graph Engine (F56)', required: true, state: 'PENDING' },
  { id: 'LANDING', label: 'Landing Integration (F63/F74)', required: true, state: 'PENDING' },
  { id: 'WORKSPACE', label: 'Studio Workspace Shell (F66/F64)', required: true, state: 'PENDING' },
  { id: 'RUNTIME', label: 'Runtime Activation (F72)', required: true, state: 'PENDING' },
  { id: 'DATA', label: 'Persistent Studio Data (F71)', required: false, state: 'PENDING' },
]);

export class BootDependencyManager {
  private dependencies: Map<BootDependencyId, BootDependency> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.dependencies.clear();
    for (const dep of INITIAL_DEPENDENCIES) {
      this.dependencies.set(dep.id, { ...dep, state: 'PENDING' });
    }
  }

  public getDependency(id: BootDependencyId): BootDependency | undefined {
    return this.dependencies.get(id);
  }

  public getAllDependencies(): readonly BootDependency[] {
    return Array.from(this.dependencies.values());
  }

  public markChecking(id: BootDependencyId): void {
    const dep = this.dependencies.get(id);
    if (dep) {
      dep.state = 'CHECKING';
      dep.startedAt = performance.now();
      dep.error = undefined;
    }
  }

  public markReady(id: BootDependencyId, durationMs?: number): void {
    const dep = this.dependencies.get(id);
    if (dep) {
      dep.state = 'READY';
      dep.completedAt = performance.now();
      dep.durationMs = durationMs ?? (dep.startedAt ? dep.completedAt - dep.startedAt : 0);
      dep.error = undefined;
    }
  }

  public markFailed(id: BootDependencyId, error: string, durationMs?: number): void {
    const dep = this.dependencies.get(id);
    if (dep) {
      dep.state = 'FAILED';
      dep.completedAt = performance.now();
      dep.durationMs = durationMs ?? (dep.startedAt ? dep.completedAt - dep.startedAt : 0);
      dep.error = error;
    }
  }

  public markSkipped(id: BootDependencyId): void {
    const dep = this.dependencies.get(id);
    if (dep) {
      dep.state = 'SKIPPED';
    }
  }

  public areRequiredDependenciesReady(): boolean {
    for (const dep of this.dependencies.values()) {
      if (dep.required && dep.state !== 'READY') {
        return false;
      }
    }
    return true;
  }

  public getFailedDependency(): BootDependency | undefined {
    for (const dep of this.dependencies.values()) {
      if (dep.state === 'FAILED') {
        return dep;
      }
    }
    return undefined;
  }

  public getProgressPercentage(): number {
    const deps = Array.from(this.dependencies.values());
    if (deps.length === 0) return 100;
    const completed = deps.filter((d) => d.state === 'READY' || d.state === 'SKIPPED').length;
    return Math.round((completed / deps.length) * 100);
  }
}
