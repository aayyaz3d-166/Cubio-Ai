/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.4: Information Boundary Engine
 *
 * Formally separates geometric spatial coordinates, observable metadata,
 * and completely unobservable internal payloads.
 */

import { WorkspaceObject } from '../p61/types';
import { PropertyInformationBoundary, InformationDomainCategory } from './types';
import { IntersectedNodeState } from './constraintManifold';

export class InformationBoundaryEngine {
  public static classifyProperties(
    obj: WorkspaceObject,
    nodeState: IntersectedNodeState
  ): readonly PropertyInformationBoundary[] {
    const boundaries: PropertyInformationBoundary[] = [];

    // 1. Geometric Spatial X
    boundaries.push({
      propertyName: 'position.x',
      category: 'GEOMETRIC_SPATIAL',
      trueValue: obj.position[0],
      recoveredValue: nodeState.reconstructedPosition[0],
      isRecoverableInPrinciple: true,
      certainty: nodeState.reconstructedPosition[0] !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: nodeState.reconstructedPosition[0] !== null
        ? Math.abs(nodeState.reconstructedPosition[0] - obj.position[0])
        : 50,
    });

    // 2. Geometric Spatial Y
    boundaries.push({
      propertyName: 'position.y',
      category: 'GEOMETRIC_SPATIAL',
      trueValue: obj.position[1],
      recoveredValue: nodeState.reconstructedPosition[1],
      isRecoverableInPrinciple: true,
      certainty: nodeState.reconstructedPosition[1] !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: nodeState.reconstructedPosition[1] !== null
        ? Math.abs(nodeState.reconstructedPosition[1] - obj.position[1])
        : 50,
    });

    // 3. Geometric Spatial Z
    boundaries.push({
      propertyName: 'position.z',
      category: 'GEOMETRIC_SPATIAL',
      trueValue: obj.position[2],
      recoveredValue: nodeState.reconstructedPosition[2],
      isRecoverableInPrinciple: true,
      certainty: nodeState.reconstructedPosition[2] !== null ? 'EXACT' : 'UNOBSERVABLE',
      errorMagnitude: nodeState.reconstructedPosition[2] !== null
        ? Math.abs(nodeState.reconstructedPosition[2] - obj.position[2])
        : 50,
    });

    // 4. Observable Non-Geometric (Entity Label)
    boundaries.push({
      propertyName: 'label',
      category: 'OBSERVABLE_NON_GEOMETRIC',
      trueValue: obj.label,
      recoveredValue: obj.label,
      isRecoverableInPrinciple: true,
      certainty: 'EXACT',
      errorMagnitude: 0,
    });

    // 5. Observable Non-Geometric (Color)
    boundaries.push({
      propertyName: 'color',
      category: 'OBSERVABLE_NON_GEOMETRIC',
      trueValue: obj.color,
      recoveredValue: obj.color,
      isRecoverableInPrinciple: true,
      certainty: 'EXACT',
      errorMagnitude: 0,
    });

    // 6. Unobservable Internal Payload
    if (obj.internalPayload) {
      boundaries.push({
        propertyName: 'internalPayload',
        category: 'UNOBSERVABLE_INTERNAL_PAYLOAD',
        trueValue: obj.internalPayload,
        recoveredValue: null,
        isRecoverableInPrinciple: false, // Fundamental boundary: cannot be inferred from projection
        certainty: 'UNOBSERVABLE',
        errorMagnitude: 1.0,
      });
    }

    return Object.freeze(boundaries);
  }
}
