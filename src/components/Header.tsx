/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, StepForward, RotateCcw, ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { SwarmState } from '../types/swarm';

interface HeaderProps {
  activeTab: 'workspace' | 'influence' | 'trace' | 'benchmark' | 'tokens' | 'database';
  setActiveTab: (tab: 'workspace' | 'influence' | 'trace' | 'benchmark' | 'tokens' | 'database') => void;
  state: SwarmState;
  isPlaying: boolean;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onManualIntervene: () => void;
  onOpenCustomModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  state,
  isPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSelectScenario,
  onManualIntervene,
  onOpenCustomModal,
}) => {
  const currentScenario = SCENARIOS.find(s => s.id === state.scenarioId) || SCENARIOS[0];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm tracking-wider">
            SC
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Swarm Collusion Detector
              <span className="text-xs font-mono font-normal text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-900">
                LangGraph v0.9
              </span>
            </h1>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean text with active indicator) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Swarm Workspace
          </button>
          <button
            onClick={() => setActiveTab('influence')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'influence'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Influence Graph
            {state.metrics.isColluding && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'trace'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LangSmith Traces
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            20-Scenario Eval
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap font-mono ${
              activeTab === 'tokens'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cost Tracker
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap font-mono ${
              activeTab === 'database'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Database
          </button>
        </nav>

        {/* Zone 3: Scenario Selector & Interactive Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={state.scenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-700 max-w-[210px] truncate"
            title={currentScenario.title}
          >
            {SCENARIOS.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {String(idx + 1).padStart(2, '0')}. {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenCustomModal}
            title="Custom Scenario"
            className="p-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Execution Controls */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            {isPlaying ? (
              <button
                onClick={onPause}
                title="Pause simulation"
                className="p-1.5 rounded-md hover:bg-slate-800 text-amber-400 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                title="Run swarm simulation"
                className="p-1.5 rounded-md hover:bg-slate-800 text-emerald-400 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onStep}
              title="Next Agent Step"
              disabled={state.status === 'completed' || isPlaying}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onReset}
              title="Reset Swarm"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Switcher */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === s
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Intervention Button */}
          {state.metrics.isColluding && !state.interventionLog && (
            <button
              onClick={onManualIntervene}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm animate-pulse transition-colors whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Inject Devil's Advocate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
