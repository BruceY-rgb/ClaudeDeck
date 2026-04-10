import * as path from 'path';
import * as fs from 'fs';
import { createInterface } from 'readline';
import { is } from '@electron-toolkit/utils';
import type { ParsedSession, ParsedMessage, SessionStats } from '../../shared/types/session-detail';

// Debug: Check paths
console.log('[MockData] is.dev:', is.dev);
console.log('[MockData] __dirname:', __dirname);

// Handle both dev and production paths
// Dev: __dirname = out/main -> ../../src/data/mock -> src/data/mock
// Prod: process.resourcesPath = app Contents/Resources -> resources/src/data/mock
let MOCK_DATA_ROOT: string;
if (is.dev) {
  // In dev mode, go up from out/main to project root, then to src/data/mock
  MOCK_DATA_ROOT = path.join(__dirname, '../../src/data/mock');
} else {
  // In production, the resources are in Contents/Resources/resources/src/data/mock
  MOCK_DATA_ROOT = path.join(process.resourcesPath, 'resources/src/data/mock');
}

console.log('[MockData] MOCK_DATA_ROOT:', MOCK_DATA_ROOT);

export interface MockProject {
  id: string;
  name: string;
  path: string;
  sessions: MockSession[];
}

export interface MockSession {
  id: string;
  projectPath: string;
  startTime: string;
  endTime?: string;
  stats?: SessionStats;
  messages: ParsedMessage[];
}

/**
 * MockDataService provides demo data for the application.
 * All data comes from embedded mock files, no real Claude Code data is accessed.
 */
export class MockDataService {
  private sessions: MockSession[] = [];
  private loaded = false;

  async loadSessions(): Promise<void> {
    if (this.loaded) return;

    const sessionsDir = path.join(MOCK_DATA_ROOT, 'sessions');

    if (!fs.existsSync(sessionsDir)) {
      console.log('[MockData] Sessions directory not found');
      return;
    }

    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    console.log('[MockData] Found files:', files.length);

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      try {
        const session = await this.parseSessionFile(filePath, file);
        if (session) {
          this.sessions.push(session);
        }
      } catch (err) {
        console.warn(`[MockData] Failed to parse ${file}:`, err);
      }
    }

