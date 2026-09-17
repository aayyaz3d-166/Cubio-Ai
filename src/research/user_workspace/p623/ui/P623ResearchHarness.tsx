/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.23: Integrated Workspace Trash, Archive & Recovery Research Dashboard
 *
 * Route: ?mode=p623 | ?research=p623 | #/research/p623
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  WorkspaceEntityReference,
  TrashEntry,
  ArchiveEntry,
  RecoveryRecord,
  DeletionRecord,
  LifecyclePermissionContext,
} from '../types';
import { TrashManager } from '../trashManager';
import { ArchiveManager } from '../archiveManager';
import { LifecycleRecoveryManager } from '../recoveryManager';
import { PermanentDeletionEngine } from '../permanentDeletion';
import { deterministicHash } from '../determinism';

import { P623TrashPanel } from './P623TrashPanel';
import { P623ArchivePanel } from './P623ArchivePanel';
import { P623RecoveryPanel } from './P623RecoveryPanel';
import { P623LifecycleInspector } from './P623LifecycleInspector';

export interface P623ResearchHarnessProps {
  onExit?: () => void;
}

export const P623ResearchHarness: React.FC<P623ResearchHarnessProps> = ({ onExit }) => {
  const context: LifecyclePermissionContext = useMemo(
    () => ({
      userId: 'USR_OWNER_01',
      userRole: 'OWNER',
      workspaceId: 'WS_LIFECYCLE_CANONICAL',
    }),
    []
  );

  const [trashManager] = useState(() => new TrashManager());
  const [archiveManager] = useState(() => new ArchiveManager());

  const [trashEntries, setTrashEntries] = useState<readonly TrashEntry[]>([]);
  const [archiveEntries, setArchiveEntries] = useState<readonly ArchiveEntry[]>([]);
  const [lastRecovery, setLastRecovery] = useState<RecoveryRecord | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [deletionCount, setDeletionCount] = useState(0);

  const [selectedTrashId, setSelectedTrashId] = useState<string | null>(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

  // Initial Sample Entity
  const sampleEntity: WorkspaceEntityReference = useMemo(
    () => ({
      entityId: 'SPACE_SAMPLE_01',
      entityType: 'SPACE',
      name: 'Sample Research Space',
      spaceId: 'SPACE_SAMPLE_01',
      ownerId: 'USR_OWNER_01',
      lineageId: 'LIN_SPACE_01',
      checksum: 'CS_SPACE_01',
      realityChecksum: 'CS_REALITY_01',
      coordinates: [5, 3, 6],
      certainty: 'EXACT',
    }),
    []
  );

  // Move Sample Entity to Trash
  const handleMoveSampleToTrash = useCallback(() => {
    const res = trashManager.moveToTrash(sampleEntity, context, 'ACTIVE', 'User requested delete');
    if (res.success && res.entry) {
      setTrashEntries(trashManager.getTrash(context));
    }
  }, [trashManager, sampleEntity, context]);

  // Move Sample Entity to Archive
  const handleMoveSampleToArchive = useCallback(() => {
    const res = archiveManager.archiveEntity(sampleEntity, context, 'ACTIVE', 'Cold storage');
    if (res.success && res.entry) {
      setArchiveEntries(archiveManager.getArchivedEntities(context));
    }
  }, [archiveManager, sampleEntity, context]);

  // Restore From Trash
  const handleRestoreTrash = useCallback(
    (entry: TrashEntry) => {
      const rec = LifecycleRecoveryManager.recoverFromTrash(entry, context);
      if (rec.success && rec.record) {
        trashManager.restoreFromTrash(entry.entity.entityId, context);
        setTrashEntries(trashManager.getTrash(context));
        setLastRecovery(rec.record);
        setRecoveryError(null);
      } else {
        setRecoveryError(rec.error ?? 'Recovery Failed');
      }
    },
    [trashManager, context]
  );

  // Restore From Archive
  const handleRestoreArchive = useCallback(
    (entry: ArchiveEntry) => {
      const rec = LifecycleRecoveryManager.recoverFromArchive(entry, context);
      if (rec.success && rec.record) {
        archiveManager.restoreArchive(entry.entity.entityId, context);
        setArchiveEntries(archiveManager.getArchivedEntities(context));
        setLastRecovery(rec.record);
        setRecoveryError(null);
      } else {
        setRecoveryError(rec.error ?? 'Recovery Failed');
      }
    },
    [archiveManager, context]
  );

  // Permanent Delete
  const handlePermanentDelete = useCallback(
    (entry: TrashEntry) => {
      const del = PermanentDeletionEngine.permanentlyDelete(entry, context);
      if (del.success && del.record) {
        trashManager.restoreFromTrash(entry.entity.entityId, context); // remove from trash map
        setTrashEntries(trashManager.getTrash(context));
        setDeletionCount((prev) => prev + 1);
      }
    },
    [trashManager, context]
  );

  // Empty Trash
  const handleEmptyTrash = useCallback(() => {
    const res = trashManager.emptyTrash(context);
    if (res.success) {
      setDeletionCount((prev) => prev + res.deletedCount);
      setTrashEntries([]);
    }
  }, [trashManager, context]);

  const lifecycleChecksum = useMemo(() => {
    return deterministicHash(
      JSON.stringify([
        trashEntries.map((t) => t.entryChecksum),
        archiveEntries.map((a) => a.entryChecksum),
        deletionCount,
      ])
    );
  }, [trashEntries, archiveEntries, deletionCount]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.23 — User Workspace Trash, Archive & Recovery</h2>
          <span style={styles.subtitle}>
            Deterministic State Lifecycle Management, Cascade Safety & Cold Storage Recovery (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.actionToolbar}>
        <button onClick={handleMoveSampleToTrash} style={styles.actionBtn}>
          + Move Sample Space to Trash
        </button>
        <button onClick={handleMoveSampleToArchive} style={styles.actionBtn}>
          + Archive Sample Space
        </button>
      </div>

      <div style={styles.mainGrid}>
        {/* Left Column: Trash */}
        <div style={styles.col}>
          <P623TrashPanel
            trashEntries={trashEntries}
            selectedTrashId={selectedTrashId}
            onSelectTrash={(t) => setSelectedTrashId(t.trashId)}
            onRestoreTrash={handleRestoreTrash}
            onPermanentDelete={handlePermanentDelete}
            onEmptyTrash={handleEmptyTrash}
            isOwner={context.userRole === 'OWNER'}
          />
        </div>

        {/* Center Column: Archive */}
        <div style={{ ...styles.col, flex: 1.2 }}>
          <P623ArchivePanel
            archiveEntries={archiveEntries}
            selectedArchiveId={selectedArchiveId}
            onSelectArchive={(a) => setSelectedArchiveId(a.archiveId)}
            onRestoreArchive={handleRestoreArchive}
          />
        </div>

        {/* Right Column: Recovery & Telemetry */}
        <div style={styles.col}>
          <P623RecoveryPanel
            lastRecovery={lastRecovery}
            recoveryError={recoveryError}
          />
          <div style={{ marginTop: 16 }}>
            <P623LifecycleInspector
              activeCount={10}
              trashCount={trashEntries.length}
              archiveCount={archiveEntries.length}
              deletedCount={deletionCount}
              lifecycleChecksum={lifecycleChecksum}
              userRole={context.userRole}
              causalityPassed={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0A0B10',
    color: '#E0E0E0',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: 16,
    boxSizing: 'border-box',
    gap: 16,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1E202F',
    paddingBottom: 12,
  },
  headerTitle: {
    margin: 0,
    fontSize: 18,
    color: '#00E5FF',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    color: '#8A8F9E',
  },
  exitBtn: {
    background: '#1E202F',
    color: '#90CAF9',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 12,
  },
  actionToolbar: {
    display: 'flex',
    gap: 10,
  },
  actionBtn: {
    background: '#1E202F',
    color: '#00E5FF',
    border: '1px solid #00E5FF',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr 340px',
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export default P623ResearchHarness;
