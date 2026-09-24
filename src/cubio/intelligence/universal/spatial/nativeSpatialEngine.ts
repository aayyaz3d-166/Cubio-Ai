/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Master Native Spatial Intelligence Engine
 *
 * Placed behind the Universal Capability Router:
 * User -> Universal Router -> SPATIAL_REASONING -> CubiO Spatial Engine
 *
 * Frontend has zero direct knowledge of the internal spatial engine.
 */

import { deterministicHash } from '../../../state/determinism';
import { ProviderInfo, ProviderStatus } from '../universalTypes';
import {
  ISpatialIntelligenceProvider,
  SpatialReasoningRequest,
  SpatialReasoningResult,
  SpatialReasoningType,
} from './types';
import { CoordinateTransformSolver } from './solvers/coordinateTransformSolver';
import { HypercubeProjectionSolver } from './solvers/hypercubeProjectionSolver';
import { GeometricTopologySolver } from './solvers/geometricTopologySolver';
import { VoxelSpatialIndexSolver } from './solvers/voxelSpatialIndexSolver';
import { Harmonic369SpatialSolver } from './solvers/harmonic369SpatialSolver';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiONativeSpatialIntelligenceEngine implements ISpatialIntelligenceProvider {
  public readonly providerId = 'cubio-native-spatial-engine-v1';
  public readonly providerName = 'CubiO Native Spatial Intelligence Engine';

  private transformSolver = new CoordinateTransformSolver();
  private hypercubeSolver = new HypercubeProjectionSolver();
  private topologySolver = new GeometricTopologySolver();
  private voxelSolver = new VoxelSpatialIndexSolver();
  private harmonicSolver = new Harmonic369SpatialSolver();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    if (providerRegistry) {
      providerRegistry.registerProvider(this as any);
    }
  }

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'TOOL',
      name: this.providerName,
      version: '1.0.0-spatial',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'SPATIAL_REASONING',
        'GEOMETRIC_REASONING',
        'HARMONIC_369',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  /**
   * Solves spatial reasoning requests through native mathematical solvers.
   */
  public async solveSpatial(
    request: SpatialReasoningRequest
  ): Promise<Readonly<SpatialReasoningResult>> {
    const reasoningType = request.reasoningType || this.inferReasoningType(request.query);
    const dimension = request.targetDimension || 'D3';

    let transformedPoints3D = undefined;
    let projectedPoints3D = undefined;
    let transformationMatrix = undefined;
    let topologyMetrics = undefined;
    let voxelMetrics = undefined;
    let harmonicMetrics = undefined;
    let explanation = '';

    switch (reasoningType) {
      case '4D_TESSERACT_PROJECTION': {
        const res = this.hypercubeSolver.solveTesseract(request);
        projectedPoints3D = res.projectedVertices3D;
        explanation = `Computed 4D Hypercube (Tesseract) rotation in XW/ZW hyperplanes and stereographic 4D->3D perspective projection across 16 vertices.`;
        break;
      }

      case 'GEOMETRIC_TOPOLOGY': {
        topologyMetrics = this.topologySolver.solveTopology(request);
        explanation = `Evaluated polyhedra topology: Euler characteristic V - E + F = ${topologyMetrics.eulerCharacteristic} (Closed Manifold: ${topologyMetrics.isClosedManifold}).`;
        break;
      }

      case 'VOXEL_SPATIAL_INDEX': {
        voxelMetrics = this.voxelSolver.solveVoxelIndexing(request);
        explanation = `Generated 3D spatial voxel grid index containing ${voxelMetrics.totalVoxels} voxels with bounding box [${voxelMetrics.boundingBoxMin.join(',')}] to [${voxelMetrics.boundingBoxMax.join(',')}].`;
        break;
      }

      case '369_HARMONIC_MATRIX': {
        harmonicMetrics = this.harmonicSolver.solve369Harmonics(request);
        explanation = `Attuned 3-6-9 spatial nodal field to root harmonic ${harmonicMetrics.rootHarmonic} (${harmonicMetrics.solfeggioCarrierHz}Hz) with resonance energy ${harmonicMetrics.resonanceEnergy}.`;
        break;
      }

      case 'COORDINATE_TRANSFORM':
      case 'DIMENSIONAL_STATE_SOLVE':
      default: {
        const res = this.transformSolver.solveTransforms(request);
        transformedPoints3D = res.transformedPoints;
        transformationMatrix = res.matrix;
        explanation = `Applied 3D affine coordinate transformations with translation, quaternion/Euler rotation, and scale matrices.`;
        break;
      }
    }

    const spatialChecksum = deterministicHash(
      `SPATIAL:${reasoningType}:${dimension}:${JSON.stringify(transformedPoints3D || projectedPoints3D || topologyMetrics || voxelMetrics || harmonicMetrics)}`
    );

    return Object.freeze({
      reasoningType,
      dimension,
      transformedPoints3D,
      projectedPoints3D,
      transformationMatrix,
      topologyMetrics,
      voxelMetrics,
      harmonicMetrics,
      explanation,
      providerId: this.providerId,
      spatialChecksum,
      timestamp: Date.now(),
    });
  }

  private inferReasoningType(query: string): SpatialReasoningType {
    const q = query.toLowerCase();
    if (/tesseract|4d|hypercube|stereographic|projection/i.test(q)) return '4D_TESSERACT_PROJECTION';
    if (/topology|euler|manifold|surface|polyhedra|mesh/i.test(q)) return 'GEOMETRIC_TOPOLOGY';
    if (/voxel|octree|bounding|grid|partition/i.test(q)) return 'VOXEL_SPATIAL_INDEX';
    if (/369|harmonic|solfeggio|vortex|flux/i.test(q)) return '369_HARMONIC_MATRIX';
    if (/state|dimension|d0|d3|d8/i.test(q)) return 'DIMENSIONAL_STATE_SOLVE';
    return 'COORDINATE_TRANSFORM';
  }
}
