/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F47: Universal Script Normalizer
 *
 * Unicode NFKC normalization, Urdu/Arabic/Shahmukhi letter harmonization,
 * Aerab/Diacritic stripping, digit normalization, and Romanized phonetic standardization.
 */

import { LanguageCode, LanguageScript, NormalizedText } from './types';

// Arabic / Urdu / Shahmukhi Diacritics Regex
const ARABIC_URDU_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A\u08F0-\u08F2]/g;

// Eastern Arabic-Indic and Arabic-Indic Digits to ASCII Map
const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4', '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
};

/**
 * Harmonizes various Arabic, Urdu, and Persian character variants into canonical representations.
 */
export function harmonizePersoArabic(text: string): string {
  return text
    // Normalize Alef variants
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ, أ, إ, ٱ -> ا
    // Normalize Yeh variants
    .replace(/[\u0649\u064A\u06D0\u06D1]/g, '\u06CC') // ى, ي, ے -> ی
    // Normalize Kaf variants
    .replace(/\u0643/g, '\u06A9') // ك -> ک
    // Normalize Heh variants
    .replace(/[\u0629\u06C1\u06C2\u06D5]/g, '\u0647') // ة, ہ, ۂ -> ه
    // Normalize Waw variants
    .replace(/[\u0624\u0676\u06CF]/g, '\u0648') // ؤ -> و
    // Normalize punctuation
    .replace(/\u061F/g, '?') // ؟ -> ?
    .replace(/\u060C/g, ',') // ، -> ,
    .replace(/\u061B/g, ';') // ؛ -> ;
    .replace(/\u06D4/g, '.'); // ۔ -> .
}

/**
 * Converts non-Latin digits (Arabic-Indic, Eastern Arabic, Devanagari, Gurmukhi) to standard 0-9.
 */
export function standardizeDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹०-९੦-੯]/g, (ch) => DIGIT_MAP[ch] || ch);
}

/**
 * Strips all vowel marks, aerabs, tashkeel, and diacritics.
 */
export function stripDiacritics(text: string): string {
  return text.replace(ARABIC_URDU_DIACRITICS, '');
}

/**
 * Phonetically normalizes Roman Urdu and Roman Punjabi strings.
 */
export function normalizeRomanUrduPunjabi(text: string): string {
  let s = text.toLowerCase();

  // Standardize common phonetic spellings
  s = s
    // Vowel normalization
    .replace(/\baa+\b/g, 'a')
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ou/g, 'u')
    // Common word contractions and variants
    .replace(/\bkya\b|\bkia\b|\bkea\b/g, 'kya')
    .replace(/\bhai\b|\bhy\b|\bhe\b|\bh\b/g, 'hai')
    .replace(/\bhain\b|\bhyn\b|\bhn\b/g, 'hain')
    .replace(/\bmain\b|\bmei\b|\bme\b/g, 'mein')
    .replace(/\bkarein\b|\bkare\b|\bkaro\b/g, 'karo')
    .replace(/\bmujhe\b|\bmujy\b|\bmuje\b/g, 'mujhe')
    .replace(/\bmadad\b|\bhelp\b/g, 'madad')
    .replace(/\bchahiye\b|\bchahye\b|\bchaye\b/g, 'chahiye')
    .replace(/\bshukriya\b|\bshukria\b|\bthx\b/g, 'shukriya')
    .replace(/\bkaise\b|\bkese\b|\bkaisay\b/g, 'kaise')
    .replace(/\bbatao\b|\bbatain\b|\bbatayen\b/g, 'batao')
    .replace(/\bfarq\b|\bfarak\b|\bdifference\b/g, 'farq')
    // Punjabi words
    .replace(/\bmainu\b|\bmenu\b/g, 'mainu')
    .replace(/\btussi\b|\btusi\b/g, 'tussi')
    .replace(/\bsaanu\b|\bsanu\b/g, 'saanu')
    .replace(/\bkivein\b|\bkiven\b/g, 'kivein')
    .replace(/\bchanga\b|\bchngaa\b/g, 'changa')
    .replace(/\bdasso\b|\bdaso\b/g, 'dasso')
    .replace(/\bhovega\b|\bhovayga\b/g, 'hovega');

  return s;
}

/**
 * Master normalization function producing a NormalizedText envelope.
 */
export function normalizeText(
  rawText: string,
  declaredLanguage: LanguageCode = 'en'
): Readonly<NormalizedText> {
  // Step 1: Unicode NFKC Normalization
  const nfkc = rawText.normalize('NFKC');

  // Step 2: Standardize Digits
  const standardizedDigits = standardizeDigits(nfkc);

  // Step 3: Strip Diacritics
  const strippedDiacritics = stripDiacritics(standardizedDigits);

  // Step 4: Harmonize Perso-Arabic if applicable
  let normalizedText = harmonizePersoArabic(strippedDiacritics);

  // Step 5: Detect script
  let script: LanguageScript = 'Latn';
  if (/[\u0600-\u06FF]/.test(rawText)) {
    script = 'Arab';
  } else if (/[\u0900-\u097F]/.test(rawText)) {
    script = 'Deva';
  } else if (/[\u0A00-\u0A7F]/.test(rawText)) {
    script = 'Guru';
  } else if (/[\u4E00-\u9FFF]/.test(rawText)) {
    script = 'Hans';
  } else if (/[\u0400-\u04FF]/.test(rawText)) {
    script = 'Cyrl';
  }

  // Step 6: Extract tokens
  const cleanForTokens = normalizedText
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = cleanForTokens ? Object.freeze(cleanForTokens.split(' ')) : Object.freeze([]);

  // Step 7: Phonetic tokens for Latin script
  let phoneticTokens: readonly string[] | undefined;
  if (script === 'Latn') {
    const phoneticNorm = normalizeRomanUrduPunjabi(normalizedText);
    const pTokens = phoneticNorm
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    phoneticTokens = pTokens ? Object.freeze(pTokens.split(' ')) : Object.freeze([]);
  }

  return Object.freeze({
    rawText,
    normalizedText: normalizedText.trim(),
    strippedDiacritics: strippedDiacritics.trim(),
    standardizedDigits: standardizedDigits.trim(),
    script,
    language: declaredLanguage,
    tokens,
    phoneticTokens,
  });
}
