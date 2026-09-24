/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F76: Agent Message Bus
 *
 * Implements typed, peer-to-peer inter-agent messaging and broadcast bus.
 */

import { deterministicHash } from '../../../state/determinism';
import { AgentBusMessage, SpecialistAgentRole } from './types';

export class AgentMessageBus {
  private messageHistory: AgentBusMessage[] = [];
  private subscribers: Map<string, ((msg: AgentBusMessage) => void)[]> = new Map();

  public publish(
    senderRole: SpecialistAgentRole,
    recipientRole: SpecialistAgentRole | 'BROADCAST',
    topic: string,
    payload: unknown
  ): AgentBusMessage {
    const timestamp = Date.now();
    const messageId = `MSG_${deterministicHash(`${senderRole}:${topic}:${timestamp}`).slice(2, 10)}`;

    const message: AgentBusMessage = Object.freeze({
      messageId,
      senderRole,
      recipientRole,
      topic,
      payload,
      timestamp,
    });

    this.messageHistory.push(message);

    // Dispatch to topic subscribers
    const handlers = this.subscribers.get(topic) || [];
    for (const handler of handlers) {
      handler(message);
    }

    return message;
  }

  public subscribe(topic: string, handler: (msg: AgentBusMessage) => void): void {
    const list = this.subscribers.get(topic) || [];
    list.push(handler);
    this.subscribers.set(topic, list);
  }

  public getHistory(): readonly AgentBusMessage[] {
    return Object.freeze([...this.messageHistory]);
  }
}
