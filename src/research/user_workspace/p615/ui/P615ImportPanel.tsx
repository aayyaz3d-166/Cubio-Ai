/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Import Controls Panel
 */

import React from 'react';
import { ImportPreview } from '../types';

export interface P615ImportPanelProps {
  importJson: string;
  onImportJsonChange: (text: string) => void;
  preview: ImportPreview | null;
  onParseAndPreview: () => void;
  onExecuteCommit: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

export const P615ImportPanel: React.FC<P615ImportPanelProps> = ({
  importJson,
  onImportJsonChange,
  preview,
  onParseAndPreview,
  onExecuteCommit,
  onCancel,
  isImporting,
}) => {
  const canCommit = preview !== null && preview.validationReport.isValid;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Workspace Import</h3>
      <span style={styles.description}>
        Paste or load a JSON package. Validation & read-only preview occur before any commit is executed.
      </span>

      <textarea
        placeholder="Paste exported package JSON here..."
        value={importJson}
        onChange={(e) => onImportJsonChange(e.target.value)}
        style={styles.textarea}
      />

      <div style={styles.btnRow}>
        <button onClick={onParseAndPreview} style={styles.primaryBtn}>
          Parse & Preview
        </button>

        <button
          onClick={onExecuteCommit}
          disabled={!canCommit || isImporting}
          style={{
            ...styles.commitBtn,
            opacity: canCommit && !isImporting ? 1 : 0.5,
            cursor: canCommit && !isImporting ? 'pointer' : 'not-allowed',
          }}
        >
          {isImporting ? 'Importing...' : 'Commit Import'}
        </button>

        <button onClick={onCancel} style={styles.secondaryBtn}>
          Reset
        </button>
      </div>
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
  textarea: {
    background: '#1E202F',
    border: '1px solid #3B3F58',
    borderRadius: 4,
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 11,
    height: 110,
    padding: 8,
    resize: 'none',
  },
  btnRow: {
    display: 'flex',
    gap: 8,
  },
  primaryBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  commitBtn: {
    background: '#388E3C',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontWeight: 600,
    fontSize: 12,
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
};
