/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Native Spatial Intelligence Types & Contracts
 *
 * Core contracts for Decoupled Native Spatial Intelligence:
 * User -> Universal Router -> SPATIAL_REASONING -> CubiO Spatial Engine
 */

import { CubiODimension } from '../../../types';
import { ProviderInfo, ProviderStatus } from '../universalTypes';

export type SpatialReasoningType =
  | 'COORDINATE_TRANSFORM'
  | '4D_TESSERACT_PROJECTION'
  | 'GEOMETRIC_TOPOLOGY'
  | 'VOXEL_SPATIAL_INDEX'
  | '369_HARMONIC_MATRIX'
  | 'DIMENSIONAL_STATE_SOLVE';

export type Vector3D = readonly [number, number, number];
export type Vector4D = readonly [number, number, number, number];
export type Quaternion = readonly [number, number, number, number]; // [x, y, z, w]
export type Matrix4x4 = readonly (readonly number[])[]; // 4x4 matrix

export interface SpatialReasoningRequest {
  readonly query: string;
  readonly reasoningType?: SpatialReasoningType;
  readonly targetDimension?: CubiODimension;
  readonly coordinates3D?: readonly Vector3D[];
  readonly coordinates4D?: readonly Vector4D[];
  readonly rotationAngles?: readonly [number, number, number]; // Euler [pitch, yaw, roll] in radians
  readonly quaternion?: Quaternion;
  readonly scale?: readonly [number, number, number];
  readonly translation?: Vector3D;
  readonly hypercubeAngleW?: number; // 4D rotation angle in radians
  readonly voxelResolution?: number;
}

export interface GeometricTopologyMetrics {
  readonly vertexCount: number;
  readonly edgeCount: number;
  readonly faceCount: number;
  readonly eulerCharacteristic: number; // V - E + F
  readonly isClosedManifold: boolean;
  readonly surfaceNormals: readonly Vector3D[];
}

export interface VoxelIndexMetrics {
  readonly totalVoxels: number;
  readonly boundingBoxMin: Vector3D;
  readonly boundingBoxMax: Vector3D;
  readonly voxelGridHash: string;
}

export interface Harmonic369SpatialMetrics {
  readonly rootHarmonic: 3 | 6 | 9;
  readonly solfeggioCarrierHz: number;
  readonly vortexFluxVector: Vector3D;
  readonly resonanceEnergy: number;
}

export interface SpatialReasoningResult {
  readonly reasoningType: SpatialReasoningType;
  readonly dimension: CubiODimension;
  readonly transformedPoints3D?: readonly Vector3D[];
  readonly projectedPoints3D?: readonly Vector3D[]; // from 4D
  readonly transformationMatrix?: Matrix4x4;
  readonly topologyMetrics?: GeometricTopologyMetrics;
  readonly voxelMetrics?: VoxelIndexMetrics;
  readonly harmonicMetrics?: Harmonic369SpatialMetrics;
  readonly explanation: string;
  readonly providerId: string;
  readonly spatialChecksum: string;
  readonly timestamp: number;
}

export interface ISpatialIntelligenceProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  solveSpatial(request: SpatialReasoningRequest): Promise<Readonly<SpatialReasoningResult>>;
}
