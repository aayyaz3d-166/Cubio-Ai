/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 14: CubiO AI & Infrastructure Cost Modeler
 *
 * Models real-world infrastructure and AI inference costs across scale tiers.
 * Measures the cost-reduction impact of Edge-First spatial compute offloading.
 */

export class CubiOAICostModeler {
  // Standard cloud cost baselines:
  // - Server Compute: $0.00001 per vCPU second
  // - Outbound Bandwidth: $0.05 per GB ($0.00000005 per KB)
  // - CAS Object Storage: $0.02 per GB/month
  // - Server Foundation LLM: $0.003 per 1K tokens (input) + $0.015 per 1K tokens (output)
  // - Edge Spatial Compute: $0.00 (User hardware GPU/CPU)

  /**
   * Computes estimated AI & Infrastructure cost for a given workload.
   */
  public static calculateTierCost(
    userCount: number,
    operationsPerUser: number,
    edgeOffloadPercent = 95.0
  ): {
    totalCostUsd: number;
    baselineCloudCostWithoutEdgeUsd: number;
    costSavingsRatio: number;
    costPerActiveUserDayUsd: number;
  } {
    const totalOps = userCount * operationsPerUser;

    // Foundation AI requests (5% of total ops require heavy server model)
    const serverAiInvocations = Math.max(1, Math.round(totalOps * (1 - edgeOffloadPercent / 100)));
    const avgTokensPerInference = 500;
    const aiInferenceCostUsd = (serverAiInvocations * avgTokensPerInference * 0.000005);

    // Bandwidth cost (delta packets: 200 bytes per delta sync)
    const bandwidthBytes = totalOps * 200;
    const bandwidthCostUsd = (bandwidthBytes / (1024 * 1024 * 1024)) * 0.05;

    // Server Compute cost (lightweight delta merge: ~0.05ms per delta)
    const serverComputeSeconds = (totalOps * 0.00005);
    const serverComputeCostUsd = serverComputeSeconds * 0.00001;

    // Total actual cloud cost with CubiO Edge-First architecture
    const totalCostUsd = parseFloat((aiInferenceCostUsd + bandwidthCostUsd + serverComputeCostUsd).toFixed(4));

    // Baseline cloud cost if ALL spatial physics & rendering were rendered server-side (e.g. cloud video streaming / remote VM)
    const baselineCloudOpsCost = totalOps * 0.0025; // ~$0.0025 per continuous server physics step
    const baselineCloudCostWithoutEdgeUsd = parseFloat(baselineCloudOpsCost.toFixed(2));

    const costSavingsRatio = baselineCloudCostWithoutEdgeUsd > 0
      ? parseFloat((baselineCloudCostWithoutEdgeUsd / Math.max(0.0001, totalCostUsd)).toFixed(1))
      : 1.0;

    const costPerActiveUserDayUsd = userCount > 0
      ? parseFloat((totalCostUsd / userCount).toFixed(6))
      : 0.0;

    return {
      totalCostUsd,
      baselineCloudCostWithoutEdgeUsd,
      costSavingsRatio,
      costPerActiveUserDayUsd,
    };
  }
}
