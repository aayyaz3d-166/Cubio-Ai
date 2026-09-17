/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Scene & Object Outliner UI
 *
 * Provides hierarchical scene tree:
 * Reality References, Workspace Objects, Derived Geometry, Measurements, History.
 * Supports visibility, lock toggles, search filtering, epistemic badges, and viewport selection.
 */

import React, { useState } from 'react';
import {
  Box,
  Circle,
  Cylinder,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Ruler,
  History as HistoryIcon,
  Tag,
} from 'lucide-react';
import { WorkspaceGeometry, Measurement, GeometryHistoryEntry } from '../types';

export interface R9OutlinerProps {
  readonly geometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly selectedGeometryId: string | null;
  readonly onSelectGeometry: (geometryId: string) => void;
  readonly hiddenGeometryIds: ReadonlySet<string>;
  readonly lockedGeometryIds: ReadonlySet<string>;
  readonly onToggleVisibility: (geometryId: string) => void;
  readonly onToggleLock: (geometryId: string) => void;
  readonly measurements: readonly Measurement[];
  readonly history: readonly GeometryHistoryEntry[];
}

export const R9Outliner: React.FC<R9OutlinerProps> = ({
  geometries,
  selectedGeometryId,
  onSelectGeometry,
  hiddenGeometryIds,
  lockedGeometryIds,
  onToggleVisibility,
  onToggleLock,
  measurements,
  history,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [realityExpanded, setRealityExpanded] = useState(true);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const [derivedExpanded, setDerivedExpanded] = useState(true);
  const [measurementsExpanded, setMeasurementsExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const allGeos = Object.values(geometries) as WorkspaceGeometry[];
  const realityGeos = allGeos.filter((g: WorkspaceGeometry) => g.identity.origin === 'OBSERVED' || Boolean(g.realityReference));
  const userGeos = allGeos.filter((g: WorkspaceGeometry) => g.identity.origin === 'USER_CONSTRUCTED' && !g.realityReference);
  const derivedGeos = allGeos.filter((g: WorkspaceGeometry) => g.identity.origin === 'DERIVED');

  const filterItem = (name: string, id: string) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || id.toLowerCase().includes(term);
  };

  const badgeColor = (origin: string): { bg: string; text: string; border: string } => {
    switch (origin) {
      case 'OBSERVED':
        return { bg: '#083344', text: '#06B6D4', border: '#0E7490' };
      case 'USER_CONSTRUCTED':
        return { bg: '#451A03', text: '#F59E0B', border: '#B45309' };
      case 'DERIVED':
        return { bg: '#2E1065', text: '#A78BFA', border: '#6D28D9' };
      default:
        return { bg: '#1E293B', text: '#94A3B8', border: '#475569' };
    }
  };

  const renderSectionHeader = (
    title: string,
    count: number,
    isExpanded: boolean,
    toggle: () => void,
    icon: React.ReactNode,
    accentColor = '#94A3B8'
  ) => (
    <div
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        backgroundColor: '#0F172A',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '6px',
        marginBottom: '2px',
        border: '1px solid #1E293B',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '10px',
          backgroundColor: '#1E293B',
          color: '#CBD5E1',
        }}
      >
        {count}
      </span>
    </div>
  );

  const renderGeoRow = (geo: WorkspaceGeometry) => {
    if (!filterItem(geo.identity.name, geo.geometryId)) return null;
    const isSelected = geo.geometryId === selectedGeometryId;
    const isHidden = hiddenGeometryIds.has(geo.geometryId);
    const isLocked = lockedGeometryIds.has(geo.geometryId);
    const colors = badgeColor(geo.identity.origin);

    return (
      <div
        key={geo.geometryId}
        onClick={() => onSelectGeometry(geo.geometryId)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 8px',
          marginLeft: '8px',
          borderRadius: '4px',
          backgroundColor: isSelected ? '#1E1B4B' : 'transparent',
          border: isSelected ? '1px solid #8B5CF6' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          opacity: isHidden ? 0.45 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <Box className={`w-3.5 h-3.5 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? '#FFFFFF' : '#E2E8F0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '120px',
            }}
            title={geo.identity.name}
          >
            {geo.identity.name}
          </span>
          <span
            style={{
              fontSize: '9px',
              padding: '1px 4px',
              borderRadius: '3px',
              backgroundColor: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              fontWeight: 700,
            }}
          >
            {geo.identity.origin === 'OBSERVED' ? 'REALITY' : geo.identity.origin === 'USER_CONSTRUCTED' ? 'CONSTR' : 'DERIVED'}
          </span>
        </div>

        {/* Visibility & Lock Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(geo.geometryId);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: isHidden ? '#64748B' : '#94A3B8',
            }}
            title={isHidden ? 'Show in Viewport' : 'Hide from Viewport'}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(geo.geometryId);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: isLocked ? '#F59E0B' : '#64748B',
            }}
            title={isLocked ? 'Unlock Geometry' : 'Lock Geometry'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#090D16',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Outliner Header & Search */}
      <div style={{ padding: '10px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.05em' }}>
            SCENE OUTLINER
          </span>
          <span style={{ fontSize: '10px', color: '#64748B' }}>
            {allGeos.length} entities
          </span>
        </div>

        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            backgroundColor: '#0F172A',
            borderRadius: '5px',
            border: '1px solid #334155',
          }}
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '11px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Tree Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {/* 1. Authoritative Reality References */}
        {renderSectionHeader(
          'Reality References',
          realityGeos.length,
          realityExpanded,
          () => setRealityExpanded(!realityExpanded),
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          '#34D399'
        )}
        {realityExpanded && realityGeos.map(renderGeoRow)}

        {/* 2. User Constructed Geometry */}
        {renderSectionHeader(
          'Workspace Objects',
          userGeos.length,
          workspaceExpanded,
          () => setWorkspaceExpanded(!workspaceExpanded),
          <Layers className="w-3.5 h-3.5 text-amber-400" />,
          '#FBBF24'
        )}
        {workspaceExpanded && userGeos.map(renderGeoRow)}

        {/* 3. Derived Geometry (Booleans/Modifiers) */}
        {renderSectionHeader(
          'Derived Geometry',
          derivedGeos.length,
          derivedExpanded,
          () => setDerivedExpanded(!derivedExpanded),
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
          '#C084FC'
        )}
        {derivedExpanded && derivedGeos.map(renderGeoRow)}

        {/* 4. Measurements */}
        {renderSectionHeader(
          'Measurements',
          measurements.length,
          measurementsExpanded,
          () => setMeasurementsExpanded(!measurementsExpanded),
          <Ruler className="w-3.5 h-3.5 text-sky-400" />,
          '#38BDF8'
        )}
        {measurementsExpanded && (
          <div style={{ paddingLeft: '8px' }}>
            {measurements.map((m) => (
              <div
                key={m.measurementId}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: '#94A3B8',
                  borderBottom: '1px solid #1E293B',
                }}
              >
                <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>{m.measurementType}:</span> {m.value.toFixed(3)} {m.unit}
              </div>
            ))}
          </div>
        )}

        {/* 5. Construction History Log */}
        {renderSectionHeader(
          'History Log',
          history.length,
          historyExpanded,
          () => setHistoryExpanded(!historyExpanded),
          <HistoryIcon className="w-3.5 h-3.5 text-slate-400" />,
          '#94A3B8'
        )}
        {historyExpanded && (
          <div style={{ paddingLeft: '8px' }}>
            {history.slice(-6).reverse().map((h) => (
              <div
                key={h.entryId}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: '#64748B',
                  borderBottom: '1px solid #1E293B',
                }}
              >
                <span style={{ color: '#A78BFA' }}>{h.operation.operationType}</span> ({h.entryId.slice(0, 10)}...)
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
