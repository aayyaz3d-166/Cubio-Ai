/**
 * CUBiO AI — Funnel 02: Database ↔ Virtual Core Stability
 * Constants & Invariants
 */

export const FUNNEL_NAME = 'FUNNEL_02';
export const GATE_NAME = 'DATABASE_VIRTUAL_CORE_STABILITY';
export const FORMAT_MAGIC = 'CUBIO_VIRTUAL_CORE_CHECKPOINT';
export const SCHEMA_VERSION = '2.0.0';

// Grid Dimensions & Address Limits
export const GRID_DIMENSION = 7;
export const TOTAL_SPATIAL_CELLS = 343; // 7 * 7 * 7
export const TOTAL_SYMBOLIC_IDS = 26;   // A-Z canonical (0..25)
export const TOTAL_ADDRESS_SPACE = 369; // 26 + 343 = 369

export const SYMBOLIC_ADDRESS_START = 0;
export const SYMBOLIC_ADDRESS_END = 25;
export const SPATIAL_ADDRESS_OFFSET = 26;
export const SPATIAL_ADDRESS_END = 368;

// Permanent Invariant Locks
export const IS_ACTUATION_BLOCKED = true;
export const LOCAL_FIRST_STORAGE_ONLY = true;
export const DISALLOWED_PROTOCOLS = [
  'http://',
  'https://',
  's3://',
  'mongodb://',
  'postgres://',
  'postgresql://',
  'mysql://',
  'redis://',
  'ws://',
  'wss://',
  'ftp://',
];

// Checkpoint File Extension & Defaults
export const CHECKPOINT_FILE_EXTENSION = '.c3dcp';
export const DEFAULT_STORAGE_DIR = 'data/checkpoints/storage';
export const MANIFEST_FILE_NAME = 'checkpoints_manifest.json';
