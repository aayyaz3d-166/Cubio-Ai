/**
 * CUBiO AI — Phase 6: Task 82
 * Native Dialogue & Conversation Learning Layer
 * src/cubio/language/native/dialogue/dialogueContradictionDetector.ts
 *
 * Continuous Cross-Turn Dialogue Contradiction Detection Engine.
 * Scans new conversational statements and propositions against historical turns,
 * detects direct logical negations, attribute clashes, and relational inconsistencies,
 * and generates structured ContradictionAlert records to prevent state corruption.
 */

import { InferenceRuleEngine } from '../../../reasoning/native/inferenceRules';
import { LanguageStatementParser } from '../reasoning/languageStatementParser';
import { ParsedProposition } from '../reasoning/languageReasoningTypes';
import { ContradictionAlert, DialogueTurn } from './dialogueTypes';

export class DialogueContradictionDetector {
  private readonly _parser: LanguageStatementParser;

  constructor(parser?: LanguageStatementParser) {
    this._parser = parser ?? new LanguageStatementParser();
  }

  /**
   * Checks whether the current utterance introduces a contradiction against prior dialogue turns.
   */
  public checkUtteranceAgainstTurns(
    currentUtterance: string,
    currentTurnIndex: number,
    previousTurns: readonly DialogueTurn[],
    tenantId: string
  ): { hasContradiction: boolean; alert?: ContradictionAlert } {
    // 1. Parse current utterance into propositions and premises
    const currentProps = this._parser.parseStatements([currentUtterance], { tenantId });
    if (currentProps.length === 0) {
      return { hasContradiction: false };
    }

    const currentPremises = this._parser.toReasoningPremises(currentProps, tenantId);

    // 2. Iterate backward through previous turns to check for conflicts
    for (let i = previousTurns.length - 1; i >= 0; i--) {
      const priorTurn = previousTurns[i];

      // Extract prior propositions from utterance
      const priorProps = this._parser.parseStatements([priorTurn.utterance], { tenantId });

      // Also incorporate claims from prior response if available
      if (priorTurn.response && priorTurn.response.claims) {
        for (const cl of priorTurn.response.claims) {
          priorProps.push(
            this._parser.parseStatement(cl.statement, {
              tenantId,
              sourceObjectId: cl.provenance.sourceObjectId,
            })
          );
        }
      }

      const priorPremises = this._parser.toReasoningPremises(priorProps, tenantId);

      // Check each current premise against prior premises
      for (const curr of currentPremises) {
        for (const prior of priorPremises) {
          // Direct check via InferenceRuleEngine
          const contra = InferenceRuleEngine.tryDetectContradiction(curr, prior);
          if (contra) {
            return {
              hasContradiction: true,
              alert: {
                contradictingTurnIndex: currentTurnIndex,
                priorTurnIndex: priorTurn.turnIndex,
                previousStatement: prior.statement,
                newStatement: curr.statement,
                conflictReason: contra.reason,
                epistemicStatus: 'EPISTEMIC_UNKNOWN',
              },
            };
          }

          // Heuristic check: Same subject and same predicate, but conflicting boolean or status
          const sameSubject = curr.subject.toLowerCase() === prior.subject.toLowerCase();
          const currPred = curr.predicate.toLowerCase();
          const priorPred = prior.predicate.toLowerCase();

          const isDirectNegation =
            (currPred === `not_${priorPred}` || priorPred === `not_${currPred}`) && sameSubject;

          if (isDirectNegation) {
            return {
              hasContradiction: true,
              alert: {
                contradictingTurnIndex: currentTurnIndex,
                priorTurnIndex: priorTurn.turnIndex,
                previousStatement: prior.statement,
                newStatement: curr.statement,
                conflictReason: `Direct logical negation for subject "${curr.subject}": "${curr.statement}" contradicts prior assertion "${prior.statement}".`,
                epistemicStatus: 'EPISTEMIC_UNKNOWN',
              },
            };
          }

          // Incompatible state check: "online" vs "offline", "active" vs "inactive", "stable" vs "unstable"
          if (sameSubject && (currPred === priorPred || currPred === 'is_a' || priorPred === 'is_a')) {
            const currObj = String(curr.object).toLowerCase();
            const priorObj = String(prior.object).toLowerCase();

            const incompatiblePairs: [string, string][] = [
              ['online', 'offline'],
              ['active', 'inactive'],
              ['stable', 'unstable'],
              ['enabled', 'disabled'],
              ['nominal', 'critical'],
              ['true', 'false'],
            ];

            for (const [v1, v2] of incompatiblePairs) {
              if ((currObj === v1 && priorObj === v2) || (currObj === v2 && priorObj === v1)) {
                return {
                  hasContradiction: true,
                  alert: {
                    contradictingTurnIndex: currentTurnIndex,
                    priorTurnIndex: priorTurn.turnIndex,
                    previousStatement: prior.statement,
                    newStatement: curr.statement,
                    conflictReason: `Incompatible state transition asserted for "${curr.subject}": current "${currObj}" contradicts prior "${priorObj}".`,
                    epistemicStatus: 'EPISTEMIC_UNKNOWN',
                  },
                };
              }
            }
          }
        }
      }
    }

    return { hasContradiction: false };
  }
}
