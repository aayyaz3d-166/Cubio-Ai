/**
 * Research Mode & Spatial Probe Panel
 * 
 * Features:
 * 1. 3D Spatial Coordinate Probe & Real-time Cell Introspection
 * 2. Euclidean Distance Search: Finds nearest active cells ordered by d = √(Δx² + Δy² + Δz²)
 * 3. Search by 369 Address (0..368) & Search by Symbol
 * 4. 3D Trajectory Pathfinding: Computes step-by-step orthogonal path between Start & End points
 */

import React, { useState, useMemo } from 'react';
import {
  Coordinate3D,
  MemoryCell,
  MemoryGrid3D,
  NearestCellInfo,
  TrajectoryPath,
} from '../types';
import {
  findNearestActiveCells,
  searchByAddress,
  searchBySymbol,
} from '../core/spatialSearch';
import { calculateGridTrajectory } from '../core/trajectory';
import {
  coordToCellId,
  cellIdToAddress369,
  cellIdToCoordinate,
} from '../core/address369';
import {
  Crosshair,
  Search,
  Route,
  Navigation,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  Hash,
} from 'lucide-react';

interface ResearchModePanelProps {
  grid: MemoryGrid3D;
  selectedCell: MemoryCell | null;
  onSelectCell: (cellId: number) => void;
  onSetTrajectory?: (path: TrajectoryPath | null) => void;
}

