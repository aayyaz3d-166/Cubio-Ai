/**
 * 3D Memory Studio — Funnel 54
 * Seeded Deterministic Ambient Particle Field
 *
 * Strictly bounded to <= 100 particles with reproducible movement.
 */

import { AdvancedParticle } from '../types';
import { SimulationCamera } from '../../funnel52/types';
import { project3DCoordinateToScreen } from '../../funnel53/visual/cameraController';

const PARTICLE_COLORS = ['#38bdf8', '#818cf8', '#a855f7', '#34d399', '#f59e0b', '#06b6d4'];

export function generateAdvancedParticles(
  count: number,
  dimension: number,
  simulationTimeMs: number,
  camera: SimulationCamera,
  seed = 369054,
  reducedMotion = false
): readonly AdvancedParticle[] {
  const boundedCount = Math.min(100, Math.max(0, count));
  const particles: AdvancedParticle[] = [];

  const timeFactor = reducedMotion ? 0 : simulationTimeMs * 0.0004;

  for (let i = 0; i < boundedCount; i++) {
    // Deterministic pseudo-random parameters based on seed + i + dimension
    const pSeed = (seed + i * 1664525 + dimension * 1013904223) >>> 0;
    const baseRadius = 140 + (pSeed % 320);
    const speed = 0.3 + ((pSeed >> 8) % 100) / 100;
    const initialAngle = ((pSeed >> 16) % 360) * (Math.PI / 180);
    const elevation = (((pSeed >> 24) % 160) - 80);

    const angle = initialAngle + timeFactor * speed;
    const x = Math.cos(angle) * baseRadius;
    const z = Math.sin(angle) * baseRadius;
    const y = elevation + Math.sin(angle * 2) * 20;

    const proj = project3DCoordinateToScreen(x, y, z, camera);
    const colorHex = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const alpha = 0.2 + 0.5 * proj.scale;

    particles.push(
      Object.freeze({
        id: i,
        x,
        y,
        z,
        screenX: proj.screenX,
        screenY: proj.screenY,
        radius: Math.max(1, 1.8 * proj.scale),
        colorHex,
        alpha: Math.min(0.85, Math.max(0.1, alpha)),
      })
    );
  }

  return Object.freeze(particles);
}
