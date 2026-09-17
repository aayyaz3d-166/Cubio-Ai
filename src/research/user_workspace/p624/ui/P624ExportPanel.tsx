/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Package Export Panel
 */

import React from 'react';
import { WorkspacePackage } from '../types';

export interface P624ExportPanelProps {
  onExportSpace: () => void;
  onExportExperiment: () => void;
  onExportFullWorkspace: () => void;
  lastExportedPackage: WorkspacePackage | null;
}

export const P624ExportPanel: React.FC<P624ExportPanelProps> = ({
  onExportSpace,
  onExportExperiment,
  onExportFullWorkspace,
  lastExportedPackage,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Export</h3>
      <span style={styles.description}>
        Serializes authorized workspace state into deterministic, validated packages without mutating Reality.
      </span>

      <div style={styles.buttonGrid}>
        <button onClick={onExportSpace} style={styles.exportBtn}>
          Export Space + Assets
        </button>
        <button onClick={onExportExperiment} style={styles.exportBtn}>
          Export Experiment
        </button>
        <button onClick={onExportFullWorkspace} style={styles.exportBtn}>
          Export Full Workspace
        </button>
      </div>

      {lastExportedPackage && (
        <div style={styles.pkgSummary}>
          <div style={styles.row}>
            <span style={styles.label}>Exported Package:</span>
            <span style={styles.pkgId}>{lastExportedPackage.packageId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Entities:</span>
            <span style={styles.value}>{lastExportedPackage.entities.length}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Package CS:</span>
            <span style={styles.checksum}>{lastExportedPackage.packageChecksum}</span>
          </div>
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
  buttonGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  exportBtn: {
    background: '#1E202F',
    color: '#00E5FF',
    border: '1px solid #00E5FF',
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  pkgSummary: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    borderTop: '1px solid #2A2D3E',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    color: '#8A8F9E',
  },
  pkgId: {
    color: '#90CAF9',
    fontFamily: 'monospace',
  },
  value: {
    color: '#FFF',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
  },
};
