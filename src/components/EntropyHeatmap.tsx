/**
 * 7x7x7 Spatial Grid Entropy & Information Density Heatmap
 * 
 * Visualizes the Shannon entropy and spatial information density across the 343 grid cells.
 * Features:
 * - 3-Axis Orthogonal Slice Heatmaps (Z-depth, Y-height, X-width)
 * - 7-Layer Matrix All-in-One Multi-View (0..6 layers simultaneously)
 * - 2D Maximum Intensity Projection (MIP)
 * - Dynamic Metric Modes: Composite Density, Shannon Bits, Occurrence Hits, Connectivity Degree
 * - High-Density Hotspot Leaderboard / Cluster Detection
 * - Interactive Cell Inspection & Tooltip details
 */

import React, { useState, useMemo } from 'react';
import { MemoryCell, MemoryGrid3D } from '../types/memory';
import {
  computeGridEntropyAnalysis,
  getEntropyHeatColor,
  CellEntropyData,
  GridEntropySummary,
  SliceEntropyData,
} from '../core/entropy';
import {
  Flame,
  Layers,
  Activity,
  Sliders,
  Eye,
  Info,
  Maximize2,
  TrendingUp,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart2,
  Grid3X3,
} from 'lucide-react';

interface EntropyHeatmapProps {
  grid: MemoryGrid3D;
  selectedCellId?: number | null;
  onSelectCell?: (cellId: number) => void;
}

