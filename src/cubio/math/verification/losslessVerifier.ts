/**
 * CUBiO AI — Task 19: Lossless Encode -> Decode Verification Layer
 * Phase 1 — Mathematical Core
 * src/cubio/math/verification/losslessVerifier.ts
 *
 * Sovereign Verification Engine:
 * Formally validates that native mathematical primitives and binary/text payloads
 * undergo 100% bit-exact, lossless round-trip transformation through the 369/ternary layer:
 *
 *   X -> encodeBytesToSymbols -> decodeSymbolsToBytes -> X' (X' === X)
 *   Checksum(X) === Checksum(X')
 *   ByteLength(X) === ByteLength(X')
 */

import { calculateCanonicalChecksum } from '../../core/canonicalIdentity';
import { deserializeNativeMath, serializeNativeMath } from '../serialization';
import {
  decodeSymbolsToBytes,
  decodeSymbolsToString,
  encodeBytesToSymbols,
  encodeStringToSymbols,
  TernaryEncodingError,
} from '../ternary';
import { NativeMathValue } from '../types';
import {
  CorruptionTestResult,
  DeterminismResult,
  RoundTripMetrics,
} from './types';

/**
 * Validates round-trip fidelity for a raw Uint8Array binary buffer.
 */
export function verifyBytesRoundTrip(bytes: Uint8Array): RoundTripMetrics {
  const originalByteLength = bytes.length;
  const checksumPre = calculateCanonicalChecksum(Array.from(bytes));

  const symbolString = encodeBytesToSymbols(bytes);
  const encodedSymbolLength = symbolString.length;

  const decodedBytes = decodeSymbolsToBytes(symbolString);
  const decodedByteLength = decodedBytes.length;
  const checksumPost = calculateCanonicalChecksum(Array.from(decodedBytes));

  let isBitIdentical = originalByteLength === decodedByteLength;
  if (isBitIdentical) {
    for (let i = 0; i < originalByteLength; i++) {
      if (bytes[i] !== decodedBytes[i]) {
        isBitIdentical = false;
        break;
      }
    }
  }

  const isChecksumIdentical = checksumPre === checksumPost;
  const isLossless = isBitIdentical && isChecksumIdentical;
  const expansionRatio = originalByteLength > 0
    ? parseFloat((encodedSymbolLength / originalByteLength).toFixed(2))
    : 1.0;

  return Object.freeze({
    originalByteLength,
    decodedByteLength,
    encodedSymbolLength,
    expansionRatio,
    checksumPre,
    checksumPost,
    isBitIdentical,
    isChecksumIdentical,
    isLossless,
  });
}

/**
 * Validates round-trip fidelity for an arbitrary UTF-8 text string.
 */
export function verifyTextRoundTrip(text: string): RoundTripMetrics {
  const rawBytes = new TextEncoder().encode(text);
  const originalByteLength = rawBytes.length;
  const checksumPre = calculateCanonicalChecksum(text);

  const symbolString = encodeStringToSymbols(text);
  const encodedSymbolLength = symbolString.length;

  const decodedText = decodeSymbolsToString(symbolString);
  const decodedBytes = new TextEncoder().encode(decodedText);
  const decodedByteLength = decodedBytes.length;
  const checksumPost = calculateCanonicalChecksum(decodedText);

  const isBitIdentical = text === decodedText && originalByteLength === decodedByteLength;
  const isChecksumIdentical = checksumPre === checksumPost;
  const isLossless = isBitIdentical && isChecksumIdentical;
  const expansionRatio = originalByteLength > 0
    ? parseFloat((encodedSymbolLength / originalByteLength).toFixed(2))
    : 1.0;

  return Object.freeze({
    originalByteLength,
    decodedByteLength,
    encodedSymbolLength,
    expansionRatio,
    checksumPre,
    checksumPost,
    isBitIdentical,
    isChecksumIdentical,
    isLossless,
  });
}

/**
 * Validates round-trip fidelity for a structured NativeMathValue primitive.
 */
export function verifyMathValueRoundTrip(mathValue: NativeMathValue): RoundTripMetrics {
  const canonicalJson = serializeNativeMath(mathValue);
  const metrics = verifyTextRoundTrip(canonicalJson);

  // Deep reconstruction check
  const reconstructedMath = deserializeNativeMath(canonicalJson);
  const mathChecksumIdentical = reconstructedMath.checksum === mathValue.checksum;

  return Object.freeze({
    ...metrics,
    isLossless: metrics.isLossless && mathChecksumIdentical,
  });
}

/**
 * Validates round-trip fidelity for an arbitrary JSON-serializable payload.
 */
export function verifyJsonRoundTrip(payload: unknown): RoundTripMetrics {
  const canonicalJson = JSON.stringify(payload);
  return verifyTextRoundTrip(canonicalJson);
}

/**
 * Executes a battery of deliberate corruption tests to verify fail-closed interception.
 */
export function verifyCorruptionCases(): readonly CorruptionTestResult[] {
  const testCases: { name: string; input: string }[] = [
    { name: 'Invalid Symbol: Character 0', input: '369360' },
    { name: 'Invalid Symbol: Character 1', input: '369361' },
    { name: 'Invalid Symbol: Character 2', input: '369362' },
    { name: 'Invalid Symbol: Character 4', input: '369364' },
    { name: 'Invalid Symbol: Character 7', input: '369367' },
    { name: 'Invalid Symbol: Character X', input: '36936X' },
    { name: 'Invalid Symbol: Whitespace', input: '369 69' },
    { name: 'Truncated Stream: 1 Symbol', input: '3' },
    { name: 'Truncated Stream: 5 Symbols', input: '36936' },
    { name: 'Truncated Stream: 7 Symbols', input: '3693693' },
    { name: 'Corrupt 6-Trit Range: All 9s (Val 728 > 255)', input: '999999' },
    { name: 'Corrupt 6-Trit Range: Boundary 256', input: '666336' },
  ];

  const results: CorruptionTestResult[] = [];

  for (const tc of testCases) {
    let rejectedFailClosed = false;
    let errorCaptured: string | undefined;

    try {
      decodeSymbolsToBytes(tc.input);
    } catch (err) {
      if (err instanceof TernaryEncodingError || (err as Error).name === 'TernaryEncodingError') {
        rejectedFailClosed = true;
        errorCaptured = (err as Error).message;
      }
    }

    results.push(Object.freeze({
      testName: tc.name,
      mutatedInput: tc.input,
      rejectedFailClosed,
      errorCaptured,
    }));
  }

  return Object.freeze(results);
}

/**
 * Validates deterministic repeated-run invariance over N iterations.
 */
export function verifyRepeatedDeterminism(sample: Uint8Array, iterations = 1000): DeterminismResult {
  const initialSymbols = encodeBytesToSymbols(sample);
  const initialChecksum = calculateCanonicalChecksum(initialSymbols);

  let divergenceCount = 0;
  for (let i = 0; i < iterations; i++) {
    const symbols = encodeBytesToSymbols(sample);
    const checksum = calculateCanonicalChecksum(symbols);
    if (symbols !== initialSymbols || checksum !== initialChecksum) {
      divergenceCount++;
    }
  }

  return Object.freeze({
    iterations,
    allOutputsIdentical: divergenceCount === 0,
    canonicalChecksum: initialChecksum,
    divergenceCount,
  });
}
