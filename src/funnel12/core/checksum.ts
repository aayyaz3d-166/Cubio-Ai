/**
 * 3D Memory Studio - Funnel 12: Deterministic Checksum Core
 * 
 * Implements a 100% deterministic, standalone CRC-32 (IEEE 802.3 standard) algorithm.
 * Operates directly on Uint8Array buffers without external dependencies.
 */

// Precomputed standard CRC32 lookup table (polynomial 0xEDB88320)
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

/**
 * Calculates deterministic 32-bit CRC32 over a byte buffer slice.
 */
export function calculateCRC32(
  buffer: Uint8Array,
  start: number = 0,
  end: number = buffer.length
): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    const byte = buffer[i];
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Formats a 32-bit integer checksum as 0xXXXXXXXX hex string.
 */
export function formatChecksumHex(crc: number): string {
  return '0x' + (crc >>> 0).toString(16).toUpperCase().padStart(8, '0');
}
