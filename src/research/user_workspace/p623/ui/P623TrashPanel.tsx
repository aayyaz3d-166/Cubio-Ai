/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Workspace Trash Management Panel
 */

import React from 'react';
import { TrashEntry } from '../types';

export interface P623TrashPanelProps {
  trashEntries: readonly TrashEntry[];
  selectedTrashId: string | null;
  onSelectTrash: (entry: TrashEntry) => void;
  onRestoreTrash: (entry: TrashEntry) => void;
  onPermanentDelete: (entry: TrashEntry) => void;
  onEmptyTrash: () => void;
  isOwner: boolean;
}

export const P623TrashPanel: React.FC<P623TrashPanelProps> = ({
  trashEntries,
  selectedTrashId,
  onSelectTrash,
  onRestoreTrash,
  onPermanentDelete,
  onEmptyTrash,
  isOwner,
}) => {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Workspace Trash</h3>
        {isOwner && trashEntries.length > 0 && (
          <button onClick={onEmptyTrash} style={styles.emptyTrashBtn}>
            Empty Trash
          </button>
        )}
      </div>

      <span style={styles.description}>
        Trashed entities retain exact identity, lineage, and checksums until permanently deleted.
      </span>

      {trashEntries.length === 0 ? (
        <div style={styles.emptyBox}>Trash is empty.</div>
      ) : (
        <div style={styles.list}>
          {trashEntries.map((t) => {
            const isSelected = t.trashId === selectedTrashId;
            return (
              <div
                key={t.trashId}
                onClick={() => onSelectTrash(t)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
                  background: isSelected ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.entityName}>{t.entity.name}</span>
                  <span style={styles.typeBadge}>{t.entity.entityType}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>ID: <span style={styles.idVal}>{t.entity.entityId}</span></span>
                  <span>Space: {t.entity.spaceId}</span>
                </div>

                <div style={styles.actionRow}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreTrash(t);
                    }}
                    style={styles.restoreBtn}
                  >
                    Restore
                  </button>
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDelete(t);
                      }}
                      style={styles.deleteBtn}
                    >
                      Delete Forever
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
  emptyTrashBtn: {
    background: '#B71C1C',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  description: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  emptyBox: {
    padding: 24,
    textAlign: 'center',
    color: '#616161',
    fontSize: 12,
    background: '#141622',
    borderRadius: 6,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 280,
    overflowY: 'auto',
  },
  card: {
    border: '1px solid #2A2D3E',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityName: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 12,
  },
  typeBadge: {
    background: '#37474F',
    color: '#B0BEC5',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#8A8F9E',
  },
  idVal: {
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  actionRow: {
    display: 'flex',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  restoreBtn: {
    background: '#2E7D32',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: '#C62828',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
