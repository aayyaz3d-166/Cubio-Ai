/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F50: LLM Image Generation Planner
 *
 * Translates natural-language user prompts into formal, highly optimized
 * ImageSpecifications tailored for downstream generation providers.
 */

import { deterministicHash } from '../../../../state/determinism';
import { CubiODimension } from '../../../../types';
import {
  ImageSpecification,
  ImageGenerationCapability,
  ImageStylePreset,
  ImageGenerationOptions,
} from '../types';

export class ImageGenerationPlanner {
  public planImageSpecification(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): ImageSpecification {
    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // 1. Infer Image Generation Capability
    let capability: ImageGenerationCapability = options.capabilityHint || 'CONCEPT_GENERATION';

    if (!options.capabilityHint) {
      if (options.sourceImageData) {
        capability = 'IMAGE_TO_IMAGE';
      } else if (/\b(concept|sketch|ideate|draft|idea)\b/i.test(lower)) {
        capability = 'CONCEPT_GENERATION';
      } else if (/\b(jewelry|ring|watch|product|device|hardware|bottle|mockup|ecommerce|e-commerce)\b/i.test(lower)) {
        capability = 'PRODUCT_VISUALIZATION';
      } else if (/\b(diagram|flowchart|architecture|uml|graph|schema|schematic|pipeline)\b/i.test(lower)) {
        capability = 'DIAGRAM_GENERATION';
      } else if (/\b(explore|variations|design options|alternatives|iterations)\b/i.test(lower)) {
        capability = 'DESIGN_EXPLORATION';
      } else if (/\b(art|wallpaper|creative|cyber|tesseract|cosmic|abstract)\b/i.test(lower)) {
        capability = 'CREATIVE_IMAGE';
      } else {
        capability = 'CONCEPT_GENERATION';
      }
    }

    // 2. Infer Style Preset
    let stylePreset: ImageStylePreset = options.stylePreset || 'VOLUMETRIC_REALITY';
    if (!options.stylePreset) {
      if (capability === 'PRODUCT_VISUALIZATION') stylePreset = 'PRODUCT_STUDIO_LIGHTING';
      else if (capability === 'DIAGRAM_GENERATION') stylePreset = 'ARCHITECTURAL_BLUEPRINT';
      else if (capability === 'CREATIVE_IMAGE') stylePreset = 'NEO_SACRED_GEOMETRY';
      else if (/cyber|neon|matrix|hologram/i.test(lower)) stylePreset = 'HOLOGRAPHIC_CYBER';
      else if (/wireframe|cad|minimal/i.test(lower)) stylePreset = 'MINIMAL_WIREFRAME';
      else if (/realistic|photo|render/i.test(lower)) stylePreset = 'PHOTO_REALISTIC';
      else stylePreset = 'VOID_TESSERACT';
    }

    const width = options.width || 1024;
    const height = options.height || 1024;
    const targetDimension: CubiODimension = options.targetDimension || 'D3';

    const specId = `SPEC_${deterministicHash(`${cleanPrompt}:${capability}:${stylePreset}`).slice(2, 10)}`;

    return Object.freeze({
      specId,
      capability,
      prompt: cleanPrompt,
      negativePrompt: 'blurry, low quality, artifacts, distorted geometry, noise',
      stylePreset,
      dimensions: { width, height },
      aspectRatio: width === height ? '1:1' : width > height ? '16:9' : '9:16',
      targetDimension,
      lightingSetting: 'Volumetric studio rim lighting with 528Hz harmonic glow',
      cameraView: 'Isometric 3D perspective with 45-degree elevation',
      colorPalette: Object.freeze(['#00F5D4', '#7B2CBF', '#0B090A', '#FFFFFF']),
      sourceImageData: options.sourceImageData,
      strength: options.sourceImageData ? 0.75 : undefined,
      seed: 369,
    });
  }
}
