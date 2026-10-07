/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AGENT_PROFILES } from '../data/agents';
import { SCENARIOS } from '../data/scenarios';
import { AgentMessage, AgentRole, LangSmithSpan, ScenarioDefinition, SwarmState } from '../types/swarm';
import { evaluateCollusion, extractInfluenceEdges } from './detector';

const PROMPT_COST_PER_MILLION = 0.075;
const COMPLETION_COST_PER_MILLION = 0.30;

function calculateCost(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * PROMPT_COST_PER_MILLION +
    (completionTokens / 1_000_000) * COMPLETION_COST_PER_MILLION
  );
}

export function createInitialSwarmState(scenarioId: string = 'scen-01'): SwarmState {
  const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
  const initialPerAgent: Record<AgentRole, { tokens: number; costUsd: number }> = {
    manager: { tokens: 0, costUsd: 0 },
    researcher: { tokens: 0, costUsd: 0 },
    writer: { tokens: 0, costUsd: 0 },
    coder: { tokens: 0, costUsd: 0 },
    reviewer: { tokens: 0, costUsd: 0 },
    devils_advocate: { tokens: 0, costUsd: 0 },
  };

  return {
    scenarioId: scenario.id,
    status: 'idle',
    stepIndex: 0,
    activeNode: 'idle',
    messages: [],
    influenceEdges: [],
    metrics: {
      overallScore: 0,
      sycophancyIndex: 0,
      factualDrift: 0,
      conformityPressure: 0,
      cascadeVelocity: 0,
      isColluding: false,
      agreeingAgentCount: 0,
      agreeingAgents: [],
      interventionTriggered: false,
    },
    spans: [],
    tokenCost: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      perAgent: initialPerAgent,
    },
  };
}

export function executeNextSwarmStep(
  currentState: SwarmState,
  scenario: ScenarioDefinition
): SwarmState {
  const currentStep = currentState.stepIndex;
  const scriptItem = scenario.dialogueScript[currentStep];

  // If we already finished all script items and haven't triggered intervention, or are completed
  if (!scriptItem) {
    if (currentState.status === 'collusion_flagged' && !currentState.interventionLog) {
      return triggerInterventionStep(currentState, scenario);
    }
    return {
      ...currentState,
      status: 'completed',
      activeNode: 'consensus_resolution',
    };
  }

  const agent = AGENT_PROFILES[scriptItem.agentId];
  const runId = `swarm_run_${scenario.id}`;
  const now = Date.now();
  
  // Calculate tokens
  const promptTokens = 350 + currentStep * 120;
  const completionTokens = Math.max(80, Math.round(scriptItem.text.length / 3.8));
  const totalStepTokens = promptTokens + completionTokens;
  const stepCostUsd = calculateCost(promptTokens, completionTokens);

  const newMessage: AgentMessage = {
    id: `msg-${currentStep}-${scriptItem.agentId}`,
    agentId: scriptItem.agentId,
    content: scriptItem.text,
    timestamp: now,
    stepIndex: currentStep,
    sycophancyScore: scriptItem.sycophancyScore,
    agreesWithManagerBias: scriptItem.agreesWithManager,
    factualAccuracyScore: scriptItem.agreesWithManager ? Math.max(5, 100 - scriptItem.sycophancyScore) : 95,
    referencedAgents: scriptItem.referencedAgents,
    influenceQuote: scriptItem.quote,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalStepTokens,
    },
  };

  const newMessages = [...currentState.messages, newMessage];

  // Evaluate collusion metrics
  const newMetrics = evaluateCollusion(
    newMessages,
    scenario.isCollusionScenario,
    !!currentState.interventionLog
  );

  // Update influence edges
  const newEdges = extractInfluenceEdges(newMessages, !!currentState.interventionLog);

  // Create LangSmith span
  const spanId = `span_${currentStep}_${scriptItem.agentId}`;
  const latencyMs = Math.round(320 + Math.random() * 280);
  
  let spanStatus: LangSmithSpan['status'] = 'success';
  if (scriptItem.agreesWithManager && newMetrics.agreeingAgentCount >= 2) {
    spanStatus = 'warning';
  }
  if (newMetrics.isColluding) {
    spanStatus = 'collusion_flagged';
  }

  const newSpan: LangSmithSpan = {
    id: spanId,
    runId,
    name: `agent_node[${scriptItem.agentId}]`,
    type: 'llm',
    status: spanStatus,
    startTime: now - latencyMs,
    endTime: now,
    latencyMs,
    agentId: scriptItem.agentId,
    inputs: {
      systemPrompt: agent.systemPrompt,
      task: scenario.task,
      conversationHistory: currentState.messages.map(m => `[${m.agentId}]: ${m.content}`),
      stateContext: {
        activeStep: currentStep,
        managerPremise: scenario.managerPremise,
      },
    },
    outputs: {
      generatedMessage: scriptItem.text,
      sycophancyScore: scriptItem.sycophancyScore,
      factualAccuracyScore: newMessage.factualAccuracyScore,
      agreesWithManager: scriptItem.agreesWithManager,
    },
    metadata: {
      model: 'gemini-3.8-flash',
      temperature: 0.7,
      sycophancyScore: scriptItem.sycophancyScore,
      collusionScore: newMetrics.overallScore,
      stepIndex: currentStep,
      tags: [`role:${scriptItem.agentId}`, `scenario:${scenario.id}`, `status:${spanStatus}`],
    },
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: totalStepTokens,
      estimatedCostUsd: stepCostUsd,
    },
  };

  // Update token costs per agent
  const updatedPerAgent = { ...currentState.tokenCost.perAgent };
  const currentAgentRecord = updatedPerAgent[scriptItem.agentId] || { tokens: 0, costUsd: 0 };
  updatedPerAgent[scriptItem.agentId] = {
    tokens: currentAgentRecord.tokens + totalStepTokens,
    costUsd: currentAgentRecord.costUsd + stepCostUsd,
  };

  const updatedTokenCost = {
    promptTokens: currentState.tokenCost.promptTokens + promptTokens,
    completionTokens: currentState.tokenCost.completionTokens + completionTokens,
    totalTokens: currentState.tokenCost.totalTokens + totalStepTokens,
    totalCostUsd: currentState.tokenCost.totalCostUsd + stepCostUsd,
    perAgent: updatedPerAgent,
  };

  // Determine next status
  let nextStatus: SwarmState['status'] = 'running';
  let nextActiveNode = `agent_${scriptItem.agentId}`;

  // Check if collusion threshold hit: >=3 agents agree on false fact
  if (newMetrics.isColluding && !currentState.interventionLog) {
    nextStatus = 'collusion_flagged';
    nextActiveNode = 'collusion_detector_gate';
  }

  return {
    ...currentState,
    stepIndex: currentStep + 1,
    status: nextStatus,
    activeNode: nextActiveNode,
    messages: newMessages,
    influenceEdges: newEdges,
    metrics: newMetrics,
    spans: [...currentState.spans, newSpan],
    tokenCost: updatedTokenCost,
  };
}

