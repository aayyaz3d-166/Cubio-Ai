/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Export Controls Panel
 */

import React from 'react';
import { WorkspaceExportPackage } from '../types';

export interface P615ExportPanelProps {
  currentPackage: WorkspaceExportPackage | null;
  onGenerateExport: () => void;
  onDownloadJson: () => void;
  isExporting: boolean;
}

export const P615ExportPanel: React.FC<P615ExportPanelProps> = ({
  currentPackage,
  onGenerateExport,
  onDownloadJson,
  isExporting,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Export</h3>
      <span style={styles.description}>
        Construct deterministic, portable representation packages without exporting credentials or private secrets.
      </span>

      <div style={styles.btnGroup}>
        <button
          onClick={onGenerateExport}
          disabled={isExporting}
          style={styles.primaryBtn}
        >
          {isExporting ? 'Generating Package...' : 'Build Export Package'}
        </button>

        {currentPackage && (
          <button onClick={onDownloadJson} style={styles.secondaryBtn}>
            Download JSON Bundle
          </button>
        )}
      </div>

      {currentPackage && (
        <div style={styles.detailsBox}>
          <div style={styles.row}>
            <span style={styles.label}>Package ID:</span>
            <span style={styles.value}>{currentPackage.packageId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Spaces:</span>
            <span style={styles.value}>{currentPackage.spaces?.length ?? 0}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Experiments:</span>
            <span style={styles.value}>{currentPackage.experiments?.length ?? 0}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Saved States:</span>
            <span style={styles.value}>{currentPackage.savedStates?.length ?? 0}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Geometries:</span>
            <span style={styles.value}>{currentPackage.geometries?.length ?? 0}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Checksum:</span>
            <span style={styles.checksum}>{currentPackage.packageChecksum}</span>
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
  btnGroup: {
    display: 'flex',
    gap: 8,
  },
  primaryBtn: {
    background: '#00E5FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  secondaryBtn: {
    background: '#1E202F',
    color: '#90CAF9',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  detailsBox: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 11,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    color: '#9E9E9E',
  },
  value: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
