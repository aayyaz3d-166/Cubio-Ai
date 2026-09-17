/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.9: Sharing & Portable State Dashboard
 */

import React, { useState, useMemo, useReducer } from 'react';
import { SpaceManager } from '../../p68/spaceManager';
import { PersonalSpace } from '../../p68/types';
import { P68SpaceEditor } from '../../p68/ui/P68SpaceEditor';
import { SpaceExportEngine } from '../spaceExport';
import { SpaceImportEngine } from '../spaceImport';
import { SpaceCloneEngine } from '../spaceClone';
import { SharePackageEngine } from '../sharePackage';
import { ChecksumManifoldEngine } from '../checksumManifold';
import {
  ResearchExportPackage,
  ImportResult,
  SharePackage,
  ImportValidationReport,
} from '../types';
import { P69ExportPanel } from './P69ExportPanel';
import { P69ImportPanel } from './P69ImportPanel';
import { P69SharePackagePanel } from './P69SharePackagePanel';
import { P69ReadonlyWorkspace } from './P69ReadonlyWorkspace';
import { P69ProvenancePanel } from './P69ProvenancePanel';
import { P69ValidationPanel } from './P69ValidationPanel';
import { Share2 } from 'lucide-react';

export const P69SharingDashboard: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const spaceManager = useMemo(() => {
    const mgr = new SpaceManager();
    mgr.createSpace('Dr. Alice Chen', 'Original Research Space');
    return mgr;
  }, []);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const spaces = spaceManager.getRepository().list();
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => spaces[0]?.spaceId || '');
  const activeSpace: PersonalSpace | undefined = spaceManager.getRepository().get(activeSpaceId) || spaces[0];

  const [lastExport, setLastExport] = useState<ResearchExportPackage | null>(null);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [sharePackage, setSharePackage] = useState<SharePackage | null>(null);
  const [isReadonlyActive, setIsReadonlyActive] = useState<boolean>(false);

  const manifold = useMemo(() => {
    return activeSpace ? ChecksumManifoldEngine.computeManifold(activeSpace) : null;
  }, [activeSpace]);

  // ── Actions ──
  const handleExportSpace = () => {
    if (!activeSpace) return;
    const pkg = SpaceExportEngine.exportSpace(activeSpace);
    setLastExport(pkg);
    forceUpdate();
  };

  const handleCloneSpace = () => {
    if (!activeSpace) return;
    const { clonedSpace } = SpaceCloneEngine.cloneSpace(activeSpace);
    spaceManager.getRepository().create(clonedSpace);
    setActiveSpaceId(clonedSpace.spaceId);
    forceUpdate();
  };

  const handleCreateSharePackage = () => {
    if (!activeSpace) return;
    const sharePkg = SharePackageEngine.createSharePackage(activeSpace);
    setSharePackage(sharePkg);
    forceUpdate();
  };

  const handleImportPackage = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const res = SpaceImportEngine.importPackage(parsed, 'Dr. Alice Chen');
      setLastImportResult(res);
      if (res.success && res.importedSpace) {
        spaceManager.getRepository().create(res.importedSpace);
        setActiveSpaceId(res.importedSpace.spaceId);
      }
      forceUpdate();
    } catch (e: any) {
      setLastImportResult({
        success: false,
        importedSpace: null,
        provenance: null,
        validationReport: {
          isValid: false,
          status: 'CORRUPTED_PAYLOAD',
          issues: [`JSON parse error: ${e.message}`],
          reportChecksum: '00000000',
        },
      });
    }
  };

  if (isReadonlyActive && sharePackage) {
    return (
      <P69ReadonlyWorkspace
        space={sharePackage.payload.space}
        onExitReadonly={() => setIsReadonlyActive(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-bold text-purple-400">
            P6.9 — CONTROLLED SHARING & PORTABLE STATE
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Portable Space Representation</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: EXPORT & IMPORT CONTROLS */}
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P69ExportPanel
            activeSpace={activeSpace}
            lastExport={lastExport}
            onExportSpace={handleExportSpace}
            onCloneSpace={handleCloneSpace}
            onCreateSharePackage={handleCreateSharePackage}
          />
          <P69ImportPanel
            lastImportResult={lastImportResult}
            onImportPackage={handleImportPackage}
          />
        </div>

        {/* CENTER: 3D VIEWPORT CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P68SpaceEditor space={activeSpace} width={560} height={360} />
          {manifold && (
            <div className="flex gap-4 text-[8px] text-zinc-500 font-mono">
              <span>Reality CS: <strong className="text-cyan-400">{manifold.realityChecksum.slice(0, 8)}</strong></span>
              <span>Model CS: <strong className="text-purple-400">{manifold.modelChecksum.slice(0, 8)}</strong></span>
              <span>Geometry CS: <strong className="text-emerald-400">{manifold.geometryChecksum.slice(0, 8)}</strong></span>
              <span>View CS: <strong className="text-amber-400">{manifold.viewChecksum.slice(0, 8)}</strong></span>
            </div>
          )}
        </div>

        {/* RIGHT: SHARE PACKAGE & PROVENANCE */}
        <div className="w-[320px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P69SharePackagePanel
            sharePackage={sharePackage}
            onViewInReadonly={() => setIsReadonlyActive(true)}
          />
          <P69ProvenancePanel activeSpace={activeSpace} />
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <P69ValidationPanel
        validationReport={lastImportResult ? lastImportResult.validationReport : null}
      />
    </div>
  );
};
