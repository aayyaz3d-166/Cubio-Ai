/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Integrated Isolated Search & State Discovery Dashboard
 *
 * Route: ?mode=p621 | ?research=p621 | #/research/p621
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  SearchIndex,
  SearchQuery,
  SearchResult,
  SearchPermissionContext,
  SearchScope,
} from '../types';
import { SearchIndexBuilder } from '../indexBuilder';
import { WorkspaceSearchEngine } from '../searchEngine';
import { WorkspaceDiscoveryEngine } from '../discoveryEngine';

import { P621SearchPanel } from './P621SearchPanel';
import { P621ResultsPanel } from './P621ResultsPanel';
import { P621DiscoveryPanel } from './P621DiscoveryPanel';
import { P621IndexPanel } from './P621IndexPanel';

export interface P621ResearchHarnessProps {
  onExit?: () => void;
}

export const P621ResearchHarness: React.FC<P621ResearchHarnessProps> = ({ onExit }) => {
  const context: SearchPermissionContext = useMemo(
    () => ({
      userId: 'USR_OWNER_01',
      userRole: 'OWNER',
      workspaceId: 'WS_SEARCH_CANONICAL',
    }),
    []
  );

  // Sample Index
  const sampleIndex: SearchIndex = useMemo(() => {
    const builder = new SearchIndexBuilder('WS_SEARCH_CANONICAL');
    builder
      .addEntry({
        sourceId: 'SPACE_CANONICAL_01',
        sourceType: 'SPACE',
        name: 'Canonical Open Research Space',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_SPACE_01',
        checksum: 'CS_SPACE_01',
      })
      .addEntry({
        sourceId: 'EXP_BASELINE_01',
        sourceType: 'EXPERIMENT',
        name: 'Baseline Photogrammetry Experiment',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_EXP_01',
        checksum: 'CS_EXP_01',
      })
      .addEntry({
        sourceId: 'ST_CHECKPOINT_01',
        sourceType: 'SAVED_STATE',
        name: 'Calibrated Coordinate State Alpha',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_ST_01',
        checksum: 'CS_STATE_01',
      })
      .addEntry({
        sourceId: 'VER_ROOT_01',
        sourceType: 'VERSION',
        name: 'v1.0.0 Baseline Release',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_VER_01',
        checksum: 'CS_VER_01',
      })
      .addEntry({
        sourceId: 'CHK_MILESTONE_01',
        sourceType: 'CHECKPOINT',
        name: 'Milestone Recovery Point Alpha',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_CHK_01',
        checksum: 'CS_CHK_01',
      })
      .addEntry({
        sourceId: 'MOD_CHAIR_01',
        sourceType: 'MODEL',
        name: 'Ergonomic Chair 3D Model',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_MOD_01',
        checksum: 'CS_MOD_01',
      })
      .addEntry({
        sourceId: 'GEO_CANONICAL_01',
        sourceType: 'GEOMETRY',
        name: 'Canonical Anchor [5, 3, 6]',
        spaceId: 'SPACE_CANONICAL_01',
        ownerId: 'USR_OWNER_01',
        accessLevel: 'PUBLIC',
        lineageId: 'LIN_GEO_01',
        checksum: 'CS_GEO_01',
        coordinates: [5, 3, 6],
      });

    return builder.build();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<SearchScope>('ALL');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const query: SearchQuery = useMemo(
    () => ({
      term: searchTerm,
      scope: selectedScope,
    }),
    [searchTerm, selectedScope]
  );

  const results = useMemo(
    () => WorkspaceSearchEngine.search(sampleIndex, query, context),
    [sampleIndex, query, context]
  );

  const discovery = useMemo(
    () => WorkspaceDiscoveryEngine.discover(sampleIndex, context),
    [sampleIndex, context]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedScope('ALL');
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.21 — User Workspace Search, Indexing & State Discovery</h2>
          <span style={styles.subtitle}>
            SEARCH IS OBSERVATION — Observational Indexing, Search, Filtering & State Discovery (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* Left Column: Search & Scope Controls */}
        <div style={styles.col}>
          <P621SearchPanel
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedScope={selectedScope}
            onScopeChange={setSelectedScope}
            onClearFilters={handleClearFilters}
            resultCount={results.length}
          />
          <div style={{ marginTop: 16 }}>
            <P621IndexPanel index={sampleIndex} causalityPassed={true} />
          </div>
        </div>

        {/* Center Column: Results List */}
        <div style={{ ...styles.col, flex: 1.4 }}>
          <P621ResultsPanel
            results={results}
            selectedResultId={selectedResult?.resultId ?? null}
            onSelectResult={setSelectedResult}
          />
        </div>

        {/* Right Column: Discovery Feeds */}
        <div style={styles.col}>
          <P621DiscoveryPanel discovery={discovery} />
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
    gridTemplateColumns: '320px 1fr 320px',
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export default P621ResearchHarness;
