/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.16: Integrated Isolated User Workspace Recovery Research Dashboard
 *
 * Route: ?mode=p616 | ?research=p616 | #/research/p616
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  RecoveryPoint,
  RecoveryPreview,
  RecoveryScope,
  RecoveryAccessContext,
  RecoverySpace,
  RecoveryExperiment,
  RecoverySavedState,
  RecoveryVersion,
  RecoveryGeometry,
} from '../types';
import { BackupBuilder } from '../backupBuilder';
import { RecoveryPointEngine } from '../recoveryPoint';
import { RecoveryValidator } from '../recoveryValidator';
import { RecoveryPreviewEngine } from '../recoveryPreview';
import { RestoreEngine } from '../restoreEngine';
import { RollbackEngine } from '../rollbackEngine';
import { RecoveryHistoryEngine } from '../recoveryHistory';

import { P616BackupPanel } from './P616BackupPanel';
import { P616RecoveryPanel } from './P616RecoveryPanel';
import { P616PreviewPanel } from './P616PreviewPanel';
import { P616RecoveryInspector } from './P616RecoveryInspector';
import { P616HistoryPanel } from './P616HistoryPanel';
import { P616ValidationPanel } from './P616ValidationPanel';

export interface P616ResearchHarnessProps {
  onExit?: () => void;
}

