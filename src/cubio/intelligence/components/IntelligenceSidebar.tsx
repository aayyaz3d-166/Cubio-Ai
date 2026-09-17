/**
 * CubiO AI — Minimal Premium AI Sidebar (ChatGPT / Claude Style)
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  FolderKanban,
  BookOpen,
  Brain,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

import { ChatMessageData } from './ChatMessage';

export interface IntelligenceConversation {
  readonly id: string;
  readonly title: string;
  readonly lastUpdated: number;
  readonly messageCount: number;
  readonly projectId?: string;
}

export interface IntelligenceSidebarProps {
  readonly conversations: readonly IntelligenceConversation[];
  readonly activeConversationId: string;
  readonly onSelectConversation: (id: string) => void;
  readonly onNewChat: () => void;
  readonly onDeleteConversation: (id: string) => void;
  readonly onOpenMemory?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onSelectProject?: (projectName: string) => void;
  readonly activeProject?: string | null;
  readonly messagesMap?: Record<string, ChatMessageData[]>;
}

export const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenMemory,
  onOpenSettings,
  onSelectProject,
  activeProject,
  messagesMap,
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'CHATS' | 'PROJECTS' | 'LIBRARY'>('CHATS');

  const projects = [
    { id: 'p1', name: 'Jewelry AI & CAD', icon: '💍', count: 4 },
    { id: 'p2', name: 'Marketing & Copy', icon: '📈', count: 2 },
    { id: 'p3', name: 'CubiO Research', icon: '🌌', count: 7 },
    { id: 'p4', name: '3D Studio Engine', icon: '🎲', count: 3 },
    { id: 'p5', name: 'Business Strategy', icon: '💼', count: 1 },
  ];

  const libraryItems = [
    { id: 'l1', title: 'Ring Design Specs.pdf', type: 'PDF', date: '2d ago' },
    { id: 'l2', title: 'Aerospace Lattice Rules.docx', type: 'DOCX', date: '5d ago' },
    { id: 'l3', title: 'Topology Optimization.csv', type: 'CSV', date: '1w ago' },
  ];

  const queryLower = searchQuery.toLowerCase().trim();
  const filtered = conversations.filter((c) => {
    if (!queryLower) return true;
    // Check conversation title
    if (c.title.toLowerCase().includes(queryLower)) return true;
    // Check user & assistant message contents
    const msgs = messagesMap?.[c.id] || [];
    return msgs.some((m) => m.content.toLowerCase().includes(queryLower));
  });

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const today = filtered.filter((c) => now - c.lastUpdated < oneDay);
  const yesterday = filtered.filter((c) => now - c.lastUpdated >= oneDay && now - c.lastUpdated < 2 * oneDay);
  const previous7Days = filtered.filter((c) => now - c.lastUpdated >= 2 * oneDay && now - c.lastUpdated < 7 * oneDay);
  const older = filtered.filter((c) => now - c.lastUpdated >= 7 * oneDay);


  const renderGroup = (title: string, list: IntelligenceConversation[]) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 10px 4px 10px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {list.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                  color: isSelected ? '#F8FAFC' : '#94A3B8',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0,
                    padding: '2px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#070B14',
        borderRight: '1px solid #131E35',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        zIndex: 30,
      }}
    >
      {/* 1. TOP: + NEW CHAT BUTTON */}
      <div style={{ padding: '14px 14px 8px 14px' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#0F1E3D',
            border: '1px solid #2563EB',
            color: '#38BDF8',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1D4ED8';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0F1E3D';
            e.currentTarget.style.color = '#38BDF8';
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* 2. SEARCH INPUT */}
      <div style={{ padding: '0 14px 10px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            backgroundColor: '#0B1325',
            border: '1px solid #1E293B',
            borderRadius: '8px',
          }}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '12px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* 3. SECTION TABS (Chats | Projects | Library) */}
      <div style={{ padding: '0 14px 10px 14px', display: 'flex', gap: '4px' }}>
        {[
          { id: 'CHATS', label: 'Chats', icon: MessageSquare },
          { id: 'PROJECTS', label: 'Projects', icon: FolderKanban },
          { id: 'LIBRARY', label: 'Library', icon: BookOpen },
        ].map((tab) => {
          const isSelected = activeSection === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                flex: 1,
                padding: '5px 6px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#1E293B' : 'transparent',
                color: isSelected ? '#F8FAFC' : '#64748B',
                border: 'none',
                fontSize: '11px',
                fontWeight: isSelected ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN SCROLLABLE LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {activeSection === 'CHATS' && (
          <>
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterday)}
            {renderGroup('Previous 7 Days', previous7Days)}
            {renderGroup('Older', older)}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B', fontSize: '12px' }}>
                No chats found
              </div>
            )}
          </>
        )}

        {activeSection === 'PROJECTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', padding: '0 8px 4px 8px' }}>
              My Projects
            </div>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject?.(p.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: activeProject === p.name ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                  color: activeProject === p.name ? '#38BDF8' : '#CBD5E1',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#0B1325', padding: '2px 6px', borderRadius: '10px' }}>
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'LIBRARY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', padding: '0 8px 4px 8px' }}>
              Uploaded Files & Knowledge
            </div>
            {libraryItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#0B1325',
                  border: '1px solid #1E293B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#38BDF8', backgroundColor: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>
                    {item.type}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Uploaded {item.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. USER PROFILE / MEMORY FOOTER */}
      <div
        style={{
          borderTop: '1px solid #131E35',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#38BDF8',
            }}
          >
            A
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
              Ayyaz
            </span>
            <span style={{ fontSize: '11px', color: '#10B981' }}>
              Pro Plan
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onOpenMemory && (
            <button
              onClick={onOpenMemory}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
              title="Open Memory"
            >
              <Brain className="w-4 h-4 hover:text-cyan-400" />
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
              title="Settings"
            >
              <Settings className="w-4 h-4 hover:text-slate-200" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

