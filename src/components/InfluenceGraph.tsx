/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AGENT_PROFILES } from '../data/agents';
import { AgentRole, InfluenceEdge, SwarmState } from '../types/swarm';
import { GitCommit, ShieldAlert, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface InfluenceGraphProps {
  state: SwarmState;
}

// Geometric coordinates for node placement in SVG viewBox (800 x 480)
const NODE_POSITIONS: Record<AgentRole, { x: number; y: number }> = {
  manager: { x: 400, y: 70 },
  researcher: { x: 180, y: 220 },
  writer: { x: 620, y: 220 },
  coder: { x: 260, y: 390 },
  reviewer: { x: 540, y: 390 },
  devils_advocate: { x: 400, y: 260 }, // Center injected node
};

export const InfluenceGraph: React.FC<InfluenceGraphProps> = ({ state }) => {
  const [selectedEdge, setSelectedEdge] = useState<InfluenceEdge | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentRole | null>(null);

  const hasIntervened = !!state.interventionLog;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Causal Influence DAG (Who Influenced Whom)</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              · {state.influenceEdges.length} Active Causal Edges
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time causal graph mapping sycophancy cascade from Manager down to engineering peers.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded" />
            <span className="text-rose-400">Sycophancy Echo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-indigo-500 rounded" />
            <span className="text-indigo-400">Manager Bias Seed</span>
          </div>
          {hasIntervened && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-400 rounded" />
              <span className="text-sky-400">Devil's Advocate Cut</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arrowhead marker definitions */}
          <defs>
            <marker
              id="arrow-rose"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-angle"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#F43F5E" />
            </marker>
            <marker
              id="arrow-indigo"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-angle"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#818CF8" />
            </marker>
            <marker
              id="arrow-sky"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-angle"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38BDF8" />
            </marker>
          </defs>

          {/* Render Influence Edges */}
          {state.influenceEdges.map((edge) => {
            const p1 = NODE_POSITIONS[edge.source];
            const p2 = NODE_POSITIONS[edge.target];
            if (!p1 || !p2) return null;

            const isIntervention = edge.type === 'intervention_break';
            const isManagerSource = edge.source === 'manager';
            const strokeColor = isIntervention
              ? '#38BDF8'
              : edge.isCollusionEdge
              ? '#F43F5E'
              : '#818CF8';
            const markerId = isIntervention
              ? 'url(#arrow-sky)'
              : edge.isCollusionEdge
              ? 'url(#arrow-rose)'
              : 'url(#arrow-indigo)';

            const strokeWidth = Math.max(2, Math.min(5, (edge.weight / 100) * 4));
            const isSelected = selectedEdge?.id === edge.id;

            // Compute midpoint for label / click target
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedEdge(edge)}>
                {/* Visual line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isIntervention ? '4 4' : undefined}
                  markerEnd={markerId}
                  className={`transition-all ${
                    isSelected ? 'stroke-white stroke-[4px]' : 'opacity-85 hover:opacity-100'
                  }`}
                />

                {/* Animated pulse dot along the edge */}
                {edge.isCollusionEdge && (
                  <circle r="3" fill="#FB7185">
                    <animateMotion
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Weight badge at midpoint */}
                <circle
                  cx={midX}
                  cy={midY}
                  r="10"
                  fill="#0F172A"
                  stroke={strokeColor}
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {(['manager', 'researcher', 'writer', 'coder', 'reviewer'] as AgentRole[]).map((agentId) => {
            const pos = NODE_POSITIONS[agentId];
            const profile = AGENT_PROFILES[agentId];
            const hasSpoken = state.messages.some(m => m.agentId === agentId);
            const isAgreeing = state.messages.some(m => m.agentId === agentId && m.agreesWithManagerBias);
            const isHovered = hoveredAgent === agentId;

            return (
              <g
                key={agentId}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAgent(agentId)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                {/* Outer halo if agreeing/sycophantic */}
                {isAgreeing && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}

                {/* Base circle */}
                <circle
                  r="22"
                  fill="#0F172A"
                  stroke={isAgreeing ? '#F43F5E' : hasSpoken ? profile.color : '#334155'}
                  strokeWidth={isHovered ? '3' : '2'}
                  className="transition-all"
                />

                {/* Inner badge */}
                <circle r="14" fill={profile.color} />
                <text
                  textAnchor="middle"
                  y="4"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {profile.avatar}
                </text>

                {/* Label text */}
                <text
                  textAnchor="middle"
                  y="36"
                  fill="#E2E8F0"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {profile.name}
                </text>
                <text
                  textAnchor="middle"
                  y="48"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {profile.role.split('&')[0]}
                </text>
              </g>
            );
          })}

          {/* Devil's Advocate Center Node (Rendered only when active) */}
          {hasIntervened && (
            <g
              transform={`translate(${NODE_POSITIONS.devils_advocate.x}, ${NODE_POSITIONS.devils_advocate.y})`}
              className="cursor-pointer"
            >
              <circle
                r="30"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeDasharray="6 3"
                className="animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <circle r="22" fill="#0369A1" stroke="#38BDF8" strokeWidth="2.5" />
              <text
                textAnchor="middle"
                y="4"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                DA
              </text>
              <text
                textAnchor="middle"
                y="36"
                fill="#38BDF8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                Axiom-7 (Injected)
              </text>
              <text
                textAnchor="middle"
                y="48"
                fill="#BAE6FD"
                fontSize="9"
                fontFamily="monospace"
              >
                Epistemic Circuit Breaker
              </text>
            </g>
          )}
        </svg>

        {/* Overlay Banner if 0 edges */}
        {state.influenceEdges.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-slate-500 text-xs font-mono">
            No causal influence edges yet. Run the simulation to trace message dependencies.
          </div>
        )}
      </div>

      {/* Selected Edge Detail Drawer */}
      {selectedEdge && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase font-mono">
                {selectedEdge.source}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-white uppercase font-mono">
                {selectedEdge.target}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-rose-400 font-semibold">
                Influence Weight: {selectedEdge.weight}%
              </span>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Close [×]
            </button>
          </div>
          <div className="text-slate-300">
            <strong className="text-slate-400">Causal Sycophancy Quote:</strong>{" "}
            <span className="italic text-rose-300">"{selectedEdge.quote}"</span>
          </div>
        </div>
      )}
    </div>
  );
};
