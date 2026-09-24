/**
 * CUBiO AI — Phase 6: Task 86
 * Native Multilingual Intelligence Layer
 * src/cubio/language/native/multilingual/multilingualConceptRegistry.ts
 *
 * Decoupled Shared Concept & Multilingual Lexical Alignment Registry.
 * Decouples surface natural language representations from shared semantic
 * graph structures. Provides sovereign cross-lingual concept grounding,
 * bilingual lexical alignment, and strict unaligned-transfer rejection.
 */

import {
  SupportedLanguageCode,
  SharedConcept,
  ConceptLexicalRealization,
  MultilingualIntelligenceError,
  UnalignedSemanticTransferError,
} from './multilingualTypes';

export class MultilingualConceptRegistry {
  private static _instance: MultilingualConceptRegistry | null = null;
  private readonly _concepts = new Map<string, SharedConcept>();
  private readonly _termIndex = new Map<string, string>(); // lowercase term -> conceptId

  constructor() {
    this._initializeCanonicalConcepts();
  }

  public static getInstance(): MultilingualConceptRegistry {
    if (!MultilingualConceptRegistry._instance) {
      MultilingualConceptRegistry._instance = new MultilingualConceptRegistry();
    }
    return MultilingualConceptRegistry._instance;
  }

  /**
   * Registers a shared concept with its verified multilingual realizations.
   */
  public registerConcept(concept: SharedConcept): void {
    if (!concept || !concept.conceptId) {
      throw new MultilingualIntelligenceError('Cannot register concept without valid conceptId');
    }

    this._concepts.set(concept.conceptId, Object.freeze(concept));

    // Index all lexical realizations and surface variants
    for (const [langCode, realization] of Object.entries(concept.lexicalRealizations)) {
      const canonLower = realization.canonicalTerm.trim().toLowerCase();
      this._termIndex.set(`${langCode}:${canonLower}`, concept.conceptId);
      this._termIndex.set(`*:${canonLower}`, concept.conceptId);

      for (const v of realization.surfaceVariants) {
        const vLower = v.trim().toLowerCase();
        this._termIndex.set(`${langCode}:${vLower}`, concept.conceptId);
        this._termIndex.set(`*:${vLower}`, concept.conceptId);
      }
    }
  }

  /**
   * Retrieves a shared concept by its unique canonical ID.
   */
  public getConcept(conceptId: string): SharedConcept | null {
    return this._concepts.get(conceptId) ?? null;
  }

  /**
   * Searches for a matching shared concept from a natural language term or query phrase.
   */
  public findConceptByTerm(term: string, languageCode?: SupportedLanguageCode): SharedConcept | null {
    if (!term || typeof term !== 'string') return null;

    const clean = term.trim().toLowerCase();

    // 1. Language-specific lookup
    if (languageCode) {
      const specificKey = `${languageCode}:${clean}`;
      if (this._termIndex.has(specificKey)) {
        return this.getConcept(this._termIndex.get(specificKey)!);
      }
    }

    // 2. Universal lookup
    const universalKey = `*:${clean}`;
    if (this._termIndex.has(universalKey)) {
      return this.getConcept(this._termIndex.get(universalKey)!);
    }

    // 3. Substring containment search across registered terms
    for (const [key, conceptId] of this._termIndex.entries()) {
      const colonIdx = key.indexOf(':');
      const indexedTerm = key.slice(colonIdx + 1);
      const indexedLang = key.slice(0, colonIdx);

      if (languageCode && indexedLang !== '*' && indexedLang !== languageCode) {
        continue;
      }

      if (clean.includes(indexedTerm) || indexedTerm.includes(clean)) {
        return this.getConcept(conceptId);
      }
    }

    return null;
  }

  /**
   * Translates a concept from source language to target language using only grounded lexical mappings.
   * Throws UnalignedSemanticTransferError if no grounded alignment exists.
   */
  public transferConceptLexical(
    conceptId: string,
    targetLanguage: SupportedLanguageCode
  ): ConceptLexicalRealization {
    const concept = this.getConcept(conceptId);
    if (!concept) {
      throw new UnalignedSemanticTransferError(`Concept "${conceptId}" is not grounded in registry.`);
    }

    const realization = concept.lexicalRealizations[targetLanguage];
    if (!realization) {
      throw new UnalignedSemanticTransferError(
        `Concept "${conceptId}" has no verified lexical realization for language "${targetLanguage}". Translation without grounding is prohibited.`
      );
    }

    return realization;
  }

