/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F59: Master Universal Dimensional Engine
 *
 * Coordinates D0–D8 dimensional classification, state node creation,
 * bidirectional transformations (Lift / Project), 369 harmonic folding,
 * lossless reversible state cycles, and 7 Core Dimensional Use Cases.
 */

import {
  CubiODimensionalLevel,
  DimensionalStateNode,
  DimensionalTransformResult,
  DimensionalUseCase,
  IUniversalDimensionalEngine,
  ReversibleCycleResult,
} from './types';
import { classifyDataDimension } from './dimensionalClassifiers';
import {
  createDimensionalNode,
  executeReversibleCycle,
  fold369Harmonics,
  liftDimension,
  projectDimension,
} from './dimensionalTransformers';

export class CubiOUniversalDimensionalEngine implements IUniversalDimensionalEngine {
  /**
   * Classifies arbitrary data into its canonical dimensional level D0..D8.
   */
  public classifyDimension(data: unknown): CubiODimensionalLevel {
    return classifyDataDimension(data);
  }

  /**
   * Creates a formal DimensionalStateNode with level-specific coordinates and checksum.
   */
  public createDimensionalNode<T>(
    data: T,
    explicitLevel?: CubiODimensionalLevel
  ): Readonly<DimensionalStateNode<T>> {
    const level = explicitLevel || this.classifyDimension(data);
    return createDimensionalNode(data, level);
  }

  /**
   * Lifts a dimensional state node up the hierarchy (e.g. D0 -> D3 -> D8).
   */
  public liftDimension(
    node: DimensionalStateNode,
    targetLevel?: CubiODimensionalLevel
  ): Readonly<DimensionalTransformResult> {
    return liftDimension(node, targetLevel);
  }

  /**
   * Projects a dimensional state node down the hierarchy (e.g. D8 -> D3 -> D0).
   */
  public projectDimension(
    node: DimensionalStateNode,
    targetLevel?: CubiODimensionalLevel
  ): Readonly<DimensionalTransformResult> {
    return projectDimension(node, targetLevel);
  }

  /**
   * Folds a dimensional state node into 369 harmonic space (Ω369).
   */
  public fold369Harmonics(node: DimensionalStateNode): Readonly<DimensionalTransformResult> {
    return fold369Harmonics(node);
  }

  /**
   * Executes a full reversible state cycle (D0 -> ... -> D8 -> ... -> D0).
   */
  public executeReversibleCycle(startNode: DimensionalStateNode): Readonly<ReversibleCycleResult> {
    return executeReversibleCycle(startNode);
  }

  /**
   * Executes one of the 7 core dimensional use cases.
   */
  public executeUseCase(
    useCase: DimensionalUseCase,
    input: unknown
  ): Readonly<DimensionalTransformResult | ReversibleCycleResult> {
    switch (useCase) {
      case 'STATE_ABSTRACTION': {
        const node = this.createDimensionalNode(input, 'D0');
        return this.liftDimension(node, 'D5');
      }

      case 'INFORMATION_COMPRESSION': {
        const node = this.createDimensionalNode(input, 'D7');
        return this.projectDimension(node, 'D1');
      }

      case 'REASONING_STATES': {
        const node = this.createDimensionalNode(input, 'D5');
        return this.liftDimension(node, 'D6');
      }

      case 'SPATIAL_STATES': {
        const node = this.createDimensionalNode(input, 'D3');
        return this.liftDimension(node, 'D4');
      }

      case 'WORKFLOW_STATES': {
        const node = this.createDimensionalNode(input, 'D6');
        return this.liftDimension(node, 'D7');
      }

      case 'AGENT_STATES': {
        const node = this.createDimensionalNode(input, 'D6');
        return this.fold369Harmonics(node);
      }

      case 'MEMORY_REPRESENTATIONS': {
        const node = this.createDimensionalNode(input, 'D2');
        return this.executeReversibleCycle(node);
      }

      default: {
        const node = this.createDimensionalNode(input);
        return this.executeReversibleCycle(node);
      }
    }
  }
}
