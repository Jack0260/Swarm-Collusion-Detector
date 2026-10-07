/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AGENT_PROFILES } from '../data/agents';
import { AgentRole, SwarmState } from '../types/swarm';
import { Coins, Zap, Activity, PieChart, ShieldCheck } from 'lucide-react';

interface TokenCostTrackerProps {
  state: SwarmState;
}

export const TokenCostTracker: React.FC<TokenCostTrackerProps> = ({ state }) => {
  const { tokenCost } = state;

  const agents: AgentRole[] = ['manager', 'researcher', 'writer', 'coder', 'reviewer', 'devils_advocate'];
  const maxAgentTokens = Math.max(1, ...Object.values(tokenCost.perAgent).map(a => a.tokens));

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Total Session Cost
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
              ${tokenCost.totalCostUsd.toFixed(5)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Prompt $0.075/1M · Comp $0.30/1M
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Total Tokens Processed
          </div>
          <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
            {tokenCost.totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {state.messages.length} Swarm Messages
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Prompt / Input Tokens
          </div>
          <div className="text-2xl font-extrabold font-mono text-indigo-400 tabular-nums">
            {tokenCost.promptTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {tokenCost.totalTokens > 0
              ? `${Math.round((tokenCost.promptTokens / tokenCost.totalTokens) * 100)}% of total volume`
              : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Completion / Output Tokens
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
            {tokenCost.completionTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {tokenCost.totalTokens > 0
              ? `${Math.round((tokenCost.completionTokens / tokenCost.totalTokens) * 100)}% of total volume`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Per-Agent Accounting Ledger */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Per-Agent Cost & Compute Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Granular model token consumption by swarm role.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Model: Gemini 3.8 Flash
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {agents.map((agentId) => {
            const profile = AGENT_PROFILES[agentId];
            const data = tokenCost.perAgent[agentId] || { tokens: 0, costUsd: 0 };
            const pct = Math.round((data.tokens / maxAgentTokens) * 100);

            return (
              <div key={agentId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.avatar}
                    </div>
                    <span className="font-semibold text-slate-200">
                      {profile.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      [{profile.role.split('&')[0]}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-300 tabular-nums">
                      {data.tokens.toLocaleString()} tokens
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      ${data.costUsd.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(data.tokens > 0 ? 3 : 0, pct)}%`,
                      backgroundColor: profile.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety ROI Card */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white">Collusion Prevention ROI</div>
            <div className="text-slate-400 text-[11px]">
              Catching the sycophancy cascade early prevented hallucinated architectural refactors, security breaches, and corrupted downstream models.
            </div>
          </div>
        </div>

        <div className="text-right font-mono shrink-0">
          <div className="text-slate-400 text-[11px]">Intervention Cost</div>
          <div className="text-emerald-400 font-bold text-sm">
            ${(tokenCost.perAgent.devils_advocate?.costUsd || 0.00018).toFixed(5)}
          </div>
        </div>
      </div>
    </div>
  );
};
