/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, GitBranch, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LangGraphDAGProps {
  activeNode: string;
  isColluding: boolean;
  hasIntervened: boolean;
}

export const LangGraphDAG: React.FC<LangGraphDAGProps> = ({
  activeNode,
  isColluding,
  hasIntervened,
}) => {
  const nodes = [
    { id: 'agent_manager', label: '1. Manager Brief', color: 'border-indigo-500 text-indigo-400' },
    { id: 'agent_researcher', label: '2. Researcher Probe', color: 'border-sky-500 text-sky-400' },
    { id: 'agent_writer', label: '3. Writer Draft', color: 'border-emerald-500 text-emerald-400' },
    { id: 'agent_coder', label: '4. Coder Spec', color: 'border-amber-500 text-amber-400' },
    { id: 'agent_reviewer', label: '5. Reviewer Audit', color: 'border-purple-500 text-purple-400' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            LangGraph State Graph Execution Topology
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          State Channels: <span className="text-indigo-400">messages</span> · <span className="text-rose-400">collusion_metrics</span> · <span className="text-emerald-400">truth_context</span>
        </div>
      </div>

      {/* Primary Workflow Pipeline */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {nodes.map((node, idx) => {
          const isActive = activeNode === node.id;
          return (
            <React.Fragment key={node.id}>
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-slate-800 border-white text-white font-bold ring-2 ring-indigo-500/50 shadow-md'
                    : `bg-slate-950/80 ${node.color} opacity-85`
                }`}
              >
                {node.label}
              </div>
              {idx < nodes.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}

        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />

        {/* Conditional Detector Gate Node */}
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
            isColluding && !hasIntervened
              ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold animate-pulse'
              : 'bg-slate-950/80 border-slate-700 text-slate-400'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Conditional Collusion Gate</span>
        </div>

        {/* Injected Branch if Collusion or Intervened */}
        {hasIntervened && (
          <>
            <ArrowRight className="w-3.5 h-3.5 text-sky-500 shrink-0 hidden sm:block" />
            <div className="px-3 py-1.5 rounded-lg border border-sky-500 bg-sky-950 text-sky-200 font-mono text-xs font-bold shadow-md">
              Axiom-7 Injection
            </div>
          </>
        )}

        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />

        {/* Resolution Node */}
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
            activeNode === 'consensus_resolution'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-950/80 border-slate-800 text-slate-500'
          }`}
        >
          Resolution
        </div>
      </div>
    </div>
  );
};