export const ResearchModePanel: React.FC<ResearchModePanelProps> = ({
  grid,
  selectedCell,
  onSelectCell,
  onSetTrajectory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PROBE' | 'SEARCH' | 'TRAJECTORY'>('PROBE');

  // Spatial Coordinate Probe State
  const [probeCoord, setProbeCoord] = useState<Coordinate3D>({
    x: selectedCell ? selectedCell.x : 3,
    y: selectedCell ? selectedCell.y : 3,
    z: selectedCell ? selectedCell.z : 3,
  });

  const queryCellId = coordToCellId(probeCoord.x, probeCoord.y, probeCoord.z);
  const queryAddress369 = cellIdToAddress369(queryCellId);
  const queryCell = grid.cells[queryCellId];

  // Nearest Active Cells from Query Probe
  const nearestActive = findNearestActiveCells(
    probeCoord,
    grid,
    queryCell.state === 1 ? undefined : undefined,
    5
  );

  // Search Engine State
  const [searchAddrInput, setSearchAddrInput] = useState<string>('26');
  const [searchSymbolInput, setSearchSymbolInput] = useState<string>('H');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Trajectory Pathfinder State
  const [trajStartId, setTrajStartId] = useState<number>(() => grid.entryCellId ?? 0);
  const [trajEndId, setTrajEndId] = useState<number>(() => {
    const active = grid.cells.filter((c) => c.state === 1);
    return active.length > 1 ? active[active.length - 1].id : 342;
  });
  const [activeTrajectory, setActiveTrajectory] = useState<TrajectoryPath | null>(null);

  const syncProbeWithSelected = () => {
    if (selectedCell) {
      setProbeCoord({ x: selectedCell.x, y: selectedCell.y, z: selectedCell.z });
    }
  };

  const handleSearchAddress = () => {
    const addr = parseInt(searchAddrInput, 10);
    if (isNaN(addr) || addr < 0 || addr > 368) {
      setSearchFeedback('Please enter a valid 369 Address between 0 and 368.');
      return;
    }
    const result = searchByAddress(addr, grid);
    setSearchFeedback(result.message);
    if (result.found && result.cellIds.length > 0) {
      onSelectCell(result.cellIds[0]);
    }
  };

  const handleSearchSymbol = () => {
    if (!searchSymbolInput.trim()) {
      setSearchFeedback('Please enter a character or symbol.');
      return;
    }
    const result = searchBySymbol(searchSymbolInput, grid);
    setSearchFeedback(result.message);
    if (result.found && result.cellIds.length > 0) {
      onSelectCell(result.cellIds[0]);
    }
  };

  const handleCalculateTrajectory = () => {
    const path = calculateGridTrajectory(trajStartId, trajEndId);
    setActiveTrajectory(path);
    if (onSetTrajectory) {
      onSetTrajectory(path);
    }
  };

  const handleClearTrajectory = () => {
    setActiveTrajectory(null);
    if (onSetTrajectory) {
      onSetTrajectory(null);
    }
  };

  return (
    <div className="bg-[#111113] rounded border border-[#2D2D2F] overflow-hidden flex flex-col h-full shadow-xl text-xs">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-[#2D2D2F] bg-[#141416] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('PROBE')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              activeSubTab === 'PROBE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Probe & Nearest
          </button>
          <button
            onClick={() => setActiveSubTab('SEARCH')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              activeSubTab === 'SEARCH'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Address / Symbol Search
          </button>
          <button
            onClick={() => setActiveSubTab('TRAJECTORY')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              activeSubTab === 'TRAJECTORY'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            3D Trajectory
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* SUBTAB 1: PROBE & NEAREST EUCLIDEAN */}
        {activeSubTab === 'PROBE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-gray-500 font-bold tracking-wider">
                Spatial Probe (X, Y, Z)
              </span>
              <button
                onClick={syncProbeWithSelected}
                disabled={!selectedCell}
                className="text-[11px] px-2 py-0.5 rounded bg-[#2D2D2F] hover:bg-[#3D3D3F] disabled:opacity-40 text-[#E0E0E0] font-mono transition-colors border border-[#3D3D3F] cursor-pointer"
              >
                Sync with Selected
              </button>
            </div>

            {/* Spatial Coordinate Sliders */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                    <span>X-Axis</span>
                    <span className="text-cyan-400 font-bold">{probeCoord.x}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    value={probeCoord.x}
                    onChange={(e) =>
                      setProbeCoord((prev) => ({ ...prev, x: Number(e.target.value) }))
                    }
                    className="w-full accent-cyan-500 h-1 bg-[#2D2D2F] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                    <span>Y-Axis</span>
                    <span className="text-purple-400 font-bold">{probeCoord.y}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    value={probeCoord.y}
                    onChange={(e) =>
                      setProbeCoord((prev) => ({ ...prev, y: Number(e.target.value) }))
                    }
                    className="w-full accent-purple-500 h-1 bg-[#2D2D2F] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-1">
                    <span>Z-Axis</span>
                    <span className="text-amber-400 font-bold">{probeCoord.z}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    value={probeCoord.z}
                    onChange={(e) =>
                      setProbeCoord((prev) => ({ ...prev, z: Number(e.target.value) }))
                    }
                    className="w-full accent-amber-500 h-1 bg-[#2D2D2F] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Current Probe Point Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
                <span className="text-[10px] text-gray-500 block font-mono">Cell ID</span>
                <span className="text-sm font-bold text-[#E0E0E0] font-mono">#{queryCellId}</span>
              </div>

              <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
                <span className="text-[10px] text-gray-500 block font-mono">369 Address</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{queryAddress369}</span>
              </div>

              <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
                <span className="text-[10px] text-gray-500 block font-mono">State</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    queryCell.state === 1 ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  {queryCell.state === 1 ? 'Active (1)' : 'Idle (0)'}
                </span>
              </div>

              <div className="bg-[#0A0A0B] p-2.5 rounded border border-[#2D2D2F]">
                <span className="text-[10px] text-gray-500 block font-mono">Symbol</span>
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {queryCell.symbol !== null ? (queryCell.symbol === ' ' ? '␣' : queryCell.symbol) : '—'}
                </span>
              </div>
            </div>

            {/* Nearest Active Cells in 3D Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-gray-500 font-bold tracking-wider">
                  Nearest Active Cells in 3D Memory
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  d = √(Δx² + Δy² + Δz²)
                </span>
              </div>

              {nearestActive.length > 0 ? (
                <div className="space-y-1.5 font-mono">
                  {nearestActive.map((item) => (
                    <div
                      key={item.cellId}
                      onClick={() => onSelectCell(item.cellId)}
                      className="p-2.5 rounded bg-[#0A0A0B] hover:bg-[#1A1A1C] border border-[#2D2D2F] hover:border-cyan-500/50 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#111113] border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {item.symbol === ' ' ? '␣' : item.symbol || '•'}
                          </span>
                          <span className="text-[#E0E0E0] font-medium">
                            Cell #{item.cellId} ({item.coordinate.x}, {item.coordinate.y}, {item.coordinate.z})
                          </span>
                          <span className="text-[10px] text-cyan-400">
                            Addr {item.address369}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-green-400">
                          d = {item.euclideanDistance.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#1A1A1C]">
                        <span>
                          Vector: Δx={item.deltaVector.dx}, Δy={item.deltaVector.dy}, Δz={item.deltaVector.dz}
                        </span>
                        <span>Manhattan: {item.manhattanDistance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs bg-[#0A0A0B] rounded border border-[#2D2D2F] font-mono">
                  No active memory cells found. Encode some text to populate 3D spatial points.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: ADDRESS & SYMBOL SEARCH */}
        {activeSubTab === 'SEARCH' && (
          <div className="space-y-4 font-mono">
            {/* Search by Address */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Search by 369 Address (0..368)
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={368}
                  value={searchAddrInput}
                  onChange={(e) => setSearchAddrInput(e.target.value)}
                  placeholder="Address (0..368)"
                  className="flex-1 bg-[#111113] border border-[#2D2D2F] rounded px-3 py-1.5 text-xs text-[#E0E0E0] focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={handleSearchAddress}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Locate
                </button>
              </div>
              <span className="text-[10px] text-gray-500 block">
                0..25: Symbolic (A–Z) • 26..368: 7×7×7 Spatial Cell Addresses
              </span>
            </div>

            {/* Search by Symbol */}
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Search by Symbol / Character
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={searchSymbolInput}
                  onChange={(e) => setSearchSymbolInput(e.target.value)}
                  placeholder="e.g. 'H', 'E', 'L'"
                  className="flex-1 bg-[#111113] border border-[#2D2D2F] rounded px-3 py-1.5 text-xs text-[#E0E0E0] focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={handleSearchSymbol}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Find
                </button>
              </div>
            </div>

            {/* Feedback Message */}
            {searchFeedback && (
              <div className="p-3 bg-[#141416] border border-cyan-800/50 rounded text-cyan-300 text-xs">
                {searchFeedback}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: 3D TRAJECTORY PATHFINDER */}
        {activeSubTab === 'TRAJECTORY' && (
          <div className="space-y-4 font-mono">
            <div className="bg-[#0A0A0B] p-3.5 rounded border border-[#2D2D2F] space-y-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Orthogonal 3D Path Calculation
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">
                    Start Cell ID (0..342)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={342}
                    value={trajStartId}
                    onChange={(e) => setTrajStartId(Number(e.target.value))}
                    className="w-full bg-[#111113] border border-[#2D2D2F] rounded px-3 py-1.5 text-xs text-[#E0E0E0] focus:border-cyan-500 outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Coord: ({cellIdToCoordinate(trajStartId).x}, {cellIdToCoordinate(trajStartId).y}, {cellIdToCoordinate(trajStartId).z})
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">
                    End Cell ID (0..342)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={342}
                    value={trajEndId}
                    onChange={(e) => setTrajEndId(Number(e.target.value))}
                    className="w-full bg-[#111113] border border-[#2D2D2F] rounded px-3 py-1.5 text-xs text-[#E0E0E0] focus:border-cyan-500 outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Coord: ({cellIdToCoordinate(trajEndId).x}, {cellIdToCoordinate(trajEndId).y}, {cellIdToCoordinate(trajEndId).z})
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCalculateTrajectory}
                  className="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-900/20"
                >
                  <Route className="w-3.5 h-3.5" />
                  Calculate Trajectory
                </button>
                {activeTrajectory && (
                  <button
                    onClick={handleClearTrajectory}
                    className="px-3 py-2 rounded bg-[#2D2D2F] hover:bg-[#3D3D3F] text-gray-300 text-xs font-mono cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Trajectory Results */}
            {activeTrajectory && (
              <div className="bg-[#0A0A0B] p-3.5 rounded border border-amber-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>Trajectory Resolved</span>
                  <span>{activeTrajectory.stepCount} Steps</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#111113] p-2 rounded border border-[#2D2D2F]">
                    <span className="text-[10px] text-gray-500 block">Euclidean Distance</span>
                    <span className="text-white font-bold">{activeTrajectory.euclideanLength}</span>
                  </div>
                  <div className="bg-[#111113] p-2 rounded border border-[#2D2D2F]">
                    <span className="text-[10px] text-gray-500 block">Manhattan Steps</span>
                    <span className="text-white font-bold">{activeTrajectory.manhattanLength}</span>
                  </div>
                </div>

                {/* Step by step traversal list */}
                <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
                  {activeTrajectory.pathCellIds.map((cid, idx) => {
                    const coord = activeTrajectory.pathCoords[idx];
                    const cell = grid.cells[cid];
                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectCell(cid)}
                        className="p-1.5 rounded bg-[#111113] hover:bg-[#1A1A1C] border border-[#2D2D2F] flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold text-[10px]">#{idx + 1}</span>
                          <span className="text-[#E0E0E0]">
                            Cell #{cid} ({coord.x}, {coord.y}, {coord.z})
                          </span>
                        </div>
                        <span
                          className={`text-[10px] ${
                            cell.state === 1 ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          {cell.state === 1 ? `Symbol: '${cell.symbol}'` : 'Empty'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
