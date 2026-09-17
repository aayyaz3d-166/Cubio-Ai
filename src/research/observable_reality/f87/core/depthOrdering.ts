/**
 * 3D Memory Studio — Funnel 87
 * Core: Depth Ordering & Rank Evaluator
 */

export function calculateDepthRanking(
  items: readonly { id: string; depthZ: number }[]
): {
  sortedIds: readonly string[];
  depthRankMap: Record<string, number>;
} {
  const sorted = [...items].sort((a, b) => a.depthZ - b.depthZ);
  const depthRankMap: Record<string, number> = {};

  sorted.forEach((item, index) => {
    depthRankMap[item.id] = index + 1;
  });

  return {
    sortedIds: Object.freeze(sorted.map((s) => s.id)),
    depthRankMap: Object.freeze(depthRankMap),
  };
}
