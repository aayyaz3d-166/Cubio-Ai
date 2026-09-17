/**
 * 3D Memory Studio — Funnel 52
 * Simulation Clock & Time Formatter
 */

export function formatSimulationTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const fractions = Math.floor((ms % 1000) / 100);

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${mm}:${ss}.${fractions}`;
}