export const EntropyHeatmap: React.FC<EntropyHeatmapProps> = ({
  grid,
  selectedCellId,
  onSelectCell,
}) => {
  // Navigation & View States
  const [activePlane, setActivePlane] = useState<'Z' | 'Y' | 'X'>('Z');
  const [currentLayer, setCurrentLayer] = useState<number>(0);
  const [viewLayout, setViewLayout] = useState<'SINGLE_SLICE' | 'ALL_LAYERS' | 'PROJECTION'>('SINGLE_SLICE');
  const [metricMode, setMetricMode] = useState<'DENSITY' | 'SHANNON_BITS' | 'FREQUENCY' | 'CONNECTIVITY'>('DENSITY');
  const [colorScheme, setColorScheme] = useState<'CYBER' | 'THERMAL' | 'NEON'>('CYBER');
  const [minThreshold, setMinThreshold] = useState<number>(0);
  const [hoveredCell, setHoveredCell] = useState<CellEntropyData | null>(null);

  // Compute Grid Entropy Analysis
  const entropyAnalysis: GridEntropySummary = useMemo(() => {
    return computeGridEntropyAnalysis(grid.cells, grid.sequenceSteps?.length);
  }, [grid.cells, grid.sequenceSteps?.length]);

  // Current active slice data
  const currentSlice: SliceEntropyData | undefined = useMemo(() => {
    if (activePlane === 'Z') return entropyAnalysis.slicesZ[currentLayer];
    if (activePlane === 'Y') return entropyAnalysis.slicesY[currentLayer];
    return entropyAnalysis.slicesX[currentLayer];
  }, [entropyAnalysis, activePlane, currentLayer]);

  // Current projection data
  const currentProjection: number[][] = useMemo(() => {
    if (activePlane === 'Z') return entropyAnalysis.compositeProjectionZ;
    if (activePlane === 'Y') return entropyAnalysis.compositeProjectionY;
    return entropyAnalysis.compositeProjectionX;
  }, [entropyAnalysis, activePlane]);

  // Helper to format metric value on cell
  const getCellMetricDisplay = (cell: CellEntropyData): string => {
    if (cell.state === 0) return '';
    switch (metricMode) {
      case 'DENSITY':
        return cell.informationDensityScore > 0 ? `${Math.round(cell.informationDensityScore * 100)}` : '';
      case 'SHANNON_BITS':
        return cell.selfInformationBits > 0 ? `${cell.selfInformationBits.toFixed(1)}` : '';
      case 'FREQUENCY':
        return cell.occurrenceCount > 0 ? `×${cell.occurrenceCount}` : '';
      case 'CONNECTIVITY':
        return cell.transitionDegree > 0 ? `${cell.transitionDegree}` : '';
      default:
        return cell.symbol || '';
    }
  };

  const getMetricLabel = (): string => {
    switch (metricMode) {
      case 'DENSITY':
        return 'Information Density Score (0..100)';
      case 'SHANNON_BITS':
        return 'Self-Information (Bits: -log₂ p)';
      case 'FREQUENCY':
        return 'Visit Occurrences (Hit Count)';
      case 'CONNECTIVITY':
        return 'Sequence Transition Degree';
    }
  };

  return (
    <div className="bg-[#101013] rounded border border-[#2B2B30] overflow-hidden flex flex-col text-xs font-mono select-none">
      {/* Top Banner / Header */}
      <div className="px-4 py-3 bg-[#151519] border-b border-[#2B2B30] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Entropy & Information Density Heatmap
            </h3>
            <span className="text-[10px] text-gray-400">
              7×7×7 Matrix Distribution & Hotspot Detection
            </span>
          </div>
        </div>

        {/* Global Shannon Entropy Pill */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-[#0A0A0D] border border-cyan-900/60 flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Global H(X):</span>
            <span className="text-xs font-bold text-cyan-400">
              {entropyAnalysis.globalShannonEntropyBits} <span className="text-[9px] text-gray-500">bits</span>
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#0A0A0D] border border-rose-900/60 flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Hotspots:</span>
            <span className="text-xs font-bold text-rose-400">
              {entropyAnalysis.highDensityHotspotCount} <span className="text-[9px] text-gray-500">cells</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 space-y-3.5">
        {/* Controls Bar: Layout Selector, Plane Switcher, Metric Mode, Color Scheme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#0C0C0F] p-2.5 rounded border border-[#222228]">
          {/* 1. Layout View Mode */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold block">VIEW LAYOUT</span>
            <div className="flex rounded bg-[#16161C] p-0.5 border border-[#262630]">
              <button
                onClick={() => setViewLayout('SINGLE_SLICE')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  viewLayout === 'SINGLE_SLICE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Layer Slice
              </button>
              <button
                onClick={() => setViewLayout('ALL_LAYERS')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  viewLayout === 'ALL_LAYERS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                7-Layer Matrix
              </button>
              <button
                onClick={() => setViewLayout('PROJECTION')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  viewLayout === 'PROJECTION'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                2D Projection (MIP)
              </button>
            </div>
          </div>

          {/* 2. Plane Selector (Z, Y, X) */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold block">ORTHOGONAL PLANE</span>
            <div className="flex rounded bg-[#16161C] p-0.5 border border-[#262630]">
              <button
                onClick={() => setActivePlane('Z')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold cursor-pointer ${
                  activePlane === 'Z'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/60'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Z (Depth XY)
              </button>
              <button
                onClick={() => setActivePlane('Y')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold cursor-pointer ${
                  activePlane === 'Y'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Y (Height XZ)
              </button>
              <button
                onClick={() => setActivePlane('X')}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold cursor-pointer ${
                  activePlane === 'X'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/60'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                X (Width YZ)
              </button>
            </div>
          </div>

          {/* 3. Metric Value Display Toggle */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold block">HEATMAP METRIC</span>
            <select
              value={metricMode}
              onChange={(e) => setMetricMode(e.target.value as any)}
              className="w-full py-1 px-2 rounded bg-[#16161C] border border-[#262630] text-gray-200 text-[10px] focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="DENSITY">Information Density Index (0-100)</option>
              <option value="SHANNON_BITS">Shannon Self-Information (-log₂ p)</option>
              <option value="FREQUENCY">Token Occurrences (Hit Count)</option>
              <option value="CONNECTIVITY">Transition Connectivity (Degree)</option>
            </select>
          </div>

          {/* 4. Color Spectrum & Threshold */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-semibold">MIN THRESHOLD</span>
              <span className="text-[10px] text-rose-400 font-bold">{Math.round(minThreshold * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#1F1F26] rounded"
              />
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                className="py-0.5 px-1.5 rounded bg-[#16161C] border border-[#262630] text-gray-300 text-[9px] cursor-pointer"
              >
                <option value="CYBER">Cyber</option>
                <option value="THERMAL">Thermal</option>
                <option value="NEON">Neon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Heatmap Visualization Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Main Visualizer (Cols 7 or 8) */}
          <div className="lg:col-span-8 bg-[#0A0A0D] p-3.5 rounded border border-[#222228] flex flex-col items-center justify-center min-h-[380px]">
            {/* Slicing Controls Header (if SINGLE_SLICE) */}
            {viewLayout === 'SINGLE_SLICE' && (
              <div className="w-full flex items-center justify-between mb-3 px-1 border-b border-[#1A1A22] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold text-[11px]">
                    {activePlane} PLANE — LAYER {currentLayer} of 6
                  </span>
                  <span className="text-[10px] text-gray-500">
                    ({currentSlice?.totalActive || 0} active cells · {currentSlice?.totalOccurrences || 0} hits)
                  </span>
                </div>

                {/* Layer Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentLayer <= 0}
                    onClick={() => setCurrentLayer((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded bg-[#16161C] hover:bg-[#202028] disabled:opacity-30 text-gray-300 cursor-pointer border border-[#282834]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((l) => (
                      <button
                        key={l}
                        onClick={() => setCurrentLayer(l)}
                        className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          currentLayer === l
                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50'
                            : 'bg-[#16161C] text-gray-400 hover:text-gray-200 border border-[#262632]'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={currentLayer >= 6}
                    onClick={() => setCurrentLayer((prev) => Math.min(6, prev + 1))}
                    className="p-1 rounded bg-[#16161C] hover:bg-[#202028] disabled:opacity-30 text-gray-300 cursor-pointer border border-[#282834]"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* View Mode 1: Single 7x7 Slice */}
            {viewLayout === 'SINGLE_SLICE' && currentSlice && (
              <div className="flex flex-col items-center">
                {/* 7x7 Grid Container */}
                <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#121216] rounded border border-[#252530] shadow-2xl">
                  {currentSlice.cells.map((row, rowIdx) =>
                    row.map((cell, colIdx) => {
                      const isFiltered = cell.informationDensityScore < minThreshold && cell.state === 1;
                      const isSelected = selectedCellId === cell.cellId;
                      const heat = getEntropyHeatColor(
                        isFiltered ? 0 : cell.informationDensityScore,
                        colorScheme,
                        isFiltered ? 0 : cell.state
                      );

                      return (
                        <div
                          key={cell.cellId}
                          onClick={() => onSelectCell && onSelectCell(cell.cellId)}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            backgroundColor: heat.bg,
                            borderColor: isSelected ? '#38BDF8' : heat.border,
                            boxShadow: isSelected ? '0 0 12px #38BDF8' : heat.glow,
                          }}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative ${
                            cell.state === 1 ? 'hover:scale-110 z-10' : 'hover:border-gray-500'
                          }`}
                        >
                          {cell.state === 1 && (
                            <>
                              <span
                                style={{ color: heat.text }}
                                className="text-[12px] font-bold leading-none select-none"
                              >
                                {cell.symbol || '·'}
                              </span>
                              <span
                                style={{ color: heat.text }}
                                className="text-[8px] font-mono opacity-85 leading-none mt-0.5"
                              >
                                {getCellMetricDisplay(cell)}
                              </span>
                            </>
                          )}
                          {cell.state === 0 && (
                            <span className="text-[9px] text-gray-600 font-mono">·</span>
                          )}

                          {/* Coordinates sub-badge on hover */}
                          <div className="absolute top-0.5 left-0.5 text-[6px] text-gray-500 opacity-60">
                            {cell.x},{cell.y}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Axes notation */}
                <div className="flex justify-between w-full max-w-[340px] mt-2 text-[9px] text-gray-500 px-1">
                  <span>
                    ← {activePlane === 'Z' ? 'X: 0' : activePlane === 'Y' ? 'X: 0' : 'Y: 0'}
                  </span>
                  <span className="text-gray-400 font-bold">{getMetricLabel()}</span>
                  <span>
                    {activePlane === 'Z' ? 'X: 6' : activePlane === 'Y' ? 'X: 6' : 'Y: 6'} →
                  </span>
                </div>
              </div>
            )}

            {/* View Mode 2: 7-Layer Matrix All-in-One Multi-View */}
            {viewLayout === 'ALL_LAYERS' && (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-[#1C1C24] pb-1.5">
                  <span className="font-bold text-cyan-300">
                    COMPLETE 7-LAYER {activePlane}-AXIS VOLUME MATRIX (LAYERS 0..6)
                  </span>
                  <span>Click any cell to highlight in 3D canvas</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((lIdx) => {
                    const slice =
                      activePlane === 'Z'
                        ? entropyAnalysis.slicesZ[lIdx]
                        : activePlane === 'Y'
                        ? entropyAnalysis.slicesY[lIdx]
                        : entropyAnalysis.slicesX[lIdx];

                    return (
                      <div
                        key={lIdx}
                        onClick={() => {
                          setCurrentLayer(lIdx);
                          setViewLayout('SINGLE_SLICE');
                        }}
                        className={`p-1.5 rounded bg-[#121216] border transition-all cursor-pointer hover:border-cyan-500/80 ${
                          currentLayer === lIdx ? 'border-cyan-500/50' : 'border-[#22222A]'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[8px] text-gray-400 mb-1 px-0.5">
                          <span className="font-bold text-gray-200">Layer {lIdx}</span>
                          <span className="text-cyan-400">{slice.totalActive} active</span>
                        </div>

                        {/* Mini 7x7 */}
                        <div className="grid grid-cols-7 gap-0.5 bg-[#0A0A0D] p-1 rounded">
                          {slice.cells.map((row, r) =>
                            row.map((c, col) => {
                              const heat = getEntropyHeatColor(
                                c.informationDensityScore,
                                colorScheme,
                                c.state
                              );
                              return (
                                <div
                                  key={c.cellId}
                                  title={`Cell #${c.cellId} (${c.x},${c.y},${c.z}): ${c.symbol || 'Empty'} [H: ${c.informationDensityScore}]`}
                                  style={{
                                    backgroundColor: heat.bg,
                                    borderColor: heat.border,
                                  }}
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] border flex items-center justify-center text-[6px] text-white"
                                >
                                  {c.state === 1 && (c.symbol ? c.symbol[0] : '')}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Mode 3: 2D Maximum Intensity Projection (MIP) */}
            {viewLayout === 'PROJECTION' && (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-center space-y-0.5 mb-1">
                  <span className="text-purple-300 font-bold text-[11px] block">
                    MAXIMUM INTENSITY PROJECTION (MIP) ALONG {activePlane}-AXIS
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Collapses all 7 layers along {activePlane} to reveal maximum information concentration paths.
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#121216] rounded border border-purple-900/40 shadow-2xl">
                  {currentProjection.map((row, rIdx) =>
                    row.map((maxScore, cIdx) => {
                      const heat = getEntropyHeatColor(maxScore, colorScheme, maxScore > 0 ? 1 : 0);
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          style={{
                            backgroundColor: heat.bg,
                            borderColor: heat.border,
                            boxShadow: heat.glow,
                          }}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded border flex flex-col items-center justify-center transition-all relative"
                        >
                          {maxScore > 0 && (
                            <>
                              <span style={{ color: heat.text }} className="text-[10px] font-bold">
                                {Math.round(maxScore * 100)}
                              </span>
                              <span style={{ color: heat.text }} className="text-[7px] opacity-75">
                                max D
                              </span>
                            </>
                          )}
                          {maxScore === 0 && <span className="text-gray-700 text-[8px]">0</span>}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-[9px] text-gray-500 text-center">
                  Values represent peak Information Density (0..100) through depth
                </div>
              </div>
            )}

            {/* Color Heat Legend */}
            <div className="w-full flex items-center justify-between max-w-[420px] mt-4 pt-2 border-t border-[#181820] text-[9px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#121216] border border-[#282830] inline-block" />
                Empty (0.0)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-900 border border-blue-500 inline-block" />
                Low (0.25)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 border border-cyan-300 inline-block" />
                Medium (0.50)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-300 inline-block" />
                High (0.75)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-300 inline-block" />
                Critical (1.00)
              </span>
            </div>
          </div>

          {/* Right Column: Active Cell Inspector & Hotspot Leaderboard */}
          <div className="lg:col-span-4 space-y-3">
            {/* Live Hovered / Selected Cell Telemetry */}
            <div className="bg-[#0A0A0D] p-3 rounded border border-[#24242C] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1C1C24] pb-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  Cell Telemetry
                </span>
                {hoveredCell ? (
                  <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold">
                    HOTSPOT
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-500">Hover any cell</span>
                )}
              </div>

              {hoveredCell ? (
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Position (X, Y, Z):</span>
                    <span className="text-white font-bold">
                      ({hoveredCell.x}, {hoveredCell.y}, {hoveredCell.z}) · ID #{hoveredCell.cellId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Token / Symbol:</span>
                    <span className="text-cyan-300 font-bold text-xs">
                      '{hoveredCell.symbol || 'None'}'
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Information Density:</span>
                    <span className="text-rose-400 font-bold">
                      {Math.round(hoveredCell.informationDensityScore * 100)}% ({hoveredCell.densityCategory})
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Self-Information I(x):</span>
                    <span className="text-amber-300 font-bold">
                      {hoveredCell.selfInformationBits} bits
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Visit Frequency:</span>
                    <span className="text-green-300 font-bold">
                      {hoveredCell.occurrenceCount} visits ({hoveredCell.stepIndices.length} steps)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#131318] p-1.5 rounded">
                    <span className="text-gray-400">Active Neighbors:</span>
                    <span className="text-purple-300 font-bold">
                      {hoveredCell.localActiveNeighbors6} (6-axis) / {hoveredCell.localActiveNeighbors26} (26-cube)
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectCell && onSelectCell(hoveredCell.cellId)}
                    className="w-full mt-1 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Select in 3D Canvas
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-[10px]">
                  Hover or click any cell in the 7×7 matrix to inspect Shannon bits, neighbor cluster density, and sequence degree.
                </div>
              )}
            </div>

            {/* High-Density Hotspot Leaderboard */}
            <div className="bg-[#0A0A0D] p-3 rounded border border-[#24242C] space-y-2">
              <div className="flex items-center justify-between border-b border-[#1C1C24] pb-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Top Hotspots Ranked
                </span>
                <span className="text-[9px] text-gray-500">
                  {entropyAnalysis.hotspots.length} active cells
                </span>
              </div>

              {entropyAnalysis.hotspots.length > 0 ? (
                <div className="max-h-[190px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {entropyAnalysis.hotspots.slice(0, 7).map((hotspot, idx) => (
                    <div
                      key={hotspot.cellId}
                      onClick={() => {
                        if (onSelectCell) onSelectCell(hotspot.cellId);
                        setCurrentLayer(activePlane === 'Z' ? hotspot.z : activePlane === 'Y' ? hotspot.y : hotspot.x);
                      }}
                      className="p-1.5 rounded bg-[#121217] hover:bg-[#1A1A22] border border-[#202028] hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-[#1C1C26] text-gray-400 font-bold text-[9px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="text-white font-bold text-xs mr-1.5">
                            '{hotspot.symbol || '·'}'
                          </span>
                          <span className="text-[9px] text-gray-500">
                            ({hotspot.x},{hotspot.y},{hotspot.z})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-rose-400 font-bold text-[10px] block">
                          {Math.round(hotspot.informationDensityScore * 100)}%
                        </span>
                        <span className="text-[8px] text-gray-500">
                          {hotspot.occurrenceCount} hits · {hotspot.selfInformationBits} bits
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-gray-500 text-[10px]">
                  No active cells detected in memory.
                </div>
              )}
            </div>

            {/* Spatial Clustering Metric */}
            <div className="bg-[#0A0A0D] p-2.5 rounded border border-[#24242C] flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-400">Spatial Clustering Index:</span>
              </div>
              <span className="text-purple-300 font-bold">
                {entropyAnalysis.spatialClusteringIndex}x (autocorrelation)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
