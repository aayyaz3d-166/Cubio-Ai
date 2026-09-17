/**
 * Inspector Panel: Unified Block & Cell Inspector
 * 
 * When a block is selected, displays:
 * - Block ID
 * - Level
 * - Parent
 * - Origin
 * - Cell Count (343)
 * - Active Cells
 * - Child Blocks
 * 
 * When a cell is selected, displays:
 * - Cell ID, Block ID, Local & Global Coordinates
 * - Address 369 Mapping & Binary Payload
 * - 6-way Orthogonal Direction Adjacency
 * - Forward & Backward Sequence Graph Connections
 */

import React from 'react';
import {
  Layers,
  Binary,
  Compass,
  Link,
  ChevronRight,
  ArrowRight,
  Hash,
  Activity,
  Maximize,
  Sparkles,
  Box,
  Network,
  Workflow,
} from 'lucide-react';
import { MemoryBlock, MemoryCell, MemoryGrid3D, RootMemory } from '../types';
import { findNearestActiveCells } from '../core/spatialSearch';

interface InspectorPanelProps {
  selectedCell: MemoryCell | null;
  grid: MemoryGrid3D;
  onSelectCell: (cellId: number) => void;
  selectedBlock?: MemoryBlock | null;
  rootMemory?: RootMemory | null;
  onSelectBlock?: (blockId: number | null) => void;
  onUpdateCell?: (updatedCell: MemoryCell) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedCell,
  grid,
  onSelectCell,
  selectedBlock,
  rootMemory,
  onSelectBlock,
}) => {
  // If a block is explicitly selected (and no cell is selected or block inspector is prioritized)
  const isBlockOnlySelected = selectedBlock && !selectedCell;

  if (isBlockOnlySelected) {
    return (
      <div className="bg-[#111113] rounded border border-purple-500/30 overflow-hidden flex flex-col h-full shadow-xl font-mono text-xs">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#16161A] border-b border-[#252528] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5 text-purple-400" />
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">
              Block #{selectedBlock.blockId} Inspector
            </h3>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
            7×7×7 BLOCK
          </span>
        </div>

        <div className="p-3 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Attributes List */}
          <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
            <div className="flex justify-between border-b border-[#1E1E22] pb-1.5 text-xs">
              <span className="text-gray-400">Block ID</span>
              <span className="text-purple-300 font-bold">
                BLOCK #{selectedBlock.blockId}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Hierarchy Level</span>
              <span className="text-cyan-300 font-bold">
                Level {selectedBlock.level} ({selectedBlock.level === 1 ? 'Token/Char' : 'Cluster'})
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Parent</span>
              <span className="text-gray-200">
                {selectedBlock.parentBlockId !== null
                  ? `Block #${selectedBlock.parentBlockId}`
                  : 'ROOT (Level 1 Root)'}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">World Origin</span>
              <span className="text-emerald-400 font-bold">
                [{selectedBlock.origin.join(', ')}]
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Dimensions</span>
              <span className="text-gray-200">
                {selectedBlock.dimensions.join(' × ')} (343 Cells)
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Active Cells</span>
              <span className="text-cyan-400 font-bold">
                {selectedBlock.metadata.activeCellCount} / 343 ({Math.round((selectedBlock.metadata.activeCellCount / 343) * 1000) / 10}%)
              </span>
            </div>

            {selectedBlock.children.length > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Child Blocks</span>
                <span className="text-purple-300">
                  {selectedBlock.children.map((c) => `Block #${c}`).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Quick Active Cells in this Block */}
          <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">
                Active Cells ({selectedBlock.metadata.activeCellCount})
              </span>
              <span className="text-[10px] text-cyan-400">Select to inspect</span>
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-36 overflow-y-auto custom-scrollbar">
              {selectedBlock.cells
                .filter((c) => c.state === 1)
                .slice(0, 32)
                .map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => onSelectCell(cell.id)}
                    className="p-1 rounded bg-[#141418] hover:bg-cyan-950 border border-[#222228] text-[10px] text-cyan-300 text-center transition-colors cursor-pointer"
                  >
                    #{cell.id} '{cell.symbol === ' ' ? '␣' : cell.symbol}'
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCell) {
    return (
      <div className="bg-[#111113] rounded border border-[#252528] p-4 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="w-10 h-10 rounded bg-[#0A0A0B] flex items-center justify-center text-gray-500 mb-2.5 border border-[#252528]">
          <Compass className="w-5 h-5 text-cyan-500" />
        </div>
        <h3 className="text-xs font-semibold text-gray-200 mb-1 font-mono">No Cell or Block Selected</h3>
        <p className="text-[11px] text-gray-500 max-w-[200px] font-mono leading-relaxed">
          Select any node or block in the 3D viewport or Tree to inspect topology.
        </p>
      </div>
    );
  }

  const { neighbors } = selectedCell;

  const neighborDirections = [
    { label: 'X+', id: neighbors.xPos, dir: '+X', fullName: 'X+ (Right)' },
    { label: 'X-', id: neighbors.xNeg, dir: '-X', fullName: 'X- (Left)' },
    { label: 'Y+', id: neighbors.yPos, dir: '+Y', fullName: 'Y+ (Up)' },
    { label: 'Y-', id: neighbors.yNeg, dir: '-Y', fullName: 'Y- (Down)' },
    { label: 'Z+', id: neighbors.zPos, dir: '+Z', fullName: 'Z+ (Forward)' },
    { label: 'Z-', id: neighbors.zNeg, dir: '-Z', fullName: 'Z- (Backward)' },
  ];

  return (
    <div className="bg-[#111113] rounded border border-[#252528] overflow-hidden flex flex-col h-full shadow-xl font-mono text-xs">
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#141416] border-b border-[#252528] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-xs ${
              selectedCell.state === 1
                ? 'bg-cyan-400 shadow-xs shadow-cyan-400'
                : 'bg-gray-600'
            }`}
          />
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Cell #{selectedCell.id} Inspector
          </h3>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            selectedCell.state === 1
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
              : 'bg-[#222226] text-gray-400 border border-[#333338]'
          }`}
        >
          {selectedCell.state === 1 ? 'ACTIVE' : 'IDLE'}
        </span>
      </div>

      <div className="p-3 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
        {/* Core Attributes Inspector Card */}
        <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
          <div className="flex items-baseline justify-between border-b border-[#1E1E22] pb-1.5">
            <span className="text-xl font-bold text-cyan-400">
              #{selectedCell.id}
            </span>
            <span className="text-[10px] text-gray-400">
              ADDR: S-{selectedCell.address369}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Block ID</span>
              <span className="text-purple-300 font-bold">
                BLOCK #{selectedCell.blockId ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Local (x, y, z)</span>
              <span className="text-cyan-200 font-bold">
                ({selectedCell.x}, {selectedCell.y}, {selectedCell.z})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Global [X, Y, Z]</span>
              <span className="text-cyan-400 font-bold">
                [{selectedCell.globalCoordinate ? selectedCell.globalCoordinate.join(', ') : `${selectedCell.x}, ${selectedCell.y}, ${selectedCell.z}`}]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Symbol</span>
              <span className="text-amber-300 font-bold">
                {selectedCell.symbol !== null
                  ? `'${selectedCell.symbol === ' ' ? '␣' : selectedCell.symbol}'`
                  : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Level</span>
              <span className="text-purple-300">
                0{selectedCell.level} ({selectedCell.level === 1 ? 'Token' : selectedCell.level === 2 ? 'Cluster' : 'Composite'})
              </span>
            </div>

            {/* Runtime Derived Math Formula Box */}
            <div className="p-2 rounded bg-[#131317] border border-[#222228] space-y-0.5 text-[10px]">
              <span className="text-[9px] uppercase font-bold text-cyan-400 block">
                Runtime Derived Coordinates
              </span>
              <div className="text-gray-400">
                • XYZ = <span className="text-white font-bold">({selectedCell.x}, {selectedCell.y}, {selectedCell.z})</span>
                <span className="text-gray-500 text-[9px] ml-1">({selectedCell.id}%7, ⌊{selectedCell.id}/7⌋%7, ⌊{selectedCell.id}/49⌋)</span>
              </div>
              <div className="text-gray-400">
                • Addr = <span className="text-purple-300 font-bold">{selectedCell.address}</span>
                <span className="text-gray-500 text-[9px] ml-1">(26 + {selectedCell.id})</span>
              </div>
            </div>

            {selectedCell.relationships?.prevTokenRef && (
              <div className="flex justify-between pt-1 border-t border-[#1C1C1E] text-[11px]">
                <span className="text-gray-500">Prev Token</span>
                <span className="text-cyan-300 truncate max-w-[200px]">
                  Blk #{selectedCell.relationships.prevTokenRef.blockId} : Cell #{selectedCell.relationships.prevTokenRef.cellId} ('{selectedCell.relationships.prevTokenRef.token || ''}')
                </span>
              </div>
            )}
            {selectedCell.relationships?.nextTokenRef && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Next Token</span>
                <span className="text-emerald-300 truncate max-w-[200px]">
                  Blk #{selectedCell.relationships.nextTokenRef.blockId} : Cell #{selectedCell.relationships.nextTokenRef.cellId} ('{selectedCell.relationships.nextTokenRef.token || ''}')
                </span>
              </div>
            )}
            {selectedCell.state === 1 && (
              <div className="flex justify-between pt-1.5 border-t border-[#1E1E22]">
                <span className="text-gray-500">Binary (8-bit)</span>
                <span className="text-emerald-400 font-bold">{selectedCell.payloadBinary}</span>
              </div>
            )}
            {selectedCell.stepIndices.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Visited Steps</span>
                <span className="text-gray-300">
                  [{selectedCell.stepIndices.join(', ')}] ({selectedCell.occurrenceCount}x)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 6 Direction Orthogonal Neighbor Engine */}
        <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              6 Orthogonal Neighbors
            </span>
            <span className="text-[10px] text-cyan-400">
              {neighbors.allAdjacentIds.length} / 6 Valid
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-xs">
            {neighborDirections.map((dir) => {
              const hasNeighbor = dir.id !== null;
              const neighborCell = hasNeighbor ? grid.cells[dir.id!] : null;

              return (
                <button
                  key={dir.label}
                  disabled={!hasNeighbor}
                  onClick={() => hasNeighbor && onSelectCell(dir.id!)}
                  className={`p-1.5 rounded border text-left flex items-center justify-between transition-colors ${
                    hasNeighbor
                      ? 'bg-[#141416] border-[#25252A] hover:border-cyan-500 hover:bg-[#1A1A1E] cursor-pointer'
                      : 'bg-[#0E0E10] border-[#1A1A1C] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">{dir.label}</span>
                    <span className="text-[10px] text-gray-500 truncate">{dir.fullName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      neighborCell?.state === 1 ? 'text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {hasNeighbor ? `#${dir.id}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sequence Graph Trajectory Connections */}
        <div className="bg-[#0A0A0B] border border-[#222226] p-3 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Sequence Trajectory Connections
            </span>
            <span className="text-[10px] text-cyan-400">
              {selectedCell.connections.length} Links
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Incoming (Prev):</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {selectedCell.prevCellIds.length === 0 ? (
                  <span className="text-gray-600 text-[10px]">None (Start / Idle)</span>
                ) : (
                  selectedCell.prevCellIds.map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectCell(cid)}
                      className="px-1.5 py-0.5 rounded bg-[#16161A] border border-[#2D2D2F] hover:border-cyan-400 text-cyan-400 text-[10px] cursor-pointer"
                    >
                      #{cid}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Outgoing (Next):</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {selectedCell.nextCellIds.length === 0 ? (
                  <span className="text-gray-600 text-[10px]">None (End / Idle)</span>
                ) : (
                  selectedCell.nextCellIds.map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectCell(cid)}
                      className="px-1.5 py-0.5 rounded bg-[#16161A] border border-[#2D2D2F] hover:border-emerald-400 text-emerald-400 text-[10px] cursor-pointer"
                    >
                      #{cid}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
