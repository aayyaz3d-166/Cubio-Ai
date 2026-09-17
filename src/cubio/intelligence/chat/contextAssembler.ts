/**
 * CUBiO AI — Phase 9: Chat & Context Engine
 * contextAssembler.ts
 *
 * Master 7-Layer Context Assembler & Compactor:
 * - Aggregates context across 7 explicit canonical layers
 * - Enforces deterministic precedence hierarchy
 * - Monitors context character budget and triggers controlled compaction
 * - Preserves explicit user constraints across compaction cycles
 * - Synthesizes bounded Core Engine prompts with cryptographic integrity
 */

import * as crypto from 'crypto';
import {
  ContextLayerType,
  ContextLayerItem,
  ContextCompactionRecord,
  AssembledContext,
  UserConstraint,
  DEFAULT_CONTEXT_BUDGET_CHARS,
  MAX_RECENT_TURNS_BUDGET,
} from './chatEngineContract';
import { ChatSession } from './chatSession';
import { ContextIntegrity } from './contextIntegrity';

export interface AssembleContextParams {
  readonly session: ChatSession;
  readonly currentMessage: string;
  readonly retrievedMemory?: readonly string[];
  readonly toolEvidence?: readonly string[];
  readonly budgetChars?: number;
}

export class ContextAssembler {
  /**
   * Assembles the 7-layer context respecting budget limits and precedence hierarchy.
   */
  public static assemble(params: AssembleContextParams): AssembledContext {
    const { session, currentMessage } = params;
    const budgetChars = params.budgetChars ?? DEFAULT_CONTEXT_BUDGET_CHARS;

    const layers: ContextLayerItem[] = [];

    // =========================================================================
    // LAYER 1: SYSTEM CONTEXT
    // =========================================================================
    const systemPrompt =
      'You are CUBiO AI, a sovereign spatial intelligence orchestrator. Operates strictly local, fail-closed, with permanent hardware actuation block.';
    layers.push(
      Object.freeze({
        layerType: ContextLayerType.LAYER_1_SYSTEM,
        precedence: 'SYSTEM',
        title: 'System Invariants & Policy',
        content: systemPrompt,
        estimatedChars: systemPrompt.length,
      })
    );

    // =========================================================================
    // LAYER 2: USER CONTEXT (Explicit Constraints)
    // =========================================================================
    const activeConstraints = session.getActiveConstraints();
    if (activeConstraints.length > 0) {
      const constraintsText = activeConstraints
        .map((c) => `[CONSTRAINT: ${c.key} = "${c.value}" (Origin: ${c.provenance}, Turn: ${c.setInTurnSequence})]`)
        .join('\n');

      layers.push(
        Object.freeze({
          layerType: ContextLayerType.LAYER_2_USER,
          precedence: 'EXPLICIT_CURRENT_CONSTRAINT',
          title: 'Active User Constraints',
          content: constraintsText,
          estimatedChars: constraintsText.length,
        })
      );
    }

    // =========================================================================
    // LAYER 3: CONVERSATION CONTEXT (Compacted Summaries)
    // =========================================================================
    const compactions = session.getCompactions();
    if (compactions.length > 0) {
      const summariesText = compactions
        .map(
          (cmp) =>
            `[COMPACTED CONVERSATION SUMMARY (Turns ${cmp.compactedTurnRange[0]}..${cmp.compactedTurnRange[1]}): ${cmp.summaryText}]`
        )
        .join('\n');

      layers.push(
        Object.freeze({
          layerType: ContextLayerType.LAYER_3_CONVERSATION,
          precedence: 'OLDER_CONTEXT',
          title: 'Compacted Conversation Summaries',
          content: summariesText,
          estimatedChars: summariesText.length,
        })
      );
    }

    // =========================================================================
    // LAYER 4: RECENT TURNS (Bounded Window)
    // =========================================================================
    // Determine which turns are already compacted
    let lastCompactedSeq = 0;
    for (const cmp of compactions) {
      if (cmp.compactedTurnRange[1] > lastCompactedSeq) {
        lastCompactedSeq = cmp.compactedTurnRange[1];
      }
    }

    const allTurns = session.getTurns();
    const uncompactedTurns = allTurns.filter((t) => t.sequence > lastCompactedSeq);
    const recentTurns = uncompactedTurns.slice(-MAX_RECENT_TURNS_BUDGET);

    if (recentTurns.length > 0) {
      const turnsText = recentTurns
        .map((t) => `Turn ${t.sequence} [${t.role}]: ${t.input}\n↳ ${t.output}`)
        .join('\n\n');

      layers.push(
        Object.freeze({
          layerType: ContextLayerType.LAYER_4_RECENT_TURNS,
          precedence: 'RECENT_CONVERSATION',
          title: 'Recent Conversational Turns',
          content: turnsText,
          estimatedChars: turnsText.length,
        })
      );
    }

    // =========================================================================
    // LAYER 5: RETRIEVED MEMORY
    // =========================================================================
    if (params.retrievedMemory && params.retrievedMemory.length > 0) {
      const memoryText = params.retrievedMemory.map((m) => `[MEMORY: ${m}]`).join('\n');
      layers.push(
        Object.freeze({
          layerType: ContextLayerType.LAYER_5_RETRIEVED_MEMORY,
          precedence: 'RETRIEVED_MEMORY',
          title: 'Retrieved Spatial & Tenant Memory',
          content: memoryText,
          estimatedChars: memoryText.length,
        })
      );
    }

    // =========================================================================
    // LAYER 6: TOOL EVIDENCE
    // =========================================================================
    if (params.toolEvidence && params.toolEvidence.length > 0) {
      const evidenceText = params.toolEvidence.map((e) => `[TOOL EVIDENCE: ${e}]`).join('\n');
      layers.push(
        Object.freeze({
          layerType: ContextLayerType.LAYER_6_TOOL_EVIDENCE,
          precedence: 'SAFETY_POLICY',
          title: 'Tool & Verification Evidence',
          content: evidenceText,
          estimatedChars: evidenceText.length,
        })
      );
    }

    // =========================================================================
    // LAYER 7: CURRENT REQUEST
    // =========================================================================
    layers.push(
      Object.freeze({
        layerType: ContextLayerType.LAYER_7_CURRENT_REQUEST,
        precedence: 'CURRENT_USER_REQUEST',
        title: 'Current User Instruction',
        content: currentMessage,
        estimatedChars: currentMessage.length,
      })
    );

    // Calculate total character budget
    let totalChars = layers.reduce((acc, l) => acc + l.estimatedChars, 0);
    let compactionRecord: ContextCompactionRecord | undefined;
    let isCompacted = false;

    // Trigger controlled compaction if budget is exceeded and we have enough uncompacted turns
    if (totalChars > budgetChars && uncompactedTurns.length > 5) {
      const turnsToCompact = uncompactedTurns.slice(0, Math.floor(uncompactedTurns.length / 2));
      if (turnsToCompact.length > 0) {
        const startSeq = turnsToCompact[0].sequence;
        const endSeq = turnsToCompact[turnsToCompact.length - 1].sequence;

        const summaryText = turnsToCompact
          .map((t) => `User asked about ${t.input.slice(0, 30)}. Assistant responded with ${t.output.slice(0, 30)}.`)
          .join(' ');

        const partialCompaction: Omit<ContextCompactionRecord, 'integrityHash'> = {
          compactionId: `CMP_${Date.now()}_${startSeq}_${endSeq}`,
          timestamp: Date.now(),
          compactedTurnRange: [startSeq, endSeq],
          originalTurnCount: turnsToCompact.length,
          summaryText,
          originalTurnIds: turnsToCompact.map((t) => t.turnId),
        };

        compactionRecord = Object.freeze({
          ...partialCompaction,
          integrityHash: ContextIntegrity.computeCompactionHash(partialCompaction),
        });

        session.addCompaction(compactionRecord);
        isCompacted = true;

        // Re-calculate characters with compaction applied
        totalChars = layers.reduce((acc, l) => acc + l.estimatedChars, 0);
      }
    }

    const payloadToHash = JSON.stringify({
      conversationId: session.conversationId,
      sessionId: session.sessionId,
      layers: layers.map((l) => ({ type: l.layerType, title: l.title, len: l.estimatedChars })),
      totalChars,
    });

    const integrityHash = crypto.createHash('sha256').update(payloadToHash, 'utf8').digest('hex');

    return Object.freeze({
      conversationId: session.conversationId,
      sessionId: session.sessionId,
      layers: Object.freeze(layers),
      totalChars,
      isCompacted,
      compactionRecord,
      activeConstraints,
      integrityHash,
      assembledAt: Date.now(),
    });
  }

  /**
   * Formats the assembled context into a clean composite prompt for the Core Engine.
   */
  public static formatPromptForCoreEngine(assembled: AssembledContext): string {
    const parts: string[] = [];

    for (const layer of assembled.layers) {
      if (layer.layerType === ContextLayerType.LAYER_7_CURRENT_REQUEST) {
        // Main prompt line
        parts.push(`[Current Request]: ${layer.content}`);
      } else {
        parts.push(`--- ${layer.title} ---\n${layer.content}`);
      }
    }

    return parts.join('\n\n');
  }
}
