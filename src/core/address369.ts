/**
 * 369 Address System - Single Source of Truth
 * 
 * Conceptual Address Space: 369 Total Addresses
 * ----------------------------------------------------
 * • 26 Alphabet Symbols (A–Z):   Addresses 0 .. 25
 * • 343 Spatial Cells (7×7×7):   Addresses 26 .. 368
 * 
 * 7×7×7 Spatial Grid:
 * • X = 0..6
 * • Y = 0..6
 * • Z = 0..6
 * Total Spatial Cells: 7 × 7 × 7 = 343
 */

import { Coordinate3D } from '../types/memory';

export const DIMENSION = 7;
export const TOTAL_SPATIAL_CELLS = 343; // 7 * 7 * 7
export const TOTAL_SYMBOLIC_IDS = 26;  // A–Z canonical (0..25)
export const TOTAL_ADDRESS_SPACE = 369; // 26 + 343 = 369

export const SYMBOLIC_ADDRESS_START = 0;
export const SYMBOLIC_ADDRESS_END = 25;
export const SPATIAL_ADDRESS_OFFSET = 26; // Address 26..368
export const SPATIAL_ADDRESS_END = 368;

/**
 * Validates that coordinate (x,y,z) is within [0..6]
 */
export function validateCoordinate(x: number, y: number, z: number): void {
  if (
    !Number.isInteger(x) || x < 0 || x >= DIMENSION ||
    !Number.isInteger(y) || y < 0 || y >= DIMENSION ||
    !Number.isInteger(z) || z < 0 || z >= DIMENSION
  ) {
    throw new Error(`Coordinate out of bounds [0..6]: (${x}, ${y}, ${z})`);
  }
}

/**
 * Validates that linear Cell ID is within [0..342]
 */
export function validateCellId(cellId: number): void {
  if (!Number.isInteger(cellId) || cellId < 0 || cellId >= TOTAL_SPATIAL_CELLS) {
    throw new Error(`Cell ID out of bounds [0..342]: ${cellId}`);
  }
}

/**
 * Validates that 369 Address is within [0..368]
 */
export function validateAddress(address: number): void {
  if (!Number.isInteger(address) || address < 0 || address >= TOTAL_ADDRESS_SPACE) {
    throw new Error(`369 Address out of bounds [0..368]: ${address}`);
  }
}

/**
 * Maps 3D coordinate (x, y, z) to linear Cell ID [0..342]
 * Formula: ID = x + y * 7 + z * 49
 */
export function coordinateToCellId(x: number, y: number, z: number): number {
  validateCoordinate(x, y, z);
  return x + y * DIMENSION + z * (DIMENSION * DIMENSION);
}

// Alias
export const coordToCellId = coordinateToCellId;

/**
 * Maps linear Cell ID [0..342] to 3D coordinate (x, y, z)
 */
export function cellIdToCoordinate(cellId: number): Coordinate3D {
  validateCellId(cellId);
  const x = cellId % DIMENSION;
  const y = Math.floor(cellId / DIMENSION) % DIMENSION;
  const z = Math.floor(cellId / (DIMENSION * DIMENSION));
  return { x, y, z };
}

// Alias
export const cellIdToCoord = cellIdToCoordinate;

/**
 * Converts Cell ID [0..342] to 369 Spatial Address [26..368]
 */
export function cellIdToAddress369(cellId: number): number {
  validateCellId(cellId);
  return SPATIAL_ADDRESS_OFFSET + cellId;
}

/**
 * Converts 369 Spatial Address [26..368] to Cell ID [0..342]
 */
export function address369ToCellId(address: number): number {
  if (address < SPATIAL_ADDRESS_OFFSET || address > SPATIAL_ADDRESS_END) {
    throw new Error(`Address ${address} is not a spatial address [26..368]`);
  }
  return address - SPATIAL_ADDRESS_OFFSET;
}

/**
 * Maps 3D coordinate (x, y, z) directly to 369 Spatial Address [26..368]
 */
export function coordinateToAddress(x: number, y: number, z: number): number {
  const cellId = coordinateToCellId(x, y, z);
  return cellIdToAddress369(cellId);
}

