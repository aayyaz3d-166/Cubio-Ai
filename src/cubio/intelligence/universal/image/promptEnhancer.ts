/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F49: Spatial Prompt Enhancer
 *
 * Expands user visual prompts with multi-dimensional spatial modifiers,
 * dimension attunements, lighting settings, camera perspectives, and negative prompts.
 */

import { CubiODimension } from '../../../types';
import { EnhancedImagePrompt, ImageStylePreset } from './types';

const STYLE_PROMPT_MODIFIERS: Record<ImageStylePreset, readonly string[]> = {
  HOLOGRAPHIC_CYBER: [
    'holographic cybernetic glow',
    'luminescent neon wireframes',
    'cyan and magenta volumetric laser grid',
    '8k ultra-detailed volumetric reality',
  ],
  VOID_TESSERACT: [
    'deep void cosmic space',
    '4D hypercube tesseract isometric projection',
    'ethereal crystalline refraction',
    'quantum field geometry',
  ],
  VOLUMETRIC_REALITY: [
    'photorealistic ray-traced lighting',
    'physically based rendering (PBR)',
    'subsurface scattering',
    'cinematic spatial composition',
  ],
  NEO_SACRED_GEOMETRY: [
    '369 harmonic vortex spiral',
    'golden ratio phi proportions',
    'sacred geometric mandalas',
    'divine proportion harmonics',
  ],
  MINIMAL_WIREFRAME: [
    'clean vector mathematical wireframe',
    'crisp orthogonal lines',
    'architectural blueprint aesthetic',
    'monochrome spatial geometry',
  ],
  PHOTO_REALISTIC: [
    'photorealistic depth of field',
    'studio lighting',
    'octane render 8k',
    'ultra-sharp focus',
  ],
  PRODUCT_STUDIO_LIGHTING: [
    'luxury product studio lighting',
    'reflective glossy dark backdrop',
    'rim light highlights',
    'commercial photography 8k',
  ],
  ARCHITECTURAL_BLUEPRINT: [
    'technical architectural blueprint',
    'isometric precision drafting',
    'clean vector lines',
    'schematic system layout',
  ],
};

const DEFAULT_NEGATIVE_PROMPT =
  'blurry, noisy, low resolution, distorted geometry, extra edges, low quality, artifacts, watermark, flat 2D perspective';

/**
 * Enhances a raw prompt into a structured EnhancedImagePrompt.
 */
export function enhanceImagePrompt(
  rawPrompt: string,
  stylePreset: ImageStylePreset = 'HOLOGRAPHIC_CYBER',
  targetDimension: CubiODimension = 'D3'
): Readonly<EnhancedImagePrompt> {
  const pLower = rawPrompt.toLowerCase();
  const modifiers = [...STYLE_PROMPT_MODIFIERS[stylePreset]];

  // Dimensional grounding
  if (targetDimension === 'D4') {
    modifiers.push('4D fourth-dimensional hyperspatial projection', 'tesseract hyper-lattice');
  } else if (targetDimension === 'D0' || targetDimension === 'D1') {
    modifiers.push('minimal zero-point discrete topology', 'quantum point emitter');
  } else if (targetDimension === 'D7') {
    modifiers.push('meta-system universal architecture', 'infinite recursive scale');
  }

  // Content-specific modifiers
  if (/369|vortex|harmonic/i.test(pLower)) {
    modifiers.push('vortex mathematics flow', '369 digital root resonance lines');
  }
  if (/cube|sphere|geometry/i.test(pLower)) {
    modifiers.push('perfect Euclidean symmetry', 'isometric mathematical perspective');
  }

  const enhancedPrompt = `${rawPrompt.trim()}, ${modifiers.join(', ')}`;
  const lightingSetting = stylePreset === 'VOID_TESSERACT' ? 'Deep cosmic ambient illumination with point light source' : 'Volumetric ray-traced cyber lighting';
  const cameraPerspective = targetDimension === 'D4' ? '4D isometric projection angle (theta = 45 deg, phi = 35.26 deg)' : 'Cinematic wide-angle 3D perspective';

  return Object.freeze({
    originalPrompt: rawPrompt,
    enhancedPrompt,
    stylePreset,
    spatialModifiers: Object.freeze(modifiers),
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    lightingSetting,
    cameraPerspective,
    targetDimension,
  });
}
