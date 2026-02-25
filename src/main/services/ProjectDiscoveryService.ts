import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ProjectInfo {
  projectDir: string;
  projectName: string;
  agentCount: number;
  activeCount: number;
  lastActivity: Date;
  sessions: ProjectSession[];
}

export interface ProjectSession {
  sessionId: string;
  projectDir: string;
  jsonlFile: string;
  isActive: boolean;
  lastModified: Date;
}

export interface ClaudeProcess {
  pid: number;
  cwd: string;
}

const CLAUDE_DIR = path.join(process.env.HOME || "", ".claude");
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");

class ProjectDiscoveryService {
  /**
   * 将编码的目录名转换为真实路径
   * e.g. "-Users-yangsmac-Desktop-Slack" → "/Users/yangsmac/Desktop/Slack"
   */
  private decodeDirName(encoded: string): string {
    return encoded.replace(/^-/, "/").replace(/-/g, "/");
  }

  /**
   * 将真实路径转换为编码的目录名
   * e.g. "/Users/yangsmac/Desktop/Slack" → "-Users-yangsmac-Desktop-Slack"
   */
  private encodeDirName(realPath: string): string {
    return realPath.replace(/\//g, "-");
  }

  /**
   * 获取所有正在运行的 Claude Code 进程及其工作目录
   */
  async getRunningClaudeProcesses(): Promise<ClaudeProcess[]> {
    const processes: ClaudeProcess[] = [];
    try {
      const { stdout } = await execAsync("ps -ax -o pid,args");
      const lines = stdout.split("\n");

      // 筛选出纯 claude 命令（排除 Electron、node 等子进程）
      const claudePids: number[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^(\d+)\s+(claude(?:\s|$))/);
        if (match) {
          claudePids.push(parseInt(match[1], 10));
        }
      }

      // 通过 lsof 获取每个进程的 cwd
      for (const pid of claudePids) {
        try {
          const { stdout: lsofOut } = await execAsync(
            `lsof -p ${pid} -Fn 2>/dev/null | grep '^n/' | head -1`,
          );
          const cwd = lsofOut.trim().replace(/^n/, "");
          if (cwd) {
            processes.push({ pid, cwd });
          }
        } catch {
          // 进程可能已退出
        }
      }
    } catch {
      // ps 命令失败
    }
    return processes;
  }

  /**
   * 获取所有项目信息（混合方式：扫描会话目录 + 匹配活跃进程）
   */
  async getProjects(): Promise<ProjectInfo[]> {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return [];
    }

    // 1. 获取活跃进程
    const runningProcesses = await this.getRunningClaudeProcesses();
    const activeCwds = new Set(runningProcesses.map((p) => p.cwd));

    // 2. 扫描 ~/.claude/projects/ 下的所有项目目录
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    const projects: ProjectInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectDir = this.decodeDirName(entry.name);
      const projectPath = path.join(PROJECTS_DIR, entry.name);
      const sessions = this.getSessionsForProject(projectPath, projectDir);

      if (sessions.length === 0) continue;

      // 标记活跃会话
      const isProjectActive = activeCwds.has(projectDir);
      const activeCount = isProjectActive
        ? runningProcesses.filter((p) => p.cwd === projectDir).length
        : 0;

      // 最近活动时间取所有会话中最新的
      const lastActivity = sessions.reduce(
        (latest, s) =>
          s.lastModified > latest ? s.lastModified : latest,
        new Date(0),
      );

      projects.push({
        projectDir,
        projectName: path.basename(projectDir),
        agentCount: sessions.length,
        activeCount,
        lastActivity,
        sessions,
      });
    }

    // 按活跃数降序，再按最近活动时间降序
    projects.sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

    return projects;
  }

  /**
   * 获取某个项目目录下的所有会话（只取主会话，排除 agent-*.jsonl）
   */
  private getSessionsForProject(
    projectPath: string,
    projectDir: string,
  ): ProjectSession[] {
    const sessions: ProjectSession[] = [];
    try {
      const files = fs.readdirSync(projectPath);
      for (const file of files) {
        // 只取 UUID.jsonl，排除 agent-*.jsonl
        if (!file.endsWith(".jsonl") || file.startsWith("agent-")) continue;

        const sessionId = file.replace(".jsonl", "");
        const filePath = path.join(projectPath, file);
        const stat = fs.statSync(filePath);

        sessions.push({
          sessionId,
          projectDir,
          jsonlFile: filePath,
          isActive: false, // 后续由调用方根据进程匹配更新
          lastModified: stat.mtime,
        });
      }
    } catch {
      // 读取失败
    }

    // 按最近修改时间降序，只返回最近 20 个会话
    sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return sessions.slice(0, 20);
  }
}

export const projectDiscoveryService = new ProjectDiscoveryService();