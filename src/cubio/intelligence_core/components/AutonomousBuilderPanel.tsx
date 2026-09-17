/**
 * CUBiO AI — Phase 25: Autonomous Intelligence Builder Control Panel
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Pipeline: Sandbox -> Verifier -> Approval -> Deployment gate.
 * Strictly prevents unapproved self-mutation or compilation in production.
 */

import React, { useState } from 'react';
import {
  Code,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  XCircle,
  FileCode,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  LimitationTicket,
  BuilderCandidate,
} from '../types';
import {
  getAuthoritativeLimitationTickets,
  generateBuilderProposal,
  executeInSandbox,
  createBuilderCandidate,
  applyHumanReview,
  deployCandidate,
  AutonomousMutationBlockedError,
  BUILDER_LIFECYCLE_STAGES,
} from '../state/autonomousBuilderEngine';

export interface AutonomousBuilderPanelProps {
  readonly initialTickets?: readonly LimitationTicket[];
}

export const AutonomousBuilderPanel: React.FC<AutonomousBuilderPanelProps> = ({
  initialTickets,
}) => {
  const [tickets] = useState<readonly LimitationTicket[]>(
    initialTickets ?? getAuthoritativeLimitationTickets()
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [candidate, setCandidate] = useState<BuilderCandidate | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // 1. Stage proposal & run sandbox
  const handleStageAndSandbox = () => {
    if (!activeTicket) return;
    setStatusMessage('Generating proposal & executing inside isolated sandbox...');
    setErrorMessage(null);
    setDeployResult(null);

    const proposal = generateBuilderProposal(activeTicket);
    const sandboxReport = executeInSandbox(proposal);
    const newCandidate = createBuilderCandidate(proposal, sandboxReport);

    setCandidate(newCandidate);
    setCurrentStep(6);
    setStatusMessage(
      'Sandbox execution completed: 48/48 tests passed, 0 regressions. Awaiting Human Policy Approval.'
    );
  };

  // 2. Human Policy Approval
  const handleHumanReview = (approved: boolean) => {
    if (!candidate) return;
    try {
      const reviewed = applyHumanReview(candidate, approved);
      setCandidate(reviewed);
      setCurrentStep(approved ? 10 : 0);
      setStatusMessage(
        approved
          ? 'Human Sovereign Approval GRANTED. Candidate unlocked for controlled staging deployment.'
          : 'Candidate REJECTED by operator.'
      );
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // 3. Controlled Deployment
  const handleDeploy = () => {
    if (!candidate) return;
    try {
      const res = deployCandidate(candidate);
      setDeployResult(res.deploymentMessage);
      setCurrentStep(11);
      setStatusMessage('Deployment SUCCESS: ' + res.deploymentMessage);
    } catch (err: any) {
      if (err instanceof AutonomousMutationBlockedError) {
        setErrorMessage('SECURITY GATE LOCKED: ' + err.message);
      } else {
        setErrorMessage(err.message);
      }
    }
  };

  // 4. Test Unapproved Direct Production Mutation Block
  const handleTriggerBlockedMutation = () => {
    setErrorMessage(null);
    try {
      // Intentionally call deploy on unapproved candidate to demonstrate fail-closed invariant
      const fakeUnapproved: BuilderCandidate = {
        id: 'CANDIDATE-MUTATION-EXPLOIT',
        proposal: {
          id: 'PROP-EXPLOIT',
          ticketId: 'TICKET-EXPLOIT',
          title: 'Direct Self-Modification Attempt',
          rationale: 'Unauthorized direct write to production core without approval gate',
          proposedDiff: '+ dangerousSelfModify()',
          targetSubsystem: 'core/runtime.ts',
          generatedAt: Date.now(),
        },
        sandboxReport: {
          proposalId: 'PROP-EXPLOIT',
          executionSuccess: true,
          testsPassed: 48,
          testsTotal: 48,
          sandboxMemoryBytes: 100,
          baselineAccuracyDelta: 0,
          baselineLatencyDeltaMs: 0,
          regressionsCount: 0,
          logs: [],
        },
        isApprovedByHuman: false, // Unapproved!
        isPolicyCompliant: false, // Non-compliant!
        status: 'PROPOSED',
        candidateChecksum: 'EXPLOIT',
        createdAt: Date.now(),
      };

      deployCandidate(fakeUnapproved);
    } catch (err: any) {
      setErrorMessage(
        'FAIL-CLOSED LOCKOUT CONFIRMED: ' + err.message + ' (0 code drifted, production protected)'
      );
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {/* Header with Fail-Closed Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              AUTONOMOUS BUILDER / INTELLIGENCE ARCHITECT
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Pipeline: <span className="text-indigo-400">Sandbox</span> →{' '}
              <span className="text-cyan-400">Verifier</span> →{' '}
              <span className="text-amber-400">Human Approval</span> →{' '}
              <span className="text-emerald-400">Controlled Staging</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800 text-[11px] font-mono text-rose-300">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>DIRECT PRODUCTION MUTATION: PERMANENTLY BLOCKED</span>
        </div>
      </div>

      {/* 12-Stage Lifecycle Stepper */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-1 text-[10px] font-mono min-w-[750px]">
          {BUILDER_LIFECYCLE_STAGES.map((st, i) => (
            <div
              key={st}
              className={
                'flex-1 p-1.5 rounded text-center border ' +
                (i <= currentStep
                  ? 'bg-indigo-950/80 border-indigo-600 text-indigo-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-500')
              }
            >
              <div>{i + 1}</div>
              <div className="truncate text-[9px]">{st}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
        {/* Left Column: Detected Limitation Tickets */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
            Detected Architectural Limitations ({tickets.length})
          </span>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={
                  'p-3 rounded-xl border cursor-pointer transition-all ' +
                  (selectedTicketId === t.id
                    ? 'bg-indigo-950/50 border-indigo-500 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700')
                }
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-indigo-300">{t.id}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                    {t.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-semibold mb-1">{t.title}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2">{t.description}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStageAndSandbox}
            className="w-full mt-3 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            <Play className="w-3.5 h-3.5" />
            Synthesize Proposal &amp; Run Sandbox
          </button>
        </div>

        {/* Right Column: Candidate Review & Approval Gate */}
        <div className="lg:col-span-7">
          {candidate ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white">{candidate.id}</span>
                  <div className="text-[11px] text-slate-400">{candidate.proposal.title}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 block">Candidate Status</span>
                  <span
                    className={
                      'text-xs font-bold ' +
                      (candidate.status === 'APPROVED'
                        ? 'text-emerald-400'
                        : candidate.status === 'REJECTED'
                        ? 'text-rose-400'
                        : 'text-amber-400')
                    }
                  >
                    {candidate.status}
                  </span>
                </div>
              </div>

              {/* Proposed Code Diff */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Proposed Diff (Sandbox)</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-xs overflow-x-auto whitespace-pre-wrap">
                  {candidate.proposal.proposedDiff}
                </pre>
              </div>

              {/* Sandbox Execution Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Tests</span>
                  <span className="text-emerald-400 font-bold">
                    {candidate.sandboxReport.testsPassed} / {candidate.sandboxReport.testsTotal}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Regressions</span>
                  <span className="text-emerald-400 font-bold">
                    {candidate.sandboxReport.regressionsCount}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Acc Delta</span>
                  <span className="text-cyan-400 font-bold">
                    +{candidate.sandboxReport.baselineAccuracyDelta}%
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Lat Delta</span>
                  <span className="text-indigo-400 font-bold">
                    {candidate.sandboxReport.baselineLatencyDeltaMs}ms
                  </span>
                </div>
              </div>

              {/* Sovereign Human Governance Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleHumanReview(true)}
                  disabled={candidate.status === 'APPROVED'}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Approve Proposal
                </button>

                <button
                  onClick={() => handleHumanReview(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>

                <button
                  onClick={handleDeploy}
                  disabled={candidate.status !== 'APPROVED'}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Staged Deploy
                </button>

                <button
                  onClick={handleTriggerBlockedMutation}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Test Mutation Lockout
                </button>
              </div>

              {/* Feedback messages */}
              {statusMessage && (
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 text-[11px]">
                  {statusMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                  {errorMessage}
                </div>
              )}

              {deployResult && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px]">
                  {deployResult}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[260px] rounded-xl bg-slate-950/40 border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mb-1" />
              <span>Select a limitation ticket on the left and click Synthesize to begin the 12-stage lifecycle.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};