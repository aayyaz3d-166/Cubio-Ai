/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.24: Integrated Workspace Import, Export & Portability Dashboard
 *
 * Route: ?mode=p624 | ?research=p624 | #/research/p624
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  WorkspacePackage,
  PackageEntity,
  ImportPreview,
  ImportResult,
  PackageValidationReport,
  PortabilityPermissionContext,
} from '../types';
import { WorkspaceExportEngine } from '../workspaceExport';
import { WorkspaceImportEngine } from '../workspaceImport';

import { P624ExportPanel } from './P624ExportPanel';
import { P624ImportPanel } from './P624ImportPanel';
import { P624ConflictPanel } from './P624ConflictPanel';
import { P624PackageInspector } from './P624PackageInspector';

export interface P624ResearchHarnessProps {
  onExit?: () => void;
}

export const P624ResearchHarness: React.FC<P624ResearchHarnessProps> = ({ onExit }) => {
  const context: PortabilityPermissionContext = useMemo(
    () => ({
      userId: 'USR_OWNER_01',
      userRole: 'OWNER',
      workspaceId: 'WS_PORTABILITY_CANONICAL',
    }),
    []
  );

  const sampleSpace: PackageEntity = useMemo(
    () => ({
      entityId: 'SPACE_CANONICAL_01',
      entityType: 'SPACE',
      name: 'Primary Canonical Research Space',
      spaceId: 'SPACE_CANONICAL_01',
      ownerId: 'USR_OWNER_01',
      lineageId: 'LIN_SPACE_01',
      checksum: 'CS_SPACE_01',
      coordinates: [5, 3, 6] as const,
      certainty: 'EXACT',
    }),
    []
  );

  const sampleExp: PackageEntity = useMemo(
    () => ({
      entityId: 'EXP_BASELINE_01',
      entityType: 'EXPERIMENT',
      name: 'Baseline Photogrammetry Portability Experiment',
      spaceId: 'SPACE_CANONICAL_01',
      ownerId: 'USR_OWNER_01',
      lineageId: 'LIN_EXP_01',
      checksum: 'CS_EXP_01',
    }),
    []
  );

  const [lastExportedPackage, setLastExportedPackage] = useState<WorkspacePackage | null>(null);
  const [packageToImport, setPackageToImport] = useState<WorkspacePackage | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [validationReport, setValidationReport] = useState<PackageValidationReport | null>(null);

  // Export Space
  const handleExportSpace = useCallback(() => {
    const res = WorkspaceExportEngine.exportSpace(sampleSpace, [sampleExp], context);
    if (res.success && res.package) {
      setLastExportedPackage(res.package);
      setPackageToImport(res.package);
      const val = WorkspaceImportEngine.validatePackage(res.package, context);
      setValidationReport(val);
    }
  }, [sampleSpace, sampleExp, context]);

  // Export Experiment
  const handleExportExperiment = useCallback(() => {
    const res = WorkspaceExportEngine.exportExperiment(sampleExp, [], context);
    if (res.success && res.package) {
      setLastExportedPackage(res.package);
      setPackageToImport(res.package);
      const val = WorkspaceImportEngine.validatePackage(res.package, context);
      setValidationReport(val);
    }
  }, [sampleExp, context]);

  // Export Full Workspace
  const handleExportFullWorkspace = useCallback(() => {
    const res = WorkspaceExportEngine.exportWorkspace([sampleSpace, sampleExp], context);
    if (res.success && res.package) {
      setLastExportedPackage(res.package);
      setPackageToImport(res.package);
      const val = WorkspaceImportEngine.validatePackage(res.package, context);
      setValidationReport(val);
    }
  }, [sampleSpace, sampleExp, context]);

  // Preview Import
  const handlePreviewPackage = useCallback(() => {
    if (!packageToImport) return;
    const prev = WorkspaceImportEngine.previewImport(packageToImport, []);
    setImportPreview(prev);
  }, [packageToImport]);

  // Execute Import
  const handleExecuteImport = useCallback(() => {
    if (!packageToImport) return;
    const res = WorkspaceImportEngine.importPackage(packageToImport, [], context);
    setLastImportResult(res.result);
  }, [packageToImport, context]);

  // Cancel Import
  const handleCancelImport = useCallback(() => {
    WorkspaceImportEngine.cancelImport();
    setImportPreview(null);
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.24 — User Workspace Import, Export & Portability</h2>
          <span style={styles.subtitle}>
            Deterministic Serialization, Validation-Gated Representation & Transactional Restoration (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* Left Column: Export / Import controls */}
        <div style={styles.col}>
          <P624ExportPanel
            onExportSpace={handleExportSpace}
            onExportExperiment={handleExportExperiment}
            onExportFullWorkspace={handleExportFullWorkspace}
            lastExportedPackage={lastExportedPackage}
          />
          <div style={{ marginTop: 16 }}>
            <P624ImportPanel
              packageToImport={packageToImport}
              importPreview={importPreview}
              lastImportResult={lastImportResult}
              onPreviewPackage={handlePreviewPackage}
              onExecuteImport={handleExecuteImport}
              onCancelImport={handleCancelImport}
            />
          </div>
        </div>

        {/* Center Column: Conflicts & Preview */}
        <div style={{ ...styles.col, flex: 1.2 }}>
          <P624ConflictPanel conflicts={importPreview?.conflicts ?? []} />
          {importPreview && (
            <div style={styles.previewBox}>
              <h4 style={styles.previewTitle}>Package Entity Breakdown</h4>
              <div style={styles.previewGrid}>
                <span>Spaces: {importPreview.spacesCount}</span>
                <span>Experiments: {importPreview.experimentsCount}</span>
                <span>States: {importPreview.statesCount}</span>
                <span>Versions: {importPreview.versionsCount}</span>
                <span>Models: {importPreview.modelsCount}</span>
                <span>Geometries: {importPreview.geometriesCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Telemetry & Invariants */}
        <div style={styles.col}>
          <P624PackageInspector
            currentPackage={packageToImport}
            validationReport={validationReport}
            causalityPassed={true}
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
    gridTemplateColumns: '340px 1fr 340px',
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  previewBox: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  previewTitle: {
    margin: 0,
    fontSize: 14,
    color: '#00E5FF',
    fontWeight: 600,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    fontSize: 11,
    color: '#8A8F9E',
  },
};

export default P624ResearchHarness;
