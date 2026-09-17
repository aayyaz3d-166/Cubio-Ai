/**
 * CUBiO AI — Phase 11: Master Web Studio Application Component
 * src/cubio/web/CubiOWebStudioApp.tsx
 *
 * Sovereign, production-grade frontend for CUBiO AI.
 * Consumes /api/v1/* exclusively. Zero local intelligence fabrication.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { defaultApiClient, CubiOApiClient } from './api/apiClient';
import { authService, AuthService } from './api/authApi';
import { sendChatMessage } from './api/chatApi';
import { fetchHealth, fetchReadiness, fetchModels } from './api/healthApi';
import { Navigation } from './components/Navigation';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { SpatialInspectorModal } from './components/SpatialInspectorModal';
import { SettingsModal } from './components/SettingsModal';
import { UsageModal } from './components/UsageModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import {
  ChatMessage,
  ConversationSummary,
  UserAuthSession,
  SystemModelStatus,
  SystemReadiness,
  StudioActiveModal,
} from './types';

const CONVERSATIONS_STORAGE_KEY = 'cubio_web_studio_conversations';
const MESSAGES_STORAGE_PREFIX = 'cubio_web_studio_msgs_';

interface CubiOWebStudioAppProps {
  customApiClient?: CubiOApiClient;
  customAuthService?: AuthService;
  onNavigateTo3DStudio?: () => void;
}

export const CubiOWebStudioApp: React.FC<CubiOWebStudioAppProps> = ({
  customApiClient,
  customAuthService,
  onNavigateTo3DStudio,
}) => {
  const client = useMemo(() => customApiClient || defaultApiClient, [customApiClient]);
  const auth = useMemo(() => customAuthService || authService, [customAuthService]);

  // Session & Authentication State
  const [session, setSession] = useState<UserAuthSession | null>(() => auth.getSession());

  // Operational State
  const [modelStatus, setModelStatus] = useState<SystemModelStatus | null>(null);
  const [readiness, setReadiness] = useState<SystemReadiness | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // UI Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<StudioActiveModal>('none');

  // Conversations State
  const [conversations, setConversations] = useState<ConversationSummary[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        /* ignore storage error */
      }
    }
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return conversations[0]?.id || null;
  });

  // Active Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link auth token to API client
  useEffect(() => {
    client.setTokenGetter(() => auth.getToken());
  }, [client, auth, session]);

  // Save conversations list to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
      } catch {
        /* ignore */
      }
    }
  }, [conversations]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(`${MESSAGES_STORAGE_PREFIX}${activeConversationId}`);
        if (raw) {
          setMessages(JSON.parse(raw));
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setMessages([]);
  }, [activeConversationId]);

  // Persist messages for active conversation
  const persistMessages = useCallback((convId: string, msgs: ChatMessage[]) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`${MESSAGES_STORAGE_PREFIX}${convId}`, JSON.stringify(msgs));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // System Polling for health and model status
  const refreshSystemStatus = useCallback(async () => {
    try {
      const [rStatus, mStatus] = await Promise.all([
        fetchReadiness(client).catch(() => null),
        fetchModels(client).catch(() => null),
      ]);
      if (rStatus) setReadiness(rStatus);
      if (mStatus) setModelStatus(mStatus);
    } catch {
      /* non-fatal */
    }
  }, [client]);

  useEffect(() => {
    refreshSystemStatus();
    const interval = setInterval(refreshSystemStatus, 20000);
    return () => clearInterval(interval);
  }, [refreshSystemStatus]);

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcut listener (Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal !== 'none') {
        setActiveModal('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Conversation Management Handlers
  const handleCreateConversation = useCallback(() => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newConv: ConversationSummary = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turnCount: 0,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(`${MESSAGES_STORAGE_PREFIX}${id}`);
        } catch {
          /* ignore */
        }
      }
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConversationId(remaining[0]?.id || null);
      }
    },
    [activeConversationId, conversations]
  );

  // Authentication Sign-Out Handler
  const handleSignOut = useCallback(() => {
    auth.clearSession();
    setSession(null);
  }, [auth]);

  // Send Message Lifecycle
  const handleSendMessage = async (text: string, existingRequestId?: string) => {
    // If not authenticated, attempt session restore before prompting sign in
    if (!auth.isAuthenticated()) {
      const restored = auth.restoreSession();
      if (!restored || !restored.isAuthenticated) {
        setActiveModal('auth');
        return;
      }
      setSession(restored);
    }

    // Ensure an active conversation exists
    let convId = activeConversationId;
    if (!convId) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newConv: ConversationSummary = {
        id: convId,
        title: text.slice(0, 36) || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        turnCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(convId);
    }

    const requestId = existingRequestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const userMessage: ChatMessage = {
      id: `user_${requestId}`,
      requestId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      status: 'success',
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    persistMessages(convId, updatedWithUser);
    setIsSubmitting(true);

    try {
      const apiResponse = await sendChatMessage(client, {
        requestId,
        conversationId: convId,
        message: text,
      });

      const assistantMessage: ChatMessage = {
        id: apiResponse.turnId || `asst_${Date.now()}`,
        requestId: apiResponse.requestId,
        role: 'assistant',
        content: apiResponse.response.text,
        timestamp: new Date(apiResponse.timestamp).getTime(),
        status: 'success',
        sequence: apiResponse.sequence,
        confidence: apiResponse.response.confidence,
        epistemicState: apiResponse.response.epistemicState,
        latencyMs: apiResponse.metadata.latencyMs,
      };

      const finalMessages = [...updatedWithUser, assistantMessage];
      setMessages(finalMessages);
      persistMessages(convId, finalMessages);

      // Update conversation title and metadata
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            const isFirst = c.turnCount === 0;
            return {
              ...c,
              title: isFirst ? text.slice(0, 32) : c.title,
              updatedAt: Date.now(),
              turnCount: c.turnCount + 1,
              lastMessageSnippet: apiResponse.response.text.slice(0, 48),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        requestId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'error',
        error: err.detail || err.message || 'Failed to receive response from CUBiO API.',
      };

      const finalMessages = [...updatedWithUser, errorMessage];
      setMessages(finalMessages);
      persistMessages(convId, finalMessages);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Idempotent Retry
  const handleRetryMessage = async (failedMessage: ChatMessage) => {
    // Find the user message associated with this failed requestId
    const userMsg = messages.find((m) => m.requestId === failedMessage.requestId && m.role === 'user');
    if (!userMsg) return;

    // Filter out the failed error message
    const cleanMessages = messages.filter((m) => m.id !== failedMessage.id);
    setMessages(cleanMessages);
    if (activeConversationId) {
      persistMessages(activeConversationId, cleanMessages);
    }

    // Re-dispatch using the EXACT same requestId to ensure idempotency
    await handleSendMessage(userMsg.content, failedMessage.requestId);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-900 selection:text-white">
      {/* 1. Header Navigation */}
      <Navigation
        session={session}
        modelStatus={modelStatus}
        readiness={readiness}
        isOnline={isOnline}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        onOpenModal={(m) => setActiveModal(m)}
        onSignOut={handleSignOut}
        onNavigateTo3DStudio={onNavigateTo3DStudio}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Conversation Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isOpen={isSidebarOpen}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Chat Workspace */}
        <ChatWorkspace
          messages={messages}
          isSubmitting={isSubmitting}
          activeConversationTitle={activeConv?.title || ''}
          onSendMessage={handleSendMessage}
          onRetryMessage={handleRetryMessage}
        />
      </div>

      {/* 3. Modals */}
      <SpatialInspectorModal
        isOpen={activeModal === 'spatial'}
        onClose={() => setActiveModal('none')}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        apiUrl={client.getBaseUrl()}
        onClose={() => setActiveModal('none')}
        onSaveApiUrl={(url) => client.setBaseUrl(url)}
      />

      <UsageModal
        isOpen={activeModal === 'usage'}
        client={client}
        onClose={() => setActiveModal('none')}
      />

      <AuthModal
        isOpen={activeModal === 'auth'}
        client={client}
        authService={auth}
        onClose={() => setActiveModal('none')}
        onAuthenticated={(newSession) => setSession(newSession)}
      />

      <AccountModal
        isOpen={activeModal === 'account'}
        client={client}
        onClose={() => setActiveModal('none')}
        onSignOut={handleSignOut}
      />
    </div>
  );
};