/**
 * Maps 369 Spatial Address [26..368] directly to 3D coordinate (x, y, z)
 */
export function addressToCoordinate(address: number): Coordinate3D {
  const cellId = address369ToCellId(address);
  return cellIdToCoordinate(cellId);
}

/**
 * Check if address is symbolic (0..25)
 */
export function isSymbolicAddress(address: number): boolean {
  return address >= SYMBOLIC_ADDRESS_START && address <= SYMBOLIC_ADDRESS_END;
}

/**
 * Check if address is spatial (26..368)
 */
export function isSpatialAddress(address: number): boolean {
  return address >= SPATIAL_ADDRESS_OFFSET && address <= SPATIAL_ADDRESS_END;
}

/**
 * Maps a single character/token to its 1-based canonical symbol address (1..26 for A-Z, e.g. 'H' -> 8)
 */
export function getTokenAddress(token: string): number {
  if (!token || token.length === 0) return 0;
  const upper = token.toUpperCase();
  const code = upper.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 64; // 1 for 'A', 8 for 'H', 26 for 'Z'
  }
  if (token === ' ') return 27;
  return (token.charCodeAt(0) % 26) + 1;
}

/**
 * Maps a single character to its symbolic 369 address (0..25 for A–Z)
 * For lowercase letters, maps to 0..25. For other characters, deterministic modular hash.
 */
export function charToAddress(char: string): number {
  if (!char || char.length === 0) return 0;
  const upper = char.toUpperCase();
  const code = upper.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 65; // 0 for 'A', 25 for 'Z'
  }
  return char.charCodeAt(0) % TOTAL_SYMBOLIC_IDS;
}

/**
 * Maps symbolic address (0..25) to character 'A'..'Z'
 */
export function addressToChar(address: number): string {
  if (address >= 0 && address < TOTAL_SYMBOLIC_IDS) {
    return String.fromCharCode(65 + address);
  }
  if (address >= SPATIAL_ADDRESS_OFFSET && address <= SPATIAL_ADDRESS_END) {
    const cellId = address - SPATIAL_ADDRESS_OFFSET;
    return `[Cell#${cellId}]`;
  }
  return '?';
}

/**
 * Maps character to symbolId (0..25 for A-Z, or character code)
 */
export function charToSymbolId(char: string): number {
  if (!char) return 0;
  const upper = char.toUpperCase();
  const code = upper.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 65;
  }
  return char.charCodeAt(0);
}

/**
 * Converts a symbol ID or char code to an 8-bit binary string representation
 */
export function symbolIdTo8BitBinary(symbolId: number): string {
  return (symbolId & 0xff).toString(2).padStart(8, '0');
}

/**
 * Deterministically maps a character/token and step index to a 3D Cell ID [0..342]
 * 
 * Exact Deterministic Rule:
 * • Base coordinate derived from character code: (charCode * 19 + 7) % 343
 * • Step dispersion offset: (stepIndex * 31) % 343
 * • Spatial Cell ID = (base + stepOffset) % 343
 * 
 * Guarantee: The same input text ALWAYS produces the identical sequence of cell IDs and coordinates.
 */
export function mapTokenToSpatialCell(char: string, stepIndex: number = 0): {
  cellId: number;
  address: number;
  address369: number;
  coord: Coordinate3D;
  symbolId: number;
  binary: string;
} {
  const charCode = char.charCodeAt(0);
  const symbolId = charToSymbolId(char);
  
  const baseSpatialIndex = (charCode * 19 + 7) % TOTAL_SPATIAL_CELLS;
  const stepOffset = (stepIndex * 31) % TOTAL_SPATIAL_CELLS;
  const cellId = (baseSpatialIndex + stepOffset) % TOTAL_SPATIAL_CELLS;
  
  const address = cellIdToAddress369(cellId);
  const coord = cellIdToCoordinate(cellId);
  const binary = charCode.toString(2).padStart(8, '0');

  return {
    cellId,
    address,
    address369: address,
    coord,
    symbolId,
    binary,
  };
}
