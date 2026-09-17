/**
 * CUBiO AI — Phase 25: Multi-Pillar Live Telemetry Panel
 * Real-time monitoring across Visual Cortex, Memory Core, Intelligence, and System Health.
 */

import React from 'react';
import { Database, Brain, Shield, Activity, HardDrive, Lock, Cpu } from 'lucide-react';
import { LiveIntelligenceStateSnapshot } from '../types';

interface LiveTelemetryPanelProps {
  readonly state: LiveIntelligenceStateSnapshot | null;
}

export const LiveTelemetryPanel: React.FC<LiveTelemetryPanelProps> = ({ state }) => {
  if (!state) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500">
        Initializing telemetry stream...
      </div>
    );
  }

  const { model, memory, reasoning, system, timestamp } = state;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold">SOVEREIGN TELEMETRY FEED</span>
        </div>
        <span>Timestamp: {new Date(timestamp).toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 font-mono">
        {/* Pillar 1: Model Substrate */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wider">NATIVE MODEL</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
              {model.status}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Model ID:</span>
              <span className="text-indigo-300 font-bold truncate max-w-[130px]" title={model.modelId}>
                {model.modelId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Checkpoint:</span>
              <span className="text-slate-300 truncate max-w-[130px]" title={model.checkpointId}>
                {model.checkpointId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Parameters:</span>
              <span className="text-white font-bold">{model.totalParameters.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vocabulary:</span>
              <span className="text-slate-300">{model.vocabularySize.toLocaleString()} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Qwen Dependency (QWEN_REMOVED):</span>
              <span className="text-emerald-400 font-bold">{model.activeQwenDependency} (eradicated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">External Model Calls:</span>
              <span className="text-emerald-400 font-bold">{model.externalModelCalls} (OFFLINE)</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Memory Core */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white tracking-wider">MEMORY CORE</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
              STATE-T
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Short-Term Registers:</span>
              <span className="text-white font-bold">{memory.shortTermCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Long-Term (369):</span>
              <span className="text-amber-300 font-bold">{memory.longTermCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Semantic Nodes:</span>
              <span className="text-slate-300">{memory.semanticCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Relational Edges:</span>
              <span className="text-slate-300">{memory.relationalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Temporal Epochs:</span>
              <span className="text-cyan-300">{memory.temporalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Storage:</span>
              <span className="text-slate-300">{(memory.totalActiveBytes / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Epistemic Reasoning */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white tracking-wider">EPISTEMIC REASONING</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
              GUARDED
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Non-Fact Lockout:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {reasoning.nonFactLockoutEnforced ? 'ENFORCED' : 'DISABLED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Confidence:</span>
              <span className="text-emerald-300 font-bold">{(reasoning.averageConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Chain Depth:</span>
              <span className="text-white font-bold">{reasoning.activeChainDepth} hops</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Hypotheses:</span>
              <span className="text-amber-300">{reasoning.activeHypotheses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Facts Ingested:</span>
              <span className="text-indigo-300 font-bold">{reasoning.evidenceDistribution.FACT}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Observations:</span>
              <span className="text-cyan-300">{reasoning.evidenceDistribution.OBSERVATION}</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: System Health */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white tracking-wider">SYSTEM BOUNDS</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              {system.securityStatus}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Actuation Lock:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {system.actuationBlocked ? 'PERMANENT BLOCK' : 'UNLOCKED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network Sockets:</span>
              <span className="text-emerald-400 font-bold">{system.networkAccess} (AIR-GAPPED)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CPU Load:</span>
              <span className="text-slate-300">{system.cpuLoadPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Heap:</span>
              <span className="text-slate-300 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-slate-500" />
                {(system.heapUsageBytes / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Throughput:</span>
              <span className="text-indigo-300 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-500" />
                {system.throughputOpsPerSec.toFixed(1)} ops/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Errors:</span>
              <span className="text-emerald-400 font-bold">{system.errorCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};