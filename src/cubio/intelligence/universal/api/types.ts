/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F69: Universal API Gateway Types & Contracts
 *
 * Single Production Gateway Route: POST /intelligence
 * Supporting 9 Modalities: Text, Image, Audio, Files, Code, Tools, Workflows, Projects, Agents.
 */

export interface UniversalApiImagePayload {
  readonly url?: string;
  readonly data?: Uint8Array;
  readonly width?: number;
  readonly height?: number;
  readonly mimeType?: string;
}

export interface UniversalApiAudioPayload {
  readonly text?: string;
  readonly data?: Uint8Array;
  readonly sampleRate?: number;
  readonly language?: string;
}

export interface UniversalApiFilePayload {
  readonly path: string;
  readonly content?: string;
  readonly mimeType?: string;
}

export interface UniversalApiCodePayload {
  readonly sourceCode: string;
  readonly language?: string;
  readonly targetFramework?: string;
}

export interface UniversalApiWorkflowPayload {
  readonly action: string;
  readonly template?: string;
  readonly autoAuthorize?: boolean;
}

export interface UniversalApiProjectPayload {
  readonly projectId?: string;
  readonly goal?: string;
  readonly targetDimension?: string;
}

export interface UniversalApiAgentPayload {
  readonly agentIds?: readonly string[];
  readonly mode?: string;
}

export interface UniversalApiRequest {
  readonly requestId?: string;
  readonly authHeader?: string;
  readonly tenantId?: string;
  readonly text?: string;
  readonly image?: UniversalApiImagePayload;
  readonly audio?: UniversalApiAudioPayload;
  readonly files?: readonly UniversalApiFilePayload[];
  readonly code?: UniversalApiCodePayload;
  readonly tools?: readonly string[];
  readonly workflows?: UniversalApiWorkflowPayload;
  readonly projects?: UniversalApiProjectPayload;
  readonly agents?: UniversalApiAgentPayload;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface UniversalArtifact {
  readonly name: string;
  readonly type: string;
  readonly uri?: string;
  readonly data?: unknown;
}

export interface UniversalApiResponse {
  readonly gatewayId: string;
  readonly endpoint: string;
  readonly method: string;
  readonly statusCode: number;
  readonly success: boolean;
  readonly modalitiesProcessed: readonly string[];
  readonly textResponse: string;
  readonly artifacts: readonly UniversalArtifact[];
  readonly spatialResult?: {
    readonly vertexCount: number;
    readonly faceCount: number;
    readonly isClosedManifold: boolean;
  };
  readonly workflowResult?: {
    readonly planId: string;
    readonly totalSteps: number;
    readonly stagingUrl: string;
  };
  readonly projectResult?: {
    readonly projectId: string;
    readonly healthScore: number;
    readonly progressPercent: number;
  };
  readonly validationResult: {
    readonly isValid: boolean;
    readonly validationScore: number;
    readonly auditSignature: string;
  };
  readonly executionTimeMs: number;
  readonly responseChecksum: string;
  readonly timestamp: number;
  readonly error?: string;
}

export interface IUniversalApiGateway {
  handleRequest(
    endpoint: string,
    method: string,
    request: UniversalApiRequest
  ): Promise<Readonly<UniversalApiResponse>>;
}
