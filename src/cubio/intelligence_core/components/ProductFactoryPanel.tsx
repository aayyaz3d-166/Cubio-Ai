/**
 * CUBiO AI — Phase 25: Product Factory Panel
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * 9-Stage Innovation Pipeline manager:
 * PROBLEM -> RESEARCH -> HYPOTHESIS -> DESIGN -> PROTOTYPE -> SIMULATION -> TEST -> VALIDATION -> PRODUCT_CANDIDATE
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { ProductFactoryPipelineItem, ProductFactoryStage } from '../types';
import {
  ORDERED_PRODUCT_STAGES,
  getInitialProductFactoryPipeline,
  advanceProductStage,
} from '../state/productFactoryEngine';

export interface ProductFactoryPanelProps {
  readonly initialPipeline?: readonly ProductFactoryPipelineItem[];
}

export const ProductFactoryPanel: React.FC<ProductFactoryPanelProps> = ({
  initialPipeline,
}) => {
  const [pipeline, setPipeline] = useState<ProductFactoryPipelineItem[]>(
    initialPipeline ? [...initialPipeline] : [...getInitialProductFactoryPipeline()]
  );
  const [newProductName, setNewProductName] = useState('');
  const [newProductHypothesis, setNewProductHypothesis] = useState('');

  const handleAdvance = (item: ProductFactoryPipelineItem) => {
    const updated = advanceProductStage(item);
    setPipeline((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newItem: ProductFactoryPipelineItem = {
      id: 'PROD-0' + (pipeline.length + 1),
      productName: newProductName.trim(),
      currentStage: 'PROBLEM',
      progressPct: parseFloat(((1 / ORDERED_PRODUCT_STAGES.length) * 100).toFixed(1)),
      hypothesisSummary: newProductHypothesis.trim() || 'New sovereign product initiative.',
      validationPassed: false,
      stagesCompleted: ['PROBLEM'],
    };

    setPipeline((prev) => [...prev, newItem]);
    setNewProductName('');
    setNewProductHypothesis('');
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              PRODUCT FACTORY &amp; 9-STAGE INNOVATION PIPELINE
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Progression: Problem → Research → Hypothesis → Design → Prototype → Simulation → Test → Validation → Product Candidate
            </p>
          </div>
        </div>
      </div>

      {/* 9-Stage Pipeline Sequence Visualizer */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-[720px]">
          {ORDERED_PRODUCT_STAGES.map((st, i) => (
            <React.Fragment key={st}>
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono">
                <span className="text-[9px] text-slate-500 block">Stage {i + 1}</span>
                <span className="text-[10px] font-bold text-slate-300">{st}</span>
              </div>
              {i < ORDERED_PRODUCT_STAGES.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
        {pipeline.map((item) => {
          const isCandidate = item.currentStage === 'PRODUCT_CANDIDATE';

          return (
            <div
              key={item.id}
              className={
                'p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ' +
                (isCandidate
                  ? 'bg-emerald-950/20 border-emerald-800/80'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700')
              }
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-400">{item.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-900 border-slate-700 text-slate-300">
                    {item.currentStage}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {item.productName}
                  {isCandidate && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.hypothesisSummary}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {/* Stage Progress Bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Progress ({item.stagesCompleted.length}/{ORDERED_PRODUCT_STAGES.length})</span>
                    <span>{item.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={
                        'h-full rounded-full transition-all duration-300 ' +
                        (isCandidate ? 'bg-emerald-500' : 'bg-cyan-500')
                      }
                      style={{ width: `${item.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Advance Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    {item.validationPassed ? 'Validation PASS' : 'Pending Validation'}
                  </span>
                  {!isCandidate ? (
                    <button
                      onClick={() => handleAdvance(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <span>Advance Stage</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Certified Candidate
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Product Pipeline Form */}
      <form
        onSubmit={handleCreateNew}
        className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-wrap items-center gap-3 font-mono"
      >
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="New Product Initiative Name..."
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Hypothesis or goal summary..."
            value={newProductHypothesis}
            onChange={(e) => setNewProductHypothesis(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={!newProductName.trim()}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Stage Into Pipeline
        </button>
      </form>
    </div>
  );
};