/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.7: Parameter System
 *
 * Implements typed, validated geometric parameters (LENGTH, ANGLE, RADIUS, DIAMETER, COUNT, BOOLEAN, ENUM).
 */

import { GeometricParameter, ParameterType } from './types';
import { generateDeterministicParamId } from './determinism';

export class ParameterSystem {
  public static validateParameterValue(val: unknown, min: number, max: number): boolean {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return false;
    return val >= min && val <= max;
  }

  public static createParameter(
    featureId: string,
    name: string,
    type: ParameterType,
    value: number,
    min = 0,
    max = 1000,
    unit = 'mm'
  ): GeometricParameter {
    if (!this.validateParameterValue(value, min, max)) {
      throw new Error(`Invalid parameter value for ${name}: ${value} (must be in range [${min}, ${max}] and finite).`);
    }

    return Object.freeze({
      id: generateDeterministicParamId(featureId, name),
      name,
      type,
      value: Number(value.toFixed(4)),
      min,
      max,
      unit,
      defaultValue: Number(value.toFixed(4)),
      sourceFeatureId: featureId,
    });
  }

  public static updateParameterValue(param: GeometricParameter, newValue: number): GeometricParameter {
    if (!this.validateParameterValue(newValue, param.min, param.max)) {
      throw new Error(
        `Cannot update parameter ${param.name} to ${newValue}: value must be in range [${param.min}, ${param.max}] and finite.`
      );
    }

    return Object.freeze({
      ...param,
      value: Number(newValue.toFixed(4)),
    });
  }
}
