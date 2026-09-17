/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Navigator Dashboard
 */

import React, { useState, useMemo, useReducer } from 'react';
import { SpaceManager } from '../../p68/spaceManager';
import { SavedStateManager } from '../../p68/savedStateManager';
import { ExperimentManager } from '../../p68/experimentManager';
import { RecentViewsEngine } from '../../p68/recentViews';
import { PersonalSpace } from '../../p68/types';
import { P68SpaceEditor } from '../../p68/ui/P68SpaceEditor';
import { WorkspaceIndex } from '../workspaceIndex';
import { ReindexEngine } from '../reindex';
import { StaleDetector } from '../staleDetector';
import { OrphanDetector } from '../orphanDetector';
import { FavoritesEngine } from '../favorites';
import { TaggingEngine } from '../tagging';
import { IndexValidationEngine } from '../indexValidation';
import { NavigationCoordinator } from '../navigation';
import {
  IndexRecord,
  WorkspaceSearchQuery,
  SortSpec,
  IndexEntityType,
} from '../types';
import { P610SearchBar } from './P610SearchBar';
import { P610FilterPanel } from './P610FilterPanel';
import { P610SortPanel } from './P610SortPanel';
import { P610SpaceResults } from './P610SpaceResults';
import { P610WorkspaceInspector } from './P610WorkspaceInspector';
import { P610ValidationPanel } from './P610ValidationPanel';
import { Compass } from 'lucide-react';

export const P610WorkspaceNavigator: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const userId = 'Dr. Alice Chen';

  const { spaceManager, savedStateManager, experimentManager, recentViewsEngine, index } =
    useMemo(() => {
      const sMgr = new SpaceManager();
      const stMgr = new SavedStateManager();
      const eMgr = new ExperimentManager();
      const rvEngine = new RecentViewsEngine();

      const sp1 = sMgr.createSpace(userId, 'Jewelry Geometry Alpha', 'Parametric Ring Prototype');
      const sp2 = sMgr.createSpace(userId, 'Architecture Space Beta', 'Structural 3D Mesh');

      stMgr.createSavedState(sp1, 'Ring Baseline');
      eMgr.createExperiment(sp1, 'Observer Fusion Experiment');

      const idx = new WorkspaceIndex(userId);
      const { indexState } = ReindexEngine.reindexWorkspace(
        userId,
        sMgr,
        stMgr,
        eMgr,
        rvEngine
      );
      for (const rec of indexState.records) {
        idx.addRecord(rec);
      }

      return {
        spaceManager: sMgr,
        savedStateManager: stMgr,
        experimentManager: eMgr,
        recentViewsEngine: rvEngine,
        index: idx,
      };
    }, [userId]);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
    const list = spaceManager.getRepository().list();
    return list[0]?.spaceId || '';
  });
  const activeSpace: PersonalSpace | undefined = spaceManager.getRepository().get(activeSpaceId);

  const [searchQuery, setSearchQuery] = useState<WorkspaceSearchQuery>({});
  const [sortSpec, setSortSpec] = useState<SortSpec>({
    primaryField: 'NAME',
    direction: 'ASC',
  });
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Reindex handler
  const handleReindex = () => {
    index.clear();
    const { indexState } = ReindexEngine.reindexWorkspace(
      userId,
      spaceManager,
      savedStateManager,
      experimentManager,
      recentViewsEngine
    );
    for (const rec of indexState.records) {
      index.addRecord(rec);
    }
    forceUpdate();
  };

  // Query Results
  const results = useMemo(() => {
    return index.query(searchQuery, sortSpec);
  }, [index, searchQuery, sortSpec]);

  const selectedRecord = useMemo(() => {
    return selectedRecordId ? index.getRecord(selectedRecordId) || null : null;
  }, [index, selectedRecordId]);

  const staleReport = useMemo(
    () => StaleDetector.detectStale(index.listRecords(), spaceManager),
    [index, spaceManager]
  );
  const orphanReport = useMemo(
    () => OrphanDetector.detectOrphans(index.listRecords(), spaceManager),
    [index, spaceManager]
  );
  const validationReport = useMemo(
    () => IndexValidationEngine.validateIndexState(index.getIndexState()),
    [index]
  );

  // ── Actions ──
  const handleTogglePin = (record: IndexRecord) => {
    const updated = record.isPinned
      ? FavoritesEngine.unpinEntity(record)
      : FavoritesEngine.pinEntity(record);
    index.updateRecord(updated);
    forceUpdate();
  };

  const handleAddTag = (record: IndexRecord, tag: string) => {
    const updated = TaggingEngine.addTag(record, tag);
    index.updateRecord(updated);
    forceUpdate();
  };

  const handleRemoveTag = (record: IndexRecord, tag: string) => {
    const updated = TaggingEngine.removeTag(record, tag);
    index.updateRecord(updated);
    forceUpdate();
  };

  const handleOpenEntity = (record: IndexRecord) => {
    if (record.entityType === 'SPACE' || record.entityType === 'CLONE' || record.entityType === 'IMPORT') {
      const space = NavigationCoordinator.openSpace(record.spaceId, spaceManager, recentViewsEngine);
      setActiveSpaceId(space.spaceId);
    } else if (record.entityType === 'SAVED_STATE') {
      const restored = NavigationCoordinator.openSavedState(
        record.entityId,
        record.spaceId,
        savedStateManager,
        spaceManager
      );
      spaceManager.saveSpace(restored);
      setActiveSpaceId(restored.spaceId);
    }
    forceUpdate();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.10 — WORKSPACE INDEX & NAVIGATION
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Deterministic Search & Discovery Layer</span>
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
        {/* LEFT: SEARCH, FILTERS, RESULTS */}
        <div className="w-[340px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P610SearchBar
            searchText={searchQuery.queryText || ''}
            onSearchChange={(text) => setSearchQuery((prev) => ({ ...prev, queryText: text }))}
          />
          <P610FilterPanel query={searchQuery} onUpdateQuery={setSearchQuery} />
          <P610SortPanel sortSpec={sortSpec} onSortChange={setSortSpec} />
          <P610SpaceResults
            records={results}
            selectedRecordId={selectedRecordId}
            onSelectRecord={(r) => setSelectedRecordId(r.recordId)}
            onTogglePin={handleTogglePin}
            onOpenEntity={handleOpenEntity}
          />
        </div>

        {/* CENTER: 3D VIEWPORT CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P68SpaceEditor space={activeSpace} width={560} height={360} />
          {activeSpace && (
            <div className="text-[8.5px] text-zinc-500 font-mono">
              Active Space: <strong className="text-cyan-400">{activeSpace.name}</strong> ({activeSpace.spaceId}) | Reality CS: {activeSpace.reality.realityChecksum}
            </div>
          )}
        </div>

        {/* RIGHT: ENTITY INSPECTOR & METADATA */}
        <div className="w-[320px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P610WorkspaceInspector
            selectedRecord={selectedRecord}
            indexChecksum={index.calculateIndexChecksum()}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onTogglePin={handleTogglePin}
          />
        </div>
      </div>

      {/* ── BOTTOM PANEL: INDEX INTEGRITY ── */}
      <P610ValidationPanel
        validationReport={validationReport}
        staleReport={staleReport}
        orphanReport={orphanReport}
        totalIndexed={index.listRecords().length}
        onReindex={handleReindex}
      />
    </div>
  );
};
