/**
 * CUBiO AI — Phase 6: Task 82
 * Native Dialogue & Conversation Learning Layer
 * src/cubio/language/native/dialogue/topicTracker.ts
 *
 * Deterministic Topic Tracking & Coreference Resolution Engine.
 * Manages active dialogue subject, resolves pronouns and demonstrative references,
 * tracks topic switches, and enables seamless context recovery when returning
 * to previous conversational topics.
 */

import { LanguageStatementParser } from '../reasoning/languageStatementParser';
import { TopicState, TopicTransition } from './dialogueTypes';

export class TopicTracker {
  private _activeTopic?: string;
  private readonly _topicHistory: string[] = [];
  private readonly _transitions: TopicTransition[] = [];
  private readonly _parser: LanguageStatementParser;

  constructor(parser?: LanguageStatementParser) {
    this._parser = parser ?? new LanguageStatementParser();
  }

  public get activeTopic(): string | undefined {
    return this._activeTopic;
  }

  public get topicHistory(): readonly string[] {
    return Object.freeze([...this._topicHistory]);
  }

  public get transitions(): readonly TopicTransition[] {
    return Object.freeze([...this._transitions]);
  }

  public get state(): TopicState {
    return Object.freeze({
      activeTopic: this._activeTopic,
      topicHistory: Object.freeze([...this._topicHistory]),
      transitions: Object.freeze([...this._transitions]),
    });
  }

  /**
   * Initializes or restores topic tracker state from a saved snapshot.
   */
  public restoreState(state: TopicState): void {
    this._activeTopic = state.activeTopic;
    this._topicHistory.length = 0;
    this._topicHistory.push(...state.topicHistory);
    this._transitions.length = 0;
    this._transitions.push(...state.transitions);
  }

  /**
   * Evaluates an utterance to extract the focal entity / topic.
   */
  public extractTopic(utterance: string): string | undefined {
    const clean = utterance.trim().replace(/[?.,!]+$/, '');

    // 0. Imperative commands with pronouns or generic objects have no explicit topic entity
    if (/^(?:configure|diagnose|adjust|operate|evaluate|run diagnostic|tune|set|start|stop)\s*(?:it|this|that|system|component)?$/i.test(clean)) {
      return undefined;
    }

    // 1. Check regarding / topic-introduction patterns: "Regarding X", "About X"
    const regardingMatch = clean.match(/^(?:regarding|about|as for|speaking of)\s+([a-zA-Z0-9_-]+)/i);
    if (regardingMatch) {
      return regardingMatch[1].trim().toLowerCase();
    }

    // 2. Check direct question patterns
    const goal = this._parser.parseQueryGoal(clean);
    if (goal.targetSubject && !this.isPronoun(goal.targetSubject)) {
      return goal.targetSubject.toLowerCase();
    }

    // 3. Fallback: propositions parsed from utterance
    const props = this._parser.parseStatements([clean]);
    if (props.length > 0 && props[0].subject && !this.isPronoun(props[0].subject)) {
      return props[0].subject.toLowerCase();
    }

    return undefined;
  }

  /**
   * Updates the active topic based on the new utterance and current turn index.
   * Detects topic switches and returns whether a switch occurred.
   */
  public updateTopic(
    utterance: string,
    turnIndex: number
  ): { activeTopic?: string; isTopicSwitch: boolean; isContextRecovery: boolean } {
    const extracted = this.extractTopic(utterance);

    if (!extracted) {
      // Retain existing active topic if no new topic extracted
      return {
        activeTopic: this._activeTopic,
        isTopicSwitch: false,
        isContextRecovery: false,
      };
    }

    const normExtracted = extracted.toLowerCase();

    // Case A: Same topic continuing
    if (this._activeTopic && this._activeTopic.toLowerCase() === normExtracted) {
      return {
        activeTopic: this._activeTopic,
        isTopicSwitch: false,
        isContextRecovery: false,
      };
    }

    // Case B: Context Recovery (returning to a previously discussed topic)
    const priorIndex = this._topicHistory.findIndex((t) => t.toLowerCase() === normExtracted);
    const isContextRecovery = priorIndex !== -1;

    const previousTopic = this._activeTopic;
    if (previousTopic && !this._topicHistory.includes(previousTopic)) {
      this._topicHistory.push(previousTopic);
    }

    this._activeTopic = normExtracted;

    this._transitions.push({
      fromTopic: previousTopic,
      toTopic: normExtracted,
      atTurnIndex: turnIndex,
      timestamp: Date.now(),
    });

    return {
      activeTopic: this._activeTopic,
      isTopicSwitch: true,
      isContextRecovery,
    };
  }

  /**
   * Resolves pronouns and demonstratives in an utterance to the active topic.
   * e.g., "How does it confine plasma?" -> "How does Tokamak confine plasma?"
   */
  public resolveCoreferences(utterance: string): { resolvedUtterance: string; resolvedSubject?: string } {
    if (!this._activeTopic) {
      return { resolvedUtterance: utterance };
    }

    const target = this._activeTopic;
    let resolved = utterance;

    // Pronouns & Demonstrative phrases
    const coreferencePatterns = [
      /\b(?:how does|can|does|is|why is|what makes)\s+(it|this|that|the device|the system|this component)\b/gi,
      /\b(it|this device|the device|this system|the system)\s+(?:is|has|can|produces|operates|functions)\b/gi,
    ];

    for (const pat of coreferencePatterns) {
      resolved = resolved.replace(pat, (match, p1) => {
        return match.replace(p1, target);
      });
    }

    // Direct pronoun replacement at start of question
    if (/^(?:is|are|does|can)\s+(?:it|this|that)\b/i.test(resolved)) {
      resolved = resolved.replace(/\b(?:it|this|that)\b/i, target);
    }

    return {
      resolvedUtterance: resolved,
      resolvedSubject: target,
    };
  }

  /**
   * Returns true if a term is a pronoun or generic demonstrative.
   */
  public isPronoun(term: string): boolean {
    const lower = term.trim().toLowerCase();
    const pronouns = new Set([
      'it',
      'they',
      'them',
      'this',
      'that',
      'these',
      'those',
      'he',
      'she',
      'what',
      'who',
      'where',
      'which',
      'device',
      'system',
      'component',
      'entity',
      'configure',
      'diagnose',
      'adjust',
      'operate',
      'evaluate',
      'tune',
      'set',
      'regarding',
      'about',
    ]);
    return pronouns.has(lower);
  }
}
