/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Language Detector
 *
 * Multi-tier script and lexical language detector for English, Urdu,
 * Roman Urdu, Punjabi (Shahmukhi/Gurmukhi/Roman), Arabic, Hindi, Chinese, etc.
 */

import { LanguageCode, LanguageScript, LanguageDetectionReport } from './types';

// Distinctive Urdu-only characters in Perso-Arabic script
const URDU_DISTINCTIVE_CHARS = /[\u0679\u0688\u0691\u06BA\u06D2\u06C1\u06BE\u0698\u06AF\u0686\u067E]/;

// Shahmukhi Punjabi distinctive vocabulary
const SHAHMUKHI_PUNJABI_WORDS = /(^|[\s،۔؟,\.\?!])(توں|کیویں|سانوں|ہویا|ایتھے|کرنا|کردا|مینوں|تسی|دس|دسو|نوں|ہوئے|ہوندے|چنگا)($|[\s،۔؟,\.\?!])/;

// Arabic distinctive particles, words, and definite article prefix
const ARABIC_DISTINCTIVE_WORDS = /(^|[\s،۔؟,\.\?!])(في|من|على|إلى|هذا|هذه|هل|كيف|لماذا|ماذا|شكرا|مرحبا|أنا|نحن|هو|هي|الذي|التي|فرق|مكعب|كرة|الفضاء|فضاء|اليوم|أحتاج|مساعدة|افحص|الجذر|الرقمي|تحليل|المسار|توقع|احسب)($|[\s،۔؟,\.\?!])|(^|[\s،۔؟,\.\?!])ال[\u0621-\u064A]{2,}/;

// Roman Urdu distinctive words
const ROMAN_URDU_LEXICON = [
  'kya', 'hai', 'hain', 'mein', 'karein', 'karo', 'mujhe', 'madad', 'chahiye',
  'shukriya', 'kaise', 'batao', 'farq', 'aap', 'tum', 'hum', 'bhi', 'nahi',
  'ye', 'woh', 'kuch', 'bataiye', 'karen', 'wala', 'wali', 'karte', 'karna',
  'mere', 'liye', 'ek', 'banao', 'bana', 'sun', 'rahy', 'rahe', 'ho', 'kese',
  'theek', 'bolo', 'suno', 'batayein', 'bataen', 'kahan', 'kyun', 'kab', 'aur',
  'par', 'se', 'ko', 'ji', 'haan', 'salam', 'assalam', 'aoa', 'zaroor', 'acha', 'accha',
];

// Roman Punjabi distinctive words
const ROMAN_PUNJABI_LEXICON = [
  'mainu', 'tussi', 'tusi', 'saanu', 'assi', 'kivein', 'kiven', 'changa',
  'dasso', 'daso', 'hovega', 'hovayga', 'karna ae', 'karda', 'farak',
  'vaddi', 'chhoti', 'kithe', 'ethe', 'othe', 'pya', 'rehnda',
];

// English distinctive function words
const ENGLISH_LEXICON = [
  'the', 'between', 'and', 'explain', 'difference', 'what', 'how', 'why',
  'is', 'are', 'in', 'of', 'to', 'for', 'with', 'from', 'this', 'that',
  'hello', 'help', 'can', 'you', 'please', 'cube', 'sphere', 'space',
];

// Spanish distinctive words
const SPANISH_LEXICON = ['hola', 'gracias', 'como', 'estas', 'donde', 'por favor', 'cubo', 'esfera', 'ayuda', 'cual', 'entre'];

// French distinctive words
const FRENCH_LEXICON = ['bonjour', 'merci', 'comment', 'pourquoi', 'avec', 'est', 'dans', 'aide', 'quelle', 'entre'];

// German distinctive words
const GERMAN_LEXICON = ['hallo', 'danke', 'wie', 'warum', 'bitte', 'unterschied', 'wurfel', 'kugel', 'hilfe', 'zwischen'];

/**
 * Counts occurrences of vocabulary list in a text.
 */
function countLexiconMatches(text: string, lexicon: readonly string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of lexicon) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      count++;
    }
  }
  return count;
}

/**
 * Primary language detection function.
 */
