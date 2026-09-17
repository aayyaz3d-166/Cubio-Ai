/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * native_vocabulary.ts
 *
 * Sovereign vocabulary builder and catalog for CUBIO-TOKENIZER-V1.
 * Contains ZERO external pretrained model tokens or files.
 * Pre-populates:
 * - Special control & epistemic tokens
 * - Full printable ASCII range
 * - Urdu Unicode script (Alef to Yeh, numbers, punctuation)
 * - Roman Urdu subwords & syllables
 * - Mathematical operators, physics constants & logic symbols
 * - 3D spatial coordinate & Address369 tokens
 * - Structured JSON syntax elements
 */

import { createHash } from 'crypto';
import {
  CUBIO_TOKENIZER_ID,
  CUBIO_VOCABULARY_ID,
} from './native_model_types';
import { ExternalModelGuard } from './external_model_guard';

export interface VocabularyCatalog {
  readonly vocabularyId: string;
  readonly tokenizerId: string;
  readonly size: number;
  readonly tokenToId: ReadonlyMap<string, number>;
  readonly idToToken: ReadonlyMap<number, string>;
  readonly vocabularyHash: string;
  readonly specialTokens: Readonly<Record<string, number>>;
}

export class NativeVocabularyBuilder {
  public static readonly SPECIAL_TOKENS = {
    PAD: '<PAD>',
    UNK: '<UNK>',
    BOS: '<BOS>',
    EOS: '<EOS>',
    SEP: '<SEP>',
    MASK: '<MASK>',
    EPISTEMIC_FACT: '<EPISTEMIC_FACT>',
    EPISTEMIC_DERIVATION: '<EPISTEMIC_DERIVATION>',
    EPISTEMIC_OBSERVATION: '<EPISTEMIC_OBSERVATION>',
    EPISTEMIC_HYPOTHESIS: '<EPISTEMIC_HYPOTHESIS>',
    EPISTEMIC_PREDICTION: '<EPISTEMIC_PREDICTION>',
    EPISTEMIC_ASSUMPTION: '<EPISTEMIC_ASSUMPTION>',
    EPISTEMIC_UNKNOWN: '<EPISTEMIC_UNKNOWN>',
    SPATIAL_ANCHOR: '<SPATIAL_ANCHOR>',
    SPATIAL_CELL: '<SPATIAL_CELL>',
    HARMONIC_369: '<HARMONIC_369>',
  } as const;

