/**
 * CubiO — Step 86 Cluster Topology Manager
 */

export class TopologyManager {
  private readonly worldSize: number;

  constructor(worldSize = 6) {
    this.worldSize = worldSize;
  }

  public getRingNeighbors(rank: number): { prevRank: number; nextRank: number } {
    const prevRank = (rank - 1 + this.worldSize) % this.worldSize;
    const nextRank = (rank + 1) % this.worldSize;
    return { prevRank, nextRank };
  }

  public getMeshAdjacencyMatrix(): readonly (readonly number[])[] {
    const matrix: number[][] = [];
    for (let i = 0; i < this.worldSize; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.worldSize; j++) {
        row.push(i === j ? 0 : 1);
      }
      matrix.push(row);
    }
    return Object.freeze(matrix);
  }
}
