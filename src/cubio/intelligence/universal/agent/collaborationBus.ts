/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Multi-Agent Collaboration Bus
 *
 * Facilitates message passing, shared state synchronization,
 * and collaborative convergence between specialized agents.
 */

import { deterministicHash } from '../../../state/determinism';
import { AgentContribution, AgentMessage } from './types';

export class MultiAgentCollaborationBus {
  private messages: AgentMessage[] = [];
  private sharedBlackboard: Map<string, unknown> = new Map();

  /**
   * Broadcasts a message on the collaboration bus.
   */
  public postMessage(
    fromAgent: string,
    toAgent: string | 'BROADCAST',
    type: 'PROPOSE' | 'CRITIQUE' | 'REFINE' | 'AGREE',
    content: string
  ): Readonly<AgentMessage> {
    const timestamp = Date.now();
    const messageId = `MSG_${deterministicHash(fromAgent + toAgent + content + timestamp).slice(2, 10)}`;

    const message: AgentMessage = Object.freeze({
      messageId,
      fromAgent,
      toAgent,
      type,
      content,
      timestamp,
    });

    this.messages.push(message);
    return message;
  }

  /**
   * Records an agent contribution on the shared blackboard.
   */
  public recordContribution(contribution: AgentContribution): void {
    this.sharedBlackboard.set(contribution.role, contribution.payload);
    this.postMessage(
      contribution.agentId,
      'BROADCAST',
      'PROPOSE',
      `Completed ${contribution.role} contribution: ${contribution.summary}`
    );
  }

  /**
   * Retrieves all recorded collaboration messages.
   */
  public getMessages(): readonly AgentMessage[] {
    return Object.freeze([...this.messages]);
  }

  /**
   * Gets shared blackboard state.
   */
  public getBlackboardState(): Readonly<Record<string, unknown>> {
    const state: Record<string, unknown> = {};
    for (const [k, v] of this.sharedBlackboard.entries()) {
      state[k] = v;
    }
    return Object.freeze(state);
  }
}
