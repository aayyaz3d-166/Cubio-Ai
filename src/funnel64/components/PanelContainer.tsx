/**
 * 3D Memory Studio — Funnel 64
 * Component: PanelContainer
 *
 * Host container delegating to the 10 first-class workspace panels.
 */

import React, { useState, useEffect } from 'react';
import { PanelDescriptor } from '../types';
import { StudioWorkspaceManager } from '../workspace/workspaceManager';
import { PanelHeader } from './PanelHeader';
import { DimensionalInformationState } from '../../funnel49/types';
import {
  Database,
  Compass,
  Info,
  MessageSquare,
  Bot,
  Search,
  Share2,
  Layers,
  Sparkles,
  Settings,
  Send,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface PanelContainerProps {
  panel: PanelDescriptor;
  workspace: StudioWorkspaceManager;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  panel,
  workspace,
  onClose,
  onUpdate,
}) => {
  const [, setTick] = useState(0);
  const forceUpdate = () => {
    setTick((t) => t + 1);
    if (onUpdate) onUpdate();
  };

  return (
    <div
      style={{ width: `${panel.width}px` }}
      className="h-full bg-[#111114]/95 backdrop-blur-md border-r border-zinc-800 flex flex-col font-mono text-zinc-300 select-none z-20"
    >
      <PanelHeader panel={panel} onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {panel.panelId === 'DATABASE' && (
          <DatabaseSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'COORDINATES' && (
          <CoordinatesSection workspace={workspace} />
        )}
        {panel.panelId === 'INFORMATION' && (
          <InformationSection workspace={workspace} />
        )}
        {panel.panelId === 'CHAT' && (
          <ChatSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'MODELS' && (
          <ModelsSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'SEARCH' && (
          <SearchSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'GRAPH' && (
          <GraphSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'CLUSTERS' && (
          <ClusterSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'DIMENSION' && (
          <DimensionSection workspace={workspace} onUpdate={forceUpdate} />
        )}
        {panel.panelId === 'SETTINGS' && (
          <SettingsSection workspace={workspace} onUpdate={forceUpdate} />
        )}
      </div>
    </div>
  );
};

/* ─── 1. DATABASE SECTION ─── */
const DatabaseSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const [records, setRecords] = useState<readonly DimensionalInformationState[]>([]);

  useEffect(() => {
    workspace.databaseAdapter.getPermittedRecords().then(setRecords);
  }, [workspace]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>PERMITTED RECORDS</span>
        <span className="text-emerald-400 font-bold">{records.length} GREEN</span>
      </div>
      <div className="space-y-1">
        {records.map((r) => (
          <button
            key={r.stateId}
            onClick={() => {
              workspace.selectState(r.stateId);
              onUpdate();
            }}
            className={`w-full text-left p-2 rounded text-xs transition cursor-pointer flex items-center justify-between ${
              workspace.selectionManager.currentStateId === r.stateId
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50'
                : 'bg-[#18181c] hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <div className="truncate">
              <div className="font-bold text-[11px] truncate text-white">{r.entityName || r.recordId}</div>
              <div className="text-[9px] text-zinc-500 truncate">{r.stateId}</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── 2. COORDINATES SECTION ─── */
const CoordinatesSection: React.FC<{ workspace: StudioWorkspaceManager }> = ({ workspace }) => {
  const selId = workspace.selectionManager.currentStateId;
  const coord = selId ? workspace.dimensionAdapter.getCoordinate(selId) : undefined;
  const dim = workspace.dimensionAdapter.activeDimension;
  const isActual3D = dim === 3;

  return (
    <div className="space-y-3 text-xs">
      <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Active Dimension</div>
        <div className="text-sm font-extrabold text-amber-400">
          Z{dim}
        </div>
        <div className="text-[10px] text-zinc-400 font-bold">
          {isActual3D
            ? 'ACTUAL 3D SPATIAL MODE'
            : `COMPUTATIONAL PROJECTION (${workspace.dimensionAdapter.projectionType})`}
        </div>
      </div>

      {selId && coord ? (
        <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-2">
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase">SELECTED TARGET</div>
            <div className="text-white font-bold text-xs truncate">{selId}</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-800">
            <div className="bg-[#141418] p-1.5 rounded border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 block">X</span>
              <span className="font-bold text-cyan-300">{coord.projectedPosition[0].toFixed(2)}</span>
            </div>
            <div className="bg-[#141418] p-1.5 rounded border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 block">Y</span>
              <span className="font-bold text-cyan-300">{coord.projectedPosition[1].toFixed(2)}</span>
            </div>
            <div className="bg-[#141418] p-1.5 rounded border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 block">Z</span>
              <span className="font-bold text-cyan-300">{coord.projectedPosition[2].toFixed(2)}</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
            Raw Dimension Values: <span className="text-zinc-400 truncate block">[{coord.rawValues.join(', ')}]</span>
          </div>
        </div>
      ) : selId ? (
        <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">SELECTED TARGET</div>
          <div className="text-white font-bold text-xs truncate">{selId}</div>
          <div className="text-amber-400 text-[11px] pt-1">COORDINATES UNAVAILABLE</div>
        </div>
      ) : (
        <div className="text-center py-6 text-zinc-500 text-xs">Select a state to inspect coordinates.</div>
      )}
    </div>
  );
};

/* ─── 3. INFORMATION SECTION ─── */
const InformationSection: React.FC<{ workspace: StudioWorkspaceManager }> = ({ workspace }) => {
  const selId = workspace.selectionManager.currentStateId;
  const [record, setRecord] = useState<DimensionalInformationState | undefined>(undefined);

  useEffect(() => {
    if (selId) {
      workspace.databaseAdapter.getRecordById(selId).then(setRecord);
    } else {
      setRecord(undefined);
    }
  }, [workspace, selId]);

  return (
    <div className="space-y-3 text-xs">
      {selId ? (
        <div className="space-y-2">
          <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">SELECTED STATE</div>
            <div className="text-sm font-bold text-white truncate">{selId}</div>
            {record?.entityName && (
              <div className="text-[11px] text-cyan-300 font-semibold">{record.entityName}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>GREEN CLASSIFICATION</span>
            </span>
          </div>
          {record && (
            <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1 text-[11px] text-zinc-400">
              <div><span className="text-zinc-500">CATEGORY:</span> <span className="text-zinc-200">{record.category}</span></div>
              <div><span className="text-zinc-500">DOMAIN:</span> <span className="text-zinc-200">{record.sourceDomain}</span></div>
              {record.metadata && (
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800 space-y-0.5">
                  {Object.entries(record.metadata).map(([k, v]) => (
                    <div key={k}><span className="text-zinc-600">{k}:</span> <span className="text-zinc-300">{String(v)}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-zinc-500 text-xs">No state selected.</div>
      )}
    </div>
  );
};

/* ─── 4. CHAT SECTION ─── */
const ChatSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const [input, setInput] = useState('');
  const messages = workspace.llmAdapter.getMessages();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    workspace.llmAdapter.sendMessage(
      input,
      workspace.modelRegistry.selectedModel.modelId,
      workspace.selectionManager.currentStateId || undefined
    );
    setInput('');
    onUpdate();
  };

  return (
    <div className="flex flex-col h-full space-y-2 text-xs">
      <div className="px-2 py-1 bg-amber-950/30 border border-amber-800/40 rounded text-[10px] text-amber-300">
        ⚠️ AI Interface [MOCK / NOT CONNECTED]
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-72 p-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-lg text-xs leading-relaxed ${
              m.sender === 'USER'
                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                : 'bg-[#18181c] text-zinc-300 border border-zinc-800'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-1.5 pt-2 border-t border-zinc-800">
        <input
          type="text"
          placeholder="Ask AI workspace..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-[#18181c] border border-zinc-700 px-2 py-1.5 rounded text-xs text-white focus:outline-hidden"
        />
        <button
          type="submit"
          className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded cursor-pointer transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

/* ─── 5. MODELS SECTION ─── */
const ModelsSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const models = workspace.modelRegistry.getAvailableModels();

  return (
    <div className="space-y-2 text-xs">
      <div className="text-[10px] text-zinc-500 font-bold uppercase">Available Providers & Models</div>
      <div className="space-y-1.5">
        {models.map((m) => (
          <button
            key={m.modelId}
            onClick={() => {
              workspace.modelRegistry.selectModel(m.modelId);
              onUpdate();
            }}
            className={`w-full text-left p-2.5 rounded border transition cursor-pointer ${
              m.selected
                ? 'bg-purple-950/50 border-purple-500 text-purple-200'
                : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="font-bold text-[11px] text-white flex items-center justify-between">
              <span>{m.displayName}</span>
              <span className="text-[9px] text-zinc-500">{m.provider}</span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-1">{m.capabilities.join(' • ')}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── 6. SEARCH SECTION ─── */
const SearchSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly any[]>([]);

  useEffect(() => {
    workspace.searchAdapter.search(query).then(setResults);
  }, [workspace, query]);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-1.5 bg-[#18181c] border border-zinc-700 px-2 py-1.5 rounded">
        <Search className="w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search states, tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-white focus:outline-hidden text-xs"
        />
      </div>

      <div className="space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Results ({results.length})</div>
        {results.map((r) => (
          <button
            key={r.resultId}
            onClick={() => {
              workspace.selectState(r.stateId);
              onUpdate();
            }}
            className="w-full text-left p-2 rounded bg-[#18181c] hover:bg-zinc-800 text-xs transition cursor-pointer flex items-center justify-between"
          >
            <div className="truncate">
              <div className="font-bold text-white truncate">{r.title}</div>
              <div className="text-[9px] text-zinc-500 truncate">{r.stateId}</div>
            </div>
            <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1 py-0.5 rounded">
              {(r.score * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── 7. GRAPH SECTION ─── */
const GraphSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const selId = workspace.selectionManager.currentStateId;
  const rels = selId
    ? workspace.graphAdapter.getRelationshipsForState(selId)
    : workspace.graphAdapter.getAllRelationships().slice(0, 20);

  return (
    <div className="space-y-2 text-xs">
      <div className="text-[10px] text-zinc-500 font-bold uppercase">
        {selId ? `Connected to ${selId.split(':')[1] || selId}` : 'Universe Graph Sample'}
      </div>
      <div className="space-y-1">
        {rels.map((rel) => (
          <div
            key={rel.relationshipId}
            className="p-2 rounded bg-[#18181c] border border-zinc-800 space-y-1 text-xs"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-teal-400 font-bold">{rel.relationshipType}</span>
              <span className="text-zinc-500">{(rel.strength * 100).toFixed(0)}% Str</span>
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {rel.sourceStateId} → {rel.targetStateId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── 8. CLUSTER SECTION ─── */
const ClusterSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const clusters = workspace.clusterAdapter.getAllClusters();

  return (
    <div className="space-y-2 text-xs">
      <div className="text-[10px] text-zinc-500 font-bold uppercase">Spatial Clusters ({clusters.length})</div>
      <div className="space-y-1.5">
        {clusters.map((c) => (
          <div
            key={c.clusterId}
            className="p-2.5 rounded bg-[#18181c] border border-zinc-800 space-y-1 text-xs"
          >
            <div className="font-bold text-fuchsia-400 flex items-center justify-between text-[11px]">
              <span>{c.clusterId}</span>
              <span className="text-zinc-500">{c.clusterType}</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Members: <strong className="text-emerald-400">{c.memberStateIds.length}</strong> | Radius: {c.radius.toFixed(1)}m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── 9. DIMENSION SECTION ─── */
const DimensionSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = ({
  workspace,
  onUpdate,
}) => {
  const dims = [1, 2, 3, 4, 8, 12, 16] as const;

  return (
    <div className="space-y-3 text-xs">
      <div className="text-[10px] text-zinc-500 font-bold uppercase">Select Computational Dimension</div>
      <div className="grid grid-cols-2 gap-1.5">
        {dims.map((d) => (
          <button
            key={d}
            onClick={() => {
              workspace.switchDimension(d);
              onUpdate();
            }}
            className={`p-2 rounded font-bold transition cursor-pointer ${
              workspace.dimensionAdapter.activeDimension === d
                ? 'bg-amber-500 text-black'
                : 'bg-[#18181c] border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Z{d} {d === 3 ? '(3D Spatial)' : '(Projection)'}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── 10. SETTINGS SECTION ─── */
const SettingsSection: React.FC<{ workspace: StudioWorkspaceManager; onUpdate: () => void }> = () => {
  return (
    <div className="space-y-3 text-xs">
      <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Theme & Interface</div>
        <div className="text-zinc-300 font-bold">Studio Dark (Research Standard)</div>
      </div>
      <div className="bg-[#18181c] p-2.5 rounded border border-zinc-800 space-y-1">
        <div className="text-[10px] text-zinc-500 font-bold uppercase">Renderer Pipeline</div>
        <div className="text-emerald-400 font-bold">F55 Single GPU RAF Authority</div>
      </div>
    </div>
  );
};
