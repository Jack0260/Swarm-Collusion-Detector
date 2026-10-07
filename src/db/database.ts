/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { LangSmithSpan, ScenarioDefinition, EvalResult } from '../types/swarm';

export interface DbRunRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  timestamp: number;
  durationMs: number;
  status: 'nominal' | 'collusion_detected' | 'intervened';
  maxCollusionScore: number;
  agreeingAgentCount: number;
  agreeingAgents: string[];
  totalTokens: number;
  totalCostUsd: number;
  spansCount: number;
  interventionTriggered: boolean;
}

export interface DbIncidentRecord {
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
  status: 'mitigated' | 'unmitigated';
}

export interface DatabaseSchema {
  version: string;
  createdAt: number;
  updatedAt: number;
  runs: DbRunRecord[];
  incidents: DbIncidentRecord[];
  customScenarios: ScenarioDefinition[];
  benchmarkEvals: EvalResult[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'swarm_collusion.db.json');

class DatabaseService {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load existing database file, initializing clean database:', err);
    }

    const initialDb: DatabaseSchema = {
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runs: [],
      incidents: [],
      customScenarios: [],
      benchmarkEvals: [],
    };

    this.saveImmediate(initialDb);
    return initialDb;
  }

  private saveImmediate(db: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public save(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      this.data.updatedAt = Date.now();
      this.saveImmediate(this.data);
      this.isSaving = false;
    }, 100);
  }

  // --- Runs Operations ---
  public getRuns(limit = 100): DbRunRecord[] {
    return [...this.data.runs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public insertRun(run: Omit<DbRunRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): DbRunRecord {
    const record: DbRunRecord = {
      id: run.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: run.timestamp || Date.now(),
      ...run,
    };
    this.data.runs.unshift(record);
    if (this.data.runs.length > 500) {
      this.data.runs = this.data.runs.slice(0, 500);
    }
    this.save();
    return record;
  }

  // --- Incidents Operations ---
  public getIncidents(limit = 50): DbIncidentRecord[] {
    return [...this.data.incidents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public insertIncident(incident: Omit<DbIncidentRecord, 'id' | 'timestamp'>): DbIncidentRecord {
    const record: DbIncidentRecord = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      ...incident,
    };
    this.data.incidents.unshift(record);
    this.save();
    return record;
  }

  // --- Custom Scenarios Operations ---
  public getCustomScenarios(): ScenarioDefinition[] {
    return this.data.customScenarios;
  }

  public insertCustomScenario(scenario: ScenarioDefinition): ScenarioDefinition {
    const existingIndex = this.data.customScenarios.findIndex(s => s.id === scenario.id);
    if (existingIndex >= 0) {
      this.data.customScenarios[existingIndex] = scenario;
    } else {
      this.data.customScenarios.push(scenario);
    }
    this.save();
    return scenario;
  }

  // --- Benchmark Evals Operations ---
  public getBenchmarkEvals(): EvalResult[] {
    return this.data.benchmarkEvals;
  }

  public setBenchmarkEvals(evals: EvalResult[]): void {
    this.data.benchmarkEvals = evals;
    this.save();
  }

  // --- Statistics ---
  public getStats() {
    const totalRuns = this.data.runs.length;
    const totalIncidents = this.data.incidents.length;
    const totalTokensTracked = this.data.runs.reduce((acc, r) => acc + (r.totalTokens || 0), 0);
    const totalCostTracked = this.data.runs.reduce((acc, r) => acc + (r.totalCostUsd || 0), 0);
    const mitigatedIncidents = this.data.incidents.filter(i => i.status === 'mitigated').length;

    return {
      totalRuns,
      totalIncidents,
      mitigatedIncidents,
      totalCustomScenarios: this.data.customScenarios.length,
      totalTokensTracked,
      totalCostTracked,
      lastUpdated: this.data.updatedAt,
      dbPath: DB_FILE_PATH,
    };
  }

  public resetDatabase(): void {
    this.data = {
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runs: [],
      incidents: [],
      customScenarios: [],
      benchmarkEvals: [],
    };
    this.saveImmediate(this.data);
  }

  public exportRaw(): DatabaseSchema {
    return this.data;
  }
}

export const dbService = new DatabaseService();