  /**
   * Returns all registered concept IDs.
   */
  public getAllConceptIds(): readonly string[] {
    return Object.freeze(Array.from(this._concepts.keys()));
  }

  // ===========================================================================
  // CANONICAL INITIALIZATION
  // ===========================================================================

  private _initializeCanonicalConcepts(): void {
    // 1. TOKAMAK FUSION DEVICE
    this.registerConcept({
      conceptId: 'concept_tokamak',
      canonicalName: 'tokamak',
      domain: 'PHYSICS_FUSION',
      spatialCellId: 42,
      defaultEpistemicStatus: 'CANONICAL_FACT',
      semanticAttributes: Object.freeze({
        confinement: 'magnetic',
        plasmaState: 'hot_plasma',
        stable: true,
      }),
      lexicalRealizations: Object.freeze({
        en: Object.freeze({
          languageCode: 'en',
          canonicalTerm: 'tokamak',
          surfaceVariants: Object.freeze(['tokamak', 'fusion reactor', 'magnetic confinement reactor']),
          declarativeTemplate: 'Tokamak is a magnetic plasma confinement fusion device.',
          interrogativeTemplate: 'Is Tokamak a magnetic confinement fusion device?',
        }),
        fr: Object.freeze({
          languageCode: 'fr',
          canonicalTerm: 'tokamak',
          surfaceVariants: Object.freeze(['tokamak', 'réacteur à fusion', 'confinement magnétique']),
          declarativeTemplate: 'Le Tokamak est un dispositif de confinement magnétique du plasma.',
          interrogativeTemplate: 'Le Tokamak est-il un dispositif de confinement magnétique?',
        }),
        de: Object.freeze({
          languageCode: 'de',
          canonicalTerm: 'tokamak',
          surfaceVariants: Object.freeze(['tokamak', 'fusionsreaktor', 'magnetischer einschluss']),
          declarativeTemplate: 'Der Tokamak ist ein Fusionsgerät mit magnetischem Plasmaeinschluss.',
          interrogativeTemplate: 'Ist der Tokamak ein magnetisches Einschlussgerät?',
        }),
        ur: Object.freeze({
          languageCode: 'ur',
          canonicalTerm: 'ٹوکماک',
          surfaceVariants: Object.freeze(['ٹوکماک', 'فیوژن ری ایکٹر', 'مقناطیسی قید']),
          declarativeTemplate: 'ٹوکماک ایک مقناطیسی پلازما قید کرنے والا فیوژن آلہ ہے۔',
          interrogativeTemplate: 'کیا ٹوکماک مقناطیسی پلازما قید کرنے والا آلہ ہے؟',
        }),
        ar: Object.freeze({
          languageCode: 'ar',
          canonicalTerm: 'توكاماك',
          surfaceVariants: Object.freeze(['توكاماك', 'مفاعل اندماج', 'حصر مغناطيسي']),
          declarativeTemplate: 'توكاماك هو جهاز حصر مغناطيسي للبلازما الاندماجية.',
          interrogativeTemplate: 'هل توكاماك جهاز حصر مغناطيسي؟',
        }),
        zh: Object.freeze({
          languageCode: 'zh',
          canonicalTerm: '托卡马克',
          surfaceVariants: Object.freeze(['托卡马克', '核聚变装置', '磁约束装置']),
          declarativeTemplate: '托卡马克是一种磁约束等离子体核聚变装置。',
          interrogativeTemplate: '托卡马克是磁约束装置吗？',
        }),
      }),
    });

    // 2. REACTOR CORE
    this.registerConcept({
      conceptId: 'concept_reactor_core',
      canonicalName: 'reactorcore',
      domain: 'ENERGY_FACILITY',
      spatialCellId: 105,
      defaultEpistemicStatus: 'CANONICAL_FACT',
      semanticAttributes: Object.freeze({
        state: 'stable',
        operational: true,
      }),
      lexicalRealizations: Object.freeze({
        en: Object.freeze({
          languageCode: 'en',
          canonicalTerm: 'reactorcore',
          surfaceVariants: Object.freeze(['reactor core', 'primary core', 'reactorcore']),
          declarativeTemplate: 'ReactorCore is stable and operational.',
          interrogativeTemplate: 'Is ReactorCore stable?',
        }),
        fr: Object.freeze({
          languageCode: 'fr',
          canonicalTerm: 'cœur du réacteur',
          surfaceVariants: Object.freeze(['cœur du réacteur', 'reactorcore', 'coeur']),
          declarativeTemplate: 'Le cœur du réacteur est stable et opérationnel.',
          interrogativeTemplate: 'Le cœur du réacteur est-il stable?',
        }),
        de: Object.freeze({
          languageCode: 'de',
          canonicalTerm: 'reaktorkern',
          surfaceVariants: Object.freeze(['reaktorkern', 'reactorcore', 'kern']),
          declarativeTemplate: 'Der Reaktorkern ist stabil und betriebsbereit.',
          interrogativeTemplate: 'Ist der Reaktorkern stabil?',
        }),
        ur: Object.freeze({
          languageCode: 'ur',
          canonicalTerm: 'ری ایکٹر کور',
          surfaceVariants: Object.freeze(['ری ایکٹر کور', 'مرکزی کور', 'ری ایکٹر']),
          declarativeTemplate: 'ری ایکٹر کور مستحکم اور فعال ہے۔',
          interrogativeTemplate: 'کیا ری ایکٹر کور مستحکم ہے؟',
        }),
        ar: Object.freeze({
          languageCode: 'ar',
          canonicalTerm: 'قلب المفاعل',
          surfaceVariants: Object.freeze(['قلب المفاعل', 'المفاعل']),
          declarativeTemplate: 'قلب المفاعل مستقر وجاهز للتشغيل.',
          interrogativeTemplate: 'هل قلب المفاعل مستقر؟',
        }),
        zh: Object.freeze({
          languageCode: 'zh',
          canonicalTerm: '反应堆堆芯',
          surfaceVariants: Object.freeze(['反应堆堆芯', '堆芯', '反应堆']),
          declarativeTemplate: '反应堆堆芯运行稳定且正常。',
          interrogativeTemplate: '反应堆堆芯稳定吗？',
        }),
      }),
    });

    // 3. SOLAR ARRAY
    this.registerConcept({
      conceptId: 'concept_solar_array',
      canonicalName: 'solar_array',
      domain: 'ENERGY_RENEWABLE',
      spatialCellId: 198,
      defaultEpistemicStatus: 'CANONICAL_FACT',
      semanticAttributes: Object.freeze({
        capacity: 120,
        unit: 'kilowatts',
        status: 'active',
      }),
      lexicalRealizations: Object.freeze({
        en: Object.freeze({
          languageCode: 'en',
          canonicalTerm: 'solar array',
          surfaceVariants: Object.freeze(['solar array', 'photovoltaic panels', 'solar generator']),
          declarativeTemplate: 'Solar array has a capacity of 120 kilowatts.',
          interrogativeTemplate: 'What is the capacity of the solar array?',
        }),
        fr: Object.freeze({
          languageCode: 'fr',
          canonicalTerm: 'panneaux solaires',
          surfaceVariants: Object.freeze(['panneaux solaires', 'champ solaire', 'générateur photovoltaïque']),
          declarativeTemplate: 'Le réseau de panneaux solaires a une capacité de 120 kilowatts.',
          interrogativeTemplate: 'Quelle est la capacité des panneaux solaires?',
        }),
        de: Object.freeze({
          languageCode: 'de',
          canonicalTerm: 'solaranlage',
          surfaceVariants: Object.freeze(['solaranlage', 'photovoltaikanlage']),
          declarativeTemplate: 'Die Solaranlage hat eine Leistung von 120 Kilowatt.',
          interrogativeTemplate: 'Wie hoch ist die Leistung der Solaranlage?',
        }),
        ur: Object.freeze({
          languageCode: 'ur',
          canonicalTerm: 'شمسی پینل',
          surfaceVariants: Object.freeze(['شمسی پینل', 'سولر اری']),
          declarativeTemplate: 'شمسی پینل کی پیداواری صلاحیت 120 کلو واٹ ہے۔',
          interrogativeTemplate: 'شمسی پینل کی صلاحیت کتنی ہے؟',
        }),
        ar: Object.freeze({
          languageCode: 'ar',
          canonicalTerm: 'المصفوفة الشمسية',
          surfaceVariants: Object.freeze(['المصفوفة الشمسية', 'الألواح الشمسية']),
          declarativeTemplate: 'تبلغ قدرة المصفوفة الشمسية 120 كيلووات.',
          interrogativeTemplate: 'ما هي قدرة المصفوفة الشمسية؟',
        }),
        zh: Object.freeze({
          languageCode: 'zh',
          canonicalTerm: '太阳能电池阵列',
          surfaceVariants: Object.freeze(['太阳能电池阵列', '太阳能阵列', '光伏阵列', '太阳能板']),
          declarativeTemplate: '太阳能电池阵列的装机容量为120千瓦。',
          interrogativeTemplate: '太阳能阵列的容量是多少？',
        }),
      }),
    });

    // 4. DARK MATTER (Hypothesis)
    this.registerConcept({
      conceptId: 'concept_dark_matter',
      canonicalName: 'dark_matter',
      domain: 'ASTROPHYSICS',
      defaultEpistemicStatus: 'SUPPORTED_HYPOTHESIS',
      semanticAttributes: Object.freeze({
        compositionHypothesis: 'sterile_neutrinos',
        proven: false,
      }),
      lexicalRealizations: Object.freeze({
        en: Object.freeze({
          languageCode: 'en',
          canonicalTerm: 'dark matter',
          surfaceVariants: Object.freeze(['dark matter']),
          declarativeTemplate: 'Dark matter might consist of sterile neutrinos.',
          interrogativeTemplate: 'Does dark matter consist of sterile neutrinos?',
        }),
        fr: Object.freeze({
          languageCode: 'fr',
          canonicalTerm: 'matière noire',
          surfaceVariants: Object.freeze(['matière noire']),
          declarativeTemplate: 'La matière noire pourrait être composée de neutrinos stériles.',
          interrogativeTemplate: 'La matière noire est-elle composée de neutrinos stériles?',
        }),
        de: Object.freeze({
          languageCode: 'de',
          canonicalTerm: 'dunkle materie',
          surfaceVariants: Object.freeze(['dunkle materie']),
          declarativeTemplate: 'Dunkle Materie könnte aus sterilen Neutrinos bestehen.',
          interrogativeTemplate: 'Besteht dunkle Materie aus sterilen Neutrinos?',
        }),
        ur: Object.freeze({
          languageCode: 'ur',
          canonicalTerm: 'تاریک مادہ',
          surfaceVariants: Object.freeze(['تاریک مادہ']),
          declarativeTemplate: 'تاریک مادہ سٹرائل نیوٹرینوز پر مشتمل ہو سکتا ہے۔',
          interrogativeTemplate: 'کیا تاریک مادہ سٹرائل نیوٹرینوز پر مشتمل ہے؟',
        }),
        ar: Object.freeze({
          languageCode: 'ar',
          canonicalTerm: 'المادة المظلمة',
          surfaceVariants: Object.freeze(['المادة المظلمة']),
          declarativeTemplate: 'قد تتكون المادة المظلمة من نيوترينوات عقيمة.',
          interrogativeTemplate: 'هل تتكون المادة المظلمة من نيوترينوات عقيمة؟',
        }),
        zh: Object.freeze({
          languageCode: 'zh',
          canonicalTerm: '暗物质',
          surfaceVariants: Object.freeze(['暗物质']),
          declarativeTemplate: '暗物质可能由惰性中微子组成。',
          interrogativeTemplate: '暗物质是由惰性中微子组成的吗？',
        }),
      }),
    });
  }
}
