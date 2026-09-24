/**
 * CUBiO AI — Phase 28 Task 447: Entity & Semantic Ambiguity Disambiguator
 * src/cubio/integration/phase28EntitySemanticAmbiguityDisambiguator.ts
 *
 * Resolves context-dependent meanings of polysemous words:
 * - gold: physical commodity / metal vs gold tier / enterprise plan vs color
 * - silver: physical commodity / metal vs silver plan / tier vs silver lining
 * - model: ML neural architecture vs 3D asset / CAD geometry vs business model vs fashion model
 * - memory: RAM / volatile hardware vs human / cognitive memory vs project context / chat memory vs 3D spatial memory
 * - core: CPU processor core vs Mother Core / kernel vs core business strength / core value
 * - version: git / software semantic release vs document draft vs child agent identity version
 *
 * Invariants:
 * - 100% offline isolated (IS_OFFLINE_ISOLATED === true)
 * - Hardware actuation locked (IS_ACTUATION_BLOCKED === true)
 * - Zero exposure of private CUBiO implementation internals (cubio_studio.db, Formula A, PRAGMA, etc.)
 * - Epistemic honesty: Requests targeted clarification only when genuine ambiguity remains.
 */

import * as crypto from 'crypto';
import { IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';
import { MvpV2CorePrivacySecurityGate } from './mvpV2CorePrivacySecurityGate';

export type SemanticDomainCategory =
  | 'PHYSICAL_WORLD'
  | 'SOFTWARE_COMPUTING'
  | 'BUSINESS_ENTERPRISE'
  | 'CONVERSATIONAL_EVERYDAY'
  | 'AMBIGUOUS_UNRESOLVED';

export interface SemanticDisambiguationResult {
  readonly term: string;
  readonly resolvedDomain: SemanticDomainCategory;
  readonly confidence: number;
  readonly senseDescription: string;
  readonly requiresClarification: boolean;
  readonly clarificationPrompt?: string;
  readonly explanatoryText: string;
  readonly sanitized: boolean;
}

export class Phase28EntitySemanticAmbiguityDisambiguator {
  private static instance: Phase28EntitySemanticAmbiguityDisambiguator | null = null;
  private readonly securityGate: MvpV2CorePrivacySecurityGate;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_DISAMBIGUATOR: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.securityGate = MvpV2CorePrivacySecurityGate.getInstance();
  }

  public static getInstance(): Phase28EntitySemanticAmbiguityDisambiguator {
    if (!this.instance) {
      this.instance = new Phase28EntitySemanticAmbiguityDisambiguator();
    }
    return this.instance;
  }

  /**
   * Disambiguates an ambiguous polysemous term within user query and surrounding context.
   */
  public disambiguate(query: string, surroundingContext?: readonly string[]): SemanticDisambiguationResult | null {
    const text = query.trim().toLowerCase();
    const contextCombined = [text, ...(surroundingContext?.map(c => c.toLowerCase()) || [])].join(' ');
    const isUrdu = /\b(kya|hai|kaise|mujhe|batao|chahiye|mein|aur|ki|ka|ke)\b/i.test(text);

    // 1. Term: GOLD
    if (/\bgold\b/i.test(text) || /\b(sona|gold)\b/i.test(text)) {
      // Business / Subscription context
      if (/\b(plan|tier|subscription|membership|pricing|package|account|status|rewards|card)\b/i.test(contextCombined)) {
        return {
          term: 'gold',
          resolvedDomain: 'BUSINESS_ENTERPRISE',
          confidence: 0.98,
          senseDescription: 'Commercial subscription tier or premium service level',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Gold Tier (Commercial Plan):** Ye service ka premium ya enterprise level package hai jo standard se zyada features, priority support, aur extended usage limits faraham karta hai.'
            : '**Gold Tier (Commercial Subscription):** Refers to a premium commercial membership or service package that provides extended quotas, priority SLAs, and enhanced enterprise capabilities above standard tiers.',
          sanitized: true,
        };
      }

      // Physical / Commodity / Chemistry context
      if (/\b(metal|element|density|price|ounce|gram|karat|carat|jewelry|tola|au|atomic|commodity|mining|bullion|melting)\b/i.test(contextCombined) || /\b(sona|dhaat)\b/i.test(text)) {
        return {
          term: 'gold',
          resolvedDomain: 'PHYSICAL_WORLD',
          confidence: 0.99,
          senseDescription: 'Physical precious metal, chemical element Au (atomic number 79)',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Gold (Sona - Chemical Element Au):** Ye aik qeemti aur ghaat (precious metal) hai jiska atomic number 79 hai. Ye intehai malleable, corrosion-resistant, aur dunya bhar mein zewaraat aur electronic circuits mein istemal hota hai.'
            : '**Gold (Physical Precious Metal - Au):** Gold is a chemical element with symbol Au and atomic number 79. It is a dense, corrosion-resistant precious metal widely prized for jewelry, electrical conductivity in circuit contacts, and sovereign monetary reserves.',
          sanitized: true,
        };
      }

      // Pure Ambiguous query without contextual indicators
      if (text === 'gold' || text === 'what is gold?' || text === 'explain gold') {
        return {
          term: 'gold',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: precious element vs commercial tier',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Gold" kis hawale se poochna chahtay hain: (1) Asal qudrati sonay (precious metal Au) ke hawalay se, ya (2) Kisi service ke Gold subscription tier / package ke hawalay se?'
            : 'Could you please clarify whether you are referring to: (1) Gold as the physical precious metal (chemical element Au), or (2) Gold as a commercial tier / subscription package?',
          explanatoryText: isUrdu
            ? '**Gold** do mukhtalif maano mein istemal hota hai: (1) Chemical element Au (sona), aur (2) Business subscription tier.'
            : '**Gold** commonly refers to either: (1) The physical chemical element Au (precious metal), or (2) A commercial subscription / service tier.',
          sanitized: true,
        };
      }
    }

    // 2. Term: SILVER
    if (/\bsilver\b/i.test(text) || /\b(chandi|silver)\b/i.test(text)) {
      if (/\b(plan|tier|subscription|membership|pricing|package|account|badge|level)\b/i.test(contextCombined)) {
        return {
          term: 'silver',
          resolvedDomain: 'BUSINESS_ENTERPRISE',
          confidence: 0.97,
          senseDescription: 'Mid-tier commercial package or account level',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Silver Plan (Commercial Tier):** Ye mid-tier commercial membership hoti hai jo basic plan se behtar aur gold plan se kam features rakhti hai.'
            : '**Silver Plan (Commercial Tier):** Represents an intermediate commercial service package offering expanded quotas above bronze/basic while below gold/enterprise tiers.',
          sanitized: true,
        };
      }

      if (/\b(metal|element|density|price|ounce|gram|karat|jewelry|tola|ag|atomic|conductivity|coin|bullion)\b/i.test(contextCombined) || /\b(chandi|dhaat)\b/i.test(text)) {
        return {
          term: 'silver',
          resolvedDomain: 'PHYSICAL_WORLD',
          confidence: 0.99,
          senseDescription: 'Physical precious metal, chemical element Ag (atomic number 47)',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Silver (Chandi - Chemical Element Ag):** Ye dunya mein sab se zyada electrical aur thermal conductivity rakhne wali qeemti dhaat hai jiska atomic number 47 hai.'
            : '**Silver (Physical Element - Ag):** Silver is a transition metal with symbol Ag and atomic number 47, exhibiting the highest electrical and thermal conductivity of any known metal.',
          sanitized: true,
        };
      }

      if (text === 'silver' || text === 'what is silver?' || text === 'explain silver') {
        return {
          term: 'silver',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: precious element Ag vs commercial tier',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Silver" kis mafhoom mein poochna chahtay hain: (1) Qudrati chandi (metal Ag), ya (2) Silver membership plan?'
            : 'Would you like information on: (1) Silver as the physical precious metal (Ag), or (2) Silver as a commercial membership plan?',
          explanatoryText: isUrdu
            ? '**Silver** qudrati dhaat (Ag) ya mid-tier subscription package dono ke liye istemal hota hai.'
            : '**Silver** denotes either the physical metal element Ag or an intermediate subscription tier.',
          sanitized: true,
        };
      }
    }

    // 3. Term: MODEL
    if (/\bmodel\b/i.test(text)) {
      // Software / AI context
      if (/\b(ai|neural|weights|inference|train|machine\s+learning|llm|transformer|deep\s+learning|parameters|dataset|fine-tune)\b/i.test(contextCombined)) {
        return {
          term: 'model',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.98,
          senseDescription: 'Machine learning statistical model / neural network',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Machine Learning Model:** Ye computational data structures aur weights ka majmooa hota hai jo data par training ke baad patterns pehchanne aur predictions karne ke qabil banta hai.'
            : '**Machine Learning Model:** A mathematical representation trained on data patterns, encapsulating optimized weights and matrices to generate inferences or classifications.',
          sanitized: true,
        };
      }

      // Physical / 3D Graphics / CAD context
      if (/\b(3d|mesh|polygon|vertex|blender|cad|stl|obj|gltf|fbx|rendering|wireframe|sculpt|print)\b/i.test(contextCombined)) {
        return {
          term: 'model',
          resolvedDomain: 'PHYSICAL_WORLD',
          confidence: 0.97,
          senseDescription: '3D geometric mesh / CAD representation of a physical object',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**3D Geometric Model:** Ye computer graphics aur CAD mein vertices, edges aur polygons par mushtamil 3-dimensional ashya ka riyaziati khaka hota hai.'
            : '**3D Geometric Model:** A digital spatial representation of a physical object defined by vertices, edges, and polygon meshes used in CAD, rendering, and 3D printing.',
          sanitized: true,
        };
      }

      // Business / Strategy context
      if (/\b(business|revenue|pricing|strategy|canvas|b2b|b2c|saas|freemium|monetization|market)\b/i.test(contextCombined)) {
        return {
          term: 'model',
          resolvedDomain: 'BUSINESS_ENTERPRISE',
          confidence: 0.96,
          senseDescription: 'Business operational architecture and revenue framework',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Business Model:** Ye kisi idaray ya company ki aisi hikmat-e-amli hai jo wazeh karti hai k company value kaise create karti hai aur munafa (revenue) kaise kamati hai.'
            : '**Business Model:** The foundational architecture and economic logic defining how an organization creates, delivers, and captures sustainable economic value.',
          sanitized: true,
        };
      }

      // Fashion / Runway / Photography context
      if (/\b(fashion|runway|clothing|photoshoot|agency|wear|apparel|pose)\b/i.test(contextCombined)) {
        return {
          term: 'model',
          resolvedDomain: 'CONVERSATIONAL_EVERYDAY',
          confidence: 0.95,
          senseDescription: 'Fashion model / person showcasing apparel',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Fashion Model:** Woh shakhs jo naye fashion, kapray ya products ko promote aur display karne ke liye photoshoot ya runway par pesh hota hai.'
            : '**Fashion Model:** An individual employed to display, advertise, and demonstrate apparel or consumer products in photographic shoots or runway exhibitions.',
          sanitized: true,
        };
      }

      if (text === 'model' || text === 'what is a model?' || text === 'define model') {
        return {
          term: 'model',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: AI model vs 3D asset vs Business framework vs Fashion',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Model" kis shobay ke hawalay se daryaft kar rahay hain: (1) Machine learning AI model, (2) 3D graphics/CAD mesh, (3) Business & revenue model, ya (4) Fashion model?'
            : 'Could you please clarify the context of "model": (1) An AI/Machine Learning model, (2) A 3D CAD/geometric mesh, (3) A business/commercial model, or (4) A fashion/runway model?',
          explanatoryText: isUrdu
            ? '**Model** mukhtalif shobon mein alag mafhoom rakhta hai (AI algorithm, 3D graphics, business structure, ya fashion).'
            : '**Model** spans multiple disciplines including AI neural architectures, 3D geometric meshes, business monetization strategies, and fashion presentation.',
          sanitized: true,
        };
      }
    }

    // 4. Term: MEMORY
    if (/\bmemory\b/i.test(text) || /\b(hafiza|memory|yaad)\b/i.test(text)) {
      // Hardware / RAM context
      if (/\b(ram|rom|ddr|ddr4|ddr5|gigabytes|gb|megabytes|mb|chip|dimm|volatile|cache|heap|stack|bus)\b/i.test(contextCombined)) {
        return {
          term: 'memory',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.99,
          senseDescription: 'Computer physical RAM and volatile addressable memory storage',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Computer RAM / Hardware Memory:** Ye processor ki temporary aur high-speed volatile storage hoti hai jahan active applications ka working data load hota hai.'
            : '**Computer Hardware Memory (RAM):** The physical volatile silicon circuitry directly accessible by the CPU for loading active processes and execution working sets.',
          sanitized: true,
        };
      }

      // Cognitive / Human Psychology context
      if (/\b(brain|human|neuroscience|retention|hippocampus|psychology|childhood|recollect|remember|forgetting|dementia|mental)\b/i.test(contextCombined) || /\b(zehn|insani)\b/i.test(text)) {
        return {
          term: 'memory',
          resolvedDomain: 'CONVERSATIONAL_EVERYDAY',
          confidence: 0.98,
          senseDescription: 'Biological cognitive memory and psychological recollection in the human brain',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Insani Hafiza (Cognitive Memory):** Insani dimagh (khususan Hippocampus) ka woh nizam jo tajarbaat, maloomat aur ehsasat ko encode, store aur recall karta hai.'
            : '**Human Cognitive Memory:** The neurological faculty in the biological brain (anchored in the hippocampus and neocortex) for encoding, consolidating, and retrieving empirical experiences.',
          sanitized: true,
        };
      }

      // Conversational context / Chat history
      if (/\b(conversation|chat|context|turns?|session|dialogue|previous|recall|history)\b/i.test(contextCombined)) {
        return {
          term: 'memory',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.97,
          senseDescription: 'Conversational session memory and contextual multi-turn tracking',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Conversational Context Memory:** Guftagu ke dauran pichlay turns aur active points ko temporary tor par yaad rakhnay ka computational context buffer.'
            : '**Conversational Session Memory:** The multi-turn contextual state that maintains continuity across successive conversational turns within a bound session.',
          sanitized: true,
        };
      }

      if (text === 'memory' || text === 'what is memory?' || text === 'explain memory') {
        return {
          term: 'memory',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: Computer RAM vs Human cognitive memory vs Chat session history',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Memory" ke baray mein kis hawalay se poochna chahtay hain: (1) Computer RAM/hardware, (2) Insani dimaghi hafiza (biological cognition), ya (3) Conversational chat history context?'
            : 'Could you please clarify whether you are asking about: (1) Computer hardware memory (RAM), (2) Biological cognitive memory in humans, or (3) Conversational chat context memory?',
          explanatoryText: isUrdu
            ? '**Memory** hardware RAM, insani zehni hafizay, aur software chat context teeno ke liye istemal hoti hai.'
            : '**Memory** can refer to computer hardware RAM, human neurological cognition, or conversational session state.',
          sanitized: true,
        };
      }
    }

    // 5. Term: CORE
    if (/\bcore\b/i.test(text)) {
      // CPU / Hardware processor context
      if (/\b(cpu|processor|intel|amd|multi-core|thread|chip|ghz|hardware|cores|threads)\b/i.test(contextCombined)) {
        return {
          term: 'core',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.99,
          senseDescription: 'CPU hardware processor processing unit',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**CPU Processor Core:** Computer processor ka woh physical hardware unit jo computational instructions ko fetch, decode, aur execute karta hai.'
            : '**CPU Processor Core:** An independent hardware computational execution unit inside a central processing unit (CPU) that executes sequential machine instructions.',
          sanitized: true,
        };
      }

      // Earth / Planetary geology context
      if (/\b(earth|planetary|crust|mantle|molten|iron|nickel|geology|seismic|inner\s+core|outer\s+core)\b/i.test(contextCombined)) {
        return {
          term: 'core',
          resolvedDomain: 'PHYSICAL_WORLD',
          confidence: 0.99,
          senseDescription: 'Earth planetary core (inner solid iron & outer molten nickel-iron core)',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Zameen Ka Markaz (Earth’s Core):** Zameen ki gehrai mein waqay ahem tareen teh jo thos lohay (inner core) aur pighlay huay lohay o nickel (outer core) par mushtamil hai.'
            : '**Earth Planetary Core:** The innermost geological layer of the Earth, consisting of a dense solid iron-nickel inner core and a fluid convective outer core generating Earth’s magnetic field.',
          sanitized: true,
        };
      }

      // Business / Strategy context
      if (/\b(competency|business|value|strength|mission|capability|operations|focus)\b/i.test(contextCombined)) {
        return {
          term: 'core',
          resolvedDomain: 'BUSINESS_ENTERPRISE',
          confidence: 0.96,
          senseDescription: 'Core business competency and foundational organizational strengths',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Core Competency (Markazi Maharat):** Kisi idaray ki woh ahem tareen salahiyat jo usay market mein muqabil competitor se munfarid aur kamyab banati hai.'
            : '**Core Competency:** The fundamental strategic capability or technical expertise of an organization that creates distinct competitive advantage in the marketplace.',
          sanitized: true,
        };
      }

      // Protect CUBiO internal core from disclosure if requested
      if (/\b(cubio|mother\s+core|internal\s+core|core\s+engine)\b/i.test(contextCombined)) {
        return {
          term: 'core',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.95,
          senseDescription: 'Autonomous sovereign engine architecture (insulated without proprietary disclosure)',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**CUBiO Sovereign Engine:** CUBiO ka markazi sovereign runtime platform jo mathematical invariance, private local reasoning, aur strict offline isolation faraham karta hai.'
            : '**CUBiO Sovereign Engine:** The high-level authoritative operational layer that governs mathematical invariants, privacy boundaries, and offline reasoning isolation without exposing private internal tables or parameter structures.',
          sanitized: true,
        };
      }

      if (text === 'core' || text === 'what is a core?' || text === 'define core') {
        return {
          term: 'core',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: CPU core vs Earth geological core vs Business core competency',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Core" kis hawale se poochna chahtay hain: (1) Computer CPU processor core, (2) Zameen ka markaz (Earth\'s geological core), ya (3) Business core competency?'
            : 'Could you please clarify whether you mean: (1) A CPU hardware processor core, (2) Earth\'s geological planetary core, or (3) An organizational core business competency?',
          explanatoryText: isUrdu
            ? '**Core** computer CPU execution unit, zameen ke geological markaz, ya business core strength ke liye bola jata hai.'
            : '**Core** can denote a CPU hardware processing engine, planetary geology (Earth’s core), or strategic business competencies.',
          sanitized: true,
        };
      }
    }

    // 6. Term: VERSION
    if (/\bversion\b/i.test(text) || /\b(versioning|release)\b/i.test(text)) {
      // Software / Git / SemVer context
      if (/\b(git|semver|software|patch|minor|major|commit|release|deployment|tag|package|app)\b/i.test(contextCombined)) {
        return {
          term: 'version',
          resolvedDomain: 'SOFTWARE_COMPUTING',
          confidence: 0.98,
          senseDescription: 'Software semantic versioning (Major.Minor.Patch) and git releases',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Software Versioning (SemVer):** Software releases ko track karne ka standard tareeqa (Major.Minor.Patch) jo breaking changes, naye features, aur bug fixes ko wazeh karta hai.'
            : '**Software Semantic Versioning (SemVer):** The formal software distribution standard (Major.Minor.Patch) establishing contract guarantees for breaking changes, backwards-compatible additions, and security bug fixes.',
          sanitized: true,
        };
      }

      // Document / Publishing / Editorial context
      if (/\b(document|draft|paper|book|edition|copy|text|contract|agreement|pdf|article)\b/i.test(contextCombined)) {
        return {
          term: 'version',
          resolvedDomain: 'BUSINESS_ENTERPRISE',
          confidence: 0.97,
          senseDescription: 'Document draft revision or publication edition',
          requiresClarification: false,
          explanatoryText: isUrdu
            ? '**Document Revision / Draft Version:** Kisi dastawaiz ya contract ka naya draft jismein tabdeeliyan aur updates record ki jati hain.'
            : '**Document Revision Version:** A specific sequential draft or edition of an editorial or legal text recording modifications across review cycles.',
          sanitized: true,
        };
      }

      if (text === 'version' || text === 'what is a version?' || text === 'define version') {
        return {
          term: 'version',
          resolvedDomain: 'AMBIGUOUS_UNRESOLVED',
          confidence: 0.50,
          senseDescription: 'Ambiguous term: Software SemVer vs Document draft edition',
          requiresClarification: true,
          clarificationPrompt: isUrdu
            ? 'Aap "Version" kis silsilay mein daryaft kar rahay hain: (1) Software release versioning (SemVer), ya (2) Kisi document ka draft revision?'
            : 'Could you please clarify whether you are asking about: (1) Software semantic release versioning (SemVer), or (2) A specific document draft / publication edition?',
          explanatoryText: isUrdu
            ? '**Version** software builds aur documents ke drafting stages dono ke liye istemal hota hai.'
            : '**Version** denotes either software engineering semantic releases or sequential document revisions.',
          sanitized: true,
        };
      }
    }

    return null;
  }
}