  public static buildVocabulary(): VocabularyCatalog {
    const tokenList: string[] = [];
    const addedTokens = new Set<string>();

    const addToken = (token: string) => {
      ExternalModelGuard.assertNativeOnly(token);
      if (!addedTokens.has(token)) {
        addedTokens.add(token);
        tokenList.push(token);
      }
    };

    // 1. Special Tokens
    const specialTokensMap: Record<string, number> = {};
    for (const [key, value] of Object.entries(this.SPECIAL_TOKENS)) {
      specialTokensMap[key] = tokenList.length;
      addToken(value);
    }

    // 2. Standard ASCII Characters (0x20 to 0x7E)
    for (let c = 32; c <= 126; c++) {
      addToken(String.fromCharCode(c));
    }
    addToken('\n');
    addToken('\t');
    addToken('\r');

    // 3. Mathematical & Logical Operators
    const mathSymbols = [
      '+', '-', '*', '/', '=', '≠', '≈', '<', '>', '≤', '≥', '±', '×', '÷',
      '^', '√', '∑', '∏', '∫', '∂', '∇', '∈', '∉', '⊂', '⊆', '∪', '∩', '∧', '∨', '¬',
      '⇒', '⇔', '∀', '∃', '∞', '∝', '∠', 'π', 'θ', 'λ', 'μ', 'σ', 'ω', 'Δ', 'Ω',
      'c²', 'E=mc²', 'mod', '%',
    ];
    for (const s of mathSymbols) addToken(s);

    // 4. Urdu Script Unicode Range (\u0600 - \u06FF)
    const urduChars = [
      'ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ',
      'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'ں', 'و',
      'ہ', 'ھ', 'ء', 'ی', 'ے', 'ئ', 'ؤ', 'ۃ', 'ۂ', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹',
      '؟', '۔', '،', '؛', '“', '”', '‘', '’',
    ];
    for (const u of urduChars) addToken(u);

    // 5. Common Urdu Words & Morphemes
    const urduWords = [
      'ہے', 'ہیں', 'تھا', 'تھی', 'تھے', 'کا', 'کی', 'کے', 'کو', 'سے', 'نے', 'پر', 'میں', 'تک',
      'اور', 'یا', 'اگر', 'مگر', 'لیکن', 'کیونکہ', 'پھر', 'کیا', 'کون', 'کہاں', 'کب', 'کیوں', 'کیسے',
      'یہ', 'وہ', 'ہم', 'آپ', 'تم', 'میرا', 'تیرا', 'اسکا', 'انکا', 'سب', 'کوئی', 'کچھ', 'بہت', 'زیادہ',
      'کم', 'ہاں', 'نہیں', 'درست', 'غلط', 'معلوم', 'نامعلوم', 'حقیقت', 'مفروضہ', 'پیشگوئی', 'مشاہدہ',
    ];
    for (const uw of urduWords) addToken(uw);

    // 6. Roman Urdu Tokens
    const romanUrdu = [
      'hai', 'hain', 'tha', 'thi', 'the', 'ka', 'ki', 'ke', 'ko', 'se', 'ne', 'par', 'mein', 'tak',
      'aur', 'ya', 'agar', 'magar', 'lekin', 'kyunke', 'phir', 'kya', 'kaun', 'kahan', 'kab', 'kyun', 'kaise',
      'yeh', 'woh', 'hum', 'aap', 'tum', 'mera', 'tera', 'iska', 'unka', 'sab', 'koi', 'kuch', 'bohot',
      'zyada', 'kam', 'haan', 'nahi', 'sahi', 'galat', 'maloom', 'namaloom', 'dada', 'shukriya', 'theek',
      'batao', 'samjhao', 'dekho', 'karo', 'karoonga', 'jayega', 'hoga', 'hogi', 'honge', 'socho',
    ];
    for (const ru of romanUrdu) addToken(ru);

    // 7. Structured JSON Tokens & Syntax
    const jsonTokens = [
      '{', '}', '[', ']', ':', ',', '"', 'true', 'false', 'null',
      '{"status":', '{"action":', '{"result":', '{"epistemic":', '{"address369":',
    ];
    for (const jt of jsonTokens) addToken(jt);

    // 8. CUBiO Primitives & Vocabulary
    const cubioTokens = [
      'CUBiO', 'Address369', '343-Cell', 'HCP', 'Lattice', 'Euler', 'Harmonic',
      'State-T', 'Costree', 'Trejetion', 'Rxiver', 'Epistemic', 'FACT', 'DERIVATION',
      'OBSERVATION', 'HYPOTHESIS', 'PREDICTION', 'ASSUMPTION', 'UNKNOWN',
      'SpatialMemory', 'CognitiveSpace', 'MerkleRoot', 'Sovereign', 'Genesis',
      'Checkpoint', 'Deterministic', 'Non-Fact', 'CellId', 'CoordX', 'CoordY', 'CoordZ',
    ];
    for (const ct of cubioTokens) addToken(ct);

    // 9. Common English Subwords & Words
    const englishWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with',
      'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
      'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
      'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
      'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
      'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
      'any', 'these', 'give', 'day', 'most', 'us', 'system', 'model', 'memory', 'state', 'process',
      'query', 'verify', 'spatial', 'dimension', 'coordinate', 'energy', 'mass', 'lattice', 'physics',
    ];
    for (const ew of englishWords) addToken(ew);

    // Maps
    const tokenToId = new Map<string, number>();
    const idToToken = new Map<number, string>();
    for (let i = 0; i < tokenList.length; i++) {
      tokenToId.set(tokenList[i], i);
      idToToken.set(i, tokenList[i]);
    }

    // SHA-256 Vocabulary Manifest Hash
    const vocabPayload = JSON.stringify(tokenList);
    const vocabularyHash = createHash('sha256').update(vocabPayload).digest('hex');

    return Object.freeze({
      vocabularyId: CUBIO_VOCABULARY_ID,
      tokenizerId: CUBIO_TOKENIZER_ID,
      size: tokenList.length,
      tokenToId,
      idToToken,
      vocabularyHash,
      specialTokens: Object.freeze(specialTokensMap),
    });
  }
}
