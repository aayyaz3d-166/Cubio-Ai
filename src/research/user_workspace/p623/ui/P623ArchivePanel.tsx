/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Workspace Archive Management Panel
 */

import React from 'react';
import { ArchiveEntry } from '../types';

export interface P623ArchivePanelProps {
  archiveEntries: readonly ArchiveEntry[];
  selectedArchiveId: string | null;
  onSelectArchive: (entry: ArchiveEntry) => void;
  onRestoreArchive: (entry: ArchiveEntry) => void;
}

export const P623ArchivePanel: React.FC<P623ArchivePanelProps> = ({
  archiveEntries,
  selectedArchiveId,
  onSelectArchive,
  onRestoreArchive,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Archive</h3>
      <span style={styles.description}>
        Archived items are preserved in cold storage, maintaining exact lineage and recoverable state.
      </span>

      {archiveEntries.length === 0 ? (
        <div style={styles.emptyBox}>Archive is empty.</div>
      ) : (
        <div style={styles.list}>
          {archiveEntries.map((a) => {
            const isSelected = a.archiveId === selectedArchiveId;
            return (
              <div
                key={a.archiveId}
                onClick={() => onSelectArchive(a)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? '#00E5FF' : '#2A2D3E',
                  background: isSelected ? '#181A2A' : '#141622',
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.entityName}>{a.entity.name}</span>
                  <span style={styles.typeBadge}>{a.entity.entityType}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>ID: <span style={styles.idVal}>{a.entity.entityId}</span></span>
                  <span>Lineage: {a.entity.lineageId}</span>
                </div>

                <div style={styles.actionRow}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreArchive(a);
                    }}
                    style={styles.restoreBtn}
                  >
                    Unarchive / Restore
                  </button>
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
  title: {
    margin: 0,
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
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
    background: '#263238',
    color: '#80CBC4',
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
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  restoreBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
