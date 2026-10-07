/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CollusionMeter } from './components/CollusionMeter';
import { AgentSwarmView } from './components/AgentSwarmView';
import { InfluenceGraph } from './components/InfluenceGraph';
import { LangSmithTraceViewer } from './components/LangSmithTraceViewer';
import { EvalHarness } from './components/EvalHarness';
import { TokenCostTracker } from './components/TokenCostTracker';
import { DevilsAdvocatePanel } from './components/DevilsAdvocatePanel';
import { LangGraphDAG } from './components/LangGraphDAG';
import { CustomScenarioModal } from './components/CustomScenarioModal';
import { DatabaseViewer } from './components/DatabaseViewer';
import { SCENARIOS } from './data/scenarios';
import { AgentRole, ScenarioDefinition, SwarmState } from './types/swarm';
import { createInitialSwarmState, executeNextSwarmStep, triggerInterventionStep } from './lib/engine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'influence' | 'trace' | 'benchmark' | 'tokens' | 'database'>('workspace');
  const [scenariosList, setScenariosList] = useState<ScenarioDefinition[]>(SCENARIOS);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('scen-01');
  const [state, setState] = useState<SwarmState>(() => createInitialSwarmState('scen-01'));
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  const activeScenario = scenariosList.find(s => s.id === currentScenarioId) || scenariosList[0];

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const loggedRunsRef = useRef<Set<string>>(new Set());

  // Auto-persist completed runs and incidents into database
  useEffect(() => {
    if ((state.status === 'completed' || state.status === 'intervened') && state.messages.length > 0) {
      const runKey = `${state.scenarioId}_${state.stepIndex}_${state.status}`;
      if (!loggedRunsRef.current.has(runKey)) {
        loggedRunsRef.current.add(runKey);
        
        // Persist run
        fetch('/api/db/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: activeScenario.id,
            scenarioTitle: activeScenario.title,
            durationMs: state.spans.reduce((sum, s) => sum + s.latencyMs, 0),
            status: state.status === 'intervened' ? 'intervened' : state.metrics.isColluding ? 'collusion_detected' : 'nominal',
            maxCollusionScore: state.metrics.overallScore,
            agreeingAgentCount: state.metrics.agreeingAgentCount,
            agreeingAgents: state.metrics.agreeingAgents,
            totalTokens: state.tokenCost.totalTokens,
            totalCostUsd: state.tokenCost.totalCostUsd,
            spansCount: state.spans.length,
            interventionTriggered: !!state.interventionLog,
          }),
        }).catch(() => {});

        // If intervention occurred, also persist incident record
        if (state.interventionLog) {
          fetch('/api/db/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: `run_${state.scenarioId}_${Date.now()}`,
              scenarioId: activeScenario.id,
              triggerStep: state.interventionLog.triggeredAtStep,
              agreeingAgents: state.interventionLog.agreeingAgents,
              managerPremise: activeScenario.managerPremise,
              counterProof: state.interventionLog.counterProof,
              scoreBefore: state.interventionLog.scoreBefore,
              scoreAfter: state.interventionLog.scoreAfter,
              status: 'mitigated',
            }),
          }).catch(() => {});
        }
      }
    }
  }, [state.status, state.stepIndex, state.messages.length, state.scenarioId, state.interventionLog, activeScenario]);

  // Switch scenario
  const handleSelectScenario = (scenarioId: string) => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentScenarioId(scenarioId);
    setState(createInitialSwarmState(scenarioId));
  };

  // Step action
  const handleStep = () => {
    setState((prevState) => {
      // If already flagged for collusion and not yet intervened, automatically route to Devil's Advocate!
      if (prevState.status === 'collusion_flagged' && !prevState.interventionLog) {
        return triggerInterventionStep(prevState, activeScenario);
      }
      return executeNextSwarmStep(prevState, activeScenario);
    });
  };

  // Manual intervention override
  const handleManualIntervene = () => {
    setState((prevState) => triggerInterventionStep(prevState, activeScenario));
  };

  // Reset
  const handleReset = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setState(createInitialSwarmState(currentScenarioId));
  };

  // Custom scenario inject
  const handleCustomScenario = (customScenario: ScenarioDefinition) => {
    setScenariosList(prev => [customScenario, ...prev]);
    setCurrentScenarioId(customScenario.id);
    setState(createInitialSwarmState(customScenario.id));
  };

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(1800 / playbackSpeed);

    timerRef.current = setInterval(() => {
      setState((prevState) => {
        // Stop if completed
        if (prevState.status === 'completed') {
          setIsPlaying(false);
          return prevState;
        }

        // If flagged for collusion and haven't intervened yet, trigger Devil's Advocate
        if (prevState.status === 'collusion_flagged' && !prevState.interventionLog) {
          return triggerInterventionStep(prevState, activeScenario);
        }

        const next = executeNextSwarmStep(prevState, activeScenario);
        if (next.status === 'completed') {
          setIsPlaying(false);
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeScenario]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        state={state}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStep={handleStep}
        onReset={handleReset}
        onSelectScenario={handleSelectScenario}
        onManualIntervene={handleManualIntervene}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Global Collusion & Sycophancy Gauge */}
        <CollusionMeter
          metrics={state.metrics}
          isIntervened={!!state.interventionLog}
        />

        {/* Dynamic Injected Devil's Advocate Panel (When triggered) */}
        <DevilsAdvocatePanel state={state} />

        {/* LangGraph Topology DAG Indicator */}
        <LangGraphDAG
          activeNode={state.activeNode}
          isColluding={state.metrics.isColluding}
          hasIntervened={!!state.interventionLog}
        />

        {/* View Switcher Panels */}
        {activeTab === 'workspace' && (
          <AgentSwarmView
            state={state}
            onSelectAgentForTrace={(agentId) => {
              setActiveTab('trace');
            }}
          />
        )}

        {activeTab === 'influence' && (
          <InfluenceGraph state={state} />
        )}

        {activeTab === 'trace' && (
          <LangSmithTraceViewer state={state} />
        )}

        {activeTab === 'benchmark' && (
          <EvalHarness
            onLoadScenarioIntoPlayground={(scenarioId) => {
              handleSelectScenario(scenarioId);
              setActiveTab('workspace');
            }}
          />
        )}

        {activeTab === 'tokens' && (
          <TokenCostTracker state={state} />
        )}

        {activeTab === 'database' && (
          <DatabaseViewer />
        )}
      </main>

      {/* Custom Scenario Injection Modal */}
      <CustomScenarioModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomScenario}
      />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="text-slate-400">
            <strong>Resume Line:</strong> Built a multi-agent collusion detection system that identifies sycophancy loops in agent swarms.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>FastAPI REST Specification</span>
            <span aria-hidden="true">·</span>
            <span>LangGraph Mock Engine</span>
            <span aria-hidden="true">·</span>
            <span>LangSmith Trace Spans</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
