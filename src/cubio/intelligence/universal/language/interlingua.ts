/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Interlingua Semantic Pivot Mapper
 *
 * Translates multi-lingual user requests (Urdu, Roman Urdu, Punjabi, Arabic, etc.)
 * into canonical language-neutral Interlingua Semantic Pivots for downstream engines.
 */

import { deterministicHash } from '../../../state/determinism';
import { LanguageCode, SemanticInterlinguaRepresentation } from './types';
import { detectLanguage } from './detector';
import { normalizeText, normalizeRomanUrduPunjabi } from './normalizer';

/**
 * Mapping rules from multilingual patterns to canonical English semantic pivots.
 */
interface InterlinguaRule {
  readonly pattern: RegExp;
  readonly canonicalPivot: string;
  readonly intent: string;
  readonly entities?: readonly string[];
}

const INTERLINGUA_RULES: readonly InterlinguaRule[] = Object.freeze([
  // ─── 1. GREETINGS ────────────────────────────────────────────────────────
  {
    pattern: /(سلام|اسلام علیکم|آداب|ہیلو|مرحبا|السلام عليكم|नमस्ते|sat sri akaal|sasrikal|kya haal|ki haal|kivein|salam|assalam|kaise ho|hola|bonjour|hallo)/i,
    canonicalPivot: 'hello',
    intent: 'GREETING',
    entities: ['GreetingGreeting'],
  },

  // ─── 2. HELP & CAPABILITIES ──────────────────────────────────────────────
  {
    pattern: /(مدد چاہیے|رہنمائی|کیا کر سکتے ہو|آپ کیا کر سکتے ہیں|أحتاج( إلى)? مساعدة|ماذا يمكنك|madad chahiye|help chahiye|kya kar sakte ho|features batao|guide chahiye|mainu madad|ki kar sakde|ayuda|besoin d'aide|brauche hilfe)/i,
    canonicalPivot: 'i need help',
    intent: 'HELP',
    entities: ['HelpGuidance'],
  },

  // ─── 3. PLATFORM QUERY ───────────────────────────────────────────────────
  {
    pattern: /(کیوبیو کیا ہے|ما هو كيوبيو|cubio kya hai|cubio ki hai|what is cubio|que es cubio|c'est quoi cubio|was ist cubio)/i,
    canonicalPivot: 'What is CubiO?',
    intent: 'PLATFORM_QUERY',
    entities: ['PlatformIdentity'],
  },

  // ─── 4. CONTEXT RECALL ───────────────────────────────────────────────────
  {
    pattern: /(میں نے ابھی کیا پوچھا|پچھلا سوال کیا تھا|ماذا سألتك|maine abhi kya poocha|mera pichla sawal kya tha|main hun ki puchhya|que pregunte|qu'ai-je demande)/i,
    canonicalPivot: 'what did I just ask you?',
    intent: 'CONTEXT_RECALL',
    entities: ['ContextRecall'],
  },

  // ─── 5. FOLLOW-UP ────────────────────────────────────────────────────────
  {
    pattern: /(ایسا کیوں ہوا|کیوں ہوا|تفصیل بتائیں|مزید بتائیں|لماذا حدث ذلك|اشرح اكثر|aisa kyu hua|kyun hua|aur batao|tafseel batao|edan kyon hoya|por que paso|pourquoi cela s'est produit)/i,
    canonicalPivot: 'why did that happen?',
    intent: 'FOLLOW_UP',
    entities: ['FollowUp'],
  },

  // ─── 6. CREATIVE TASK ────────────────────────────────────────────────────
  {
    pattern: /(نظم لکھیں|خلائی نظم|کہانی سنائیں|قصيدة عن الفضاء|اكتب قصة|space poem|space par poem|kahani sunao|kavita likho|escribe un poema|ecris un poeme)/i,
    canonicalPivot: 'write a short poem about space',
    intent: 'CREATIVE_TASK',
    entities: ['CreativeComposition'],
  },

  // ─── 7. GEOMETRIC COMPARISON (CUBE VS SPHERE) ────────────────────────────
  {
    pattern: /(مکعب اور (دائرے|کرہ|گیند) میں( کیا)? فرق|الفرق بين المكعب والكرة|cube (aur|te|and) sphere (mein|main|vich) (kya |ki )?(farq|farak)|cube vs sphere|diferencia entre cubo y esfera|difference entre cube et sphere)/i,
    canonicalPivot: 'Explain the difference between a cube and a sphere.',
    intent: 'GEOMETRIC_QUERY',
    entities: ['Cube', 'Sphere', 'GeometricComparison'],
  },

  // ─── 8. 369 VORTEX & HARMONIC CALCULATION ────────────────────────────────
  {
    pattern: /(369 ڈیجیٹل روٹ|369 ہارمونک|افحص الجذر الرقمي 369|369 digital root|369 harmonic|369 vortex|369 dekho|369 check)/i,
    canonicalPivot: 'inspect the 369 digital root',
    intent: 'CALCULATION',
    entities: ['Harmonic369', 'DigitalRoot', 'VortexMath'],
  },

  // ─── 9. TRAJECTORY PREDICTION ────────────────────────────────────────────
  {
    pattern: /(راستے کی پیشگوئی|پیشن گوئی|توقع المسار|trajectory predict|future state|peshangoi|agla state)/i,
    canonicalPivot: 'predict the trajectory',
    intent: 'PREDICTION',
    entities: ['TrajectoryForecast'],
  },

  // ─── 10. TOPOLOGY & SPATIAL REASONING ────────────────────────────────────
  {
    pattern: /(ٹوپولوجی کا تجزیہ|تحليل الطوبولوجيا|topology analyze|manifold analysis|topology da analysis)/i,
    canonicalPivot: 'analyze this topology',
    intent: 'SPATIAL_REASONING',
    entities: ['TopologyAnalysis', 'Manifold'],
  },
]);

/**
 * Maps any multilingual text query into a canonical SemanticInterlinguaRepresentation.
 */
export function toInterlingua(
  rawText: string,
  context?: Record<string, unknown>
): Readonly<SemanticInterlinguaRepresentation> {
  const detection = detectLanguage(rawText);
  const normalized = normalizeText(rawText, detection.detectedLanguage);

  let interlinguaPivot = rawText;
  let detectedIntent = 'GENERAL_CHAT';
  const extractedEntities: string[] = [];

  // Match against Interlingua Rules
  const searchCorpus = `${normalized.normalizedText} ${normalized.phoneticTokens ? normalized.phoneticTokens.join(' ') : ''}`;

  for (const rule of INTERLINGUA_RULES) {
    if (rule.pattern.test(searchCorpus) || rule.pattern.test(rawText)) {
      interlinguaPivot = rule.canonicalPivot;
      detectedIntent = rule.intent;
      if (rule.entities) {
        extractedEntities.push(...rule.entities);
      }
      break;
    }
  }

  // Extract spatial dimension markers if present
  let dimension = 'D3';
  if (/\b(d0|0d)\b/i.test(searchCorpus)) dimension = 'D0';
  else if (/\b(d1|1d)\b/i.test(searchCorpus)) dimension = 'D1';
  else if (/\b(d2|2d)\b/i.test(searchCorpus)) dimension = 'D2';
  else if (/\b(d4|4d|tesseract)\b/i.test(searchCorpus)) dimension = 'D4';
  else if (/\b(d5|5d)\b/i.test(searchCorpus)) dimension = 'D5';
  else if (/\b(d6|6d)\b/i.test(searchCorpus)) dimension = 'D6';
  else if (/\b(d7|7d)\b/i.test(searchCorpus)) dimension = 'D7';

  const interlinguaId = `INTL_${deterministicHash(rawText + interlinguaPivot).slice(2, 12)}`;

  return Object.freeze({
    interlinguaId,
    sourceLanguage: detection.detectedLanguage,
    sourceText: rawText,
    normalizedText: normalized.normalizedText,
    interlinguaPivot,
    detectedIntent,
    extractedEntities: Object.freeze([...new Set(extractedEntities)]),
    spatialGrounding: Object.freeze({
      dimension,
      geometricForm: extractedEntities.includes('Cube') ? 'Cube' : undefined,
      mathematicalContext: extractedEntities.includes('Harmonic369') ? '369_VORTEX' : undefined,
    }),
    confidence: detection.confidence,
    timestamp: Date.now(),
  });
}
