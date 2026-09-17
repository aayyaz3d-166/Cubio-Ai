/**
 * 3D Memory Studio — Funnel 64
 * LLM Panel Adapter (Mock / Test Interface)
 *
 * Implements bounded message history (<= 100 messages) and mock LLM dispatch.
 * No real API calls or external credentials are used.
 */

export const MAX_CHAT_MESSAGES = 100;

export interface WorkspaceChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  modelId: string;
  text: string;
  timestamp: number;
  isMock: boolean;
}

export class LLMPanelAdapter {
  private messages: WorkspaceChatMessage[] = [
    {
      id: 'msg-f64-init',
      sender: 'AI',
      modelId: 'gemini-2.5-pro',
      text: '3D Memory Studio AI Workspace initialized [MOCK / NOT CONNECTED]. Select any 3D node to provide spatial context.',
      timestamp: Date.now(),
      isMock: true,
    },
  ];

  public sendMessage(
    text: string,
    modelId = 'gemini-2.5-pro',
    contextDescription?: string
  ): WorkspaceChatMessage {
    const userMsg: WorkspaceChatMessage = {
      id: `msg-u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'USER',
      modelId,
      text,
      timestamp: Date.now(),
      isMock: false,
    };
    this.addMessage(userMsg);

    // Generate deterministic mock AI reply
    let replyText = `[${modelId}] [MOCK / NOT CONNECTED] Received query: "${text}".`;
    if (contextDescription) {
      replyText += ` Context: ${contextDescription}.`;
    }

    const aiMsg: WorkspaceChatMessage = {
      id: `msg-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'AI',
      modelId,
      text: replyText,
      timestamp: Date.now() + 10,
      isMock: true,
    };
    this.addMessage(aiMsg);

    return aiMsg;
  }

  private addMessage(msg: WorkspaceChatMessage): void {
    this.messages.push(msg);
    if (this.messages.length > MAX_CHAT_MESSAGES) {
      this.messages.shift(); // Evict oldest
    }
  }

  public getMessages(): readonly WorkspaceChatMessage[] {
    return [...this.messages];
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public get messageCount(): number {
    return this.messages.length;
  }
}
