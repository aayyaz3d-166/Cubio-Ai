/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parametric Geometry & Feature Construction — Type Definitions
 *
 * Types for typed parameters, sketch constraints, DAG feature graphs,
 * parametric features (Point, Sketch, Extrude, Revolve, Fillet, Chamfer, Boolean),
 * dependency resolution, validation, snapshots, and exports.
 *
 * Scientific boundary: Parametric computational model only.
 * No claims of physical reality, spontaneous information creation, or higher dimensions.
 */

import { CertaintyLevel } from '../../observation_reconstruction/p52/types';
import { WorkspaceReality } from '../p61/types';
import { ModelScene3D } from '../p65/types';
import { AdvancedGeometryScene, AdvancedGeometryObject, AdvancedMesh3D } from '../p66/types';

export type { AdvancedGeometryScene, AdvancedGeometryObject, AdvancedMesh3D };

export type ParameterType = 'LENGTH' | 'ANGLE' | 'RADIUS' | 'DIAMETER' | 'COUNT' | 'BOOLEAN' | 'ENUM';

export type FeatureType =
  | 'POINT'
  | 'SKETCH'
  | 'EXTRUDE'
  | 'REVOLVE'
  | 'FILLET'
  | 'CHAMFER'
  | 'BOOLEAN_UNION'
  | 'BOOLEAN_DIFFERENCE'
  | 'BOOLEAN_INTERSECTION';

export type FeatureState = 'ACTIVE' | 'SUPPRESSED' | 'INVALID';

export type ConstraintType =
  | 'HORIZONTAL'
  | 'VERTICAL'
  | 'COINCIDENT'
  | 'PARALLEL'
  | 'PERPENDICULAR'
  | 'EQUAL'
  | 'DISTANCE'
  | 'ANGLE'
  | 'RADIUS'
  | 'DIAMETER'
  | 'FIXED';

export type SketchConstraintStatus =
  | 'FULLY_CONSTRAINED'
  | 'PARTIALLY_CONSTRAINED'
  | 'UNDER_CONSTRAINED'
  | 'OVER_CONSTRAINED'
  | 'INVALID';

export interface GeometricParameter {
  readonly id: string;
  readonly name: string;
  readonly type: ParameterType;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly unit: string;
  readonly defaultValue: number;
  readonly sourceFeatureId: string;
}

export interface SketchEntity2D {
  readonly id: string;
  readonly type: 'POINT' | 'LINE' | 'POLYLINE' | 'ARC' | 'CIRCLE';
  readonly points: ReadonlyArray<readonly [number, number]>;
  readonly radius?: number;
}

export interface SketchConstraint {
  readonly id: string;
  readonly type: ConstraintType;
  readonly targetEntityIds: readonly string[];
  readonly value?: number;
}

export interface Sketch2D {
  readonly id: string;
  readonly plane: 'XY' | 'XZ' | 'YZ';
  readonly origin: readonly [number, number, number];
  readonly entities: readonly SketchEntity2D[];
  readonly constraints: readonly SketchConstraint[];
  readonly isClosedProfile: boolean;
  readonly status: SketchConstraintStatus;
  readonly checksum: string;
}

export interface ParametricFeature {
  readonly id: string;
  readonly name: string;
  readonly type: FeatureType;
  readonly state: FeatureState;
  readonly parameters: readonly GeometricParameter[];
  readonly inputReferences: readonly string[];
  readonly parentFeatureId: string | null;
  readonly dependencyIds: readonly string[];
  readonly outputGeometry: AdvancedGeometryObject | null;
  readonly certainty: CertaintyLevel;
  readonly creationIndex: number;
  readonly checksum: string;
}

export interface ParametricFeatureGraph {
  readonly graphId: string;
  readonly features: readonly ParametricFeature[];
  readonly rootFeatureIds: readonly string[];
  readonly executionOrder: readonly string[];
  readonly isCyclic: boolean;
  readonly checksum: string;
  readonly timestamp: number;
}

export interface FeatureValidationReport {
  readonly isValid: boolean;
  readonly status:
    | 'VALID'
    | 'CYCLIC_FEATURE_DEPENDENCY'
    | 'UNSUPPORTED_FILLET_CASE'
    | 'UNSUPPORTED_CHAMFER_CASE'
    | 'UNSUPPORTED_BOOLEAN_CASE'
    | 'INVALID_PARAMETER'
    | 'INVALID_TOPOLOGY';
  readonly issues: readonly string[];
  readonly reportChecksum: string;
}

export interface ParametricSnapshot3D {
  readonly snapshotId: string;
  readonly label: string;
  readonly reality: WorkspaceReality;
  readonly modelScene: ModelScene3D;
  readonly geometryScene: AdvancedGeometryScene;
  readonly featureGraph: ParametricFeatureGraph;
  readonly snapshotChecksum: string;
  readonly timestamp: number;
}
