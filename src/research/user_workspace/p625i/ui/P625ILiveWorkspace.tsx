/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Main Live Workspace Container & Studio Interface
 *
 * Route: ?mode=p625i | ?research=p625i | #/research/p625i
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  WorkspaceUserContext,
  LiveSpaceState,
  LiveSavedState,
} from '../types';
import { WorkspaceAdapter } from '../workspaceAdapter';

import { P625IWorkspaceSidebar, SidebarTab } from './P625IWorkspaceSidebar';
import { P625ISpacePanel } from './P625ISpacePanel';
import { P625IStatePanel } from './P625IStatePanel';
import { P625IStatusPanel } from './P625IStatusPanel';

export interface P625ILiveWorkspaceProps {
  onExit?: () => void;
}

export const P625ILiveWorkspace: React.FC<P625ILiveWorkspaceProps> = ({ onExit }) => {
  const context: WorkspaceUserContext = useMemo(
    () => ({
      userId: 'USR_OWNER_01',
      userRole: 'OWNER',
      workspaceId: 'WS_STUDIO_LIVE_01',
      isAuthenticated: true,
    }),
    []
  );

  const [adapter] = useState(() => {
    const adp = new WorkspaceAdapter(context);
    // Seed baseline space if empty
    if (adp.getState().spaces.length === 0) {
      const sp = adp.createSpace('Primary Canonical Space', [5, 3, 6]);
      adp.addExperiment('EXP_01', sp.spaceId, 'Primary Canonical Space Photogrammetry');
    }
    return adp;
  });

  const [activeTab, setActiveTab] = useState<SidebarTab>('SPACES');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const state = adapter.getState();
  const activeSpace = state.spaces.find((s) => s.spaceId === state.activeSpaceId && !s.isDeleted) ?? null;
  const report = adapter.getActivationReport();

  const handleCreateSpace = useCallback(
    (name: string) => {
      adapter.createSpace(name, [5, 3, 6]);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleOpenSpace = useCallback(
    (spaceId: string) => {
      adapter.openSpace(spaceId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleDeleteSpace = useCallback(
    (spaceId: string) => {
      adapter.deleteSpace(spaceId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleSaveState = useCallback(
    (stateName: string) => {
      adapter.saveCurrentState(stateName);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleResetState = useCallback(() => {
    adapter.resetCurrentState();
    forceRefresh();
  }, [adapter, forceRefresh]);

  const handleModifyCoords = useCallback(
    (coords: [number, number, number]) => {
      adapter.modifyState({ coordinates: coords });
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleSelectObject = useCallback(
    (objectId: string | null) => {
      adapter.setSelectedObject(objectId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  const handleLoadSavedState = useCallback(
    (stateId: string) => {
      adapter.loadSavedState(stateId);
      forceRefresh();
    },
    [adapter, forceRefresh]
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>3D Memory Studio — Live Workspace (P6.25-I)</h2>
          <span style={styles.subtitle}>
            Live Connected User Workspace, Space Lifecycle, Real-Time State Mutation & Recovery (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Workspace
          </button>
        )}
      </header>

      <div style={styles.body}>
        {/* Sidebar */}
        <P625IWorkspaceSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          spacesCount={state.spaces.filter((s) => !s.isDeleted).length}
          experimentsCount={state.experiments.length}
          savedStatesCount={state.savedStates.length}
          recentViewsCount={state.recentViews.length}
        />

        {/* Content Area */}
        <div style={styles.mainContent}>
          {activeTab === 'SPACES' && (
            <div style={styles.splitGrid}>
              <div style={styles.col}>
                <P625ISpacePanel
                  spaces={state.spaces}
                  activeSpaceId={state.activeSpaceId}
                  onCreateSpace={handleCreateSpace}
                  onOpenSpace={handleOpenSpace}
                  onSaveState={handleSaveState}
                  onResetState={handleResetState}
                  onDeleteSpace={handleDeleteSpace}
                />
              </div>

              <div style={styles.col}>
                <P625IStatePanel
                  activeSpace={activeSpace}
                  selectedObjectId={state.selectedObjectId}
                  onModifyCoordinates={handleModifyCoords}
                  onSelectObject={handleSelectObject}
                />
                <div style={{ marginTop: 16 }}>
                  <P625IStatusPanel report={report} currentChecksum={state.currentChecksum} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EXPERIMENTS' && (
            <div style={styles.tabBox}>
              <h3 style={styles.tabTitle}>My Experiments</h3>
              {state.experiments.length === 0 ? (
                <div style={styles.empty}>No experiments found for active user.</div>
              ) : (
                <div style={styles.cardList}>
                  {state.experiments.map((exp) => (
                    <div key={exp.experimentId} style={styles.tabCard}>
                      <span style={styles.cardTitle}>{exp.name}</span>
                      <span style={styles.cardMeta}>ID: {exp.experimentId} | Space: {exp.spaceId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'SAVED_STATES' && (
            <div style={styles.tabBox}>
              <h3 style={styles.tabTitle}>Saved States</h3>
              {state.savedStates.length === 0 ? (
                <div style={styles.empty}>No saved states in active workspace. Save a state to view it here.</div>
              ) : (
                <div style={styles.cardList}>
                  {state.savedStates.map((st) => (
                    <div key={st.stateId} style={styles.tabCard}>
                      <div style={styles.cardRow}>
                        <span style={styles.cardTitle}>{st.name}</span>
                        <button onClick={() => handleLoadSavedState(st.stateId)} style={styles.loadBtn}>
                          Restore State
                        </button>
                      </div>
                      <span style={styles.cardMeta}>State ID: {st.stateId} | CS: {st.stateChecksum}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'RECENT_VIEWS' && (
            <div style={styles.tabBox}>
              <h3 style={styles.tabTitle}>Recent Views</h3>
              {state.recentViews.length === 0 ? (
                <div style={styles.empty}>No recent views recorded.</div>
              ) : (
                <div style={styles.cardList}>
                  {state.recentViews.map((v) => (
                    <div key={v.viewId} style={styles.tabCard}>
                      <span style={styles.cardTitle}>{v.spaceName}</span>
                      <span style={styles.cardMeta}>Space ID: {v.spaceId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #1E202F',
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
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  tabBox: {
    background: '#12131C',
    border: '1px solid #2A2D3E',
    borderRadius: 8,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tabTitle: {
    margin: 0,
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: 600,
  },
  empty: {
    padding: 30,
    textAlign: 'center',
    color: '#616161',
    fontSize: 12,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  tabCard: {
    background: '#181A28',
    border: '1px solid #2A2D3E',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFF',
    fontWeight: 600,
    fontSize: 13,
  },
  cardMeta: {
    fontSize: 11,
    color: '#8A8F9E',
  },
  loadBtn: {
    background: '#0288D1',
    color: '#FFF',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
};

export default P625ILiveWorkspace;
