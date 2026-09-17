/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * P5.1: Ambiguity / Information Loss Testing
 *
 * Tests whether different underlying states can produce the same
 * observable frame when observed through the same observer.
 *
 * If X1 ≠ X2 but F(X1, O) === F(X2, O), this is an OBSERVATIONAL AMBIGUITY.
 */

import {
  P51UnderlyingState,
  P51ObserverFrame,
  P51AmbiguityCase,
} from './types';
import { projectState } from './projection';

export function testAmbiguity(
  stateA: P51UnderlyingState,
  stateB: P51UnderlyingState,
  observer: P51ObserverFrame
): P51AmbiguityCase {
  const frameA = projectState(stateA, observer);
  const frameB = projectState(stateB, observer);

  const statesDifferent = stateA.checksum !== stateB.checksum;
  const framesIdentical = frameA.frameChecksum === frameB.frameChecksum;
  const isAmbiguity = statesDifferent && framesIdentical;

  let collapsedDimension = 'NONE';
  if (isAmbiguity) {
    // Determine which dimension was collapsed
    const sampleA = stateA.records[0];
    const sampleB = stateB.records[0];
    if (sampleA && sampleB) {
      const posA = sampleA.canonicalPosition;
      const posB = sampleB.canonicalPosition;
      if (posA[0] === posB[0] && posA[1] === posB[1] && posA[2] === posB[2]) {
        collapsedDimension = 'INTERNAL_PROPERTIES';
      } else {
        collapsedDimension = 'SPATIAL';
      }
    }
  }

  return Object.freeze({
    caseId: `AMB_${stateA.stateId}_vs_${stateB.stateId}_via_${observer.observerId}`,
    stateAId: stateA.stateId,
    stateBId: stateB.stateId,
    observerId: observer.observerId,
    statesDifferent,
    framesIdentical,
    isAmbiguityDetected: isAmbiguity,
    collapsedDimension,
    description: isAmbiguity
      ? `AMBIGUITY DETECTED: States ${stateA.stateId} and ${stateB.stateId} differ (checksums: ${stateA.checksum} vs ${stateB.checksum}) but produce identical observable frames through observer ${observer.observerId}. The projection loses ${collapsedDimension} information.`
      : `No ambiguity: States produce distinguishable frames (frames identical: ${framesIdentical}, states different: ${statesDifferent}).`,
  });
}

/**
 * Test ambiguity across dimensional observations.
 * Z2 observation loses the Z coordinate, so two states differing only in Z
 * will appear identical in Z2.
 */
export function testDimensionalAmbiguity(
  observer: P51ObserverFrame
): P51AmbiguityCase {
  // State A: objects at z=6
  const stateA: P51UnderlyingState = Object.freeze({
    stateId: 'AMB_STATE_Z6',
    checksum: 'z6_checksum',
    records: Object.freeze([{
      id: 'AMB_OBJ_1',
      entityName: 'Object at Z=6',
      canonicalPosition: [5, 3, 6] as const,
      category: 'TEST',
      color: '#ff0000',
      properties: {},
    }]),
    timestamp: 0,
  });

  // State B: objects at z=100 (different Z)
  const stateB: P51UnderlyingState = Object.freeze({
    stateId: 'AMB_STATE_Z100',
    checksum: 'z100_checksum',
    records: Object.freeze([{
      id: 'AMB_OBJ_1',
      entityName: 'Object at Z=100',
      canonicalPosition: [5, 3, 100] as const,
      category: 'TEST',
      color: '#ff0000',
      properties: {},
    }]),
    timestamp: 0,
  });

  return testAmbiguity(stateA, stateB, observer);
}
