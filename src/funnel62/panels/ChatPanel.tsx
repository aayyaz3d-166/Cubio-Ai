/**
 * 3D Memory Studio — Funnel 62
 * Component: ChatPanel
 *
 * Context-aware AI Chat interface with ModelSelector.
 */

import React, { useState } from 'react';
import { ModelRegistry } from '../ai/modelRegistry';
import { AIContextPayload } from '../ai/llmTypes';
import { ModelSelector } from '../components/ModelSelector';
import { Bot, Send, Sparkles, User, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  modelRegistry: ModelRegistry;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  aiContext: AIContextPayload | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  modelRegistry,
  selectedModelId,
  onSelectModel,
  aiContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'AI',
      text: 'Hello! I am connected to the 3D Memory Studio. Select any state node in the 3D viewport or database to provide context for our conversation.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Synthetic simulated response with bounded context
    setTimeout(() => {
      let reply = `[${selectedModelId}] `;
      if (aiContext) {
        reply += `I see you have selected **${aiContext.entityName}** (${aiContext.category}, Z${aiContext.dimension}). `;
        if (aiContext.connectedRelationships.length > 0) {
          reply += `It has ${aiContext.connectedRelationships.length} active relationships in the 3D graph. `;
        }
        reply += `Regarding your query "${currentInput}": Analyzing spatial knowledge state...`;
      } else {
        reply += `Received "${currentInput}". No 3D state is currently selected.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'AI',
          text: reply,
          timestamp: Date.now(),
        },
      ]);
    }, 400);
  };

  return (
    <div className="w-96 h-full bg-[#111114]/95 backdrop-blur-md border-l border-zinc-800 flex flex-col font-mono text-zinc-300 select-none">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI CONVERSATION HUB</span>
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>F47 BOUNDED</span>
          </span>
        </div>
        <ModelSelector
          modelRegistry={modelRegistry}
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
        />
      </div>

      {/* Active Context Banner */}
      {aiContext && (
        <div className="px-3 py-1.5 bg-[#18181c] border-b border-zinc-800 text-[10px] text-cyan-300 flex items-center justify-between">
          <span className="truncate">
            Context: <strong>{aiContext.entityName}</strong>
          </span>
          <span className="text-zinc-500">Z{aiContext.dimension}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 text-xs ${
              m.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                m.sender === 'USER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}
            >
              {m.sender === 'USER' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                m.sender === 'USER'
                  ? 'bg-blue-600/30 text-blue-100 border border-blue-500/40'
                  : 'bg-[#18181c] text-zinc-200 border border-zinc-800'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI about selected 3D memory..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#18181c] border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-hidden"
          />
          <button
            type="submit"
            className="p-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg cursor-pointer transition shadow-md shadow-cyan-600/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
