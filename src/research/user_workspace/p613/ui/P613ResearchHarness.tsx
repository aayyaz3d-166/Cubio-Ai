/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: User Workspace Versioning & State Timeline Research Harness Dashboard
 */

import React, { useState, useMemo, useReducer } from 'react';
import { SpaceManager } from '../../p68/spaceManager';
import { PersonalSpace } from '../../p68/types';
import { P68SpaceEditor } from '../../p68/ui/P68SpaceEditor';
import { VersionManager } from '../versionManager';
import { TimelineCoordinator } from '../timeline';
import { VersionDiffEngine } from '../versionDiff';
import { RestoreEngine } from '../restore';
import { BranchingEngine } from '../branching';
import { VersionHistoryLogger } from '../versionHistory';
import { VersionValidator } from '../versionValidator';
import { WorkspaceVersion } from '../types';
import { P613TimelinePanel } from './P613TimelinePanel';
import { P613VersionInspector } from './P613VersionInspector';
import { P613VersionDiffPanel } from './P613VersionDiffPanel';
import { P613RestorePanel } from './P613RestorePanel';
import { GitCommit } from 'lucide-react';

export const P613ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const workspaceId = 'WS_RESEARCH_ALICE_01';
  const ownerUserId = 'Dr. Alice Chen';

  const { spaceManager, initialSpace, versionManager, timelineCoordinator, historyLogger } =
    useMemo(() => {
      const sMgr = new SpaceManager();
      const sp = sMgr.createSpace(ownerUserId, 'Parametric Versioned Space', 'Historical state timeline');
      const vMgr = new VersionManager();
      const tCoord = new TimelineCoordinator();
      const hLogger = new VersionHistoryLogger();

      // Create V0 INITIAL
      const { version: v0 } = vMgr.createVersion(
        sp,
        'INITIAL',
        null,
        'Baseline initial workspace state',
        workspaceId,
        true
      );
      tCoord.appendVersion(v0);
      hLogger.logEvent({
        eventId: 'EVT_0',
        workspaceId,
        versionId: v0.versionId,
        eventType: 'VERSION_CREATED',
        description: 'Initialized V0 baseline state',
        timestamp: 0,
      });

      return {
        spaceManager: sMgr,
        initialSpace: sp,
        versionManager: vMgr,
        timelineCoordinator: tCoord,
        historyLogger: hLogger,
      };
    }, [workspaceId, ownerUserId]);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [currentSpace, setCurrentSpace] = useState<PersonalSpace>(initialSpace);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const versions = versionManager.listVersions(workspaceId);
  const selectedVersion = useMemo(() => {
    return selectedVersionId ? versionManager.getVersion(selectedVersionId) || null : null;
  }, [versionManager, selectedVersionId]);

  const latestVersion = versionManager.getLatestVersion(workspaceId);

  // Compute diff between selected version and latest version
  const diff = useMemo(() => {
    if (!selectedVersion || !latestVersion) return null;
    if (selectedVersion.versionId === latestVersion.versionId) {
      if (versions.length > 1) {
        const prev = versions[versions.length - 2];
        return VersionDiffEngine.compareVersions(prev, latestVersion);
      }
    }
    return VersionDiffEngine.compareVersions(selectedVersion, latestVersion);
  }, [selectedVersion, latestVersion, versions]);

  // Validation report
  const validationReport = useMemo(() => {
    if (versions.length === 0) {
      return {
        isValid: true,
        status: 'VERSION_VALID' as const,
        issues: [],
        reportChecksum: '00000000',
      };
    }
    return VersionValidator.validateVersion(versions[versions.length - 1], versions);
  }, [versions]);

  // ── Actions ──
  const handleSaveVersion = () => {
    const { version, isDuplicate } = versionManager.createVersion(
      currentSpace,
      'SAVE',
      null,
      'Manual workspace save',
      workspaceId
    );
    if (!isDuplicate) {
      timelineCoordinator.appendVersion(version);
      historyLogger.logEvent({
        eventId: `EVT_${versions.length}`,
        workspaceId,
        versionId: version.versionId,
        eventType: 'VERSION_CREATED',
        description: `Saved V${version.versionIndex}`,
        timestamp: 0,
      });
      setSelectedVersionId(version.versionId);
    }
    forceUpdate();
  };

  const handleCreateCheckpoint = () => {
    const { version } = versionManager.createVersion(
      currentSpace,
      'MANUAL_CHECKPOINT',
      null,
      'Milestone checkpoint',
      workspaceId,
      true
    );
    timelineCoordinator.appendVersion(version);
    historyLogger.logEvent({
      eventId: `EVT_${versions.length}`,
      workspaceId,
      versionId: version.versionId,
      eventType: 'VERSION_CREATED',
      description: `Created checkpoint V${version.versionIndex}`,
      timestamp: 0,
    });
    setSelectedVersionId(version.versionId);
    forceUpdate();
  };

  const handleRestoreVersion = (version: WorkspaceVersion) => {
    const { restoredSpace, result } = RestoreEngine.restoreVersion(
      version,
      currentSpace,
      versionManager
    );
    timelineCoordinator.appendVersion(result.newVersion);
    setCurrentSpace(restoredSpace);
    historyLogger.logEvent({
      eventId: result.restoreEventId,
      workspaceId,
      versionId: result.newVersion.versionId,
      eventType: 'VERSION_RESTORED',
      description: `Restored state to V${version.versionIndex} as V${result.newVersion.versionIndex}`,
      timestamp: 0,
    });
    setSelectedVersionId(result.newVersion.versionId);
    forceUpdate();
  };

  const handleBranchVersion = (version: WorkspaceVersion) => {
    const branchName = prompt('Enter Branch Name:', 'experimental-branch') || 'experiment-1';
    const result = BranchingEngine.createBranch(
      version,
      branchName,
      currentSpace,
      versionManager
    );
    timelineCoordinator.appendVersion(result.branchVersion);
    historyLogger.logEvent({
      eventId: `EVT_BRN_${versions.length}`,
      workspaceId,
      versionId: result.branchVersion.versionId,
      eventType: 'VERSION_BRANCHED',
      description: `Branched '${branchName}' from V${version.versionIndex}`,
      timestamp: 0,
    });
    setSelectedVersionId(result.branchVersion.versionId);
    forceUpdate();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <GitCommit className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.13 — USER WORKSPACE VERSIONING & STATE TIMELINE
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Deterministic History & Branching Layer</span>
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
        {/* LEFT: TIMELINE & DIFF */}
        <div className="w-[340px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P613TimelinePanel
            versions={versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={(v) => setSelectedVersionId(v.versionId)}
            onSaveVersion={handleSaveVersion}
            onCreateCheckpoint={handleCreateCheckpoint}
            onRestoreVersion={handleRestoreVersion}
            onBranchVersion={handleBranchVersion}
          />
          <P613VersionDiffPanel diff={diff} />
        </div>

        {/* CENTER: 3D VIEWPORT CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P68SpaceEditor space={currentSpace} width={560} height={360} />
          <div className="text-[8.5px] text-zinc-500 font-mono">
            Active Workspace: <strong className="text-cyan-400">{currentSpace.name}</strong> | State CS: {currentSpace.spaceChecksum}
          </div>
        </div>

        {/* RIGHT: VERSION INSPECTOR */}
        <div className="w-[320px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P613VersionInspector selectedVersion={selectedVersion} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: RESTORE & CAUSALITY ── */}
      <P613RestorePanel
        selectedVersion={selectedVersion}
        validationReport={validationReport}
        events={historyLogger.getEvents(workspaceId)}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
};
