/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Package Telemetry & Invariants Inspector
 */

import React from 'react';
import { WorkspacePackage, PackageValidationReport } from '../types';

export interface P624PackageInspectorProps {
  currentPackage: WorkspacePackage | null;
  validationReport: PackageValidationReport | null;
  causalityPassed: boolean;
}

export const P624PackageInspector: React.FC<P624PackageInspectorProps> = ({
  currentPackage,
  validationReport,
  causalityPassed,
}) => {
  return (
    <div style={styles.panel}>
      <h4 style={styles.title}>Package Telemetry & Invariants</h4>

      <div style={styles.section}>
        <div style={styles.row}>
          <span style={styles.label}>Package ID:</span>
          <span style={styles.val}>{currentPackage?.packageId ?? 'NONE'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Schema Version:</span>
          <span style={styles.val}>{currentPackage?.schemaVersion ?? '6.24.0'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Entity Count:</span>
          <span style={styles.val}>{currentPackage?.entities.length ?? 0}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Validation Status:</span>
          <span
            style={{
              color: validationReport?.isValid ? '#81C784' : '#FF8A80',
              fontWeight: 600,
            }}
          >
            {validationReport?.status ?? 'UNVALIDATED'}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Reality Invariance:</span>
          <span style={{ color: causalityPassed ? '#81C784' : '#FF8A80', fontWeight: 600 }}>
            {causalityPassed ? 'INVARIANTS PRESERVED' : 'BREACH'}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Package CS:</span>
          <span style={styles.checksum}>{currentPackage?.packageChecksum ?? 'N/A'}</span>
        </div>
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
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  section: {
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
    color: '#8A8F9E',
  },
  val: {
    color: '#FFF',
    fontFamily: 'monospace',
  },
  checksum: {
    color: '#FFD54F',
    fontFamily: 'monospace',
    fontSize: 10,
  },
};