export const P616ResearchHarness: React.FC<P616ResearchHarnessProps> = ({ onExit }) => {
  const [accessContext, setAccessContext] = useState<RecoveryAccessContext>({
    userId: 'USR_OWNER_01',
    userRole: 'OWNER',
    workspaceId: 'WS_RECOVERY_CANONICAL',
    accessibleSpaceIds: ['SPACE_REC_01'],
  });

  const [activeChecksum, setActiveChecksum] = useState<string>('CS_ACTIVE_BASE_01');
  const [activeModelChecksum, setActiveModelChecksum] = useState<string>('CS_MODEL_ACTIVE_01');
  const [activeGeometryChecksum, setActiveGeometryChecksum] = useState<string>('CS_GEO_ACTIVE_01');

  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RecoveryPoint | null>(null);
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [historyEngine] = useState(() => new RecoveryHistoryEngine());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [rollbackChecksum, setRollbackChecksum] = useState<string | null>(null);

  // Trigger Backup
  const handleTriggerBackup = useCallback(
    (scope: RecoveryScope) => {
      setIsBackingUp(true);
      const builder = new BackupBuilder(accessContext, scope);

      const space: RecoverySpace = {
        spaceId: 'SPACE_REC_01',
        name: 'Canonical Recovery Space',
        workspaceId: accessContext.workspaceId,
        ownerId: accessContext.userId,
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_SPACE_REC_01',
        realityChecksum: 'CS_REALITY_01',
        checksum: 'CS_SPACE_01',
        createdAt: 0,
        updatedAt: 0,
        metadata: {},
      };
      builder.addSpace(space);

      const exp: RecoveryExperiment = {
        experimentId: 'EXP_REC_01',
        spaceId: 'SPACE_REC_01',
        workspaceId: accessContext.workspaceId,
        ownerId: accessContext.userId,
        name: 'Recovery Validation Experiment',
        description: 'Tests deterministic restoration',
        type: 'BASELINE',
        sourceVersionId: 'VER_REC_01',
        sourceStateChecksum: 'CS_STATE_01',
        currentStateId: 'ST_REC_01',
        lineageId: 'LIN_EXP_01',
        checksum: 'CS_EXP_01',
        createdAt: 0,
        metadata: {},
      };
      builder.addExperiment(exp);

      const st: RecoverySavedState = {
        stateId: 'ST_REC_01',
        spaceId: 'SPACE_REC_01',
        experimentId: 'EXP_REC_01',
        workspaceId: accessContext.workspaceId,
        ownerId: accessContext.userId,
        title: 'Checkpoint Beta',
        certainty: 'EXACT',
        realityChecksum: 'CS_REALITY_01',
        aggregateChecksum: 'CS_AGGREGATE_01',
        lineageId: 'LIN_ST_01',
        checksum: 'CS_STATE_01',
        createdAt: 0,
        metadata: {},
      };
      builder.addSavedState(st);

      const ver: RecoveryVersion = {
        versionId: 'VER_REC_01',
        spaceId: 'SPACE_REC_01',
        workspaceId: accessContext.workspaceId,
        ownerId: accessContext.userId,
        label: 'v1.0.0',
        parentVersionId: null,
        versionType: 'INITIAL',
        versionIndex: 0,
        stateChecksum: 'CS_STATE_01',
        lineageId: 'LIN_VER_01',
        checksum: 'CS_VER_01',
        createdAt: 0,
        changeSummary: 'Initial backup baseline',
      };
      builder.addVersion(ver);

      const geo: RecoveryGeometry = {
        geometryId: 'GEO_CANONICAL_01',
        spaceId: 'SPACE_REC_01',
        workspaceId: accessContext.workspaceId,
        name: 'Canonical Anchor [5, 3, 6]',
        entityType: 'GEOMETRY_OBJECT',
        certainty: 'EXACT',
        coordinates: [5, 3, 6],
        geometryChecksum: 'CS_GEO_01',
        lineageId: 'LIN_GEO_01',
      };
      builder.addGeometry(geo);

      const pkg = builder.build();
      const pt = RecoveryPointEngine.createRecoveryPoint(pkg);

      setRecoveryPoints((prev) => [pt, ...prev]);
      historyEngine.append(
        'BACKUP_CREATED',
        pt.recoveryPointId,
        activeChecksum,
        `Backup created for scope ${scope}`
      );
      setIsBackingUp(false);
    },
    [accessContext, activeChecksum, historyEngine]
  );

  // Select & Preview
  const handleSelectPoint = useCallback(
    (point: RecoveryPoint) => {
      setSelectedPoint(point);
      const prev = RecoveryPreviewEngine.generatePreview(
        point,
        activeChecksum,
        activeModelChecksum,
        activeGeometryChecksum,
        accessContext
      );
      setPreview(prev);
      historyEngine.append(
        'RECOVERY_PREVIEWED',
        point.recoveryPointId,
        activeChecksum,
        `Preview generated for point ${point.recoveryPointId}`
      );
    },
    [activeChecksum, activeModelChecksum, activeGeometryChecksum, accessContext, historyEngine]
  );

  // Validate
  const handleValidatePoint = useCallback(
    (point: RecoveryPoint) => {
      const val = RecoveryValidator.validate(point.package, accessContext);
      historyEngine.append(
        'BACKUP_VALIDATED',
        point.recoveryPointId,
        activeChecksum,
        `Validation result: ${val.status}`
      );
      alert(`Recovery Point Validation: ${val.status} (Issues: ${val.issues.length})`);
    },
    [accessContext, activeChecksum, historyEngine]
  );

  // Restore
  const handleRestorePoint = useCallback(
    (point: RecoveryPoint) => {
      setIsRestoring(true);
      historyEngine.append('RESTORE_STARTED', point.recoveryPointId, activeChecksum, 'Restore pipeline started');

      const result = RestoreEngine.executeRestore(
        point,
        activeChecksum,
        activeModelChecksum,
        activeGeometryChecksum,
        accessContext
      );

      setIsRestoring(false);

      if (result.success && result.restoredChecksum) {
        setRollbackChecksum(activeChecksum);
        setActiveChecksum(result.restoredChecksum);
        historyEngine.append(
          'RESTORE_COMPLETED',
          point.recoveryPointId,
          result.restoredChecksum,
          `Restored ${result.committedSpaces.length} spaces, ${result.committedGeometries.length} geometries`
        );
        alert(`Restore Committed Successfully! (Restored CS: ${result.restoredChecksum})`);
      } else {
        historyEngine.append(
          'RESTORE_FAILED',
          point.recoveryPointId,
          activeChecksum,
          `Restore failed: ${result.error}`
        );
        alert(`Restore Failed: ${result.error}`);
      }
    },
    [activeChecksum, activeModelChecksum, activeGeometryChecksum, accessContext, historyEngine]
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.16 — User Workspace Recovery, Backup & Restoration</h2>
          <span style={styles.subtitle}>
            Deterministic Recovery Points, Read-Only Preview, Transactional Restore & Rollback (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* Left Column: Backup & Recovery Points */}
        <div style={{ ...styles.col, gap: 16 }}>
          <P616BackupPanel onTriggerBackup={handleTriggerBackup} isBackingUp={isBackingUp} />
          <P616RecoveryPanel
            recoveryPoints={recoveryPoints}
            selectedPointId={selectedPoint?.recoveryPointId ?? null}
            onSelectPoint={handleSelectPoint}
            onRestorePoint={handleRestorePoint}
            onValidatePoint={handleValidatePoint}
            isRestoring={isRestoring}
          />
        </div>

        {/* Center Column: Recovery Preview */}
        <div style={{ ...styles.col, flex: 1.4 }}>
          <P616PreviewPanel preview={preview} />
        </div>

        {/* Right Column: Recovery Inspector */}
        <div style={styles.col}>
          <P616RecoveryInspector
            selectedPoint={selectedPoint}
            preview={preview}
            activeChecksum={activeChecksum}
          />
        </div>
      </div>

      <div style={styles.bottomRow}>
        <div style={{ flex: 1 }}>
          <P616HistoryPanel history={historyEngine.getHistory()} />
        </div>
        <div style={{ flex: 1 }}>
          <P616ValidationPanel
            validationStatus={preview?.validationReport.status ?? null}
            causalityPassed={true}
            rollbackChecksum={rollbackChecksum}
          />
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr 320px',
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
};

export default P616ResearchHarness;
