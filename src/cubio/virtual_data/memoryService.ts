/**
 * CUBiO AI — Phase 3: Memory Service
 *
 * Provides bidirectional synchronization and integrity validation between:
 * Virtual Database ↕ Logical Memory Contract ↕ 3D Memory Core (EulerMemoryEngine / 369)
 */

import {
  LogicalSpatialMemoryRecord,
  createSpatialMemoryRecord,
  computeSpatialMemoryHash,
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  validateCoordinate,
  validateCellId,
  validateAddress,
  TOTAL_SPATIAL_CELLS,
  DIMENSION
} from './memoryContract';
import { VirtualDataService } from './virtualDataService';
import { EulerMemoryEngine, EulerNode } from '../../core/EulerMemoryEngine';

export class MemoryService {
  private static instance: MemoryService | null = null;
  private readonly vds: VirtualDataService;

  constructor(vds?: VirtualDataService) {
    this.vds = vds ?? VirtualDataService.getInstance();
  }

  public static getInstance(vds?: VirtualDataService): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService(vds);
    }
    return MemoryService.instance;
  }

  /**
   * Encodes state into a LogicalSpatialMemoryRecord and persists it to the Virtual Database.
   */
  public async writeSpatialMemory(
    coordinate: readonly [number, number, number],
    state: Record<string, unknown>,
    options?: { source?: string; clusterId?: string }
  ): Promise<LogicalSpatialMemoryRecord> {
    const record = createSpatialMemoryRecord({
      coordinate,
      state,
      source: options?.source,
      clusterId: options?.clusterId
    });

    const adapter = this.vds.getAdapter();
    await adapter.save<LogicalSpatialMemoryRecord & { id: string }>('spatial_memory', {
      id: record.memoryId,
      ...record
    });

    return record;
  }

  /**
   * Reads a spatial memory record by cell ID [0..342] from the Virtual Database.
   */
  public async readSpatialMemoryByCellId(cellId: number): Promise<LogicalSpatialMemoryRecord | undefined> {
    validateCellId(cellId);
    const adapter = this.vds.getAdapter();
    const rec = await adapter.get<LogicalSpatialMemoryRecord>('spatial_memory', `SPATIAL_MEM_${cellId}`);
    if (!rec) return undefined;

    // Verify hash and invariant integrity
    this.verifyRecordIntegrity(rec);
    return rec;
  }

  /**
   * Reads a spatial memory record by 3D coordinate (x, y, z) from the Virtual Database.
   */
  public async readSpatialMemoryByCoordinate(x: number, y: number, z: number): Promise<LogicalSpatialMemoryRecord | undefined> {
    validateCoordinate(x, y, z);
    const cellId = coordinateToCellId(x, y, z);
    return this.readSpatialMemoryByCellId(cellId);
  }

  /**
   * Reads a spatial memory record by 369 spatial address [26..368] from the Virtual Database.
   */
  public async readSpatialMemoryByAddress369(address369: number): Promise<LogicalSpatialMemoryRecord | undefined> {
    validateAddress(address369);
    const cellId = address369ToCellId(address369);
    return this.readSpatialMemoryByCellId(cellId);
  }

  /**
   * Reads all stored spatial memory records from the Virtual Database.
   */
  public async getAllSpatialMemories(): Promise<readonly LogicalSpatialMemoryRecord[]> {
    const adapter = this.vds.getAdapter();
    const all = await adapter.getAll<LogicalSpatialMemoryRecord>('spatial_memory');
    for (const rec of all) {
      this.verifyRecordIntegrity(rec);
    }
    return all;
  }

  /**
   * Synchronizes EulerMemoryEngine (3D Memory Core) state INTO the Virtual Database.
   */
  public async syncEulerMemoryToDatabase(euler: EulerMemoryEngine): Promise<{ count: number }> {
    let count = 0;
    for (let x = 0; x < euler.gridSize; x++) {
      for (let y = 0; y < euler.gridSize; y++) {
        for (let z = 0; z < euler.gridSize; z++) {
          const key = `${x},${y},${z}`;
          const node: EulerNode = euler.grid[key];
          if (node) {
            await this.writeSpatialMemory(
              [x, y, z],
              {
                phi: node.phi,
                amplitudeReal: node.amplitudeReal,
                amplitudeImag: node.amplitudeImag,
                weight: node.weight
              },
              { source: 'EULER_MEMORY_CORE_SYNC' }
            );
            count++;
          }
        }
      }
    }
    return { count };
  }

  /**
   * Rehydrates EulerMemoryEngine (3D Memory Core) FROM the Virtual Database.
   */
  public async syncDatabaseToEulerMemory(euler: EulerMemoryEngine): Promise<{ rehydrated: number }> {
    const records = await this.getAllSpatialMemories();
    let rehydrated = 0;
    for (const rec of records) {
      const [x, y, z] = rec.coordinate;
      const key = `${x},${y},${z}`;
      if (rec.state) {
        euler.grid[key] = {
          coords: { x, y, z },
          phi: (rec.state.phi as number) ?? 0.0,
          amplitudeReal: (rec.state.amplitudeReal as number) ?? 1.0,
          amplitudeImag: (rec.state.amplitudeImag as number) ?? 0.0,
          weight: (rec.state.weight as number) ?? 1.0
        };
        rehydrated++;
      }
    }
    return { rehydrated };
  }

  /**
   * Verifies the complete 7x7x7 (343 spatial cells) coverage without collision or drift.
   */
  public verify343CellIntegrity(): {
    totalCells: number;
    uniqueCellIds: number;
    uniqueAddresses: number;
    centerMatches: boolean;
    allValid: boolean;
  } {
    const cellIds = new Set<number>();
    const addresses = new Set<number>();

    for (let x = 0; x < DIMENSION; x++) {
      for (let y = 0; y < DIMENSION; y++) {
        for (let z = 0; z < DIMENSION; z++) {
          const cellId = coordinateToCellId(x, y, z);
          validateCellId(cellId);
          cellIds.add(cellId);

          const address369 = cellIdToAddress369(cellId);
          validateAddress(address369);
          addresses.add(address369);

          const backCoord = cellIdToCoordinate(cellId);
          if (backCoord.x !== x || backCoord.y !== y || backCoord.z !== z) {
            throw new Error(`Coordinate roundtrip mismatch at (${x},${y},${z})`);
          }
        }
      }
    }

    const centerCellId = coordinateToCellId(3, 3, 3);
    const centerAddress = cellIdToAddress369(centerCellId);
    const centerMatches = centerCellId === 171 && centerAddress === 197;

    return {
      totalCells: TOTAL_SPATIAL_CELLS,
      uniqueCellIds: cellIds.size,
      uniqueAddresses: addresses.size,
      centerMatches,
      allValid: cellIds.size === TOTAL_SPATIAL_CELLS && addresses.size === TOTAL_SPATIAL_CELLS && centerMatches
    };
  }

  /**
   * Convenience alias for verifying 343-cell lattice integrity.
   */
  public validateMemoryIntegrity(): boolean {
    return this.verify343CellIntegrity().allValid;
  }

  /**
   * Internal validator to fail-closed on tampered or corrupted records.
   */
  private verifyRecordIntegrity(rec: LogicalSpatialMemoryRecord): void {
    if (!rec.coordinate || rec.coordinate.length !== 3) {
      throw new Error(`CORRUPT_SPATIAL_RECORD: Missing or invalid coordinate array in record ${rec.memoryId}`);
    }
    const [x, y, z] = rec.coordinate;
    validateCoordinate(x, y, z);
    validateCellId(rec.cellId);
    validateAddress(rec.address369);

    const expectedCellId = coordinateToCellId(x, y, z);
    if (rec.cellId !== expectedCellId) {
      throw new Error(`INVARIANT_VIOLATION: Cell ID ${rec.cellId} does not match coordinate (${x},${y},${z}) expected ${expectedCellId}`);
    }

    const expectedAddress = cellIdToAddress369(expectedCellId);
    if (rec.address369 !== expectedAddress) {
      throw new Error(`INVARIANT_VIOLATION: Address ${rec.address369} does not match cell ID ${rec.cellId} expected ${expectedAddress}`);
    }

    const expectedHash = computeSpatialMemoryHash({
      cellId: rec.cellId,
      coordinate: rec.coordinate,
      address369: rec.address369,
      state: rec.state,
      source: rec.source
    });

    if (rec.integrityHash && rec.integrityHash !== expectedHash) {
      throw new Error(`TAMPER_DETECTED: Spatial memory integrity hash mismatch for record ${rec.memoryId}`);
    }
  }
}
