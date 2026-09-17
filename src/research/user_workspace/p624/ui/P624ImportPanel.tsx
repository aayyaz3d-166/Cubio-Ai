/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Workspace Package Import Panel
 */

import React from 'react';
import { WorkspacePackage, ImportPreview, ImportResult } from '../types';

export interface P624ImportPanelProps {
  packageToImport: WorkspacePackage | null;
  importPreview: ImportPreview | null;
  lastImportResult: ImportResult | null;
  onPreviewPackage: () => void;
  onExecuteImport: () => void;
  onCancelImport: () => void;
}

export const P624ImportPanel: React.FC<P624ImportPanelProps> = ({
  packageToImport,
  importPreview,
  lastImportResult,
  onPreviewPackage,
  onExecuteImport,
  onCancelImport,
}) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Import</h3>
      <span style={styles.description}>
        Transactional, validation-gated package restoration with immutable preview and collision resolution.
      </span>

      {!packageToImport ? (
        <div style={styles.emptyBox}>No package selected for import. Export or load a package to proceed.</div>
      ) : (
        <div style={styles.content}>
          <div style={styles.infoRow}>
            <span>Package: <strong style={{ color: '#00E5FF' }}>{packageToImport.packageId}</strong></span>
            <span>Entities: {packageToImport.entities.length}</span>
          </div>

          <div style={styles.btnRow}>
            <button onClick={onPreviewPackage} style={styles.previewBtn}>
              Generate Import Preview
            </button>
            {importPreview && (
              <button onClick={onExecuteImport} style={styles.importBtn}>
                Commit Import
              </button>
            )}
            <button onClick={onCancelImport} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>

          {lastImportResult && (
            <div
              style={{
                ...styles.resultBox,
                borderColor: lastImportResult.success ? '#81C784' : '#FF8A80',
              }}
            >
              <div style={styles.row}>
                <span style={styles.label}>Transaction:</span>
                <span style={styles.val}>{lastImportResult.transactionId}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Status:</span>
                <span
                  style={{
                    color: lastImportResult.success ? '#81C784' : '#FF8A80',
                    fontWeight: 600,
                  }}
                >
                  {lastImportResult.status}
                </span>
              </div>
              {lastImportResult.error && (
                <div style={{ color: '#FFCDD2', fontSize: 10, marginTop: 4 }}>
                  {lastImportResult.error}
                </div>
              )}
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
  },
  btnRow: {
    display: 'flex',
    gap: 8,
  },
  previewBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  importBtn: {
    background: '#2E7D32',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#37474F',
    color: '#B0BEC5',
    border: 'none',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 11,
    cursor: 'pointer',
  },
  resultBox: {
    background: '#181A28',
    borderRadius: 6,
    padding: 10,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    color: '#8A8F9E',
  },
  val: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
};
