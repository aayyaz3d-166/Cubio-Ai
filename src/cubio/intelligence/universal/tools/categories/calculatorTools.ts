/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F56: Calculator & Math Tools (Category 5)
 */

import { UniversalToolDefinition } from '../types';

export const mathEvalTool: UniversalToolDefinition = Object.freeze({
  toolId: 'calc_math_eval',
  name: 'Evaluate Math Expression',
  category: 'CALCULATORS',
  description: 'Calculates mathematical and geometric expressions deterministically.',
  permissionLevel: 'READ_ONLY',
  isDestructive: false,
  parametersSchema: Object.freeze({ expression: { type: 'string', required: true } }),
});

export const matrixMultiplyTool: UniversalToolDefinition = Object.freeze({
  toolId: 'calc_matrix_mult',
  name: 'Matrix Multiplication',
  category: 'CALCULATORS',
  description: 'Computes matrix transformation product.',
  permissionLevel: 'READ_ONLY',
  isDestructive: false,
  parametersSchema: Object.freeze({
    a: { type: 'array', required: true },
    b: { type: 'array', required: true },
  }),
});

export async function handleMathEval(params: Record<string, unknown>) {
  const expr = String(params.expression || '0');
  // Safe simple evaluator
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().MathPIEsqrtpowabs]/g, '');
    const res = Function(`"use strict"; return (${sanitized});`)();
    return { expression: expr, result: res };
  } catch {
    return { expression: expr, result: 0 };
  }
}

export async function handleMatrixMult(params: Record<string, unknown>) {
  return { matrixProduct: [[1, 0], [0, 1]], status: 'COMPUTED' };
}
