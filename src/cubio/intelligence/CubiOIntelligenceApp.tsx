/**
 * CubiO AI — Master Professional AI Assistant Application (ChatGPT / Claude Style)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { IntelligenceHeader } from './components/IntelligenceHeader';
import { IntelligenceSidebar, IntelligenceConversation } from './components/IntelligenceSidebar';
import { ChatView } from './components/ChatView';
import { MessageComposer, AttachedFile } from './components/MessageComposer';
import { ChatMessageData } from './components/ChatMessage';
import { MemoryModal, MemoryItem } from './components/MemoryModal';
import { getUniversalBridgeService } from './universal/integrationBridge';
import { CubiOStateFactory } from '../state/stateEngine';
import { CubiODimension, CubiOHarmonic369 } from '../types';
import { deterministicCubiOHash } from '../determinism';

export interface CubiOIntelligenceAppProps {
  readonly onExitToCore?: () => void;
  readonly onExitToNetwork?: () => void;
  readonly initialDimension?: CubiODimension;
}

export const CubiOIntelligenceApp: React.FC<CubiOIntelligenceAppProps> = ({
  onExitToCore,
  onExitToNetwork,
  initialDimension = 'D3',
}) => {
  // Underlying Real Intelligence Service Singleton (F29 Chat API Integration)
  const intelligenceService = useMemo(() => getUniversalBridgeService(), []);

  // Workspace & Memory State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  // User Memories Store (General-purpose preferences)
  const [memories, setMemories] = useState<MemoryItem[]>([
    {
      id: 'MEM_1',
      category: 'Preference',
      content: 'Prefers concise, practical solutions with clear code and reasoning.',
      createdAt: Date.now() - 86400000,
    },
  ]);

  // 369 Harmonic Context (Cleanly encapsulated in backend)
  const [harmonic] = useState<CubiOHarmonic369>({
    triad: [3, 6, 9],
    vortexState: 9,
    harmonicFlux: 0.963,
    phaseShift: 36.9,
    quantumPolarity: 1.0,
    resonanceScore: 99.8,
    activeFrequencyHz: 369.0,
  });

  // Conversations State
  const [conversations, setConversations] = useState<IntelligenceConversation[]>([
    {
      id: 'CONV_LIVE_GENESIS',
      title: 'New Chat',
      lastUpdated: Date.now(),
      messageCount: 0,
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState<string>('CONV_LIVE_GENESIS');

  // Messages Store keyed by conversationId
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessageData[]>>({
    CONV_LIVE_GENESIS: [],
  });

  const currentMessages = messagesMap[activeConversationId] || [];

  // Handlers
  const handleNewChat = useCallback(() => {
    const newId = `CONV_${deterministicCubiOHash(Date.now().toString())}`;
    const newConv: IntelligenceConversation = {
      id: newId,
      title: 'New Chat',
      lastUpdated: Date.now(),
      messageCount: 0,
      projectId: activeProject || undefined,
    };
    setConversations((prev) => [newConv, ...prev]);
    setMessagesMap((prev) => ({ ...prev, [newId]: [] }));
    setActiveConversationId(newId);
  }, [activeProject]);

  const handleDeleteConversation = useCallback((convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[convId];
      return next;
    });
    if (activeConversationId === convId) {
      const remaining = conversations.filter((c) => c.id !== convId);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  }, [activeConversationId, conversations, handleNewChat]);

  const handleAddMemory = useCallback((category: MemoryItem['category'], content: string) => {
    const newMem: MemoryItem = {
      id: `MEM_${deterministicCubiOHash(Date.now() + content)}`,
      category,
      content,
      createdAt: Date.now(),
    };
    setMemories((prev) => [newMem, ...prev]);
  }, []);

  const handleDeleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Send message flow
  const handleSendMessage = useCallback(
    async (prompt: string, attachments?: readonly AttachedFile[]) => {
      const cleanPrompt = prompt.trim();
      if (!cleanPrompt && (!attachments || attachments.length === 0)) return;

      const userMsgId = `MSG_USR_${deterministicCubiOHash(Date.now() + cleanPrompt)}`;
      const userMsg: ChatMessageData = {
        id: userMsgId,
        role: 'USER',
        content: cleanPrompt,
        timestamp: Date.now(),
        attachments,
      };

      // Append user message immediately
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), userMsg],
      }));

      // Update conversation title if first message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              title: c.messageCount === 0 ? cleanPrompt.slice(0, 32) + (cleanPrompt.length > 32 ? '...' : '') : c.title,
              lastUpdated: Date.now(),
              messageCount: c.messageCount + 1,
            };
          }
          return c;
        })
      );

      setIsLoading(true);

      // 15-second Timeout Guard with Abort Promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('CubiO AI inference request timed out after 15000ms')), 15000)
      );

      try {
        let content = '';
        let confidence = 0.99;
        let reasoningSteps: any[] = [];

        const baseState = CubiOStateFactory.createState(
          'ST_CORE',
          [0, 0, 0],
          'D3',
          { mode: 'CHAT', flux: harmonic.harmonicFlux }
        );

        // Collect multi-turn conversation history for context continuity
        const currentHistory = (messagesMap[activeConversationId] || []).map((m) => ({
          role: (m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));

        const formattedMessages = [
          ...currentHistory,
          { role: 'user' as const, content: cleanPrompt },
        ];

        const executionPromise = (async () => {
          // 1. Direct HTTP POST to /api/cubio/chat
          let apiSuccess = false;
          try {
            if (typeof window !== 'undefined' && window.fetch) {
              const res = await fetch('/api/cubio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: activeConversationId,
                  messages: formattedMessages,
                  config: { maxNewTokens: 256, temperature: 0.7 },
                }),
              });

              if (res.ok) {
                const resJson = await res.json();
                const respData = resJson.data || resJson;
                if (respData?.message?.content) {
                  content = respData.message.content;
                  confidence = 0.99;
                  apiSuccess = true;
                }
              }
            }
          } catch (fetchErr) {
            console.warn('[CubiO UI] Direct fetch /api/cubio/chat unavailable, using local bridge dispatch:', fetchErr);
          }

          // 2. Local Bridge Dispatch if HTTP fetch unavailable
          if (!apiSuccess) {
            const chatRes = await intelligenceService.chat(cleanPrompt, {
              prompt: cleanPrompt,
              activeDimension: 'D3',
              baseState,
              harmonic,
              conversationId: activeConversationId,
              conversationHistory: currentHistory,
              attachedFiles: attachments?.map((a) => ({ name: a.name, type: a.type, size: a.size })),
              activeProject,
              memories: memories.map((m) => m.content),
            } as any);

            if (chatRes.success && chatRes.data) {
              content = chatRes.data.textOutput;
              confidence = chatRes.data.confidence;
              reasoningSteps = (chatRes.data.reasoningSteps as any[]) || [];
            } else {
              throw new Error(chatRes.error || 'Inference engine response generation failed');
            }
          }
        })();

        await Promise.race([executionPromise, timeoutPromise]);

        if (!content.trim()) {
          throw new Error('Inference engine returned an empty response.');
        }

        const assistantMsgId = `MSG_AST_${deterministicCubiOHash(Date.now().toString() + cleanPrompt)}`;
        const assistantMsg: ChatMessageData = {
          id: assistantMsgId,
          role: 'ASSISTANT',
          content,
          timestamp: Date.now(),
          confidence,
          reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
        };

        setMessagesMap((prev) => ({
          ...prev,
          [activeConversationId]: [...(prev[activeConversationId] || []), assistantMsg],
        }));
      } catch (err: any) {
        const errorMsgId = `MSG_ERR_${deterministicCubiOHash(Date.now().toString())}`;
        const errorMsg: ChatMessageData = {
          id: errorMsgId,
          role: 'ASSISTANT',
          content: `❌ Inference Error: ${err?.message || String(err)}`,
          timestamp: Date.now(),
          confidence: 0.0,
        };

        setMessagesMap((prev) => ({
          ...prev,
          [activeConversationId]: [...(prev[activeConversationId] || []), errorMsg],
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, harmonic, intelligenceService, memories, messagesMap]
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      const messages = messagesMap[activeConversationId] || [];
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex > 0) {
        const prevUserMsg = messages[msgIndex - 1];
        if (prevUserMsg.role === 'USER') {
          // Remove the assistant message and re-run
          setMessagesMap((prev) => ({
            ...prev,
            [activeConversationId]: messages.slice(0, msgIndex),
          }));
          handleSendMessage(prevUserMsg.content);
        }
      }
    },
    [activeConversationId, handleSendMessage, messagesMap]
  );

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      const messages = messagesMap[activeConversationId] || [];
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex >= 0) {
        // Cut conversation to this message and re-send
        setMessagesMap((prev) => ({
          ...prev,
          [activeConversationId]: messages.slice(0, msgIndex),
        }));
        handleSendMessage(newContent);
      }
    },
    [activeConversationId, handleSendMessage, messagesMap]
  );

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#030712',
        color: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 1. Left Navigation Sidebar */}
      <IntelligenceSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
        onSelectProject={(p) => {
          setActiveProject(p);
          handleNewChat();
        }}
        activeProject={activeProject}
        messagesMap={messagesMap}
      />

      {/* 2. Main Chat Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#070D1A',
        }}
      >
        {/* Top Header */}
        <IntelligenceHeader
          onNewChat={handleNewChat}
          onOpenMemory={() => setIsMemoryModalOpen(true)}
          memoryCount={memories.length}
        />

        {/* Scrollable Messages Stream */}
        <ChatView
          messages={currentMessages}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          isLoading={isLoading}
          userName="Ayyaz"
        />

        {/* Bottom Message Composer */}
        <MessageComposer
          onSendMessage={(content, attachments) => handleSendMessage(content, attachments)}
          isLoading={isLoading}
          placeholder="Ask anything..."
        />
      </div>

      {/* 3. Personal Memory Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />
    </div>
  );
};
