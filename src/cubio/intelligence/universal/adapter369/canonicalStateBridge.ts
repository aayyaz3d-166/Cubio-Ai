/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: Canonical State Bridge
 *
 * Ingests AI inputs and maps them into Canonical CubiO State structures and
 * formal D0..D7 Dimensional State Nodes without mutating legacy state trees.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiODimension } from '../../../types';
import { CubiOUniversalDimensionalEngine } from '../dimension/dimensionalEngine';
import { DimensionalStateNode } from '../dimension/types';
import { Adapter369Request } from './types';

export class CanonicalStateBridge {
  private dimEngine = new CubiOUniversalDimensionalEngine();

  /**
   * Bridges an AI input into a canonical state dictionary and dimensional node.
   */
  public bridgeAIInput(request: Adapter369Request): {
    readonly canonicalState: Readonly<Record<string, unknown>>;
    readonly dimensionalNode: DimensionalStateNode;
    readonly dimension: CubiODimension;
  } {
    const rawInput = request.aiInput.trim();
    const dimension: CubiODimension = request.targetDimension || 'D3';

    // Extract numbers from input or generate deterministic spatial coordinates
    const numMatches = rawInput.match(/-?\d+(\.\d+)?/g);
    const coordinates: number[] = numMatches
      ? numMatches.slice(0, 4).map((n) => parseFloat(n))
      : [3.0, 6.0, 9.0, 432.0];

    // Ensure at least 3 coordinates for D3/D4
    while (coordinates.length < 4) {
      coordinates.push((coordinates.length + 1) * 3);
    }

    const stateChecksum = deterministicHash(`CANONICAL_AI_BRIDGE:${rawInput}:${dimension}:${coordinates.join(',')}`);
    const canonicalState: Record<string, unknown> = {
      bridgeId: `CBR_${stateChecksum.slice(2, 10)}`,
      rawInput,
      dimension,
      spatialCoordinates: Object.freeze([...coordinates]),
      problemContext: request.problemContext || 'Universal AI Spatial Problem',
      parameters: request.parameters || {},
      timestamp: Date.now(),
    };

    const dimensionalNode = this.dimEngine.createDimensionalNode(
      canonicalState,
      dimension as any
    );

    return {
      canonicalState: Object.freeze(canonicalState),
      dimensionalNode,
      dimension,
    };
  }
}
