/**
 * 3D Memory Studio - Memory Tree Hierarchy Panel
 * 
 * Displays the expandable structural hierarchy:
 * 
 * ROOT
 *  ├── Block 0
 *  │    ├── Cell #12 ('H') [Addr 26]
 *  │    └── Cell #45 ('E') [Addr 27]
 *  ├── Block 1
 *  └── Block 2
 * 
 * Clicking a block focuses it in the 3D viewport.
 * Clicking a cell inspects and selects the cell.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Box,
  Layers,
  Sparkles,
  Focus,
  Maximize2,
  Database,
  Network,
} from 'lucide-react';
import { RootMemory } from '../types/memory';

interface MemoryTreePanelProps {
  rootMemory: RootMemory;
  selectedBlockId: number | null;
  onSelectBlock: (blockId: number | null) => void;
  selectedCellId: number | null;
  onSelectCell: (cellId: number | null) => void;
  onFocusBlock?: (blockId: number) => void;
  onFocusCell?: (cellId: number) => void;
}

export const MemoryTreePanel: React.FC<MemoryTreePanelProps> = ({
  rootMemory,
  selectedBlockId,
  onSelectBlock,
  selectedCellId,
  onSelectCell,
  onFocusBlock,
  onFocusCell,
}) => {
  const [isRootExpanded, setIsRootExpanded] = useState(true);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleBlock = (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  return (
    <div
      id="memory-tree-panel"
      className="bg-[#0D0D10] border border-[#222226] rounded-lg p-3 text-xs font-mono space-y-2.5 shadow-lg select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E1E22] pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-gray-200 text-xs tracking-wider uppercase">
            Memory Tree Hierarchy
          </span>
        </div>
        <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800 font-bold">
          {rootMemory.blocks.length} {rootMemory.blocks.length === 1 ? 'BLOCK' : 'BLOCKS'} (
          {rootMemory.totalCapacity} CELLS)
        </span>
      </div>

      {/* Tree Content */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 text-[11px]">
        {/* ROOT Node */}
        <div className="space-y-1">
          <div
            onClick={() => onSelectBlock(null)}
            className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
              selectedBlockId === null
                ? 'bg-cyan-950/40 border border-cyan-700/60 text-cyan-300'
                : 'hover:bg-[#16161A] text-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRootExpanded(!isRootExpanded);
                }}
                className="text-gray-400 hover:text-white p-0.5"
              >
                {isRootExpanded ? (
                  <ChevronDown className="w-3 h-3 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
              </button>
              {isRootExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="font-bold text-white">ROOT</span>
              <span className="text-[10px] text-gray-500">
                (Level 1 Root · {rootMemory.totalActiveCells} Active)
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold">
              {rootMemory.blocks.length} {rootMemory.blocks.length === 1 ? 'Child' : 'Children'}
            </span>
          </div>

          {/* Child Blocks Tree */}
          {isRootExpanded && (
            <div className="pl-4 space-y-1 border-l border-[#26262B] ml-2.5">
              {rootMemory.blocks.map((block, idx) => {
                const isSelected = selectedBlockId === block.blockId;
                const isExpanded = !!expandedBlocks[block.blockId];
                const activeCells = block.cells.filter((c) => c.state === 1);
                const isLast = idx === rootMemory.blocks.length - 1;

                return (
                  <div key={block.blockId} className="space-y-1">
                    {/* Block Row */}
                    <div
                      onClick={() => {
                        onSelectBlock(block.blockId);
                        if (onFocusBlock) onFocusBlock(block.blockId);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-purple-950/60 border border-purple-600/70 text-purple-200 shadow-sm'
                          : 'hover:bg-[#16161A] text-gray-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-600 text-[10px]">
                          {isLast ? '└──' : '├──'}
                        </span>
                        <button
                          onClick={(e) => toggleBlock(block.blockId, e)}
                          className="text-gray-400 hover:text-white p-0.5"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-purple-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                        <Box
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-purple-300' : 'text-purple-400'
                          }`}
                        />
                        <span className="font-bold text-gray-200">
                          Block {block.blockId}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          [{block.origin.join(', ')}]
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400">
                          {block.metadata.activeCellCount}/343
                        </span>
                        <button
                          title="Focus 3D Viewport on this Block"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBlock(block.blockId);
                            if (onFocusBlock) onFocusBlock(block.blockId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-purple-800/40 rounded text-purple-300 transition-opacity"
                        >
                          <Focus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Cell Children inside Block */}
                    {isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-[#202024] ml-3.5">
                        {activeCells.length === 0 ? (
                          <div className="text-[10px] text-gray-500 italic p-1">
                            No active cells (Idle 343-cell block)
                          </div>
                        ) : (
                          activeCells.slice(0, 32).map((cell) => {
                            const isCellSelected = selectedCellId === cell.id;
                            return (
                              <div
                                key={cell.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectBlock(block.blockId);
                                  onSelectCell(cell.id);
                                  if (onFocusCell) onFocusCell(cell.id);
                                }}
                                className={`flex items-center justify-between px-2 py-0.5 rounded cursor-pointer text-[10px] transition-colors ${
                                  isCellSelected
                                    ? 'bg-cyan-950/80 text-cyan-200 font-bold border border-cyan-700/60'
                                    : 'hover:bg-[#18181D] text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-600">·</span>
                                  <span>Cell #{cell.id}</span>
                                  <span className="text-cyan-300 font-mono">
                                    ('{cell.symbol === ' ' ? '␣' : cell.symbol}')
                                  </span>
                                </div>
                                <span className="text-gray-500 text-[9px]">
                                  Addr {cell.address}
                                </span>
                              </div>
                            );
                          })
                        )}
                        {activeCells.length > 32 && (
                          <div className="text-[10px] text-gray-500 italic px-2 py-0.5">
                            + {activeCells.length - 32} more active cells in Block {block.blockId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
