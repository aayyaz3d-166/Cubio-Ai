/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.25-I: Workspace Primary Sidebar Navigation
 */

import React from 'react';
import {
  LiveSpaceState,
  LiveExperimentState,
  LiveSavedState,
  LiveRecentView,
} from '../types';

export type SidebarTab = 'SPACES' | 'EXPERIMENTS' | 'SAVED_STATES' | 'RECENT_VIEWS';

export interface P625IWorkspaceSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  spacesCount: number;
  experimentsCount: number;
  savedStatesCount: number;
  recentViewsCount: number;
}

export const P625IWorkspaceSidebar: React.FC<P625IWorkspaceSidebarProps> = ({
  activeTab,
  onTabChange,
  spacesCount,
  experimentsCount,
  savedStatesCount,
  recentViewsCount,
}) => {
  return (
    <div style={styles.sidebar}>
      <h3 style={styles.brand}>User Workspace</h3>

      <div style={styles.menu}>
        <button
          onClick={() => onTabChange('SPACES')}
          style={{
            ...styles.menuItem,
            background: activeTab === 'SPACES' ? '#1E202F' : 'transparent',
            color: activeTab === 'SPACES' ? '#00E5FF' : '#B0BEC5',
          }}
        >
          <span>My Spaces</span>
          <span style={styles.badge}>{spacesCount}</span>
        </button>

        <button
          onClick={() => onTabChange('EXPERIMENTS')}
          style={{
            ...styles.menuItem,
            background: activeTab === 'EXPERIMENTS' ? '#1E202F' : 'transparent',
            color: activeTab === 'EXPERIMENTS' ? '#00E5FF' : '#B0BEC5',
          }}
        >
          <span>My Experiments</span>
          <span style={styles.badge}>{experimentsCount}</span>
        </button>

        <button
          onClick={() => onTabChange('SAVED_STATES')}
          style={{
            ...styles.menuItem,
            background: activeTab === 'SAVED_STATES' ? '#1E202F' : 'transparent',
            color: activeTab === 'SAVED_STATES' ? '#00E5FF' : '#B0BEC5',
          }}
        >
          <span>Saved States</span>
          <span style={styles.badge}>{savedStatesCount}</span>
        </button>

        <button
          onClick={() => onTabChange('RECENT_VIEWS')}
          style={{
            ...styles.menuItem,
            background: activeTab === 'RECENT_VIEWS' ? '#1E202F' : 'transparent',
            color: activeTab === 'RECENT_VIEWS' ? '#00E5FF' : '#B0BEC5',
          }}
        >
          <span>Recent Views</span>
          <span style={styles.badge}>{recentViewsCount}</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    background: '#0D0E15',
    borderRight: '1px solid #1E202F',
    width: 220,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  brand: {
    margin: 0,
    fontSize: 15,
    color: '#00E5FF',
    fontWeight: 700,
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'left',
  },
  badge: {
    background: '#181A28',
    color: '#8A8F9E',
    padding: '2px 6px',
    borderRadius: 10,
    fontSize: 10,
  },
};
