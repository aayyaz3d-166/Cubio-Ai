/**
 * 3D Memory Studio — Funnel 52
 * Bounded Ambient Particle Field Generator
 */

import { SimulatedParticle } from '../types';

export function generateSimulatedParticles(count = 48): readonly SimulatedParticle[] {
  const particles: SimulatedParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count;
    const radius = 50 + (i % 6) * 35;
    const speed = 0.0008 + (i % 4) * 0.0004;
    particles.push(
      Object.freeze({
        id: `PART_${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: ((i % 7) - 3) * 20,
        radius: 1.5 + (i % 3) * 0.8,
        alpha: 0.25 + ((i % 4) * 0.15),
        colorHex: i % 3 === 0 ? '#38bdf8' : i % 2 === 0 ? '#06b6d4' : '#10b981',
        angle,
        speed,
      })
    );
  }
  return Object.freeze(particles);
}

export function stepSimulatedParticles(
  particles: readonly SimulatedParticle[],
  deltaMs: number,
  speedMultiplier: number
): readonly SimulatedParticle[] {
  return Object.freeze(
    particles.map((p) => {
      const nextAngle = (p.angle + p.speed * deltaMs * speedMultiplier) % (2 * Math.PI);
      const radius = Math.sqrt(p.x * p.x + p.y * p.y);
      return Object.freeze({
        ...p,
        angle: nextAngle,
        x: Math.cos(nextAngle) * radius,
        y: Math.sin(nextAngle) * radius,
      });
    })
  );
}
