/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LangSmithSpan, SwarmState } from '../types/swarm';
import { ChevronRight, Copy, Check, Clock, Coins, Layers, Search, Terminal, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LangSmithTraceViewerProps {
  state: SwarmState;
}

export const LangSmithTraceViewer: React.FC<LangSmithTraceViewerProps> = ({ state }) => {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(
    state.spans.length > 0 ? state.spans[state.spans.length - 1].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'io' | 'metadata' | 'json'>('io');

  // Fallback to latest span if selected is gone
  const activeSpan = state.spans.find(s => s.id === selectedSpanId) || state.spans[state.spans.length - 1] || null;

  const filteredSpans = state.spans.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.agentId && s.agentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyJson = () => {
    if (!activeSpan) return;
    navigator.clipboard.writeText(JSON.stringify(activeSpan, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[700px]">
      {/* Top LangSmith Header Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
            λ
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              LangSmith Trace Explorer
              <span className="text-xs font-mono font-normal text-slate-400">
                · Run: swarm_run_{state.scenarioId}
              </span>
            </h2>
          </div>
        </div>

        {/* Global Trace Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-semibold tabular-nums">{state.spans.length}</span> Spans
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-400 font-semibold tabular-nums">
              ${state.tokenCost.totalCostUsd.toFixed(5)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split View: Left Run Tree, Right Span Detail */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Left Pane: Span Run Tree (4 cols) */}
        <div className="md:col-span-5 flex flex-col h-full bg-slate-950/50 overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter spans by agent, name, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
              />
            </div>
          </div>

          {/* Span Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSpans.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                No trace spans recorded yet.
              </div>
            ) : (
              filteredSpans.map((span) => {
                const isSelected = activeSpan?.id === span.id;
                let statusBadge = (
                  <span className="text-[10px] font-mono text-emerald-400">OK</span>
                );
                if (span.status === 'collusion_flagged') {
                  statusBadge = (
                    <span className="text-[10px] font-mono text-rose-400 font-bold px-1 rounded bg-rose-950 border border-rose-500/30">
                      FLAGGED
                    </span>
                  );
                } else if (span.status === 'intervened') {
                  statusBadge = (
                    <span className="text-[10px] font-mono text-sky-400 font-bold px-1 rounded bg-sky-950 border border-sky-500/30">
                      INTERVENED
                    </span>
                  );
                } else if (span.status === 'warning') {
                  statusBadge = (
                    <span className="text-[10px] font-mono text-amber-400">ECHO</span>
                  );
                }

                return (
                  <div
                    key={span.id}
                    onClick={() => setSelectedSpanId(span.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-indigo-500/60 bg-indigo-950/30 shadow-sm'
                        : 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 shrink-0 ${isSelected ? 'text-indigo-400 rotate-90' : ''}`} />
                        <span className="font-mono font-semibold text-slate-200 truncate">
                          {span.name}
                        </span>
                      </div>
                      {statusBadge}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pl-5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="tabular-nums">{span.latencyMs}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="tabular-nums">{span.tokenUsage.totalTokens} tok</span>
                        <span>·</span>
                        <span className="text-slate-300 tabular-nums">
                          ${span.tokenUsage.estimatedCostUsd.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Span Inspector (7 cols) */}
        <div className="md:col-span-7 flex flex-col h-full bg-slate-900/40 overflow-hidden">
          {activeSpan ? (
            <>
              {/* Span Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-indigo-400 font-bold">
                      {activeSpan.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {activeSpan.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Model: {activeSpan.metadata.model}</span>
                    <span>·</span>
                    <span>Latency: {activeSpan.latencyMs}ms</span>
                    <span>·</span>
                    <span>Tokens: {activeSpan.tokenUsage.totalTokens}</span>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('io')}
                    className={`px-2.5 py-1 rounded ${activeTab === 'io' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    I/O State
                  </button>
                  <button
                    onClick={() => setActiveTab('metadata')}
                    className={`px-2.5 py-1 rounded ${activeTab === 'metadata' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Metadata
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-2.5 py-1 rounded ${activeTab === 'json' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {/* Span Body View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'io' && (
                  <div className="space-y-4">
                    {/* Inputs Card */}
                    <div className="border border-slate-800 rounded-lg bg-slate-950/60 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 text-xs font-mono font-bold text-slate-300">
                        Input Parameters & Context
                      </div>
                      <div className="p-3 text-xs font-mono space-y-2 text-slate-300">
                        {Object.entries(activeSpan.inputs).map(([k, v]) => (
                          <div key={k} className="border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                            <span className="text-indigo-400 font-semibold">{k}:</span>
                            <div className="mt-1 text-slate-300 whitespace-pre-wrap pl-2 border-l border-slate-800">
                              {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outputs Card */}
                    <div className="border border-slate-800 rounded-lg bg-slate-950/60 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 text-xs font-mono font-bold text-slate-300">
                        Span Outputs & Sycophancy Evaluation
                      </div>
                      <div className="p-3 text-xs font-mono space-y-2 text-slate-300">
                        {Object.entries(activeSpan.outputs).map(([k, v]) => (
                          <div key={k} className="border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                            <span className="text-emerald-400 font-semibold">{k}:</span>
                            <div className="mt-1 text-slate-300 whitespace-pre-wrap pl-2 border-l border-slate-800">
                              {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'metadata' && (
                  <div className="border border-slate-800 rounded-lg bg-slate-950/60 p-4 space-y-3 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-slate-500">Model Runtime</div>
                        <div className="text-slate-200 font-bold">{activeSpan.metadata.model}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Execution Latency</div>
                        <div className="text-slate-200 font-bold">{activeSpan.latencyMs} ms</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Prompt Tokens</div>
                        <div className="text-slate-200 font-bold">{activeSpan.tokenUsage.promptTokens}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Completion Tokens</div>
                        <div className="text-slate-200 font-bold">{activeSpan.tokenUsage.completionTokens}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Total Run Cost</div>
                        <div className="text-emerald-400 font-bold">${activeSpan.tokenUsage.estimatedCostUsd.toFixed(6)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Step Index</div>
                        <div className="text-slate-200 font-bold">{activeSpan.metadata.stepIndex}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-slate-500 mb-1.5">Span Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {activeSpan.metadata.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'json' && (
                  <div className="relative">
                    <button
                      onClick={handleCopyJson}
                      className="absolute right-3 top-3 p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-mono"
                    >
                      {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                    </button>
                    <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px]">
                      {JSON.stringify(activeSpan, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
              Select a trace span on the left to inspect I/O, tokens, and metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
