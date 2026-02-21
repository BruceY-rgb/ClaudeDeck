import { execa } from "execa";
import fs from "fs/promises";
import path from "path";

export class GitService {
  async clone(url: string, targetDir: string): Promise<void> {
    // Ensure parent directory exists
    const parentDir = path.dirname(targetDir);
    await fs.mkdir(parentDir, { recursive: true });

    // Check if directory already exists
    try {
      await fs.access(targetDir);
      // Directory exists, do nothing (already cloned)
      return;
    } catch {
      // Directory doesn't exist, proceed with clone
    }

    await execa("git", ["clone", "--depth", "1", url, targetDir]);
  }

  async pull(repoDir: string): Promise<void> {
    // Get current branch and pull
    const { stdout } = await execa("git", ["branch", "--show-current"], {
      cwd: repoDir,
    });
    const branch = stdout.trim() || "main";

    await execa("git", ["pull", "origin", branch], { cwd: repoDir });
  }

  async getLastCommitSha(repoDir: string): Promise<string> {
    const { stdout } = await execa("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
    });
    return stdout.trim().substring(0, 7);
  }

  async fetch(repoDir: string): Promise<void> {
    await execa("git", ["fetch", "--all"], { cwd: repoDir });
  }
}

export const gitService = new GitService();
