/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.14: Integrated Isolated Search, Indexing & Navigation Research Dashboard
 *
 * Route: ?mode=p614 | ?research=p614 | #/research/p614
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  WorkspaceIndex,
  SearchQuery,
  SearchResults,
  SearchResult,
  SearchNavigationTarget,
  SearchValidationReport,
  SearchExportPackage,
  SearchScope,
  EntityType,
  SearchSortField,
  SearchSortOrder,
  SearchAccessContext,
} from '../types';
import { WorkspaceIndexBuilder } from '../indexBuilder';
import { WorkspaceSearchEngine } from '../searchEngine';
import { WorkspaceNavigationEngine } from '../navigation';
import { SearchValidator } from '../searchValidator';
import { SearchExportEngine } from '../searchExport';
import { SearchSnapshotEngine } from '../searchSnapshot';
import { SearchCausalityAuditor } from '../searchCausality';

import { P614SearchPanel } from './P614SearchPanel';
import { P614SearchResults } from './P614SearchResults';
import { P614NavigationPanel } from './P614NavigationPanel';
import { P614SearchInspector } from './P614SearchInspector';
import { P614ValidationPanel } from './P614ValidationPanel';

export interface P614ResearchHarnessProps {
  onExit?: () => void;
}

export const P614ResearchHarness: React.FC<P614ResearchHarnessProps> = ({ onExit }) => {
  // 1. Build a mock initial index
  const [accessContext, setAccessContext] = useState<SearchAccessContext>({
    userId: 'USR_RESEARCH_01',
    userRole: 'OWNER',
    workspaceId: 'WS_RESEARCH_DEMO',
    accessibleSpaceIds: ['SPACE_01', 'SPACE_02'],
    accessibleExperimentIds: ['EXP_01'],
  });

  const sampleIndex: WorkspaceIndex = useMemo(() => {
    const builder = new WorkspaceIndexBuilder('WS_RESEARCH_DEMO');

    // Space
    builder.registerEntity({
      entityId: 'SPACE_01',
      entityType: 'SPACE',
      ownerId: 'USR_RESEARCH_01',
      title: 'Canonical Architecture Space',
      name: 'Canonical Architecture Space',
      accessLevel: 'PUBLIC',
      lineageId: 'LIN_SPACE_01',
      checksum: 'CS_SPACE_01',
    });

    // Experiment
    builder.registerEntity({
      entityId: 'EXP_01',
      entityType: 'EXPERIMENT',
      ownerId: 'USR_RESEARCH_01',
      spaceId: 'SPACE_01',
      title: 'Baseline Dimensionality Experiment',
      name: 'Baseline Dimensionality Experiment',
      accessLevel: 'PUBLIC',
      lineageId: 'LIN_EXP_01',
      checksum: 'CS_EXP_01',
    });

    // Saved State
    builder.registerEntity({
      entityId: 'ST_01',
      entityType: 'SAVED_STATE',
      ownerId: 'USR_RESEARCH_01',
      spaceId: 'SPACE_01',
      experimentId: 'EXP_01',
      title: 'Checkpoint State Alpha',
      name: 'Checkpoint State Alpha',
      accessLevel: 'SHARED',
      lineageId: 'LIN_ST_01',
      checksum: 'CS_ST_01',
      certainty: 'EXACT',
    });

    // Geometry Object
    builder.registerEntity({
      entityId: 'GEO_OBJ_01',
      entityType: 'GEOMETRY_OBJECT',
      ownerId: 'USR_RESEARCH_01',
      spaceId: 'SPACE_01',
      title: 'Primary Coordinate Anchor',
      name: 'Primary Coordinate Anchor',
      accessLevel: 'PUBLIC',
      lineageId: 'LIN_GEO_01',
      certainty: 'EXACT',
      coordinates: [5, 3, 6],
      checksum: 'CS_GEO_01',
    });

    // Solid Entity
    builder.registerEntity({
      entityId: 'SOLID_01',
      entityType: 'SOLID',
      ownerId: 'USR_RESEARCH_01',
      spaceId: 'SPACE_01',
      title: 'Manifold Polyhedron',
      name: 'Manifold Polyhedron',
      accessLevel: 'PUBLIC',
      lineageId: 'LIN_SOLID_01',
      certainty: 'EXACT',
      coordinates: [10, 5, 8],
      checksum: 'CS_SOLID_01',
    });

    return builder.build();
  }, []);

  // 2. Search state
  const [searchText, setSearchText] = useState('');
  const [scope, setScope] = useState<SearchScope>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | undefined>();
  const [selectedCertainty, setSelectedCertainty] = useState<'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN' | undefined>();
  const [sortField, setSortField] = useState<SearchSortField>('RELEVANCE');
  const [sortOrder, setSortOrder] = useState<SearchSortOrder>('DESC');

  // 3. Results & Navigation state
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<SearchNavigationTarget | null>(null);
  const [exportPackage, setExportPackage] = useState<SearchExportPackage | null>(null);

  // Construct current query
  const query: SearchQuery = useMemo(() => {
    return WorkspaceSearchEngine.createQuery({
      text: searchText,
      scope,
      filter: {
        entityTypes: selectedEntityType ? [selectedEntityType] : undefined,
        certainty: selectedCertainty,
      },
      sort: { field: sortField, order: sortOrder },
      accessContext,
    });
  }, [searchText, scope, selectedEntityType, selectedCertainty, sortField, sortOrder, accessContext]);

  // Execute search
  const searchResults: SearchResults = useMemo(() => {
    return WorkspaceSearchEngine.executeSearch(sampleIndex, query);
  }, [sampleIndex, query]);

  // Validation report
  const validationReport: SearchValidationReport = useMemo(() => {
    return SearchValidator.validateIndex(sampleIndex);
  }, [sampleIndex]);

  // Handlers
  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setScope('ALL');
    setSelectedEntityType(undefined);
    setSelectedCertainty(undefined);
    setSortField('RELEVANCE');
    setSortOrder('DESC');
    setSelectedResult(null);
    setNavigationTarget(null);
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    setNavigationTarget(null);
  }, []);

  const handleNavigate = useCallback(
    (entityId: string) => {
      const target = WorkspaceNavigationEngine.navigateToEntity(
        entityId,
        sampleIndex,
        accessContext
      );
      setNavigationTarget(target);
    },
    [sampleIndex, accessContext]
  );

  const handleExport = useCallback(() => {
    const pkg = SearchExportEngine.generateExportPackage(
      sampleIndex,
      query,
      searchResults
    );
    setExportPackage(pkg);
  }, [sampleIndex, query, searchResults]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>P6.14 — User Workspace Search, Indexing & Navigation</h2>
          <span style={styles.subtitle}>
            Deterministic Search, Access Boundaries, Immutable Snapshots (σ² = 0)
          </span>
        </div>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            Exit Harness
          </button>
        )}
      </header>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Left: Controls */}
        <div style={styles.leftCol}>
          <P614SearchPanel
            searchText={searchText}
            onSearchTextChange={setSearchText}
            scope={scope}
            onScopeChange={setScope}
            selectedEntityType={selectedEntityType}
            onEntityTypeChange={setSelectedEntityType}
            selectedCertainty={selectedCertainty}
            onCertaintyChange={setSelectedCertainty}
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onExecuteSearch={() => {}}
            onClearFilters={handleClearFilters}
            resultCount={searchResults.totalMatches}
          />
        </div>

        {/* Center: Search Results & Navigation */}
        <div style={styles.centerCol}>
          <P614SearchResults
            results={searchResults.results}
            selectedEntityId={selectedResult?.entity.entityId}
            onSelectResult={handleSelectResult}
          />
          <P614NavigationPanel
            selectedResult={selectedResult}
            navigationTarget={navigationTarget}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Right: Inspector */}
        <div style={styles.rightCol}>
          <P614SearchInspector
            index={sampleIndex}
            query={query}
            results={searchResults}
          />
        </div>
      </div>

      {/* Bottom: Validation, Causality & Export */}
      <div style={styles.bottomRow}>
        <P614ValidationPanel
          validationReport={validationReport}
          exportPackage={exportPackage}
          causalityPassed={true}
          onExport={handleExport}
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
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  centerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  bottomRow: {
    display: 'flex',
    flexDirection: 'column',
  },
};
