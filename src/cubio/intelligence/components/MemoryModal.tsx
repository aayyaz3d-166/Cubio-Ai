/**
 * CubiO AI — Minimal Personal Context & Memory Modal
 * Allows users to view, add, and delete memories stored by CubiO AI.
 */

import React, { useState } from 'react';
import { Brain, Trash2, Plus, X, Check, ShieldCheck } from 'lucide-react';

export interface MemoryItem {
  readonly id: string;
  readonly category: 'Preference' | 'Project' | 'Fact' | 'Context';
  readonly content: string;
  readonly createdAt: number;
}

export interface MemoryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly memories: readonly MemoryItem[];
  readonly onAddMemory: (category: MemoryItem['category'], content: string) => void;
  readonly onDeleteMemory: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('Preference');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddMemory(newCategory, newContent.trim());
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0A0F1D',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#0F1E3D',
                border: '1px solid #2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                CubiO Memory
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                What CubiO remembers across your conversations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
          >
            <X className="w-5 h-5 hover:text-slate-200" />
          </button>
        </div>

        {/* Memory List */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontSize: '13px' }}>
              No memories stored yet. As you chat, CubiO will remember your key preferences and project context.
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#1E293B',
                        color: '#38BDF8',
                        textTransform: 'uppercase',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {m.category}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#F1F5F9', lineHeight: 1.4 }}>
                    {m.content}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteMemory(m.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Delete memory"
                >
                  <Trash2 className="w-4 h-4 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Memory Form */}
        {isAdding ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #1E293B', paddingTop: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="Preference">Preference</option>
                <option value="Project">Project</option>
                <option value="Fact">Fact</option>
                <option value="Context">Context</option>
              </select>

              <input
                type="text"
                placeholder="e.g. Always respond with concise code snippets and clear headings"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Memory
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10B981' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Private & Client Encrypted</span>
            </div>

            <button
              onClick={() => setIsAdding(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                color: '#38BDF8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
