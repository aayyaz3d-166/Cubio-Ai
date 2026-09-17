/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Validation & Boundary Monitor Panel
 */

import React from 'react';
import { SearchValidationReport, SearchExportPackage } from '../types';

export interface P614ValidationPanelProps {
  validationReport: SearchValidationReport | null;
  exportPackage: SearchExportPackage | null;
  causalityPassed: boolean;
  onExport: () => void;
}

export const P614ValidationPanel: React.FC<P614ValidationPanelProps> = ({
  validationReport,
  exportPackage,
  causalityPassed,
  onExport,
}) => {
  const isValid = validationReport?.isValid ?? true;

  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h4 style={styles.title}>System Validation & Causality Monitor</h4>
        <button onClick={onExport} style={styles.exportBtn}>
          Export Research Package
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.label}>Index Status:</span>
          <span
            style={{
              ...styles.badge,
              background: isValid ? '#1B5E20' : '#B71C1C',
              color: isValid ? '#A5D6A7' : '#EF9A9A',
            }}
          >
            {validationReport?.status ?? 'SEARCH_VALID'}
          </span>
        </div>

        <div style={styles.item}>
          <span style={styles.label}>Causality Status:</span>
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

        <div style={styles.item}>
          <span style={styles.label}>Export Status:</span>
          <span
            style={{
              ...styles.badge,
              background:
                exportPackage?.status === 'RESEARCH_EXPORT_READY'
                  ? '#0D47A1'
                  : '#37474F',
              color:
                exportPackage?.status === 'RESEARCH_EXPORT_READY'
                  ? '#90CAF9'
                  : '#B0BEC5',
            }}
          >
            {exportPackage?.status ?? 'IDLE'}
          </span>
        </div>
      </div>

      {validationReport && validationReport.issues.length > 0 && (
        <div style={styles.issuesContainer}>
          <span style={styles.issuesTitle}>Validation Issues:</span>
          {validationReport.issues.map((iss, idx) => (
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  exportBtn: {
    background: '#00B0FF',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
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
