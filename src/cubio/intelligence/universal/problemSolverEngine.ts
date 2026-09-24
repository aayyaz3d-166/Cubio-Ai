/**
 * CubiO AI — Problem Solver Engine (Delegating to RealLLMProviderPool)
 *
 * Bridges problem solving inquiries to the authoritative LLM provider pool.
 */

import { RealLLMProviderPool } from './llm/realLLMProviderPool';
import { LLMChatMessage } from './llm/types';
import { CubIOWebSearchService } from './webSearchService';

export interface ConversationTurn {
  readonly role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  readonly content: string;
}

export interface ProblemSolveContext {
  readonly conversationHistory?: readonly ConversationTurn[];
  readonly attachedFiles?: readonly { name: string; type: string; size: number }[];
  readonly activeProject?: string | null;
  readonly memories?: readonly string[];
  readonly webSearchEnabled?: boolean;
}

export interface ProblemSolveResult {
  readonly solutionText: string;
  readonly category: string;
  readonly confidence: number;
}

export class CubiOProblemSolverEngine {
  public static async solve(prompt: string, context: ProblemSolveContext = {}): Promise<ProblemSolveResult> {
    const cleanPrompt = prompt
      .replace(/\[memory:[^\]]+\]/gi, '')
      .replace(/\[web search active\]/gi, '')
      .trim();

    const messages: LLMChatMessage[] = (context.conversationHistory || []).map((turn) => ({
      role: turn.role === 'ASSISTANT' ? 'assistant' : 'user',
      content: turn.content,
    }));

    let promptToSend = cleanPrompt;
    if (CubIOWebSearchService.requiresWebSearch(cleanPrompt, context.webSearchEnabled)) {
      const searchResult = await CubIOWebSearchService.searchAndSynthesize(cleanPrompt);
      promptToSend = `${cleanPrompt}\n\n[WEB_SEARCH_CONTEXT]: ${searchResult.synthesizedAnswer}`;
    }

    messages.push({
      role: 'user',
      content: promptToSend,
    });

    const providerPool = RealLLMProviderPool.getInstance();
    const result = await providerPool.dispatchChat(messages, {
      requestedProvider: 'gemini',
    });

    return {
      solutionText: result.text || 'I have processed your request.',
      category: 'GENERAL_CONVERSATION',
      confidence: result.confidence || 0.99,
    };
  }
}
