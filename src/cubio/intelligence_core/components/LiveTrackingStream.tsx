/**
 * CUBiO AI — Phase 25: Live Tracking Event Stream Panel
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Millisecond-precision event stream synchronized with 3D spatial trajectory animation.
 */

import React from 'react';
import { LiveTrackingEvent } from '../types';
import { Activity, Clock, ArrowRight } from 'lucide-react';

interface LiveTrackingStreamProps {
  readonly events: readonly LiveTrackingEvent[];
  readonly onSelectEvent?: (event: LiveTrackingEvent) => void;
}

const typeStyles: Record<string, { badge: string; text: string; dot: string }> = {
  OBSERVATION_RECEIVED: { badge: 'bg-cyan-950/80 border-cyan-800 text-cyan-300', text: 'Observation Ingested', dot: 'bg-cyan-400' },
  ADDRESS_MAPPED: { badge: 'bg-amber-950/80 border-amber-800 text-amber-300', text: 'Address Mapped', dot: 'bg-amber-400' },
  MEMORY_LOOKUP: { badge: 'bg-blue-950/80 border-blue-800 text-blue-300', text: 'Memory Lookup', dot: 'bg-blue-400' },
  REASONING_CHAIN_STARTED: { badge: 'bg-indigo-950/80 border-indigo-800 text-indigo-300', text: 'Reasoning Hop', dot: 'bg-indigo-400' },
  EVIDENCE_CLASSIFIED: { badge: 'bg-purple-950/80 border-purple-800 text-purple-300', text: 'Evidence Classified', dot: 'bg-purple-400' },
  CANDIDATE_HYPOTHESIS: { badge: 'bg-amber-950/80 border-amber-800 text-amber-300', text: 'Hypothesis Formed', dot: 'bg-amber-400' },
  VERIFICATION_PASS: { badge: 'bg-emerald-950/80 border-emerald-800 text-emerald-300', text: 'Verification PASS', dot: 'bg-emerald-400' },
  STATE_COMMITTED: { badge: 'bg-emerald-950/80 border-emerald-800 text-emerald-300', text: 'State Committed', dot: 'bg-emerald-400' },
};

export const LiveTrackingStream: React.FC<LiveTrackingStreamProps> = ({
  events,
  onSelectEvent,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Live Tracking Stream</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            REAL-TIME SYNC
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing latest {events.length} events
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs font-mono">
        {events.map((evt) => {
          const style = typeStyles[evt.type] || {
            badge: 'bg-slate-800 border-slate-700 text-slate-300',
            text: evt.type,
            dot: 'bg-slate-400',
          };

          return (
            <div
              key={evt.id}
              onClick={() => onSelectEvent?.(evt)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 min-w-[85px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {evt.timeFormatted}
                </span>

                <div className="flex items-center gap-2">
                  <span className={'w-2 h-2 rounded-full animate-pulse ' + style.dot} />
                  <span className={'px-2 py-0.5 rounded border text-[10px] font-bold ' + style.badge}>
                    {style.text}
                  </span>
                </div>

                <span className="text-slate-300 text-xs hidden sm:inline truncate max-w-xs md:max-w-md">
                  {evt.description}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="text-amber-400">Addr {evt.address369}</span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400">{evt.cellId}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};