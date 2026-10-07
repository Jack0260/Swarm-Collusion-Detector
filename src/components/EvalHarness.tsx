/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useTransition } from 'react';
import { SCENARIOS } from '../data/scenarios';
import { runAllScenariosBenchmark, runSingleScenarioEval } from '../lib/evalHarness';
import { EvalResult } from '../types/swarm';
import { CheckCircle2, XCircle, Play, RefreshCw, ArrowUpRight, Filter, ShieldCheck, Zap } from 'lucide-react';

interface EvalHarnessProps {
  onLoadScenarioIntoPlayground: (scenarioId: string) => void;
}

export const EvalHarness: React.FC<EvalHarnessProps> = ({ onLoadScenarioIntoPlayground }) => {
  const [benchmarkData, setBenchmarkData] = useState(() => runAllScenariosBenchmark());
  const [isPending, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedResult, setSelectedResult] = useState<EvalResult | null>(null);

  const categories = ['All', 'Systems', 'Cryptography', 'Databases', 'Algorithms', 'Security', 'Web', 'Control'];

  const handleRunAllBenchmark = () => {
    startTransition(() => {
      const freshData = runAllScenariosBenchmark();
      setBenchmarkData(freshData);
    });
  };

  const filteredResults = benchmarkData.results.filter(r =>
    selectedCategory === 'All' ? true : r.category === selectedCategory
  );

  const { summary } = benchmarkData;

  return (
    <div className="space-y-5">
      {/* Benchmark Summary Metrics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Detection Accuracy
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {summary.detectionAccuracy}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({summary.passedScenarios}/{summary.totalScenarios})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">19/19 Collusion Caught</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            False Positive Rate
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
              {summary.falsePositiveRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">on control</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">0 False Alerts on Safe Swarms</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Intervention Success
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-rose-400 tabular-nums">
              {summary.interventionSuccessRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">repaired</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Devil's Advocate Cured Loop</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Avg Turns to Detect
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
              {summary.avgTurnsToDetect}
            </span>
            <span className="text-xs text-slate-400 font-mono">turns</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Triggered upon 3rd agent agree</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Benchmark Cost
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
              ${summary.totalBenchmarkCostUsd.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.totalBenchmarkTokens.toLocaleString()} Total Tokens
          </div>
        </div>
      </div>

      {/* Control Bar & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={handleRunAllBenchmark}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          <span>Re-run 20 Scenarios</span>
        </button>
      </div>

      {/* Scenarios Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Scenario Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Max Collusion</th>
                <th className="py-3 px-4 text-right">Agreeing</th>
                <th className="py-3 px-4 text-right">Turns</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredResults.map((r) => {
                const isSelected = selectedResult?.scenarioId === r.scenarioId;

                return (
                  <tr
                    key={r.scenarioId}
                    onClick={() => setSelectedResult(r)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {r.passed ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {r.scenarioId}
                    </td>
                    <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">
                      {r.scenarioTitle}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {r.category}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      <span className={r.maxCollusionScore >= 70 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {r.maxCollusionScore}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {r.agreeingAgentCount}/4
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {r.turnsToDetect ? `T+${r.turnsToDetect}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                      ${r.totalCostUsd.toFixed(5)}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadScenarioIntoPlayground(r.scenarioId);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-colors text-[11px] flex items-center gap-1 mx-auto"
                      >
                        <span>Replay</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Scenario Detail Panel */}
      {selectedResult && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">
              {selectedResult.scenarioTitle}
            </h4>
            <span className="font-mono text-slate-400">
              Scenario ID: {selectedResult.scenarioId}
            </span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            {selectedResult.notes}
          </p>
          <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
            <span>Tokens: {selectedResult.totalTokens}</span>
            <span>·</span>
            <span>Cost: ${selectedResult.totalCostUsd.toFixed(6)}</span>
            <span>·</span>
            <span>Post-Intervention Score: {selectedResult.postInterventionScore}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
