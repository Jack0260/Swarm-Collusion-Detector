/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, Trash2, ShieldAlert, CheckCircle2, Search, Table, FileText, ArrowRight } from 'lucide-react';

interface DbStats {
  totalRuns: number;
  totalIncidents: number;
  mitigatedIncidents: number;
  totalCustomScenarios: number;
  totalTokensTracked: number;
  totalCostTracked: number;
  lastUpdated: number;
  dbPath: string;
}

interface DbRun {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  timestamp: number;
  durationMs: number;
  status: string;
  maxCollusionScore: number;
  agreeingAgentCount: number;
  agreeingAgents: string[];
  totalTokens: number;
  totalCostUsd: number;
  spansCount: number;
  interventionTriggered: boolean;
}

interface DbIncident {
  id: string;
  runId: string;
  scenarioId: string;
  timestamp: number;
  triggerStep: number;
  agreeingAgents: string[];
  managerPremise: string;
  counterProof: string;
  scoreBefore: number;
  scoreAfter: number;
  status: string;
}

export const DatabaseViewer: React.FC = () => {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [runs, setRuns] = useState<DbRun[]>([]);
  const [incidents, setIncidents] = useState<DbIncident[]>([]);
  const [activeTable, setActiveTable] = useState<'runs' | 'incidents'>('runs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<DbIncident | null>(null);

  const fetchDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, runsRes, incidentsRes] = await Promise.all([
        fetch('/api/db/stats').then(r => r.json()),
        fetch('/api/db/runs').then(r => r.json()),
        fetch('/api/db/incidents').then(r => r.json()),
      ]);
      setStats(statsRes);
      setRuns(runsRes || []);
      setIncidents(incidentsRes || []);
    } catch (err) {
      console.error('Failed to fetch DB data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/db/export';
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to clear and reset the database?')) {
      await fetch('/api/db/reset', { method: 'POST' });
      fetchDatabaseData();
    }
  };

  const filteredRuns = runs.filter(r =>
    r.scenarioTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.scenarioId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i =>
    i.scenarioId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.managerPremise.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* DB Overview Header KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Total Logged Runs
            </span>
            <Table className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
            {stats?.totalRuns ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Table: `runs`
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Collusion Incidents
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400 tabular-nums">
            {stats?.totalIncidents ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {stats?.mitigatedIncidents ?? 0} Mitigated by Devil's Advocate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Persistent Scenarios
            </span>
            <FileText className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
            {stats?.totalCustomScenarios ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Custom Task Schemas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Storage Engine
            </span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            JSON ACID Datastore
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono truncate" title={stats?.dbPath}>
            Local File System
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          {/* Table Switcher */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTable('runs')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTable === 'runs'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Runs ({runs.length})
            </button>
            <button
              onClick={() => setActiveTable('incidents')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTable === 'incidents'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incidents ({incidents.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-slate-700 w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDatabaseData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 transition-colors"
            title="Reset database"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table Viewer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {activeTable === 'runs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Max Collusion</th>
                  <th className="py-3 px-4 text-right">Agreeing</th>
                  <th className="py-3 px-4 text-right">Tokens</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                      No run records in database yet. Run the swarm or benchmark above to record runs.
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-indigo-400 whitespace-nowrap">
                        {r.id.slice(0, 14)}...
                      </td>
                      <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">
                        {r.scenarioTitle}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {r.interventionTriggered ? (
                          <span className="text-[11px] font-mono text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/30">
                            INTERVENED
                          </span>
                        ) : r.maxCollusionScore >= 70 ? (
                          <span className="text-[11px] font-mono text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/30">
                            COLLUDED
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400">
                            NOMINAL
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">
                        {r.maxCollusionScore}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                        {r.agreeingAgentCount}/4
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {r.totalTokens}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-400">
                        ${r.totalCostUsd?.toFixed(5) ?? '0.00000'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTable === 'incidents' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Scenario ID</th>
                  <th className="py-3 px-4">Trigger Step</th>
                  <th className="py-3 px-4">Agreeing Agents</th>
                  <th className="py-3 px-4 text-right">Score Before / After</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      No collusion incidents logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono text-rose-400 whitespace-nowrap">
                        {inc.id.slice(0, 14)}...
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {inc.scenarioId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        T+{inc.triggerStep}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {inc.agreeingAgents.join(', ')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        <span className="text-rose-400 line-through">{inc.scoreBefore}%</span>{' '}
                        <span className="text-emerald-400 font-bold">{inc.scoreAfter}%</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 text-[11px] font-bold">
                          MITIGATED
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Incident Drawer */}
      {selectedIncident && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">
              Incident Detail: {selectedIncident.id}
            </h4>
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-slate-500 hover:text-slate-300 font-mono"
            >
              Close [×]
            </button>
          </div>
          <div className="space-y-1.5 font-mono text-slate-300">
            <div>
              <strong className="text-rose-400">Manager Premise:</strong> "{selectedIncident.managerPremise}"
            </div>
            <div>
              <strong className="text-sky-400">Injected Counter-Proof:</strong> {selectedIncident.counterProof}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
