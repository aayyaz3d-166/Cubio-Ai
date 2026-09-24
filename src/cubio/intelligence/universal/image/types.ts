/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: Image Intelligence & Generation Types
 *
 * Core contracts for Image Understanding, Vision Scene Parsing,
 * Multi-Provider Generation Orchestration, and Sovereign Procedural SVG Synthesis.
 *
 * Covers 6 generation capabilities:
 * 1. Concept Generation
 * 2. Product Visualization
 * 3. Diagram Generation
 * 4. Creative Images
 * 5. Design Exploration
 * 6. Image-to-Image Workflows
 *
 * Architecture:
 * Prompt -> LLM Planning -> Image Specification -> Image Provider -> Generated Asset -> Project Intelligence
 */

import { CubiODimension } from '../../../types';
import { ProviderInfo, ProviderStatus } from '../universalTypes';

export type ImageTaskMode =
  | 'UNDERSTANDING'
  | 'GENERATION'
  | 'EDITING'
  | 'PROCEDURAL_SYNTHESIS';

export type ImageStylePreset =
  | 'HOLOGRAPHIC_CYBER'
  | 'VOID_TESSERACT'
  | 'VOLUMETRIC_REALITY'
  | 'NEO_SACRED_GEOMETRY'
  | 'MINIMAL_WIREFRAME'
  | 'PHOTO_REALISTIC'
  | 'PRODUCT_STUDIO_LIGHTING'
  | 'ARCHITECTURAL_BLUEPRINT';

export type ImageGenerationCapability =
  | 'CONCEPT_GENERATION'
  | 'PRODUCT_VISUALIZATION'
  | 'DIAGRAM_GENERATION'
  | 'CREATIVE_IMAGE'
  | 'DESIGN_EXPLORATION'
  | 'IMAGE_TO_IMAGE';

export interface EnhancedImagePrompt {
  readonly originalPrompt: string;
  readonly enhancedPrompt: string;
  readonly stylePreset: ImageStylePreset;
  readonly spatialModifiers: readonly string[];
  readonly negativePrompt: string;
  readonly lightingSetting: string;
  readonly cameraPerspective: string;
  readonly targetDimension: CubiODimension;
}

export interface ImageSpecification {
  readonly specId: string;
  readonly capability: ImageGenerationCapability;
  readonly prompt: string;
  readonly negativePrompt?: string;
  readonly stylePreset: ImageStylePreset;
  readonly dimensions: { readonly width: number; readonly height: number };
  readonly aspectRatio: '1:1' | '16:9' | '4:3' | '9:16';
  readonly targetDimension: CubiODimension;
  readonly lightingSetting: string;
  readonly cameraView: string;
  readonly colorPalette: readonly string[];
  readonly sourceImageData?: Uint8Array; // For image-to-image workflows
  readonly strength?: number; // 0.0 to 1.0 for img2img transformation
  readonly seed?: number;
}

export interface VisualObjectDetection {
  readonly label: string;
  readonly confidence: number;
  readonly boundingBox: readonly [number, number, number, number]; // [x, y, width, height] in normalized 0..1
  readonly spatialCoordinates?: readonly [number, number, number];
  readonly geometryType?: string;
}

export interface DetailedImageAnalysis {
  readonly analysisId: string;
  readonly sceneDescription: string;
  readonly detectedObjects: readonly VisualObjectDetection[];
  readonly dominantColors: readonly string[];
  readonly textExtracted?: readonly string[];
  readonly spatialComposition: {
    readonly focalPoint: readonly [number, number];
    readonly depthEstimate: number; // 0.0 .. 1.0
    readonly symmetryScore: number; // 0.0 .. 1.0
    readonly primaryGeometricForm?: string;
  };
  readonly aestheticScore: number; // 0.0 .. 10.0
  readonly confidence: number; // 0.0 .. 1.0
  readonly analysisChecksum: string;
  readonly timestamp: number;
}

export interface UniversalImageArtifact {
  readonly artifactId: string;
  readonly prompt: string;
  readonly enhancedPrompt?: string;
  readonly stylePreset: ImageStylePreset;
  readonly width: number;
  readonly height: number;
  readonly format: 'svg' | 'png' | 'webp' | 'jpg';
  readonly svgMarkup?: string;
  readonly imageUrl?: string;
  readonly imageData?: Uint8Array;
  readonly isSovereignProcedural: boolean;
  readonly providerId: string;
  readonly confidence: number;
  readonly artifactChecksum: string;
  readonly timestamp: number;
}

export interface ImageGenerationOptions {
  readonly width?: number;
  readonly height?: number;
  readonly stylePreset?: ImageStylePreset;
  readonly targetDimension?: CubiODimension;
  readonly format?: 'svg' | 'png' | 'webp';
  readonly preferredProviderId?: string;
  readonly sourceImageData?: Uint8Array;
  readonly capabilityHint?: ImageGenerationCapability;
  readonly projectId?: string;
}

// ─── PLUGGABLE IMAGE GENERATION PROVIDER CONTRACT ──────────────────────────

export interface IImageGenerationProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  generateFromSpec(spec: ImageSpecification): Promise<Readonly<UniversalImageArtifact>>;
}

// ─── PIPELINE RESULT CONTRACT ──────────────────────────────────────────────

export interface ImagePipelineResult {
  readonly pipelineId: string;
  readonly specification: ImageSpecification;
  readonly generatedAsset: UniversalImageArtifact;
  readonly projectAssetRecord?: {
    readonly projectId: string;
    readonly assetUri: string;
    readonly registeredInManifest: boolean;
  };
  readonly executionTimeMs: number;
  readonly success: boolean;
  readonly pipelineChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalImageEngine {
  analyzeImage(imageData: Uint8Array | string): Promise<DetailedImageAnalysis>;
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<UniversalImageArtifact>;
  enhancePrompt(prompt: string, style?: ImageStylePreset, dimension?: CubiODimension): EnhancedImagePrompt;
  synthesizeProcedural(
    geometryType: 'TESSERACT_4D' | 'VORTEX_TORUS_369' | 'PLATONIC_CUBE_SPHERE' | 'CYBER_GRID',
    options?: ImageGenerationOptions
  ): UniversalImageArtifact;
}