export function detectLanguage(text: string): Readonly<LanguageDetectionReport> {
  const trimmed = text.trim();
  const tokenCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // ─── TIER 1: SCRIPT IDENTIFICATION ───────────────────────────────────────
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    // Perso-Arabic Script
    const isRTL = true;
    const script: LanguageScript = 'Arab';

    // Disambiguate between Urdu, Shahmukhi Punjabi, and Arabic
    if (SHAHMUKHI_PUNJABI_WORDS.test(trimmed)) {
      return Object.freeze({
        detectedLanguage: 'pa-shahmukhi',
        script,
        isRTL,
        confidence: 0.92,
        dialect: 'Shahmukhi Punjabi',
        tokenCount,
      });
    }

    if (URDU_DISTINCTIVE_CHARS.test(trimmed)) {
      return Object.freeze({
        detectedLanguage: 'ur',
        script,
        isRTL,
        confidence: 0.95,
        dialect: 'Standard Urdu (Nastaliq)',
        tokenCount,
      });
    }

    if (ARABIC_DISTINCTIVE_WORDS.test(trimmed)) {
      return Object.freeze({
        detectedLanguage: 'ar',
        script,
        isRTL,
        confidence: 0.94,
        dialect: 'Modern Standard Arabic',
        tokenCount,
      });
    }

    // Default Arabic-script fallback based on character frequency
    return Object.freeze({
      detectedLanguage: 'ur',
      script,
      isRTL,
      confidence: 0.82,
      tokenCount,
    });
  }

  if (/[\u0A00-\u0A7F]/.test(trimmed)) {
    // Gurmukhi Script -> Punjabi
    return Object.freeze({
      detectedLanguage: 'pa-gurmukhi',
      script: 'Guru' as LanguageScript,
      isRTL: false,
      confidence: 0.98,
      dialect: 'Gurmukhi Punjabi',
      tokenCount,
    });
  }

  if (/[\u0900-\u097F]/.test(trimmed)) {
    // Devanagari Script -> Hindi
    return Object.freeze({
      detectedLanguage: 'hi',
      script: 'Deva' as LanguageScript,
      isRTL: false,
      confidence: 0.96,
      dialect: 'Modern Standard Hindi',
      tokenCount,
    });
  }

  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    // Hanzi Script -> Chinese
    return Object.freeze({
      detectedLanguage: 'zh',
      script: 'Hans' as LanguageScript,
      isRTL: false,
      confidence: 0.98,
      dialect: 'Simplified Chinese',
      tokenCount,
    });
  }

  // ─── TIER 2: LATIN SCRIPT DISAMBIGUATION ──────────────────────────────────
  const script: LanguageScript = 'Latn';
  const isRTL = false;

  const romanPunjabiScore = countLexiconMatches(trimmed, ROMAN_PUNJABI_LEXICON);
  const romanUrduScore = countLexiconMatches(trimmed, ROMAN_URDU_LEXICON);
  const englishScore = countLexiconMatches(trimmed, ENGLISH_LEXICON);
  const spanishScore = countLexiconMatches(trimmed, SPANISH_LEXICON);
  const frenchScore = countLexiconMatches(trimmed, FRENCH_LEXICON);
  const germanScore = countLexiconMatches(trimmed, GERMAN_LEXICON);

  if (romanPunjabiScore >= 1 && romanPunjabiScore >= romanUrduScore && romanPunjabiScore >= englishScore) {
    return Object.freeze({
      detectedLanguage: 'pa-roman',
      script,
      isRTL,
      confidence: Math.min(0.95, 0.6 + romanPunjabiScore * 0.15),
      dialect: 'Roman Punjabi',
      tokenCount,
    });
  }

  if (romanUrduScore >= 1 && romanUrduScore >= englishScore) {
    return Object.freeze({
      detectedLanguage: 'ur-roman',
      script,
      isRTL,
      confidence: Math.min(0.95, 0.6 + romanUrduScore * 0.15),
      dialect: 'Roman Urdu',
      tokenCount,
    });
  }

  if (englishScore > 0 && englishScore >= spanishScore && englishScore >= frenchScore && englishScore >= germanScore) {
    return Object.freeze({
      detectedLanguage: 'en',
      script,
      isRTL,
      confidence: 0.94,
      dialect: 'English',
      tokenCount,
    });
  }

  if (spanishScore >= 2 || /[áéíóúñ¿¡]/.test(trimmed)) {
    return Object.freeze({
      detectedLanguage: 'es',
      script,
      isRTL,
      confidence: 0.88,
      dialect: 'Spanish',
      tokenCount,
    });
  }

  if (frenchScore >= 2 || /[éèêëàâîïôûùüç]/.test(trimmed)) {
    return Object.freeze({
      detectedLanguage: 'fr',
      script,
      isRTL,
      confidence: 0.88,
      dialect: 'French',
      tokenCount,
    });
  }

  if (germanScore >= 2 || /[äöüß]/.test(trimmed)) {
    return Object.freeze({
      detectedLanguage: 'de',
      script,
      isRTL,
      confidence: 0.88,
      dialect: 'German',
      tokenCount,
    });
  }

  // Default Latin -> English
  return Object.freeze({
    detectedLanguage: 'en',
    script,
    isRTL,
    confidence: 0.90,
    dialect: 'English',
    tokenCount,
  });
}
