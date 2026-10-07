/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AGENT_PROFILES } from '../data/agents';
import { SCENARIOS } from '../data/scenarios';
import { AgentMessage, AgentRole, SwarmState } from '../types/swarm';
import { Bot, Check, AlertOctagon, CornerDownRight, ShieldCheck, Sparkles } from 'lucide-react';

interface AgentSwarmViewProps {
  state: SwarmState;
  onSelectAgentForTrace?: (agentId: AgentRole) => void;
}

export const AgentSwarmView: React.FC<AgentSwarmViewProps> = ({ state, onSelectAgentForTrace }) => {
  const currentScenario = SCENARIOS.find(s => s.id === state.scenarioId) || SCENARIOS[0];
  const agentsList: AgentRole[] = ['manager', 'researcher', 'writer', 'coder', 'reviewer'];
  if (state.interventionLog) {
    agentsList.push('devils_advocate');
  }

  return (
    <div className="space-y-5">
      {/* Task & Premises Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Category: {currentScenario.category}</span>
              <span aria-hidden="true">·</span>
              <span>Task ID: {currentScenario.id}</span>
              {currentScenario.isCollusionScenario ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">Sycophancy Trap Test</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-medium">Nominal Control Test</span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {currentScenario.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-slate-200">Objective:</strong> {currentScenario.task}
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[280px] max-w-md text-xs font-mono">
            {/* Manager Premise */}
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-1">
                Manager's Asserted Premise
              </div>
              <div className="text-slate-300 line-clamp-3 italic">
                "{currentScenario.managerPremise}"
              </div>
            </div>

            {/* Verified Ground Truth */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
                Verified Ground Truth Knowledge Base
              </div>
              <div className="text-slate-300 line-clamp-3">
                {currentScenario.groundTruth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Agent Swarm Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {(['manager', 'researcher', 'writer', 'coder', 'reviewer'] as AgentRole[]).map((agentId) => {
          const profile = AGENT_PROFILES[agentId];
          const hasSpoken = state.messages.some(m => m.agentId === agentId);
          const isAgreeing = state.messages.some(m => m.agentId === agentId && m.agreesWithManagerBias);
          const isActive = state.activeNode === `agent_${agentId}` || (state.activeNode === 'idle' && agentId === 'manager');
          const tokenData = state.tokenCost.perAgent[agentId] || { tokens: 0, costUsd: 0 };

          return (
            <div
              key={agentId}
              onClick={() => onSelectAgentForTrace?.(agentId)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'border-indigo-500/60 bg-indigo-950/20 shadow-sm ring-1 ring-indigo-500/40'
                  : isAgreeing
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : hasSpoken
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-800/60 bg-slate-900/30 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.avatar}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {profile.name.split(' ')[0]}
                  </span>
                </div>
                
                {isAgreeing ? (
                  <span className="text-[10px] font-mono text-rose-400 font-bold px-1 rounded bg-rose-950 border border-rose-500/30">
                    Sycophant
                  </span>
                ) : hasSpoken ? (
                  <span className="text-[10px] font-mono text-emerald-400">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">
                    Standby
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 truncate">
                {profile.role.split('&')[0]}
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="tabular-nums">{tokenData.tokens} tok</span>
                <span className="text-slate-300 tabular-nums">
                  ${tokenData.costUsd.toFixed(5)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Dialogue / Trace Stream */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Swarm Execution Stream ({state.messages.length} Turns)
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {state.status === 'collusion_flagged' ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Collusion Gate Active
              </span>
            ) : state.status === 'intervened' ? (
              <span className="text-sky-400 font-semibold">
                Devil's Advocate Injected
              </span>
            ) : state.status === 'running' ? (
              <span className="text-emerald-400">Processing Swarm Turn...</span>
            ) : (
              <span className="text-slate-500">Awaiting Next Step</span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
          {state.messages.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Press "Play" or "Next Agent Step" above to start the LangGraph swarm execution.
            </div>
          ) : (
            state.messages.map((msg, idx) => {
              const agent = AGENT_PROFILES[msg.agentId];
              const isManager = msg.agentId === 'manager';
              const isIntervention = msg.isIntervention;

              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isIntervention
                      ? 'border-rose-500/50 bg-rose-950/20 shadow-md ring-1 ring-rose-500/30'
                      : isManager
                      ? 'border-indigo-500/30 bg-indigo-950/20'
                      : msg.agreesWithManagerBias
                      ? 'border-rose-500/30 bg-rose-950/10'
                      : 'border-slate-800 bg-slate-900/40'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.avatar}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">
                          {agent.name}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                          [{agent.role}]
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      {isIntervention ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-900/60 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Adversarial Counter-Intervention
                        </span>
                      ) : isManager ? (
                        <span className="text-indigo-400 text-[11px]">
                          Director Premise
                        </span>
                      ) : msg.agreesWithManagerBias ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-rose-400 font-semibold text-[11px] tabular-nums">
                            Sycophancy: {msg.sycophancyScore}%
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-amber-400 text-[11px]">
                            False Agreement
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">
                          Factual Rigor ({msg.factualAccuracyScore}%)
                        </span>
                      )}

                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400 text-[11px] tabular-nums">
                        {msg.tokens.total} tok
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs text-slate-200 leading-relaxed font-sans pl-8">
                    {msg.content}
                  </p>

                  {/* Influence Citation Note */}
                  {msg.influenceQuote && (
                    <div className="mt-2.5 ml-8 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                      <CornerDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-300">Causal Sycophancy Echo:</strong>{" "}
                        <span className="italic text-rose-300/90">"{msg.influenceQuote}"</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
