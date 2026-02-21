import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import os from 'os'

interface CLIResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number | null
}

interface StreamOptions {
  agentName?: string
  skillName?: string
  prompt: string
  onOutput?: (data: string, type: 'stdout' | 'stderr') => void
  onClose?: (code: number | null) => void
}

let currentProcess: ChildProcess | null = null

export class CLIService {
  private getClaudeCommand(): string {
    return process.platform === 'win32' ? 'claude.cmd' : 'claude'
  }

  /**
   * Run a Claude CLI command and return the result
   */
  async run(command: string[], input?: string): Promise<CLIResult> {
    return new Promise((resolve) => {
      const args = command.slice(1) // Remove 'claude' from args
      const proc = spawn(this.getClaudeCommand(), args, {
        stdio: input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, CLAUDE_DBG: undefined }
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          stdout,
          stderr: err.message,
          exitCode: null
        })
      })

      if (input) {
        proc.stdin?.write(input)
        proc.stdin?.end()
      }
    })
  }

  /**
   * Run an agent with a prompt and stream output to a window
   */
  async runAgent(agentName: string, prompt: string, mainWindow: BrowserWindow): Promise<void> {
    await this.kill()

    const proc = spawn(this.getClaudeCommand(), ['-a', agentName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_DBG: undefined }
    })

    currentProcess = proc

    proc.stdout?.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'stdout', data: text })
    })

    proc.stderr?.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'stderr', data: text })
    })

    proc.on('close', (code) => {
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'close', code })
      currentProcess = null
    })

    // Send the prompt after a short delay to ensure the process is ready
    setTimeout(() => {
      if (proc.stdin) {
        proc.stdin.write(prompt + '\n')
        proc.stdin.end()
      }
    }, 500)
  }

  /**
   * Test a skill with a prompt and stream output to a window
   */
  async testSkill(skillName: string, prompt: string, mainWindow: BrowserWindow): Promise<void> {
    await this.kill()

    const proc = spawn(this.getClaudeCommand(), ['-s', skillName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_DBG: undefined }
    })

    currentProcess = proc

    proc.stdout?.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'stdout', data: text })
    })

    proc.stderr?.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'stderr', data: text })
    })

    proc.on('close', (code) => {
      mainWindow.webContents.send(IPC.CLI_OUTPUT, { type: 'close', code })
      currentProcess = null
    })

    // Send the prompt after a short delay
    setTimeout(() => {
      if (proc.stdin) {
        proc.stdin.write(prompt + '\n')
        proc.stdin.end()
      }
    }, 500)
  }

  /**
   * Kill the current CLI process
   */
  async kill(): Promise<void> {
    if (currentProcess) {
      currentProcess.kill('SIGTERM')
      currentProcess = null
    }
  }

  /**
   * Check if Claude CLI is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.run([this.getClaudeCommand(), '--version'])
      return result.success || result.stdout.includes('Claude')
    } catch {
      return false
    }
  }
}

export const cliService = new CLIService()
