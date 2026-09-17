/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Live Space Controls & Management Panel
 */

import React, { useState } from 'react';
import { LiveSpaceState } from '../types';

export interface P625ISpacePanelProps {
  spaces: readonly LiveSpaceState[];
  activeSpaceId: string | null;
  onCreateSpace: (name: string) => void;
  onOpenSpace: (spaceId: string) => void;
  onSaveState: (stateName: string) => void;
  onResetState: () => void;
  onDeleteSpace: (spaceId: string) => void;
}

export const P625ISpacePanel: React.FC<P625ISpacePanelProps> = ({
  spaces,
  activeSpaceId,
  onCreateSpace,
  onOpenSpace,
  onSaveState,
  onResetState,
  onDeleteSpace,
}) => {
  const [newSpaceName, setNewSpaceName] = useState('');
  const [saveStateName, setSaveStateName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);

  const activeSpaces = spaces.filter((s) => !s.isDeleted);

  const handleCreate = () => {
    if (newSpaceName.trim()) {
      onCreateSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowCreateInput(false);
    }
  };

  const handleSave = () => {
    if (saveStateName.trim()) {
      onSaveState(saveStateName.trim());
      setSaveStateName('');
      setShowSaveInput(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>My Spaces</h3>
        <button
          onClick={() => setShowCreateInput(!showCreateInput)}
          style={styles.createBtn}
        >
          + New Space
        </button>
      </div>

      {showCreateInput && (
        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Space name..."
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleCreate} style={styles.confirmBtn}>
            Create
          </button>
        </div>
      )}

      <div style={styles.list}>
        {activeSpaces.length === 0 ? (
          <div style={styles.empty}>No spaces created yet.</div>
        ) : (
          activeSpaces.map((space) => {
            const isActive = space.spaceId === activeSpaceId;
            return (
              <div
                key={space.spaceId}
                onClick={() => onOpenSpace(space.spaceId)}
                style={{
                  ...styles.card,
                  borderColor: isActive ? '#00E5FF' : '#2A2D3E',
                  background: isActive ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.spaceName}>{space.name}</span>
                  {isActive && <span style={styles.activeBadge}>ACTIVE</span>}
                </div>

                <div style={styles.metaRow}>
                  <span>ID: <span style={styles.idVal}>{space.spaceId}</span></span>
                  <span>Coords: [{space.currentCoordinates.join(', ')}]</span>
                </div>

                <div style={styles.actions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSpace(space.spaceId);
                    }}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeSpaceId && (
        <div style={styles.activeToolbar}>
          <div style={styles.toolbarBtns}>
            <button onClick={() => setShowSaveInput(!showSaveInput)} style={styles.saveBtn}>
              Save State
            </button>
            <button onClick={onResetState} style={styles.resetBtn}>
              Reset State
            </button>
          </div>

          {showSaveInput && (
            <div style={styles.inputRow}>
              <input
                type="text"
                placeholder="Saved state name..."
                value={saveStateName}
                onChange={(e) => setSaveStateName(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleSave} style={styles.confirmBtn}>
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 16,
    color: '#E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
  },
  createBtn: {
    background: '#00E5FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    gap: 6,
  },
  input: {
    background: '#181A28',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '6px 10px',
    color: '#FFF',
    fontSize: 11,
    flex: 1,
  },
  confirmBtn: {
    background: '#2E7D32',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 11,
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 280,
    overflowY: 'auto',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#616161',
    fontSize: 12,
  },
  card: {
    border: '1px solid #2A2D3E',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spaceName: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 12,
  },
  activeBadge: {
    background: '#00E5FF',
    color: '#000',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#8A8F9E',
  },
  idVal: {
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  deleteBtn: {
    background: '#C62828',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 10,
    cursor: 'pointer',
  },
  activeToolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '1px solid #2A2D3E',
    paddingTop: 10,
  },
  toolbarBtns: {
    display: 'flex',
    gap: 8,
  },
  saveBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
  },
  resetBtn: {
    background: '#455A64',
    color: '#ECEFF1',
    border: 'none',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
  },
};
