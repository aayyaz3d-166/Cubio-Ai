/**
 * CUBiO AI — Funnel 02: Database ↔ Virtual Core Stability
 * Type Definitions & Schemas
 */

import { Coordinate3D, MemoryCell, MemoryGrid3D } from '../types/memory';
import { EulerMemoryEngine } from '../core/EulerMemoryEngine';

export interface CheckpointSecurity {
  is_actuation_blocked: boolean;
  local_first_only: boolean;
  cloud_storage_disabled: boolean;
  model_weights_included: false;
}

export interface CheckpointHeader {
  magic: string;
  schema_version: string;
  funnel: string;
  gate: string;
  checkpoint_id: string;
  created_at: string;
  epoch: number;
  description: string;
}

export interface SymbolicAddressEntry {
  address: number;
  symbol: string;
  symbolId: number;
}

export interface SpatialAddressEntry {
  address: number;
  cellId: number;
  coord: [number, number, number];
}

export interface CheckpointAddressing {
  total_address_space: number;
  symbolic_count: number;
  spatial_count: number;
  symbolic_table: SymbolicAddressEntry[];
  spatial_table: SpatialAddressEntry[];
}

export interface CanonicalCellState {
  id: number;
  address369: number;
  x: number;
  y: number;
  z: number;
  state: 0 | 1;
  symbol: string | null;
  symbolId: number | null;
  payloadBinary: string;
  occurrenceCount: number;
  stepIndices: number[];
  connections: number[];
}

export interface EulerNodeState {
  coords: [number, number, number];
  phi: number;
  amplitudeReal: number;
  amplitudeImag: number;
  weight: number;
}

export interface CheckpointIntegrity {
  algorithm: 'SHA-256';
  payload_sha256: string;
  cells_merkle_root: string;
  addresses_merkle_root: string;
  byte_length: number;
  canonical_checksum: string;
}

export interface VirtualCoreCheckpoint {
  header: CheckpointHeader;
  security: CheckpointSecurity;
  addressing: CheckpointAddressing;
  grid_state: {
    dimension: number;
    total_cells: number;
    active_cell_count: number;
    cells: CanonicalCellState[];
  };
  euler_state: {
    dimension: number;
    total_nodes: number;
    nodes: EulerNodeState[];
  };
  sequence_steps: Array<{
    stepIndex: number;
    cellId: number;
    address369: number;
    token: string;
    coordinate: Coordinate3D;
  }>;
  integrity: CheckpointIntegrity;
}

export interface CheckpointManifestEntry {
  checkpoint_id: string;
  epoch: number;
  filename: string;
  filepath: string;
  created_at: string;
  sha256: string;
  byte_length: number;
  active_cells: number;
  status: 'COMMITTED' | 'INVALID';
}

export interface StorageManifest {
  protocol: string;
  version: string;
  last_updated: string;
  latest_epoch: number;
  total_checkpoints: number;
  checkpoints: CheckpointManifestEntry[];
}

export interface CheckpointSaveResult {
  success: boolean;
  checkpoint_id: string;
  epoch: number;
  filepath: string;
  sha256: string;
  byte_length: number;
  duration_ms: number;
}

export interface CheckpointVerificationResult {
  isValid: boolean;
  checkpoint_id: string;
  errors: string[];
  warnings: string[];
  payload_sha256_match: boolean;
  cells_merkle_root_match: boolean;
  addresses_merkle_root_match: boolean;
  actuation_lock_verified: boolean;
  cell_count: number;
  address_count: number;
}

export interface ReplayResult {
  success: boolean;
  checkpoint_id: string;
  epoch: number;
  grid: MemoryGrid3D;
  euler: EulerMemoryEngine;
  cells_reconstructed: number;
  addresses_verified: number;
  duration_ms: number;
}
