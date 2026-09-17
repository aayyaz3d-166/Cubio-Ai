/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.20: Integrated Isolated Workspace Audit & Recovery Dashboard
 *
 * Route: ?mode=p620 | ?research=p620 | #/research/p620
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  AuditableWorkspace,
  WorkspaceAudit,
  RecoveryCheckpoint,
  RecoveryResult,
  RecoveryState,
} from '../types';
import { WorkspaceAuditEngine } from '../workspaceAudit';
import { CheckpointManager } from '../checkpointManager';
import { WorkspaceRecoveryEngine } from '../recoveryEngine';

import { P620AuditPanel } from './P620AuditPanel';
import { P620CheckpointPanel } from './P620CheckpointPanel';
import { P620RecoveryPanel } from './P620RecoveryPanel';
import { P620IntegrityPanel } from './P620IntegrityPanel';

export interface P620ResearchHarnessProps {
  onExit?: () => void;
}

export const P620ResearchHarness: React.FC<P620ResearchHarnessProps> = ({ onExit }) => {
  // Sample Canonical Workspace
  const sampleWorkspace: AuditableWorkspace = useMemo(() => {
    return {
      workspaceId: 'WS_CANONICAL_P620',
      ownerId: 'USR_OWNER_01',
      spaces: [
        {
          spaceId: 'SPACE_PRIMARY_01',
          name: 'Primary Canonical Research Space',
          workspaceId: 'WS_CANONICAL_P620',
          ownerId: 'USR_OWNER_01',
          accessLevel: 'PUBLIC',
          lineageId: 'LIN_SPACE_01',
          realityChecksum: 'CS_REALITY_CANONICAL_01',
          checksum: 'CS_SPACE_01',
        },
      ],
      experiments: [
        {
          experimentId: 'EXP_BASELINE_01',
          spaceId: 'SPACE_PRIMARY_01',
          name: 'Audit Baseline Experiment',
          type: 'BASELINE',
          sourceVersionId: 'VER_ROOT_01',
          sourceStateChecksum: 'CS_STATE_01',
          currentStateId: 'ST_CHECKPOINT_01',
          lineageId: 'LIN_EXP_01',
          checksum: 'CS_EXP_01',
        },
      ],
      realityStates: [
        {
          realityStateId: 'REALITY_CANONICAL_01',
          spaceId: 'SPACE_PRIMARY_01',
          realityChecksum: 'CS_REALITY_CANONICAL_01',
          canonicalCoordinates: [5, 3, 6],
          certainty: 'EXACT',
          isAuthoritative: true,
        },
      ],
      models: [
        {
          modelId: 'MOD_CHAIR_01',
          spaceId: 'SPACE_PRIMARY_01',
          name: 'Ergonomic Chair Model',
          objectCount: 4,
          modelChecksum: 'CS_MODEL_01',
        },
      ],
      geometries: [
        {
          geometryId: 'GEO_CANONICAL_01',
          spaceId: 'SPACE_PRIMARY_01',
          name: 'Canonical Anchor [5, 3, 6]',
          entityType: 'GEOMETRY_OBJECT',
          certainty: 'EXACT',
          coordinates: [5, 3, 6],
          geometryChecksum: 'CS_GEO_01',
          lineageId: 'LIN_GEO_01',
        },
      ],
      savedStates: [
        {
          stateId: 'ST_CHECKPOINT_01',
          spaceId: 'SPACE_PRIMARY_01',
          title: 'Calibrated Coordinate State Alpha',
          certainty: 'EXACT',
          realityChecksum: 'CS_REALITY_CANONICAL_01',
          aggregateChecksum: 'CS_AGGREGATE_01',
          lineageId: 'LIN_ST_01',
          checksum: 'CS_STATE_01',
          createdAt: 0,
        },
      ],
      versions: [
        {
          versionId: 'VER_ROOT_01',
          spaceId: 'SPACE_PRIMARY_01',
          label: 'v1.0.0',
          parentVersionId: null,
          versionType: 'INITIAL',
          versionIndex: 0,
          stateChecksum: 'CS_STATE_01',
          lineageId: 'LIN_VER_01',
          checksum: 'CS_VER_01',
        },
      ],
      timelines: [
        {
          timelineId: 'TL_01',
          spaceId: 'SPACE_PRIMARY_01',
          eventType: 'WORKSPACE_INITIALIZED',
          timestamp: 0,
          stateChecksum: 'CS_STATE_01',
          details: 'Initial workspace timeline event',
        },
      ],
      collaborations: [
        {
          collaborationId: 'COL_01',
          spaceId: 'SPACE_PRIMARY_01',
          participantRoles: { USR_OWNER_01: 'OWNER' },
          permissionsChecksum: 'CS_PERM_01',
        },
      ],
      workspaceChecksum: 'CS_WORKSPACE_CANONICAL_01',
    };
  }, []);

  const [audit, setAudit] = useState<WorkspaceAudit | null>(() => WorkspaceAuditEngine.auditWorkspace(sampleWorkspace));
  const [checkpoints, setCheckpoints] = useState<RecoveryCheckpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<RecoveryCheckpoint | null>(null);
  const [lastResult, setLastResult] = useState<RecoveryResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Run Graph Audit
  const handleRunAudit = useCallback(() => {
    setIsAuditing(true);
    const result = WorkspaceAuditEngine.auditWorkspace(sampleWorkspace);
    setAudit(result);
    setIsAuditing(false);
  }, [sampleWorkspace]);

  // Create Checkpoint
  const handleCreateCheckpoint = useCallback(() => {
    const recoveryState: RecoveryState = {
      space: sampleWorkspace.spaces[0],
      experiment: sampleWorkspace.experiments[0],
      realityState: sampleWorkspace.realityStates[0],
      models: sampleWorkspace.models,
      geometries: sampleWorkspace.geometries,
      savedState: sampleWorkspace.savedStates[0],
      version: sampleWorkspace.versions[0],
      timeline: sampleWorkspace.timelines[0],
      collaboration: sampleWorkspace.collaborations[0],
      stateChecksum: 'CS_AGGREGATE_01',
    };

    const chk = CheckpointManager.createCheckpoint(
      recoveryState,
      { observerId: 'OBS_01' },
      { dimension: '3D' },
      { zoom: 1.0 }
    );

    setCheckpoints((prev) => [chk, ...prev]);
    setSelectedCheckpoint(chk);
  }, [sampleWorkspace]);

  // Restore Checkpoint
  const handleRestoreCheckpoint = useCallback((chk: RecoveryCheckpoint) => {
    setIsRestoring(true);
    const result = WorkspaceRecoveryEngine.restoreCheckpoint(chk);
    setLastResult(result);
    setIsRestoring(false);
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.20 — User Workspace Audit, Integrity & Recovery</h2>
          <span style={styles.subtitle}>
            Deterministic State Graph Audit, Immutable Checkpoints, Causal Boundaries (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* Left Column: Graph Audit */}
        <div style={styles.col}>
          <P620AuditPanel
            audit={audit}
            onRunAudit={handleRunAudit}
            isAuditing={isAuditing}
          />
        </div>

        {/* Center Column: Recovery Checkpoints */}
        <div style={{ ...styles.col, flex: 1.4 }}>
          <P620CheckpointPanel
            checkpoints={checkpoints}
            selectedCheckpointId={selectedCheckpoint?.checkpointId ?? null}
            onSelectCheckpoint={setSelectedCheckpoint}
            onRestoreCheckpoint={handleRestoreCheckpoint}
            onCreateCheckpoint={handleCreateCheckpoint}
            isRestoring={isRestoring}
          />
        </div>

        {/* Right Column: Recovery Output */}
        <div style={styles.col}>
          <P620RecoveryPanel lastResult={lastResult} />
        </div>
      </div>

      <div style={styles.bottomRow}>
        <P620IntegrityPanel
          report={audit?.integrityReport ?? null}
          causalityPassed={true}
        />
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
    gridTemplateColumns: '320px 1fr 340px',
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  bottomRow: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export default P620ResearchHarness;
