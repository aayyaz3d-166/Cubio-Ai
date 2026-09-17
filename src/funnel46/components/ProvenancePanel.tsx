/**
 * 3D Memory Studio — Funnel 46
 * Component: ProvenancePanel
 *
 * Panel 9: Complete 8-stage research pipeline provenance lineage viewer.
 */

import React from 'react';
import { ProvenanceViewModel } from '../../funnel45/types';
import { CheckCircle, ShieldCheck, GitCommit, ArrowDown } from 'lucide-react';

interface ProvenancePanelProps {
  provenance?: ProvenanceViewModel;
}

export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ provenance }) => {
  if (!provenance) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-xs">
        No provenance lineage loaded. Select a state to inspect its end-to-end research lineage.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 font-mono text-xs">
      {/* Header Info */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">Full Pipeline Provenance Lineage</span>
        </div>
        <div className="text-[11px] text-zinc-400">
          State: <strong className="text-cyan-400">{provenance.stateId}</strong>
        </div>
      </div>

      {/* 8-Stage Pipeline Linear Timeline */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-md p-4 space-y-3">
        {provenance.pipelineSteps.map((step, idx) => {
          const isLast = idx === provenance.pipelineSteps.length - 1;
          return (
            <div key={step.stepNumber} className="relative">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  {step.stepNumber}
                </div>

                <div className="flex-1 bg-[#111113] border border-[#27272a] rounded p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-300 font-semibold">
                    <span>{step.stepName}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 break-all">{step.details}</div>
                  <div className="text-[10px] text-zinc-500 font-mono break-all pt-0.5">
                    Artifact: {step.artifactId}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="ml-3 pl-0 border-l border-zinc-700 h-3 my-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