    this.loaded = true;
    console.log(`[MockData] Loaded ${this.sessions.length} mock sessions`);
  }

  private async parseSessionFile(filePath: string, fileName: string): Promise<MockSession | null> {
    const fileStream = fs.createReadStream(filePath);
    const rl = createInterface({ input: fileStream });

    const messages: ParsedMessage[] = [];
    let startTime = '';
    let endTime = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheCreationTokens = 0;
    let model = 'sonnet';

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);
        const type = data.type;

        if (!startTime && data.timestamp) {
          startTime = data.timestamp;
        }

        if (type === 'result' && data.timestamp) {
          endTime = data.timestamp;
        }

        if (data.usage?.input_tokens) {
          totalInputTokens += data.usage.input_tokens;
        }
        if (data.usage?.output_tokens) {
          totalOutputTokens += data.usage.output_tokens;
        }
        if (data.usage?.cache_read_input_tokens) {
          totalCacheReadTokens += data.usage.cache_read_input_tokens;
        }
        if (data.usage?.cache_creation_input_tokens) {
          totalCacheCreationTokens += data.usage.cache_creation_input_tokens;
        }
        if (data.usage?.model) {
          model = data.usage.model;
        }

        // Parse user messages
        if (type === 'prompt' && data.message?.content) {
          const content = Array.isArray(data.message.content)
            ? data.message.content.map((c: any) => c.text || '').join('')
            : data.message.content;
          messages.push({
            id: `${fileName}-user-${messages.length}`,
            role: 'user',
            content: [{ type: 'text', text: content }],
            timestamp: data.timestamp || '',
            isMeta: false,
            isSidechain: false,
          });
        }

        // Parse assistant messages
        if (type === 'result' && data.message?.content) {
          const contentBlocks: ParsedMessage['content'] = [];
          const content = data.message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text') {
                contentBlocks.push({ type: 'text', text: block.text || '' });
              } else if (block.type === 'tool_use') {
                contentBlocks.push({
                  type: 'tool_use',
                  toolUseId: block.id || '',
                  toolName: block.name || '',
                  input: block.input || {},
                });
              } else if (block.type === 'tool_result') {
                contentBlocks.push({
                  type: 'tool_result',
                  toolUseId: block.tool_use_id || '',
                  output: block.content || '',
                });
              }
            }
          }
          messages.push({
            id: `${fileName}-assistant-${messages.length}`,
            role: 'assistant',
            content: contentBlocks,
            timestamp: data.timestamp || '',
            model: data.usage?.model,
            isMeta: false,
            isSidechain: false,
          });
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    if (messages.length === 0) {
      return null;
    }

    const projectPath = fileName.replace(/-[a-f0-9-]+\.jsonl$/, '').replace(/-/g, '/');

    return {
      id: fileName.replace('.jsonl', ''),
      projectPath,
      startTime,
      endTime,
      stats: {
        totalInputTokens,
        totalOutputTokens,
        totalCacheReadTokens,
        totalCacheCreationTokens,
        estimatedCostUsd: this.computeCost(totalInputTokens, totalOutputTokens, totalCacheReadTokens, totalCacheCreationTokens, model),
        durationSeconds: endTime && startTime
          ? Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000))
          : 0,
      },
      messages,
    };
  }

  private computeCost(input: number, output: number, cacheRead: number, cacheCreation: number, model: string): number {
    const pricing = this.getPricing(model);
    return (
      (input / 1_000_000) * pricing.input +
      (output / 1_000_000) * pricing.output +
      (cacheRead / 1_000_000) * pricing.cacheRead +
      (cacheCreation / 1_000_000) * pricing.cacheCreation
    );
  }

  private getPricing(model: string): { input: number; output: number; cacheRead: number; cacheCreation: number } {
    const lower = model.toLowerCase();
    if (lower.includes('opus')) {
      return { input: 15, output: 75, cacheRead: 1.875, cacheCreation: 18.75 };
    }
    if (lower.includes('haiku')) {
      return { input: 0.8, output: 4, cacheRead: 0.08, cacheCreation: 1.0 };
    }
    return { input: 3, output: 15, cacheRead: 0.3, cacheCreation: 3.75 }; // sonnet default
  }

  /**
   * Get all mock sessions
   */
  getSessions(): MockSession[] {
    return this.sessions;
  }

  /**
   * Get sessions for a specific contributor/project
   */
  getSessionsByProject(projectPath: string): MockSession[] {
    return this.sessions.filter(s => s.projectPath.includes(projectPath));
  }

  /**
   * Get mock analytics data for dashboard
   */
  getAnalyticsData() {
    const now = new Date();

    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalSessions = 0;
    let totalDuration = 0;

    // If no sessions, return default mock data
    if (this.sessions.length === 0) {
      const activityByDay: { date: string; count: number }[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        activityByDay.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 20),
        });
      }
      return {
        totalSessions: 0,
        totalCostUsd: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheCreationTokens: 0,
        totalDurationSeconds: 0,
        averageCostPerSession: 0,
        averageDurationSeconds: 0,
        activityByDay: activityByDay.reverse(),
        modelUsage: {},
        topProjects: [],
        toolUsage: {},
      };
    }

    const activityByDay: { date: string; count: number }[] = [];
    const modelUsage: Record<string, number> = {};
    const topProjects: Array<{ projectPath: string; sessionCount: number; totalCost: number }> = [];
    const toolUsage: Record<string, number> = {};

    // Generate 30 days of activity data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      activityByDay.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20),
      });
    }

    // Calculate totals from sessions
    for (const session of this.sessions) {
      if (session.stats) {
        totalCost += session.stats.estimatedCostUsd;
        totalInputTokens += session.stats.totalInputTokens;
        totalOutputTokens += session.stats.totalOutputTokens;
        totalCacheReadTokens += session.stats.totalCacheReadTokens || 0;
        totalCacheCreationTokens += session.stats.totalCacheCreationTokens || 0;
        totalSessions++;
        totalDuration += Math.floor(Math.random() * 3600); // Mock duration

        modelUsage['sonnet'] = (modelUsage['sonnet'] || 0) + session.stats.totalInputTokens + session.stats.totalOutputTokens;
      }
    }

    // Build top projects from sessions
    const projectMap = new Map<string, { count: number; cost: number }>();
    for (const session of this.sessions) {
      const projectName = session.projectPath.split('/').pop() || 'Unknown';
      const existing = projectMap.get(projectName) || { count: 0, cost: 0 };
      projectMap.set(projectName, {
        count: existing.count + 1,
          cost: existing.cost + (session.stats?.estimatedCostUsd || 0),
      });
    }
    for (const [projectPath, data] of projectMap) {
      topProjects.push({ projectPath, sessionCount: data.count, totalCost: data.cost });
    }

    // Calculate averages
    const averageCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
    const averageDurationSeconds = totalSessions > 0 ? totalDuration / totalSessions : 0;

    return {
      totalSessions,
      totalCostUsd: Math.round(totalCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheCreationTokens,
      totalDurationSeconds: totalDuration,
      averageCostPerSession: Math.round(averageCostPerSession * 100) / 100,
      averageDurationSeconds: Math.round(averageDurationSeconds),
      activityByDay: activityByDay.reverse(),
      modelUsage,
      topProjects: topProjects.slice(0, 10),
      toolUsage,
    };
  }
}

export const mockDataService = new MockDataService();
