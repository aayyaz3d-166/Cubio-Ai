/**
 * CUBiO AI — Phase 11: Conversation Sidebar Component
 * src/cubio/web/components/ConversationSidebar.tsx
 */

import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { ConversationSummary } from '../types';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onCloseMobile: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  isOpen,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-14 left-0 w-72 md:w-64 lg:w-72
          bg-zinc-900/95 md:bg-zinc-900/60 border-r border-zinc-800
          flex flex-col z-20 md:z-10 transition-transform duration-200 ease-in-out shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top: Action Button */}
        <div className="p-3 border-b border-zinc-800/80">
          <button
            onClick={() => {
              onCreateConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="p-2 border-b border-zinc-800/60">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950/70 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const dateStr = new Date(conv.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`
                    group relative flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition
                    ${
                      isActive
                        ? 'bg-indigo-950/50 text-indigo-100 border border-indigo-800/50'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{conv.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{conv.turnCount} turns</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      title="Delete Conversation"
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Stats */}
        <div className="p-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>{conversations.length} total dialogues</span>
          <span className="text-[10px] uppercase font-mono tracking-wider">v1 API</span>
        </div>
      </aside>
    </>
  );
};
