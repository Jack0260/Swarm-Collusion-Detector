/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentRole = 
  | 'manager' 
  | 'researcher' 
  | 'writer' 
  | 'coder' 
  | 'reviewer' 
  | 'devils_advocate';

export interface AgentProfile {
  id: AgentRole;
  name: string;
  role: string;
  avatar: string;
  color: string;
  accentColor: string;
  bgLight: string;
  description: string;
  epistemicTendency: string;
  systemPrompt: string;
}

export interface AgentMessage {
  id: string;
  agentId: AgentRole;
  content: string;
  timestamp: number;
  stepIndex: number;
  sycophancyScore: number; // 0 - 100
  agreesWithManagerBias: boolean;
  factualAccuracyScore: number; // 0 - 100
  referencedAgents: AgentRole[];
  influenceQuote?: string;
  isIntervention?: boolean;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface InfluenceEdge {
  id: string;
  source: AgentRole;
  target: AgentRole;
  weight: number; // 0 - 100
  type: 'bias_seeding' | 'sycophantic_echo' | 'rubber_stamp' | 'factual_correction' | 'intervention_break';
  quote: string;
  timestamp: number;
  isCollusionEdge: boolean;
}

export interface CollusionMetrics {
  overallScore: number; // 0 - 100
  sycophancyIndex: number; // 0 - 100
  factualDrift: number; // 0 - 100
  conformityPressure: number; // 0 - 100
  cascadeVelocity: number; // 0 - 100
  isColluding: boolean;
  agreeingAgentCount: number;
  agreeingAgents: AgentRole[];
  flaggedTimestamp?: number;
  interventionTriggered: boolean;
}

export interface LangSmithSpan {
  id: string;
  runId: string;
  parentSpanId?: string;
  name: string;
  type: 'chain' | 'llm' | 'tool' | 'guardrail' | 'intervention';
  status: 'success' | 'warning' | 'collusion_flagged' | 'intervened';
  startTime: number;
  endTime: number;
  latencyMs: number;
  agentId?: AgentRole;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  metadata: {
    model: string;
    temperature?: number;
    sycophancyScore?: number;
    collusionScore?: number;
    stepIndex?: number;
    tags: string[];
  };
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: 'Systems' | 'Cryptography' | 'Databases' | 'Algorithms' | 'Security' | 'Web' | 'Control';
  task: string;
  groundTruth: string;
  managerPremise: string;
  isCollusionScenario: boolean; // false for control scenario
  expectedAgreeingAgents: AgentRole[];
  devilsAdvocateCounterProof: string;
  dialogueScript: {
    agentId: AgentRole;
    text: string;
    sycophancyScore: number;
    agreesWithManager: boolean;
    referencedAgents: AgentRole[];
    quote?: string;
  }[];
}

export interface EvalResult {
  scenarioId: string;
  scenarioTitle: string;
  category: string;
  isCollusionScenario: boolean;
  detectedCollusion: boolean;
  maxCollusionScore: number;
  agreeingAgentCount: number;
  turnsToDetect: number;
  successfullyIntervened: boolean;
  postInterventionScore: number;
  totalTokens: number;
  totalCostUsd: number;
  passed: boolean;
  notes: string;
}

export interface SwarmState {
  scenarioId: string;
  status: 'idle' | 'running' | 'paused' | 'collusion_flagged' | 'intervened' | 'completed';
  stepIndex: number;
  activeNode: string;
  messages: AgentMessage[];
  influenceEdges: InfluenceEdge[];
  metrics: CollusionMetrics;
  spans: LangSmithSpan[];
  tokenCost: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    perAgent: Record<AgentRole, { tokens: number; costUsd: number }>;
  };
  interventionLog?: {
    triggeredAtStep: number;
    reason: string;
    agreeingAgents: AgentRole[];
    counterProof: string;
    scoreBefore: number;
    scoreAfter: number;
  };
}
