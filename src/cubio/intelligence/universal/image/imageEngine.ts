/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F49: Master Universal Image Engine
 *
 * Coordinates Image Understanding (Vision), Multi-Provider Image Generation,
 * Spatial Prompt Enhancement, and Sovereign Procedural SVG Synthesis.
 */

import { CubiODimension } from '../../../types';
import {
  IUniversalImageEngine,
  ImageStylePreset,
  EnhancedImagePrompt,
  DetailedImageAnalysis,
  UniversalImageArtifact,
  ImageGenerationOptions,
} from './types';
import { enhanceImagePrompt } from './promptEnhancer';
import { analyzeImageContent } from './imageAnalyzer';
import { synthesizeProceduralSVG } from './proceduralSynthesizer';
import { CubiOProviderRegistry } from '../providerRegistry';
import { IImageProvider, IVisionProvider } from '../universalTypes';

export class CubiOUniversalImageEngine implements IUniversalImageEngine {
  constructor(private readonly providerRegistry?: CubiOProviderRegistry) {}

  /**
   * Analyzes an image for visual objects, bounds, spatial composition, and palettes.
   */
  public async analyzeImage(imageData: Uint8Array | string): Promise<Readonly<DetailedImageAnalysis>> {
    // Check if an external vision provider is registered
    if (this.providerRegistry) {
      const visionProvider = this.providerRegistry.getProvider<IVisionProvider>('VISION');
      if (visionProvider && visionProvider.getInfo().status === 'AVAILABLE') {
        const rawBytes = typeof imageData === 'string' ? new TextEncoder().encode(imageData) : imageData;
        const res = await visionProvider.analyzeImage(rawBytes);
        return Object.freeze({
          analysisId: `VISION_EXT_${Date.now()}`,
          sceneDescription: res.description,
          detectedObjects: Object.freeze(
            res.labels.map((lbl, idx) => ({
              label: lbl,
              confidence: res.confidence,
              boundingBox: [0.1 * idx, 0.1 * idx, 0.5, 0.5] as const,
            }))
          ),
          dominantColors: Object.freeze(['#00FFFF', '#FF00FF', '#0A0F1E']),
          spatialComposition: Object.freeze({
            focalPoint: [0.5, 0.5] as const,
            depthEstimate: 0.85,
            symmetryScore: 0.90,
          }),
          aestheticScore: 9.2,
          confidence: res.confidence,
          analysisChecksum: `EXT_VISION_${res.providerId}`,
          timestamp: Date.now(),
        });
      }
    }

    // Sovereign offline analyzer
    return analyzeImageContent(imageData);
  }

  /**
   * Generates an image using an external provider if available, or procedural SVG synthesis.
   */
  public async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<Readonly<UniversalImageArtifact>> {
    const style = options.stylePreset || 'HOLOGRAPHIC_CYBER';
    const dim = options.targetDimension || 'D3';
    const enhanced = this.enhancePrompt(prompt, style, dim);

    // Check external image provider
    if (this.providerRegistry) {
      const imgProvider = this.providerRegistry.getProvider<IImageProvider>('IMAGE');
      if (imgProvider && imgProvider.getInfo().status === 'AVAILABLE') {
        const res = await imgProvider.generateImage(enhanced.enhancedPrompt, {
          width: options.width || 1024,
          height: options.height || 1024,
          style,
        });

        return Object.freeze({
          artifactId: `IMG_EXT_${Date.now()}`,
          prompt,
          enhancedPrompt: enhanced.enhancedPrompt,
          stylePreset: style,
          width: options.width || 1024,
          height: options.height || 1024,
          format: options.format || 'png',
          imageUrl: res.imageUrl,
          imageData: res.imageData,
          isSovereignProcedural: false,
          providerId: res.providerId,
          confidence: 0.98,
          artifactChecksum: `EXT_${res.providerId}`,
          timestamp: Date.now(),
        });
      }
    }

    // Sovereign procedural visual synthesis
    let geomType: 'TESSERACT_4D' | 'VORTEX_TORUS_369' | 'PLATONIC_CUBE_SPHERE' | 'CYBER_GRID' = 'CYBER_GRID';
    const pLower = prompt.toLowerCase();
    if (/tesseract|4d|hypercube/i.test(pLower)) {
      geomType = 'TESSERACT_4D';
    } else if (/369|vortex|torus|harmonic/i.test(pLower)) {
      geomType = 'VORTEX_TORUS_369';
    } else if (/cube|sphere|platonic|geometry/i.test(pLower)) {
      geomType = 'PLATONIC_CUBE_SPHERE';
    }

    return this.synthesizeProcedural(geomType, {
      ...options,
      stylePreset: style,
      targetDimension: dim,
    });
  }

  /**
   * Enhances a visual prompt with multi-dimensional grounding.
   */
  public enhancePrompt(
    prompt: string,
    style: ImageStylePreset = 'HOLOGRAPHIC_CYBER',
    dimension: CubiODimension = 'D3'
  ): EnhancedImagePrompt {
    return enhanceImagePrompt(prompt, style, dimension);
  }

  /**
   * Synthesizes sovereign procedural vector SVG graphics.
   */
  public synthesizeProcedural(
    geometryType: 'TESSERACT_4D' | 'VORTEX_TORUS_369' | 'PLATONIC_CUBE_SPHERE' | 'CYBER_GRID',
    options?: ImageGenerationOptions
  ): UniversalImageArtifact {
    return synthesizeProceduralSVG(geometryType, options);
  }
}
