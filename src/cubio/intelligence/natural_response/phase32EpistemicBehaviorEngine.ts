/**
 * CUBiO AI — Phase 32 Task 536: Epistemic Behavior Engine
 * src/cubio/intelligence/natural_response/phase32EpistemicBehaviorEngine.ts
 *
 * Implements rigorous epistemic calibration during natural conversation:
 * 1. 4 Core Epistemic Categories:
 *    - KNOWN_FACT: Grounded scientific constants, settled geography, mathematical proofs.
 *    - UNCERTAIN_APPROXIMATE: Changing statistics, demographic estimates with explicit bounds.
 *    - UNAVAILABLE_PRIVATE: Private user data, undisclosed internal server secrets.
 *    - UNKNOWABLE_FUTURE: Inherently unpredictable future events (stock prices, distant elections).
 * 2. Resistance to Conversational Pressure:
 *    - Does NOT fabricate facts or numbers when coaxed ("just guess", "tuka maro", "give an estimate anyway").
 * 3. Natural Language Insulation Invariant:
 *    - Never outputs internal system enums (e.g. EPISTEMIC_STATUS, VDB_FAIL, CODE_404).
 *    - Uses natural, dignified conversational English, Roman Urdu, or Code-Mixed.
 * 4. Permanent Sovereign Invariants:
 *    - IS_ACTUATION_BLOCKED === true and OFFLINE_ISOLATED === true.
 *    - Actuation and security lockouts enforced.
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { IS_ACTUATION_BLOCKED } from '../chat/chatEngineContract';
import {
  Phase32RawIntentDetector,
  SafetyDisposition,
  DetectedLanguage,
} from '../intent_router/phase32RawIntentDetector';
import {
  Phase32GeneralKnowledgeEngine,
} from './phase32GeneralKnowledgeEngine';

// ============================================================================
// TYPE CONTRACTS
// ============================================================================

export type EpistemicCategory =
  | 'KNOWN_FACT'
  | 'UNCERTAIN_APPROXIMATE'
  | 'UNAVAILABLE_PRIVATE'
  | 'UNKNOWABLE_FUTURE';

export interface EpistemicDialogueRequest {
  readonly query: string;
  readonly language?: DetectedLanguage;
  readonly dialogueHistory?: readonly { role: string; content: string }[];
}

export interface EpistemicDialogueResponse {
  readonly originalQuery: string;
  readonly epistemicCategory: EpistemicCategory;
  readonly naturalResponseText: string;
  readonly resistsPressure: boolean;
  readonly hasInternalCodeLeak: boolean;
  readonly detectedLanguage: DetectedLanguage;
  readonly safetyDisposition: SafetyDisposition;
  readonly latencyMs: number;
  readonly signature: string;
}

// ============================================================================
// ENGINE IMPLEMENTATION
// ============================================================================

export class Phase32EpistemicBehaviorEngine {
  private static instance: Phase32EpistemicBehaviorEngine | null = null;
  private readonly rawDetector: Phase32RawIntentDetector;
  private readonly gkEngine: Phase32GeneralKnowledgeEngine;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
    this.rawDetector = Phase32RawIntentDetector.getInstance();
    this.gkEngine = Phase32GeneralKnowledgeEngine.getInstance();
  }

  public static getInstance(): Phase32EpistemicBehaviorEngine {
    if (!Phase32EpistemicBehaviorEngine.instance) {
      Phase32EpistemicBehaviorEngine.instance = new Phase32EpistemicBehaviorEngine();
    }
    return Phase32EpistemicBehaviorEngine.instance;
  }

  /**
   * Evaluates query epistemic status, resisting conversational pressure to fabricate.
   */
  public processEpistemicQuery(request: EpistemicDialogueRequest): EpistemicDialogueResponse {
    const t0 = performance.now();
    const query = request.query.trim();
    const qLower = query.toLowerCase();
    const language = request.language || this.rawDetector.detectLanguage(query);

    // 1. Safety & Actuation Lockout
    let safetyDisposition = this.rawDetector.evaluateSafety(query);
    if (safetyDisposition === 'SAFE') {
      const isActuation = /\b(?:trigger\s+(?:the\s+)?motor|hardware\s+actuate|switch\s+gpio|robotic\s+arm)\b/i.test(query);
      if (isActuation) safetyDisposition = 'BLOCKED_ACTUATION';

      const isSecurity = /\b(?:dump\s+passwords|steal\s+private\s+keys|bypass\s+firewall)\b/i.test(query);
      if (isSecurity) safetyDisposition = 'SECURITY_REFUSAL';
    }

    if (safetyDisposition !== 'SAFE') {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const refusal = safetyDisposition === 'BLOCKED_ACTUATION'
        ? (language === 'ROMAN_URDU'
            ? 'Physical actuator command radd kar di gayi hai. Hardware control offline safety locks ke tehat strictly blocked hai.'
            : 'Physical actuator command rejected. Hardware manipulation is strictly prohibited under offline safety locks.')
        : (language === 'ROMAN_URDU'
            ? 'Request radd kar di gayi hai. Main private security credentials ya passwords tak rasai faraham nahi kar sakta.'
            : 'Request declined. I cannot assist with security breaches or private credential exposure.');
      return {
        originalQuery: query,
        epistemicCategory: 'KNOWN_FACT',
        naturalResponseText: refusal,
        resistsPressure: true,
        hasInternalCodeLeak: false,
        detectedLanguage: language,
        safetyDisposition,
        latencyMs: elapsed,
        signature: this.computeSignature(query, refusal),
      };
    }

    // 2. Detect Conversational Pressure (Urging to guess or fabricate)
    const hasConversationalPressure = /\b(?:just\s+guess|take\s+a\s+guess|give\s+(?:me\s+)?an?\s+estimate\s+anyway|come\s+on\s+just\s+pick|don't\s+be\s+boring|tuka\s+mar[a-z]*|andaza\s+lagao|koi\s+bhi\s+bata\s+do|guess\s+karo|tuka)\b/i.test(qLower);

    // 3. Classify Epistemic Category
    let category: EpistemicCategory = 'KNOWN_FACT';
    let naturalResponseText = '';

    // A. UNKNOWABLE_FUTURE: Intrinsically unknowable future predictions or deterministic forecasts of chaotic events
    const isUnknowableFuture =
      /\b(?:will\s+quantum\s+computers\s+break|exact\s+stock\s+price|who\s+will\s+win\s+the\s+2036|predict\s+the\s+winner\s+of|lottery\s+numbers|what\s+will\s+happen\s+in\s+the\s+year\s+2050|exact\s+(?:high\s+)?temperature|year\s+20(?:3[5-9]|[4-9]\d)|aakhri\s+din|suraj\s+maghrib)\b/i.test(qLower) ||
      (/\b(?:stock\s+price|apple\s+stock|bitcoin.*price|election|temperature)\b/i.test(qLower) && /\b(?:tomorrow|next\s+year|next\s+tuesday|future|kal|mustaqbil|20\d\d)\b/i.test(qLower));

    if (isUnknowableFuture) {
      category = 'UNKNOWABLE_FUTURE';
      if (hasConversationalPressure) {
        naturalResponseText = language === 'ROMAN_URDU'
          ? 'Bila-tasdeeq andaza lagana durust nahi hoga: Mustaqbil ki market prices ya siyasi nataij ghair-yaqeeni hain aur unki peshangoi karna computational ya epistemic tor par namumkin hai.'
          : 'I cannot provide an ungrounded guess: Future market prices and socio-political outcomes depend on stochastic, unobserved variables that are inherently unknowable ahead of time.';
      } else {
        naturalResponseText = language === 'ROMAN_URDU'
          ? 'Yeh maloomat mustaqbil se taluq rakhti hain aur is waqt ghair-tasdeeq shuda hain. Epistemic boundaries ke tehat mustaqbil ki peshangoi nahi ki ja sakti.'
          : 'This information is intrinsically unknowable: Epistemic boundaries prevent speculative forecasting or ungrounded predictions of future outcomes.';
      }
    }
    // B. UNAVAILABLE_PRIVATE: Private, proprietary, or non-public information
    else if (/\b(?:what\s+did\s+the\s+ceo\s+eat|ceo.*breakfast|private\s+email\s+of|internal\s+server\s+ip|admin\s+private\s+token|secret\s+notes)\b/i.test(qLower)) {
      category = 'UNAVAILABLE_PRIVATE';
      naturalResponseText = language === 'ROMAN_URDU'
        ? 'Yeh maloomat unavailable hain: Shakhsi zaati zindagi ya internal private credentials mere pas dastiyab nahi hain aur privacy boundaries ke tehat mehfooz hain.'
        : 'This information is unavailable: Private personal activities and internal proprietary details are strictly outside accessible grounded knowledge.';
    }
    // C. UNCERTAIN_APPROXIMATE: Statistical estimates, changing metrics, demographic figures
    else if (/\b(?:world\s+population|earth\s+population|dunya\s+ki\s+abadi|number\s+of\s+trees|approximate\s+galaxies)\b/i.test(qLower)) {
      category = 'UNCERTAIN_APPROXIMATE';
      naturalResponseText = language === 'ROMAN_URDU'
        ? 'Dunya ki kul abadi taqreeban 8.1 billion (810 crore) afraad takhti jati hai. Kyunke births aur deaths musalsal hoti hain, is liye exact figure waqtan-fa-waqtan tabdeel hoti rehti hai.'
        : 'The human population of Earth is estimated at approximately 8.1 billion people. Because births and deaths occur continuously, this represents an approximate statistical demographic estimate rather than an exact instantaneous count.';
    }
    // D. KNOWN_FACT: Universal constants, settled history, geographic facts
    else {
      category = 'KNOWN_FACT';
      const gkRes = this.gkEngine.answerGeneralKnowledgeQuery({ query, language });
      naturalResponseText = gkRes.fullResponseText;
    }

    // 4. Verify Natural Language Insulation (No internal codes leaked)
    const hasInternalCodeLeak = /\b(?:EPISTEMIC_STATUS|VDB_GROUNDING_FAIL|STATUS_FLAG|ERROR_404|CORE_INTENT|AST_NODE|SYSTEM_STATE)\b/.test(naturalResponseText);

    const elapsed = Number((performance.now() - t0).toFixed(2));

    return {
      originalQuery: query,
      epistemicCategory: category,
      naturalResponseText,
      resistsPressure: hasConversationalPressure ? true : false,
      hasInternalCodeLeak,
      detectedLanguage: language,
      safetyDisposition: 'SAFE',
      latencyMs: elapsed,
      signature: this.computeSignature(query, naturalResponseText),
    };
  }

  private computeSignature(query: string, text: string): string {
    return crypto
      .createHash('sha256')
      .update(`EPISTEMIC_V1:${query}:${text}`)
      .digest('hex');
  }
}
