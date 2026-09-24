/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Master React 19 Universal UI App
 *
 * Single interface providing complete access across all 10 CubiO Super Intelligence capabilities.
 */

import React, { useState } from 'react';
import { UniversalUIMessage, UniversalUIState, UniversalUITab } from './types';
import { UniversalUIBridge } from './universalUIBridge';
import { UniversalHeader } from './components/UniversalHeader';
import { UniversalChatPanel } from './components/UniversalChatPanel';
import { UniversalWorkflowPanel } from './components/UniversalWorkflowPanel';
import { UniversalProjectPanel } from './components/UniversalProjectPanel';
import { UniversalAgentPanel } from './components/UniversalAgentPanel';
import { UniversalArtifactsPanel } from './components/UniversalArtifactsPanel';

export const CubiOUniversalUIApp: React.FC = () => {
  const [bridge] = useState(() => new UniversalUIBridge());
  const [state, setState] = useState<UniversalUIState>({
    activeTab: 'CHAT',
    messages: [],
    inputText: '',
    isRecordingVoice: false,
    attachedFiles: [],
    codeBuffer: '',
    projectHealthScore: 98,
    projectProgressPercent: 100,
    workflowStagesStatus: [],
    workflowAwaitingAuthorization: false,
    artifactsList: [],
    isProcessing: false,
    currentDimension: 'D7',
  });

  const handleSendMessage = async () => {
    if (!state.inputText.trim() && !state.selectedImage && !state.isRecordingVoice) return;

    const userMsg: UniversalUIMessage = {
      id: `MSG_${Date.now()}`,
      sender: 'USER',
      text: state.inputText || 'Omni-Modal Input',
      timestamp: Date.now(),
      imageUrl: state.selectedImage?.url,
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isProcessing: true,
    }));

    try {
      const res = await bridge.sendOmniRequest(state);

      const assistantMsg: UniversalUIMessage = {
        id: `MSG_RES_${Date.now()}`,
        sender: 'ASSISTANT',
        text: res.textResponse,
        timestamp: Date.now(),
        modalities: res.modalitiesProcessed,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
        inputText: '',
        isProcessing: false,
        workflowAwaitingAuthorization: res.workflowResult !== undefined,
        artifactsList: res.artifacts.map((a) => ({ name: a.name, type: a.type, uri: a.uri })),
        projectHealthScore: res.projectResult?.healthScore || prev.projectHealthScore,
        projectProgressPercent: res.projectResult?.progressPercent || prev.projectProgressPercent,
      }));
    } catch (err: unknown) {
      const errMsg: UniversalUIMessage = {
        id: `MSG_ERR_${Date.now()}`,
        sender: 'SYSTEM',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, errMsg],
        isProcessing: false,
      }));
    }
  };

  const handleAuthorizeWorkflow = async () => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    try {
      const res = await bridge.authorizeCurrentWorkflow();
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        workflowAwaitingAuthorization: false,
        messages: [
          ...prev.messages,
          {
            id: `AUTH_OK_${Date.now()}`,
            sender: 'SYSTEM',
            text: `✅ Autonomous deployment authorized & live on staging edge: ${res.workflowResult?.stagingUrl || 'https://staging-preview.cubio.space/live'}`,
            timestamp: Date.now(),
          },
        ],
      }));
    } catch {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#0a0a12', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <UniversalHeader
        activeTab={state.activeTab}
        onSelectTab={(tab: UniversalUITab) => setState((prev) => ({ ...prev, activeTab: tab }))}
        currentDimension={state.currentDimension}
        healthScore={state.projectHealthScore}
      />

      <main style={{ flex: 1, overflow: 'hidden' }}>
        {state.activeTab === 'CHAT' && (
          <UniversalChatPanel
            messages={state.messages}
            inputText={state.inputText}
            onChangeInputText={(text) => setState((prev) => ({ ...prev, inputText: text }))}
            onSendMessage={handleSendMessage}
            isProcessing={state.isProcessing}
            isRecordingVoice={state.isRecordingVoice}
            onToggleVoice={() => setState((prev) => ({ ...prev, isRecordingVoice: !prev.isRecordingVoice }))}
            selectedImage={state.selectedImage}
            onUploadImage={(url) => setState((prev) => ({ ...prev, selectedImage: { url, width: 1024, height: 1024 } }))}
          />
        )}

        {state.activeTab === 'WORKFLOW' && (
          <UniversalWorkflowPanel
            workflowStages={state.workflowStagesStatus}
            isAwaitingAuth={state.workflowAwaitingAuthorization}
            onAuthorize={handleAuthorizeWorkflow}
            stagingUrl="https://staging-preview.cubio.space/live"
          />
        )}

        {state.activeTab === 'PROJECT' && (
          <UniversalProjectPanel
            healthScore={state.projectHealthScore}
            progressPercent={state.projectProgressPercent}
          />
        )}

        {state.activeTab === 'AGENTS' && <UniversalAgentPanel />}

        {state.activeTab === 'ARTIFACTS' && (
          <UniversalArtifactsPanel artifacts={state.artifactsList} />
        )}
      </main>
    </div>
  );
};
