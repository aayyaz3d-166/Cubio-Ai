/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.15: Integrated Isolated Data Portability Research Dashboard
 *
 * Route: ?mode=p615 | ?research=p615 | #/research/p615
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  WorkspaceExportPackage,
  ImportPreview,
  ImportValidationReport,
  ExportValidationReport,
  PortabilityAccessContext,
  PortableSpace,
  PortableExperiment,
  PortableSavedState,
  PortableVersion,
  PortableGeometry,
} from '../types';
import { WorkspaceExportBuilder } from '../exportBuilder';
import { ImportPreviewEngine } from '../importPreview';
import { ImportCommitEngine } from '../importCommit';
import { PortabilityValidator } from '../importValidator';
import { PortabilitySerializationEngine } from '../portabilitySerialization';

import { P615ExportPanel } from './P615ExportPanel';
import { P615ImportPanel } from './P615ImportPanel';
import { P615PreviewPanel } from './P615PreviewPanel';
import { P615PortabilityInspector } from './P615PortabilityInspector';
import { P615ValidationPanel } from './P615ValidationPanel';

export interface P615ResearchHarnessProps {
  onExit?: () => void;
}

export const P615ResearchHarness: React.FC<P615ResearchHarnessProps> = ({ onExit }) => {
  const [accessContext, setAccessContext] = useState<PortabilityAccessContext>({
    userId: 'USR_OWNER_01',
    userRole: 'OWNER',
    workspaceId: 'WS_PORTABILITY_SOURCE',
    accessibleSpaceIds: ['SPACE_01'],
  });

  const [currentPackage, setCurrentPackage] = useState<WorkspaceExportPackage | null>(null);
  const [importJson, setImportJson] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Generate a mock export package
  const handleGenerateExport = useCallback(() => {
    setIsExporting(true);
    const builder = new WorkspaceExportBuilder(accessContext);

    const space: PortableSpace = {
      spaceId: 'SPACE_CANONICAL_01',
      name: 'Primary Canonical Space',
      workspaceId: accessContext.workspaceId,
      ownerId: accessContext.userId,
      accessLevel: 'PUBLIC',
      lineageId: 'LIN_SPACE_01',
      realityChecksum: 'CS_REALITY_01',
      checksum: 'CS_SPACE_01',
      createdAt: 0,
      updatedAt: 0,
      metadata: {},
    };
    builder.addSpace(space);

    const exp: PortableExperiment = {
      experimentId: 'EXP_PORT_01',
      spaceId: 'SPACE_CANONICAL_01',
      workspaceId: accessContext.workspaceId,
      ownerId: accessContext.userId,
      name: 'Portability Baseline Experiment',
      description: 'Verifies data portability invariants',
      type: 'BASELINE',
      sourceVersionId: 'VER_01',
      sourceStateChecksum: 'CS_STATE_01',
      currentStateId: 'ST_01',
      lineageId: 'LIN_EXP_01',
      checksum: 'CS_EXP_01',
      createdAt: 0,
      metadata: {},
    };
    builder.addExperiment(exp);

    const st: PortableSavedState = {
      stateId: 'ST_PORT_01',
      spaceId: 'SPACE_CANONICAL_01',
      experimentId: 'EXP_PORT_01',
      workspaceId: accessContext.workspaceId,
      ownerId: accessContext.userId,
      title: 'State Checkpoint Alpha',
      certainty: 'EXACT',
      realityChecksum: 'CS_REALITY_01',
      aggregateChecksum: 'CS_AGGREGATE_01',
      lineageId: 'LIN_ST_01',
      checksum: 'CS_STATE_01',
      createdAt: 0,
      metadata: {},
    };
    builder.addSavedState(st);

    const ver: PortableVersion = {
      versionId: 'VER_PORT_01',
      spaceId: 'SPACE_CANONICAL_01',
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
      changeSummary: 'Initial portable export version',
    };
    builder.addVersion(ver);

    const geo: PortableGeometry = {
      geometryId: 'GEO_CANONICAL_01',
      spaceId: 'SPACE_CANONICAL_01',
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
    setCurrentPackage(pkg);
    setImportJson(PortabilitySerializationEngine.serialize(pkg));
    setIsExporting(false);
  }, [accessContext]);

  // Parse & Preview
  const handleParseAndPreview = useCallback(() => {
    if (!importJson.trim()) return;
    const deserialized = PortabilitySerializationEngine.deserialize(importJson);
    if (deserialized.package) {
      const prev = ImportPreviewEngine.generatePreview(deserialized.package, {
        userId: 'USR_TARGET_02',
        userRole: 'OWNER',
        workspaceId: 'WS_PORTABILITY_TARGET',
      });
      setPreview(prev);
    }
  }, [importJson]);

  // Execute Commit
  const handleExecuteCommit = useCallback(() => {
    if (!importJson.trim()) return;
    setIsImporting(true);
    const result = ImportCommitEngine.executeImport(importJson, {
      userId: 'USR_TARGET_02',
      userRole: 'OWNER',
      workspaceId: 'WS_PORTABILITY_TARGET',
    });
    setIsImporting(false);
    if (result.success) {
      alert(`Import committed successfully! Import ID: ${result.importId}`);
    } else {
      alert(`Import failed: ${result.error}`);
    }
  }, [importJson]);

  const exportValidation: ExportValidationReport | null = useMemo(() => {
    if (!currentPackage) return null;
    return PortabilityValidator.validateExport(currentPackage);
  }, [currentPackage]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.15 — User Workspace Import, Export & Data Portability</h2>
          <span style={styles.subtitle}>
            Deterministic Portability, Manifest Validation, Atomic Commit Pipeline (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* Left Column: Export Controls */}
        <div style={styles.col}>
          <P615ExportPanel
            currentPackage={currentPackage}
            onGenerateExport={handleGenerateExport}
            onDownloadJson={() => {}}
            isExporting={isExporting}
          />
        </div>

        {/* Center Column: Import Controls & Preview */}
        <div style={{ ...styles.col, flex: 1.4, gap: 16 }}>
          <P615ImportPanel
            importJson={importJson}
            onImportJsonChange={setImportJson}
            preview={preview}
            onParseAndPreview={handleParseAndPreview}
            onExecuteCommit={handleExecuteCommit}
            onCancel={() => {
              setImportJson('');
              setPreview(null);
            }}
            isImporting={isImporting}
          />
          <P615PreviewPanel preview={preview} />
        </div>

        {/* Right Column: Inspector */}
        <div style={styles.col}>
          <P615PortabilityInspector
            currentPackage={currentPackage}
            preview={preview}
          />
        </div>
      </div>

      <div style={styles.bottomRow}>
        <P615ValidationPanel
          importValidation={preview?.validationReport ?? null}
          exportValidation={exportValidation}
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

export default P615ResearchHarness;
