/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { CollusionMetrics } from '../types/swarm';

interface CollusionMeterProps {
  metrics: CollusionMetrics;
  isIntervened: boolean;
}

export const CollusionMeter: React.FC<CollusionMeterProps> = ({ metrics, isIntervened }) => {
  const score = metrics.overallScore;

  // Determine severity tier
  let tierLabel = 'NOMINAL';
  let tierColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';
  let borderColor = 'border-emerald-500/30';
  let bgGlow = 'bg-emerald-950/20';

  if (isIntervened) {
    tierLabel = 'CIRCUIT BROKEN (INTERVENED)';
    tierColor = 'text-sky-400';
    barColor = 'bg-sky-500';
    borderColor = 'border-sky-500/30';
    bgGlow = 'bg-sky-950/20';
  } else if (score >= 70 || metrics.isColluding) {
    tierLabel = 'CRITICAL COLLUSION DETECTED';
    tierColor = 'text-rose-400';
    barColor = 'bg-rose-500';
    borderColor = 'border-rose-500/50';
    bgGlow = 'bg-rose-950/30';
  } else if (score >= 40) {
    tierLabel = 'ELEVATED SYCOPHANCY RISK';
    tierColor = 'text-amber-400';
    barColor = 'bg-amber-500';
    borderColor = 'border-amber-500/30';
    bgGlow = 'bg-amber-950/20';
  }

  return (
    <div className={`rounded-xl border ${borderColor} ${bgGlow} p-4 transition-all duration-300 relative overflow-hidden backdrop-blur-sm`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {score >= 70 && !isIntervened ? (
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
          ) : score >= 40 && !isIntervened ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <div>
            <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
              Swarm Safety Monitor
            </span>
            <div className={`text-sm font-bold tracking-tight ${tierColor}`}>
              {tierLabel}
            </div>
          </div>
        </div>

        {/* Big Score Display */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-3xl font-extrabold font-mono tabular-nums ${tierColor}`}>
              {score}
            </span>
            <span className="text-xs font-mono text-slate-500">/100</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {metrics.agreeingAgentCount >= 3 ? (
              <span className="text-rose-400 font-semibold">
                {metrics.agreeingAgentCount}/4 agents colluding
              </span>
            ) : (
              <span>{metrics.agreeingAgentCount}/4 agreeing with manager</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Score Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mb-4">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
        />
      </div>

      {/* Factor Breakdown Grid (4 components) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-800/80">
        <div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Sycophancy Index</span>
            <span className="font-mono text-slate-200 tabular-nums">{metrics.sycophancyIndex}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${metrics.sycophancyIndex > 60 ? 'bg-rose-500' : 'bg-slate-500'}`}
              style={{ width: `${metrics.sycophancyIndex}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Factual Drift</span>
            <span className="font-mono text-slate-200 tabular-nums">{metrics.factualDrift}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${metrics.factualDrift > 60 ? 'bg-rose-500' : 'bg-slate-500'}`}
              style={{ width: `${metrics.factualDrift}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Conformity Pressure</span>
            <span className="font-mono text-slate-200 tabular-nums">{metrics.conformityPressure}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${metrics.conformityPressure > 60 ? 'bg-rose-500' : 'bg-slate-500'}`}
              style={{ width: `${metrics.conformityPressure}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cascade Velocity</span>
            <span className="font-mono text-slate-200 tabular-nums">{metrics.cascadeVelocity}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${metrics.cascadeVelocity > 60 ? 'bg-rose-500' : 'bg-slate-500'}`}
              style={{ width: `${metrics.cascadeVelocity}%` }}
            />
          </div>
        </div>
      </div>

      {/* Threshold Alert Banner if Collusion Active */}
      {metrics.isColluding && !isIntervened && (
        <div className="mt-3.5 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-xs text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>
              <strong>Threshold Breach:</strong> 3 agents have corroborated the manager's false premise to avoid conflict.
            </span>
          </div>
          <span className="font-mono text-[11px] text-rose-300 underline font-semibold">
            Triggering Devil's Advocate
          </span>
        </div>
      )}

      {isIntervened && (
        <div className="mt-3.5 p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>
              <strong>Intervention Resolved:</strong> Devil's Advocate Axiom-7 successfully broke sycophancy cascade with empirical proof.
            </span>
          </div>
          <span className="font-mono text-[11px] text-sky-300">
            Epistemic Loop Reset
          </span>
        </div>
      )}
    </div>
  );
};
