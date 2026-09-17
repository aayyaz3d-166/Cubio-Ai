/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Portability Validation & Boundary Monitor Panel
 */

import React from 'react';
import { ImportValidationReport, ExportValidationReport } from '../types';

export interface P615ValidationPanelProps {
  importValidation: ImportValidationReport | null;
  exportValidation: ExportValidationReport | null;
  causalityPassed: boolean;
}

export const P615ValidationPanel: React.FC<P615ValidationPanelProps> = ({
  importValidation,
  exportValidation,
  causalityPassed,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Portability Validation & Causality Monitor</h4>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.label}>Export Validation:</span>
          <span
            style={{
              ...styles.badge,
              background:
                exportValidation?.status === 'EXPORT_VALID' ? '#1B5E20' : '#37474F',
              color:
                exportValidation?.status === 'EXPORT_VALID' ? '#A5D6A7' : '#B0BEC5',
            }}
          >
            {exportValidation?.status ?? 'READY'}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Import Validation:</span>
          <span
            style={{
              ...styles.badge,
              background:
                importValidation?.status === 'IMPORT_VALID'
                  ? '#1B5E20'
                  : importValidation
                  ? '#B71C1C'
                  : '#37474F',
              color:
                importValidation?.status === 'IMPORT_VALID'
                  ? '#A5D6A7'
                  : importValidation
                  ? '#EF9A9A'
                  : '#B0BEC5',
            }}
          >
            {importValidation?.status ?? 'AWAITING_PACKAGE'}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Reality Invariance:</span>
          <span
            style={{
              ...styles.badge,
              background: causalityPassed ? '#1B5E20' : '#B71C1C',
              color: causalityPassed ? '#A5D6A7' : '#EF9A9A',
            }}
          >
            {causalityPassed ? 'INVARIANTS PRESERVED' : 'BREACH DETECTED'}
          </span>
        </div>
      </div>

      {importValidation && importValidation.issues.length > 0 && (
        <div style={styles.issuesContainer}>
          <span style={styles.issuesTitle}>Validation Issues:</span>
          {importValidation.issues.map((iss, idx) => (
            <div key={idx} style={styles.issueText}>
              • {iss}
            </div>
          ))}
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
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#8A8F9E',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  issuesContainer: {
    background: '#2B151A',
    border: '1px solid #E57373',
    borderRadius: 4,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  issuesTitle: {
    fontSize: 11,
    color: '#FF8A80',
    fontWeight: 600,
  },
  issueText: {
    fontSize: 11,
    color: '#FFCDD2',
  },
};
