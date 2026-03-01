import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface OfficeAgentInfo {
  id: number;
  sessionId: string;
  projectDir: string;
  jsonlFile: string;
  isActive: boolean;
  lastModified: Date;
}

export interface AgentContext {
  sessionId: string;
  projectDir: string;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tools?: ToolCall[];
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

const CLAUDE_DIR = path.join(process.env.HOME || "", ".claude");
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");

class PixelOfficeService {
  private nextId = 1;

  /**
   * 将真实路径转换为编码的目录名
   */
  private encodeDirName(realPath: string): string {
    return realPath.replace(/\//g, "-");
  }

  /**
   * 根据项目目录获取所有会话
   */
  async getAgentsByProject(projectDir: string): Promise<OfficeAgentInfo[]> {
    const encoded = this.encodeDirName(projectDir);
    const projectPath = path.join(PROJECTS_DIR, encoded);

    if (!fs.existsSync(projectPath)) {
      return [];
    }

    const agents: OfficeAgentInfo[] = [];
    try {
      const files = fs.readdirSync(projectPath);
      for (const file of files) {
        if (!file.endsWith(".jsonl") || file.startsWith("agent-")) continue;

        const sessionId = file.replace(".jsonl", "");
        const filePath = path.join(projectPath, file);
        const stat = fs.statSync(filePath);

        agents.push({
          id: this.nextId++,
          sessionId,
          projectDir,
          jsonlFile: filePath,
          isActive: false,
          lastModified: stat.mtime,
        });
      }
    } catch {
      // 读取失败
    }

    agents.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return agents.slice(0, 20);
  }

  /**
   * 获取会话的对话上下文（从 JSONL 文件解析）
   */
  async getAgentContext(
    projectDir: string,
    sessionId: string,
  ): Promise<AgentContext | null> {
    const encoded = this.encodeDirName(projectDir);
    const jsonlPath = path.join(PROJECTS_DIR, encoded, `${sessionId}.jsonl`);

    if (!fs.existsSync(jsonlPath)) {
      return null;
    }

    const messages: ConversationMessage[] = [];
    try {
      const content = fs.readFileSync(jsonlPath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type !== "user" && entry.type !== "assistant") continue;

          const msg = entry.message;
          if (!msg) continue;

          // 提取文本内容
          let text = "";
          const tools: ToolCall[] = [];

          if (typeof msg.content === "string") {
            text = msg.content;
          } else if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === "text") {
                text += block.text;
              } else if (block.type === "tool_use") {
                tools.push({
                  name: block.name,
                  input: block.input || {},
                });
              }
            }
          }

          if (!text && tools.length === 0) continue;

          messages.push({
            role: entry.type as "user" | "assistant",
            content: text,
            timestamp: new Date(entry.timestamp),
            tools: tools.length > 0 ? tools : undefined,
          });
        } catch {
          // 跳过无效行
        }
      }
    } catch {
      return null;
    }

    return { sessionId, projectDir, messages };
  }

  /**
   * 在项目目录中打开终端并启动 claude
   * @param projectDir 项目目录
   * @param sessionId 可选，要恢复的会话ID，如果不提供则启动新会话
   */
  async joinTerminal(projectDir: string, sessionId?: string): Promise<void> {
    const cdCmd = process.platform === "darwin" ? `cd "${projectDir.replace(/"/g, '\\"')}"` : `cd "${projectDir}"`;

    let claudeCmd = "claude";
    if (sessionId) {
      claudeCmd += ` --resume ${sessionId}`;
    }

    const fullCmd = `${cdCmd} && ${claudeCmd}`;

    if (process.platform === "darwin") {
      await execAsync(
        `osascript -e 'tell application "Terminal" to do script "${fullCmd.replace(/"/g, '\\"')}"'`,
      );
    } else if (process.platform === "win32") {
      await execAsync(`start cmd /k "${fullCmd}"`);
    } else {
      await execAsync(
        `x-terminal-emulator -e "${fullCmd}"`,
      );
    }
  }

  /**
   * 删除会话（删除 JSONL 文件）
   */
  async deleteAgent(projectDir: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[PixelOfficeService] deleteAgent called: projectDir=${projectDir}, sessionId=${sessionId}`);

    const encoded = this.encodeDirName(projectDir);
    const jsonlPath = path.join(PROJECTS_DIR, encoded, `${sessionId}.jsonl`);

    console.log(`[PixelOfficeService] Trying to delete: ${jsonlPath}`);
    console.log(`[PixelOfficeService] File exists: ${fs.existsSync(jsonlPath)}`);

    if (!fs.existsSync(jsonlPath)) {
      console.log(`[PixelOfficeService] File does not exist, returning error`);
      return { success: false, error: "会话文件不存在" };
    }

    try {
      fs.unlinkSync(jsonlPath);
      console.log(`[PixelOfficeService] Successfully deleted file`);
      return { success: true };
    } catch (e) {
      console.log(`[PixelOfficeService] Delete failed: ${e}`);
      return { success: false, error: `删除失败: ${e}` };
    }
  }

  /**
   * 批量删除会话
   */
  async deleteAgents(projectDir: string, sessionIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    console.log(`[PixelOfficeService] deleteAgents called: projectDir=${projectDir}, count=${sessionIds.length}`);

    const encoded = this.encodeDirName(projectDir);
    const projectPath = path.join(PROJECTS_DIR, encoded);

    if (!fs.existsSync(projectPath)) {
      return { success: false, deletedCount: 0, errors: ["项目目录不存在"] };
    }

    const errors: string[] = [];
    let deletedCount = 0;

    for (const sessionId of sessionIds) {
      const jsonlPath = path.join(projectPath, `${sessionId}.jsonl`);
      try {
        if (fs.existsSync(jsonlPath)) {
          fs.unlinkSync(jsonlPath);
          deletedCount++;
        }
      } catch (e) {
        errors.push(`删除 ${sessionId} 失败: ${e}`);
      }
    }

    console.log(`[PixelOfficeService] Deleted ${deletedCount} files, ${errors.length} errors`);
    return { success: errors.length === 0, deletedCount, errors };
  }

  /**
   * 删除项目（删除项目目录下的所有会话文件）
   */
  async deleteProject(projectDir: string): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
    console.log(`[PixelOfficeService] deleteProject called: projectDir=${projectDir}`);

    const encoded = this.encodeDirName(projectDir);
    const projectPath = path.join(PROJECTS_DIR, encoded);

    if (!fs.existsSync(projectPath)) {
      console.log(`[PixelOfficeService] Project directory does not exist`);
      return { success: false, error: "项目目录不存在" };
    }

    try {
      const files = fs.readdirSync(projectPath);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));
      let deletedCount = 0;

      for (const file of jsonlFiles) {
        const filePath = path.join(projectPath, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (e) {
          console.log(`[PixelOfficeService] Failed to delete ${file}: ${e}`);
        }
      }

      console.log(`[PixelOfficeService] Successfully deleted ${deletedCount} files`);
      return { success: true, deletedCount };
    } catch (e) {
      console.log(`[PixelOfficeService] Delete project failed: ${e}`);
      return { success: false, error: `删除失败: ${e}` };
    }
  }
}

export const pixelOfficeService = new PixelOfficeService();