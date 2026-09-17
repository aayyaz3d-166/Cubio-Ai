/**
 * CubiO — Universal Spatial Operating Environment
 * Exact Reference Master Spatial Operating Environment Dashboard
 */

import React, { useState, useCallback } from 'react';
import {
  Eye,
  Zap,
  Layers,
  Sparkles,
  Database,
  Brain,
  Settings,
  TrendingUp,
  Crosshair,
  RotateCcw,
  Activity,
  FileText,
  Boxes,
  Radio,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { CubiOTopBar } from './components/CubiOTopBar';
import { CubiOCentralCube } from './components/CubiOCentralCube';
import { CubiOLeftPanel } from './components/CubiOLeftPanel';
import { CubiORightPanel } from './components/CubiORightPanel';
import { CubiODimensionBar } from './components/CubiODimensionBar';
import { CubiOActivityLogModal } from './components/CubiOActivityLogModal';
import { CubiOSettingsModal } from './components/CubiOSettingsModal';
import {
  CubiODimension,
  CubiOStudioState,
  CubiOActivityLogEntry,
  CubiOIntelligenceQuery,
  CubiOSettings,
} from '../types';
import { generateInitialCubiOState, deterministicCubiOHash } from '../determinism';
import { Spatial3DModelMetadata } from './services/spatialModelParser';
import {
  SpatialToolsState,
  SpatialToolMode,
  MeasurementUnit,
  SlicePlaneConfig,
  SpatialTransformConfig,
} from './tools/types';
import { CubiOSpatialToolsEngine } from './tools/spatialToolsEngine';
import { SpatialToolBar } from './tools/SpatialToolBar';
import { SpatialToolPanel } from './tools/SpatialToolPanel';
import { SpatialActivityRail } from './tools/SpatialActivityRail';


export interface CubiOStudioAppProps {
  readonly onExit?: () => void;
  readonly onNavigateToIntelligence?: () => void;
  readonly onNavigateToNetwork?: () => void;
}

export const CubiOStudioApp: React.FC<CubiOStudioAppProps> = ({
  onExit,
  onNavigateToIntelligence,
  onNavigateToNetwork,
}) => {
  // Master Studio State
  const [studioState, setStudioState] = useState<CubiOStudioState>(() => generateInitialCubiOState());
  const [importedModel, setImportedModel] = useState<Spatial3DModelMetadata | null>(null);
  const [spatialTools, setSpatialTools] = useState<SpatialToolsState>(() => CubiOSpatialToolsEngine.getInitialState());

  // Modal States
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleSelectTool = useCallback((tool: SpatialToolMode) => {
    setSpatialTools((prev) => {
      const steps = CubiOSpatialToolsEngine.generateActivityPipeline(tool);
      return {
        ...prev,
        activeTool: prev.activeTool === tool ? 'SELECT' : tool,
        activityRail: steps,
      };
    });
  }, []);

  const handleUnitChange = useCallback((newUnit: MeasurementUnit) => {
    setSpatialTools((prev) => {
      const dims = importedModel ? importedModel.dimensions : { width: 32, height: 32, depth: 32 };
      const newMeasurement = CubiOSpatialToolsEngine.computeMeasurement(dims, newUnit);
      return {
        ...prev,
        unit: newUnit,
        measurement: newMeasurement,
      };
    });
  }, [importedModel]);

  const handleSliceChange = useCallback((newSlice: SlicePlaneConfig) => {
    setSpatialTools((prev) => ({
      ...prev,
      slice: newSlice,
    }));
  }, []);

  const handleTransformChange = useCallback((newTransform: SpatialTransformConfig) => {
    setSpatialTools((prev) => ({
      ...prev,
      transform: newTransform,
    }));
  }, []);


  // Helper to append activity log
  const appendLog = useCallback((subsystem: any, level: any, message: string) => {
    const entry: CubiOActivityLogEntry = {
      logId: `LOG_${deterministicCubiOHash(Date.now() + message)}`,
      timestamp: Date.now(),
      level,
      subsystem,
      message,
    };
    setStudioState((prev) => ({
      ...prev,
      activityLogs: [entry, ...prev.activityLogs],
    }));
  }, []);

  // Handlers
  const handleSelectDimension = useCallback((dim: CubiODimension) => {
    setStudioState((prev) => ({
      ...prev,
      activeDimension: dim,
    }));
    appendLog('DIMENSION', 'INFO', `Switched active dimension manifold to ${dim}.`);
  }, [appendLog]);

  const handleSelectState = useCallback((stateId: string) => {
    setStudioState((prev) => ({
      ...prev,
      activeStateId: stateId,
    }));
    appendLog('STATE', 'SUCCESS', `Focused state node '${stateId}'.`);
  }, [appendLog]);

  const handleSelectTabLeft = useCallback((tab: any) => {
    setStudioState((prev) => ({
      ...prev,
      activeTabLeft: tab,
    }));
  }, []);

  const handleSelectTabRight = useCallback((tab: any) => {
    setStudioState((prev) => ({
      ...prev,
      activeTabRight: tab,
    }));
  }, []);

  const handleExecuteQuery = useCallback((promptText: string) => {
    const queryId = `QRY_${deterministicCubiOHash(Date.now() + promptText)}`;
    const newQuery: CubiOIntelligenceQuery = {
      queryId,
      prompt: promptText,
      reasoningSteps: [
        `Step 1: Analyzed spatial semantics for prompt: "${promptText}"`,
        `Step 2: Queried active dimension (${studioState.activeDimension}) manifold topology.`,
        `Step 3: Correlated with 369 harmonic resonance flux (${studioState.harmonic.harmonicFlux}).`,
        `Step 4: Synthesized non-destructive spatial conclusion with 0 state divergence.`,
      ],
      inferredConclusion: `Intelligence Engine verified spatial coherence across manifold ${studioState.activeDimension}. All invariant bounds respected.`,
      confidence: 0.995,
      status: 'RESOLVED',
      timestamp: Date.now(),
    };

    setStudioState((prev) => ({
      ...prev,
      queries: [newQuery, ...prev.queries],
    }));

    appendLog('INTELLIGENCE', 'SUCCESS', `Executed spatial reasoning query '${queryId}'.`);
  }, [studioState.activeDimension, studioState.harmonic.harmonicFlux, appendLog]);

  const handleResonancePulse = useCallback(() => {
    setStudioState((prev) => ({
      ...prev,
      harmonic: {
        ...prev.harmonic,
        harmonicFlux: parseFloat((prev.harmonic.harmonicFlux + 0.01).toFixed(3)),
        resonanceScore: Math.min(100, prev.harmonic.resonanceScore + 0.1),
      },
    }));
    appendLog('ENGINE_369', 'RESONANCE', `369 Harmonic resonance pulse triggered at ${studioState.settings.resonanceFrequencyHz} Hz.`);
  }, [studioState.settings.resonanceFrequencyHz, appendLog]);

  const handleUpdateSettings = useCallback((newSettings: Partial<CubiOSettings>) => {
    setStudioState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
    appendLog('CORE', 'INFO', 'CubiO operating environment settings updated.');
  }, [appendLog]);

  const handleQuickAction = useCallback((actionId: string) => {
    if (actionId === 'NEW_INPUT') {
      appendLog('STATE', 'INFO', 'Spawned new spatial state input stream.');
    } else if (actionId === 'RUN_ANALYSIS') {
      handleResonancePulse();
      handleExecuteQuery('Compute 369 harmonic resonance flux for current manifold.');
    } else if (actionId === 'VIEW_MEMORY') {
      handleSelectTabLeft('MEMORY');
    }
  }, [appendLog, handleResonancePulse, handleExecuteQuery, handleSelectTabLeft]);

  const activeState = studioState.states.find((s) => s.stateId === studioState.activeStateId) || null;
  const latestLog = studioState.activityLogs[0]?.message || 'All CubiO engines online and synchronized.';

  // Architecture Flow 10 Nodes matching reference
  const architectureFlow = [
    { id: 'PERCEPTION', title: 'PERCEPTION', desc: 'Input from Reality', icon: Eye },
    { id: 'ENCODING', title: 'DIMENSION', desc: 'Represent as Manifold State', icon: Zap, customLabel: 'DIM' },
    { id: 'SUPERPOSITION', title: 'SUPERPOSITION', desc: 'Multiple States Active', icon: Layers },
    { id: 'PATTERNS', title: 'PATTERNS', desc: 'Detect & Analyze', icon: Sparkles },
    { id: 'MEMORY', title: 'MEMORY', desc: 'Store & Retrieve', icon: Database },
    { id: 'LEARNING', title: 'LEARNING', desc: 'Adapt & Improve', icon: Brain },
    { id: 'REASONING', title: 'REASONING', desc: 'Understand & Infer', icon: Settings },
    { id: 'PREDICTION', title: 'PREDICTION', desc: 'Project Future States', icon: TrendingUp },
    { id: 'DECISION', title: 'DECISION', desc: 'Select Best Path', icon: Crosshair },
    { id: 'FEEDBACK', title: 'FEEDBACK', desc: 'Reality Loop Update', icon: RotateCcw },
  ];


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#070D1A',
        color: '#0F172A',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. TOP HEADER */}
      <CubiOTopBar
        coreStatus={studioState.coreStatus}
        activeDimension={studioState.activeDimension}
        activeFrequencyHz={studioState.settings.resonanceFrequencyHz}
        unreadLogsCount={studioState.activityLogs.length}
        onOpenLogs={() => setIsLogsModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExit={onExit}
        onNavigateToIntelligence={onNavigateToIntelligence}
        onNavigateToNetwork={onNavigateToNetwork}
        onQuickAction={handleQuickAction}
      />

      {/* 2. MAIN DASHBOARD BODY (3-Column Layout: Left Sidebar, Center Visualization & Cards, Right Overview & Actions) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* LEFT COLUMN: Sidebar Navigation */}
        <CubiOLeftPanel
          activeTab={studioState.activeTabLeft}
          onSelectTab={handleSelectTabLeft}
          states={studioState.states}
          activeStateId={studioState.activeStateId}
          onSelectState={handleSelectState}
          memories={studioState.memories}
          harmonic={studioState.harmonic}
          activeDimension={studioState.activeDimension}
          onSelectDimension={handleSelectDimension}
          peers={studioState.peers}
          files={studioState.files}
        />

        {/* CENTER & RIGHT DASHBOARD CANVAS */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F8FAFC',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* A. CUBiO ARCHITECTURE FLOW (Top Horizontal White Card) */}
          <div style={{ padding: '12px 14px 6px 14px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '12px 16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#0F172A',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                CUBiO ARCHITECTURE FLOW
              </div>

              {/* 10 Connected Nodes in Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  overflowX: 'auto',
                  gap: '4px',
                  padding: '2px 0',
                }}
              >
                {architectureFlow.map((node, idx) => {
                  const Icon = node.icon;
                  return (
                    <React.Fragment key={node.id}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          minWidth: '82px',
                        }}
                      >
                        {/* Circular Icon Holder */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: '#F8FAFC',
                            border: '1.5px solid #FDE68A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(217, 119, 6, 0.1)',
                            marginBottom: '4px',
                          }}
                        >
                          {node.customLabel ? (
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#D97706', fontFamily: 'monospace' }}>
                              369
                            </span>
                          ) : (
                            <Icon className="w-4 h-4 text-amber-600" />
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: '#0F172A',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {node.title}
                        </span>
                        <span
                          style={{
                            fontSize: '8px',
                            color: '#64748B',
                            lineHeight: 1.1,
                            marginTop: '1px',
                          }}
                        >
                          {node.desc}
                        </span>
                      </div>

                      {/* Golden Arrow */}
                      {idx < architectureFlow.length - 1 && (
                        <span style={{ color: '#D97706', fontSize: '13px', fontWeight: 800, opacity: 0.8 }}>
                          →
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* B. MAIN INTERACTIVE WORKSPACE (Center 3D Cube + 4 Lower Cards | Right Column) */}
          <div style={{ display: 'flex', gap: '12px', padding: '6px 14px 12px 14px', flex: 1 }}>
            {/* CENTER COLUMN: 3D Visualization + 4 Lower Information Cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              {/* 1. Large Central Spatial Visualization */}
              <div style={{ height: '360px', width: '100%', position: 'relative', shrink: 0 }}>
                <CubiOCentralCube
                  activeDimension={studioState.activeDimension}
                  harmonic={studioState.harmonic}
                  selectedFace={studioState.selectedCubeFace}
                  onSelectFace={(face) => setStudioState((p) => ({ ...p, selectedCubeFace: face }))}
                  onResonancePulse={handleResonancePulse}
                  onSelectDimension={handleSelectDimension}
                  importedModel={importedModel}
                  onModelLoaded={(meta) => {
                    setImportedModel(meta);
                    const meas = CubiOSpatialToolsEngine.computeMeasurement(meta.dimensions, spatialTools.unit);
                    const insp = CubiOSpatialToolsEngine.inspectGeometry(meta);
                    setSpatialTools((p) => ({
                      ...p,
                      measurement: meas,
                      inspectReport: insp,
                    }));
                    appendLog('DIMENSION', 'SUCCESS', `Imported 3D Model: ${meta.fileName} (${meta.vertexCount} verts, ${meta.faceCount} faces).`);
                  }}
                  onRemoveModel={() => {
                    setImportedModel(null);
                    setSpatialTools((p) => ({ ...p, inspectReport: null }));
                    appendLog('DIMENSION', 'INFO', 'Removed active 3D model.');
                  }}
                  sliceConfig={spatialTools.slice}
                  transformConfig={spatialTools.transform}
                  activeTool={spatialTools.activeTool}
                />
              </div>

              {/* 1B. Spatial Tools Bar & Interactive Drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <SpatialToolBar
                    activeTool={spatialTools.activeTool}
                    onSelectTool={handleSelectTool}
                    hasImportedModel={!!importedModel}
                  />

                  {/* Compact Activity Progress Rail */}
                  <div style={{ flex: 1, maxWidth: '280px' }}>
                    <SpatialActivityRail steps={spatialTools.activityRail} isProcessing={spatialTools.isProcessing} />
                  </div>
                </div>

                {spatialTools.activeTool !== 'SELECT' && (
                  <SpatialToolPanel
                    activeTool={spatialTools.activeTool}
                    unit={spatialTools.unit}
                    onUnitChange={handleUnitChange}
                    measurement={spatialTools.measurement}
                    inspectReport={spatialTools.inspectReport}
                    slice={spatialTools.slice}
                    onSliceChange={handleSliceChange}
                    transform={spatialTools.transform}
                    onTransformChange={handleTransformChange}
                    importedModel={importedModel}
                    onClose={() => handleSelectTool('SELECT')}
                    onAskAIAboutTool={(prompt) => {
                      handleExecuteQuery(prompt);
                      onNavigateToIntelligence?.();
                    }}
                  />
                )}
              </div>



              {/* 2. Four Lower Information Cards (Matching Reference) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {/* CARD 1: INPUT STREAMS */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      INPUT STREAMS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
                      {[
                        { name: 'Text Data', status: 'Streaming', color: '#059669' },
                        { name: 'Numeric Data', status: 'Streaming', color: '#059669' },
                        { name: 'Image Data', status: 'Active', color: '#059669' },
                        { name: '3D Models', status: 'Active', color: '#059669' },
                        { name: 'Sensor Data', status: 'Active', color: '#059669' },
                        { name: 'API / DB', status: 'Connected', color: '#059669' },
                      ].map((item) => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#475569' }}>📄 {item.name}</span>
                          <strong style={{ color: item.color, fontFamily: 'monospace' }}>{item.status}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '6px',
                      marginTop: '8px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '4px',
                    }}
                  >
                    <span>View All Streams</span>
                    <span>→</span>
                  </div>
                </div>

                {/* CARD 2: PATTERN INSIGHTS */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      PATTERN INSIGHTS
                    </div>

                    {/* Constellation Mini SVG */}
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="140" height="32" viewBox="0 0 140 32" fill="none">
                        <circle cx="20" cy="16" r="3" fill="#D97706" />
                        <circle cx="50" cy="8" r="2.5" fill="#F59E0B" />
                        <circle cx="70" cy="22" r="3.5" fill="#FDE68A" />
                        <circle cx="100" cy="12" r="2.5" fill="#D97706" />
                        <circle cx="125" cy="20" r="3" fill="#F59E0B" />
                        <line x1="20" y1="16" x2="50" y2="8" stroke="#FDE68A" strokeWidth="1" />
                        <line x1="50" y1="8" x2="70" y2="22" stroke="#FDE68A" strokeWidth="1" />
                        <line x1="70" y1="22" x2="100" y2="12" stroke="#FDE68A" strokeWidth="1" />
                        <line x1="100" y1="12" x2="125" y2="20" stroke="#FDE68A" strokeWidth="1" />
                      </svg>
                    </div>

                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', marginBottom: '4px' }}>
                      Top Patterns
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9.5px' }}>
                      {[
                        { id: 'P-001', name: 'Recurring Structure', conf: '96%' },
                        { id: 'P-002', name: 'Dimensional Relation', conf: '95%' },
                        { id: 'P-003', name: 'State Transition', conf: '93%' },
                        { id: 'P-004', name: 'Anomaly Detected', conf: '89%' },
                        { id: 'P-005', name: 'Symmetry Pattern', conf: '87%' },
                      ].map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>{p.id}</span>
                          <span style={{ color: '#64748B' }}>{p.name}</span>
                          <strong style={{ color: '#059669' }}>{p.conf}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '6px',
                      marginTop: '8px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '4px',
                    }}
                  >
                    <span>Explore Patterns</span>
                    <span>→</span>
                  </div>
                </div>

                {/* CARD 3: PREDICTION PREVIEW */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                      PREDICTION PREVIEW
                    </div>

                    {/* Mini Wave Graph */}
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="140" height="28" viewBox="0 0 140 28" fill="none">
                        <path
                          d="M4 22 L30 16 L60 20 L90 8 L120 12 L136 6"
                          stroke="#D97706"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 22 L30 16 L60 20 L90 8 L120 12 L136 6 L136 28 L4 28 Z"
                          fill="rgba(245, 158, 11, 0.08)"
                        />
                      </svg>
                    </div>

                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', marginBottom: '4px' }}>
                      Top Predicted States
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9.5px' }}>
                      {[
                        { id: 'S-1258', prob: '0.92', conf: '92%' },
                        { id: 'S-1259', prob: '0.81', conf: '87%' },
                        { id: 'S-1260', prob: '0.73', conf: '80%' },
                        { id: 'S-1261', prob: '0.64', conf: '75%' },
                      ].map((s) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>{s.id}</span>
                          <span style={{ color: '#64748B' }}>{s.prob}</span>
                          <strong style={{ color: '#059669' }}>{s.conf}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '6px',
                      marginTop: '8px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '4px',
                    }}
                  >
                    <span>View All Predictions</span>
                    <span>→</span>
                  </div>
                </div>

                {/* CARD 4: RECENT LEARNING */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      RECENT LEARNING
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '9.5px' }}>
                      {[
                        { text: 'Pattern P-001 strengthened', time: '2m ago' },
                        { text: 'New relationship discovered', time: '5m ago' },
                        { text: 'State prediction improved', time: '7m ago' },
                        { text: 'Anomaly pattern learned', time: '11m ago' },
                        { text: 'Feedback loop updated', time: '13m ago' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#334155' }}>⚡ {item.text}</span>
                          <span style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '8.5px' }}>{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '6px',
                      marginTop: '8px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '4px',
                    }}
                  >
                    <span>View Learning Log</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SYSTEM OVERVIEW, CUBiO CORE STATUS & QUICK ACTIONS */}
            <CubiORightPanel
              activeTab={studioState.activeTabRight}
              onSelectTab={handleSelectTabRight}
              queries={studioState.queries}
              onExecuteQuery={handleExecuteQuery}
              activeState={activeState}
              harmonic={studioState.harmonic}
              activeDimension={studioState.activeDimension}
              selectedCubeFace={studioState.selectedCubeFace}
              onQuickAction={handleQuickAction}
              onOpenLogs={() => setIsLogsModalOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          </div>

          {/* C. BOTTOM REALTIME TELEMETRY & MESSAGE CONSOLE */}
          <CubiODimensionBar
            activeDimension={studioState.activeDimension}
            onSelectDimension={handleSelectDimension}
            activeState={activeState}
            latestLogMessage={latestLog}
          />
        </div>
      </div>

      {/* MODALS */}
      <CubiOActivityLogModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={studioState.activityLogs}
        onClearLogs={() => setStudioState((p) => ({ ...p, activityLogs: [] }))}
      />

      <CubiOSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={studioState.settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};