export function triggerInterventionStep(
  currentState: SwarmState,
  scenario: ScenarioDefinition
): SwarmState {
  const agent = AGENT_PROFILES.devils_advocate;
  const now = Date.now();
  const runId = `swarm_run_${scenario.id}`;

  const promptTokens = 680;
  const completionTokens = Math.max(120, Math.round(scenario.devilsAdvocateCounterProof.length / 3.8));
  const totalStepTokens = promptTokens + completionTokens;
  const stepCostUsd = calculateCost(promptTokens, completionTokens);

  const interventionMessage: AgentMessage = {
    id: `msg-intervention-${currentState.stepIndex}`,
    agentId: 'devils_advocate',
    content: scenario.devilsAdvocateCounterProof,
    timestamp: now,
    stepIndex: currentState.stepIndex,
    sycophancyScore: 0,
    agreesWithManagerBias: false,
    factualAccuracyScore: 100,
    referencedAgents: currentState.metrics.agreeingAgents,
    influenceQuote: 'Epistemic circuit breaker: adversarial counter-evidence injected',
    isIntervention: true,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalStepTokens,
    },
  };

  const newMessages = [...currentState.messages, interventionMessage];

  // Recalculate metrics post-intervention
  const postMetrics = evaluateCollusion(
    newMessages,
    scenario.isCollusionScenario,
    true
  );

  const newEdges = extractInfluenceEdges(newMessages, true);

  const latencyMs = 450;
  const interventionSpan: LangSmithSpan = {
    id: `span_intervention_${currentState.stepIndex}`,
    runId,
    name: 'devils_advocate_intervention[axiom-7]',
    type: 'intervention',
    status: 'intervened',
    startTime: now - latencyMs,
    endTime: now,
    latencyMs,
    agentId: 'devils_advocate',
    inputs: {
      triggerReason: `Collusion threshold reached: ${currentState.metrics.agreeingAgentCount} agents agreed with false manager premise`,
      managerPremise: scenario.managerPremise,
      groundTruth: scenario.groundTruth,
      agreeingAgents: currentState.metrics.agreeingAgents,
    },
    outputs: {
      adversarialProof: scenario.devilsAdvocateCounterProof,
      scoreBefore: currentState.metrics.overallScore,
      scoreAfter: postMetrics.overallScore,
      actionTaken: 'Intervened in LangGraph execution; sycophancy cascade halted',
    },
    metadata: {
      model: 'gemini-3.8-flash',
      temperature: 0.2,
      collusionScore: postMetrics.overallScore,
      stepIndex: currentState.stepIndex,
      tags: ['intervention', 'devils_advocate', 'circuit_breaker'],
    },
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: totalStepTokens,
      estimatedCostUsd: stepCostUsd,
    },
  };

  const updatedPerAgent = { ...currentState.tokenCost.perAgent };
  const daRecord = updatedPerAgent.devils_advocate || { tokens: 0, costUsd: 0 };
  updatedPerAgent.devils_advocate = {
    tokens: daRecord.tokens + totalStepTokens,
    costUsd: daRecord.costUsd + stepCostUsd,
  };

  const updatedTokenCost = {
    promptTokens: currentState.tokenCost.promptTokens + promptTokens,
    completionTokens: currentState.tokenCost.completionTokens + completionTokens,
    totalTokens: currentState.tokenCost.totalTokens + totalStepTokens,
    totalCostUsd: currentState.tokenCost.totalCostUsd + stepCostUsd,
    perAgent: updatedPerAgent,
  };

  return {
    ...currentState,
    status: 'intervened',
    activeNode: 'devils_advocate_inject',
    messages: newMessages,
    influenceEdges: newEdges,
    metrics: postMetrics,
    spans: [...currentState.spans, interventionSpan],
    tokenCost: updatedTokenCost,
    interventionLog: {
      triggeredAtStep: currentState.stepIndex,
      reason: `3 agents agreed on false premise to appease manager [Sycophancy Loop Detected]`,
      agreeingAgents: currentState.metrics.agreeingAgents,
      counterProof: scenario.devilsAdvocateCounterProof,
      scoreBefore: currentState.metrics.overallScore,
      scoreAfter: postMetrics.overallScore,
    },
  };
}
