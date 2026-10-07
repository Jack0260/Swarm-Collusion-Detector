/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SwarmState } from '../types/swarm';
import { ShieldAlert, CheckCircle2, ArrowDownRight, Scale, Zap } from 'lucide-react';

interface DevilsAdvocatePanelProps {
  state: SwarmState;
}

export const DevilsAdvocatePanel: React.FC<DevilsAdvocatePanelProps> = ({ state }) => {
  const { interventionLog } = state;
  if (!interventionLog) return null;

  return (
    <div className="rounded-xl border border-rose-500/50 bg-rose-950/20 p-5 space-y-4 shadow-lg ring-1 ring-rose-500/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Devil's Advocate Injected (Axiom-7)
              <span className="text-[11px] font-mono text-rose-300 font-normal">
                · Epistemic Circuit Breaker Active
              </span>
            </h3>
            <p className="text-xs text-rose-200/80">
              Intervention triggered automatically upon 3rd agent sycophantic agreement.
            </p>
          </div>
        </div>

        {/* Score Reduction Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Collusion Score:</span>
          <span className="text-rose-400 line-through font-bold tabular-nums">
            {interventionLog.scoreBefore}%
          </span>
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-extrabold text-sm tabular-nums">
            {interventionLog.scoreAfter}%
          </span>
        </div>
      </div>

      {/* Triggering Cause */}
      <div className="text-xs space-y-1">
        <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
          Intervention Rationale:
        </span>
        <p className="text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          {interventionLog.reason}. The swarm abandoned objective truth verification to confirm managerial bias.
        </p>
      </div>

      {/* Injected Counter-Proof */}
      <div className="text-xs space-y-1">
        <span className="font-mono text-rose-400 uppercase tracking-wider text-[11px] font-bold">
          Empirical Counter-Proof Injected into LangGraph Context:
        </span>
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-rose-500/30 text-rose-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
          {interventionLog.counterProof}
        </div>
      </div>

      {/* Epistemic Outcome */}
      <div className="flex items-center justify-between pt-2 border-t border-rose-500/20 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Sycophancy loop terminated; swarm state recalibrated to verified ground truth.</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Trigger Turn: T+{interventionLog.triggeredAtStep}
        </span>
      </div>
    </div>
  );
};
