/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F69: Universal Response Formatter
 *
 * Formats standardized JSON responses with signed checksums.
 */

import { deterministicHash } from '../../../state/determinism';
import { UniversalApiResponse, UniversalArtifact } from './types';

export class UniversalResponseFormatter {
  public formatSuccessResponse(params: {
    endpoint: string;
    method: string;
    modalitiesProcessed: readonly string[];
    textResponse: string;
    artifacts?: readonly UniversalArtifact[];
    spatialResult?: { vertexCount: number; faceCount: number; isClosedManifold: boolean };
    workflowResult?: { planId: string; totalSteps: number; stagingUrl: string };
    projectResult?: { projectId: string; healthScore: number; progressPercent: number };
    validationResult?: { isValid: boolean; validationScore: number; auditSignature: string };
    executionTimeMs: number;
  }): Readonly<UniversalApiResponse> {
    const artifacts = Object.freeze(params.artifacts || []);
    const validationResult = params.validationResult || {
      isValid: true,
      validationScore: 1.0,
      auditSignature: deterministicHash(`AUDIT_GATEWAY:${params.endpoint}:${params.textResponse.length}`),
    };

    const responseChecksum = deterministicHash(
      `GATEWAY_RESP:${params.endpoint}:${params.method}:${params.modalitiesProcessed.join(',')}:${params.textResponse.slice(0, 100)}:${validationResult.auditSignature}`
    );
    const gatewayId = `GW_${responseChecksum.slice(2, 10)}`;

    return Object.freeze({
      gatewayId,
      endpoint: params.endpoint,
      method: params.method,
      statusCode: 200,
      success: true,
      modalitiesProcessed: Object.freeze([...params.modalitiesProcessed]),
      textResponse: params.textResponse,
      artifacts,
      spatialResult: params.spatialResult,
      workflowResult: params.workflowResult,
      projectResult: params.projectResult,
      validationResult,
      executionTimeMs: params.executionTimeMs,
      responseChecksum,
      timestamp: Date.now(),
    });
  }

  public formatErrorResponse(params: {
    endpoint: string;
    method: string;
    statusCode: number;
    error: string;
    executionTimeMs: number;
  }): Readonly<UniversalApiResponse> {
    const responseChecksum = deterministicHash(
      `GATEWAY_ERR:${params.endpoint}:${params.statusCode}:${params.error}`
    );
    const gatewayId = `GW_ERR_${responseChecksum.slice(2, 10)}`;

    return Object.freeze({
      gatewayId,
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      success: false,
      modalitiesProcessed: Object.freeze([]),
      textResponse: '',
      artifacts: Object.freeze([]),
      validationResult: {
        isValid: false,
        validationScore: 0.0,
        auditSignature: '0',
      },
      executionTimeMs: params.executionTimeMs,
      responseChecksum,
      timestamp: Date.now(),
      error: params.error,
    });
  }
}
