/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F74: Universal Multimodal Certification Types & Contracts
 *
 * Covers all 5 Input Modalities: TEXT, IMAGE, VOICE, FILE, CODE
 * and 7 Verification Pillars: Vision, 3D Image Gen, STT, TTS, Context, Cross-Modal, Error Handling.
 */

export interface UniversalMultimodalInputPayload {
  readonly text?: string;
  readonly image?: {
    readonly url?: string;
    readonly data?: Uint8Array;
    readonly width?: number;
    readonly height?: number;
  };
  readonly voice?: {
    readonly audioText?: string;
    readonly audioData?: Uint8Array;
    readonly sampleRate?: number;
  };
  readonly file?: {
    readonly path: string;
    readonly content?: string;
  };
  readonly code?: {
    readonly sourceCode: string;
    readonly language?: string;
  };
}

export interface VisionPerceptionResult {
  readonly detectedObjects: readonly string[];
  readonly sceneClassification: string;
  readonly dominantColors: readonly string[];
  readonly isClear: boolean;
}

export interface SpeechVerificationResult {
  readonly transcript: string;
  readonly audioBufferGenerated: boolean;
  readonly sampleRate: number;
  readonly emotionalTone: string;
  readonly confidence: number;
}

export interface CrossModalUnifiedResult {
  readonly inputText: string;
  readonly visionSummary: string;
  readonly sttTranscript: string;
  readonly synthesizedCode: string;
  readonly mesh3D: {
    readonly vertexCount: number;
    readonly faceCount: number;
    readonly isClosedManifold: boolean;
  };
  readonly workflowPlanId: string;
  readonly stagingUrl: string;
  readonly executionTimeMs: number;
  readonly checksum: string;
}

export interface IMultimodalCertificationEngine {
  verifyVisionPerception(image: { url?: string; data?: Uint8Array }): Promise<VisionPerceptionResult>;
  verifySpeechSTTandTTS(voice: { audioText?: string; audioData?: Uint8Array }): Promise<SpeechVerificationResult>;
  executeCrossModalDirective(input: UniversalMultimodalInputPayload): Promise<Readonly<CrossModalUnifiedResult>>;
}
