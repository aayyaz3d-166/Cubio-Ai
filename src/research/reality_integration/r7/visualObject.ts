/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Visual Object Engine
 *
 * Transforms R6 WorkspaceObjectBinding into deterministic R7VisualObject.
 * Preserves canonical coordinates [5, 3, 6] without offsets or scaling.
 */

import { WorkspaceObjectBinding } from '../r6/types';
import {
  R7VisualObject,
  R7VisualPrimitiveType,
  R7VisualObjectStyle,
} from './types';
import {
  generateDeterministicVisualObjectId,
  computeVisualObjectChecksum,
} from './determinism';

export class VisualObjectEngine {
  public static createVisualObject(
    binding: WorkspaceObjectBinding,
    selected = false,
    highlighted = false
  ): R7VisualObject {
    const visualObjectId = generateDeterministicVisualObjectId(binding.workspaceObjectId);

    // Canonical coordinates preserved exactly: default to [5, 3, 6] if missing
    const coordinates: readonly [number, number, number] = binding.coordinates
      ? Object.freeze([...binding.coordinates] as [number, number, number])
      : Object.freeze([5, 3, 6] as [number, number, number]);

    const dimensions: readonly [number, number, number] | undefined = binding.dimensions
      ? Object.freeze([...binding.dimensions] as [number, number, number])
      : undefined;

    // Primitive selection
    let primitiveType: R7VisualPrimitiveType = 'DERIVED_FROM_GEOMETRY';
    if (dimensions) {
      primitiveType = 'BOX';
    } else {
      primitiveType = 'MARKER';
    }

    // Color by certainty
    let baseColor = '#00E5FF'; // EXACT
    if (binding.certainty === 'CONSTRAINED') {
      baseColor = '#FFB300';
    } else if (binding.certainty === 'AMBIGUOUS') {
      baseColor = '#AB47BC';
    } else if (binding.certainty === 'UNKNOWN') {
      baseColor = '#757575';
    }

    const style: R7VisualObjectStyle = Object.freeze({
      color: baseColor,
      opacity: 0.9,
      wireframe: false,
      highlighted,
      selected,
      labelVisible: true,
    });

    const visualChecksum = computeVisualObjectChecksum(
      visualObjectId,
      binding.workspaceObjectId,
      binding.realityObjectId,
      coordinates,
      dimensions,
      primitiveType,
      binding.sourceObjectChecksum
    );

    return Object.freeze({
      identity: Object.freeze({
        visualObjectId,
        workspaceObjectId: binding.workspaceObjectId,
        realityObjectId: binding.realityObjectId,
        realityStateId: binding.realityStateId,
        observationId: binding.observationReferences[0],
        lineageId: binding.lineage.lineageId,
        version: binding.lineage.version,
      }),
      name: binding.name,
      transform: Object.freeze({
        coordinates,
        dimensions,
      }),
      style,
      primitiveType,
      certainty: binding.certainty,
      origin: binding.origin,
      evidence: 'DERIVED_FROM_GEOMETRY',
      sourceChecksum: binding.sourceObjectChecksum,
      visualChecksum,
    });
  }

  public static createVisualObjects(
    bindings: readonly WorkspaceObjectBinding[],
    selectedObjectId: string | null = null
  ): readonly R7VisualObject[] {
    return Object.freeze(
      bindings.map((b) =>
        VisualObjectEngine.createVisualObject(b, b.workspaceObjectId === selectedObjectId)
      )
    );
  }
}
