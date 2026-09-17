/**
 * 3D Memory Studio — Funnel 53
 * Visual State Node Formatting & Rendering Utilities
 */

export function formatSequence369Stream(seq: string | null): string {
  if (!seq) return 'RESTRICTED';
  const chunks: string[] = [];
  for (let i = 0; i < seq.length; i += 3) {
    chunks.push(seq.slice(i, i + 3));
  }
  return chunks.join(' ');
}

export function formatShortCoordinate(coordStr: string): string {
  if (!coordStr) return 'X0.Y0.Z0';
  return coordStr.replace(/^COORD_/, '');
}
