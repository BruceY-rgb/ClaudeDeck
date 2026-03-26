import { join, dirname } from 'path'
import { homedir } from 'os'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, lstatSync, readlinkSync, symlinkSync, readFileSync, writeFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'

const CLAUDE_DIR = join(homedir(), '.claude')
const CLAUDE_JSON_FILE = join(homedir(), '.claude.json')
const INIT_MARKER = join(CLAUDE_DIR, '.hima-initialized')

/**
 * DemoDataService seeds ~/.claude with bundled demo data on first launch.
 *
 * It copies agents, skills, plans, plugins, projects, settings and .claude.json
 * from the packaged resources/demo-data directory, then rewrites any macOS-style
 * paths inside JSON config files so they point to the current user's home directory.
 */
export class DemoDataService {
  private demoDataRoot: string

  constructor() {
    if (is.dev) {
      this.demoDataRoot = join(__dirname, '../../resources/demo-data')
    } else {
      this.demoDataRoot = join(process.resourcesPath, 'resources/demo-data')
    }
  }

  /**
   * Returns true if demo data has already been initialized.
   */
  isInitialized(): boolean {
    return existsSync(INIT_MARKER)
  }

  /**
   * Main entry point: seed demo data if not yet initialized.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized()) {
      console.log('[DemoData] Already initialized, skipping.')
      return false
    }

    if (!existsSync(this.demoDataRoot)) {
      console.log('[DemoData] Demo data directory not found, skipping.')
      return false
    }

    console.log('[DemoData] First launch detected – seeding demo data...')

    try {
      // Ensure ~/.claude exists
      mkdirSync(CLAUDE_DIR, { recursive: true })

      // Copy .claude directory contents
      const claudeSrc = join(this.demoDataRoot, '.claude')
      if (existsSync(claudeSrc)) {
        this.copyDirRecursive(claudeSrc, CLAUDE_DIR)
      }

      // Copy .claude.json to home directory
      const claudeJsonSrc = join(this.demoDataRoot, '.claude.json')
      if (existsSync(claudeJsonSrc) && !existsSync(CLAUDE_JSON_FILE)) {
        copyFileSync(claudeJsonSrc, CLAUDE_JSON_FILE)
      }

      // Rewrite paths in JSON config files
      this.rewritePaths()

      // Write initialization marker
      writeFileSync(INIT_MARKER, JSON.stringify({
        initializedAt: new Date().toISOString(),
        version: '2.0.1'
      }))

      console.log('[DemoData] Demo data seeded successfully.')
      return true
    } catch (err) {
      console.error('[DemoData] Failed to seed demo data:', err)
      return false
    }
  }

  /**
   * Recursively copy a directory, skipping files that already exist at the destination.
   */
  private copyDirRecursive(src: string, dest: string): void {
    mkdirSync(dest, { recursive: true })

    const entries = readdirSync(src)
    for (const entry of entries) {
      // Skip macOS metadata files
      if (entry.startsWith('._') || entry === '.DS_Store') continue

      const srcPath = join(src, entry)
      const destPath = join(dest, entry)

      try {
        // Use lstatSync to avoid following broken symlinks
        const lstat = lstatSync(srcPath)

        if (lstat.isSymbolicLink()) {
          // Recreate symlinks as-is (relative links will resolve in the new location)
          if (!existsSync(destPath)) {
            try {
              const linkTarget = readlinkSync(srcPath)
              symlinkSync(linkTarget, destPath)
            } catch {
              // Skip broken or unsupported symlinks silently
              console.warn(`[DemoData] Skipped symlink: ${srcPath}`)
            }
          }
        } else if (lstat.isDirectory()) {
          this.copyDirRecursive(srcPath, destPath)
        } else {
          // Only copy if destination doesn't exist (don't overwrite user data)
          if (!existsSync(destPath)) {
            mkdirSync(dirname(destPath), { recursive: true })
            copyFileSync(srcPath, destPath)
          }
        }
      } catch (err) {
        // Skip entries that cannot be stat'd (e.g. broken symlinks on some OS)
        console.warn(`[DemoData] Skipped entry: ${srcPath}`, err)
      }
    }
  }

  /**
   * Rewrite macOS-style paths in JSON config files to match the current system.
   *
   * The demo data was exported from /Users/yangsmac, so we replace that prefix
   * with the current user's home directory.
   */
  private rewritePaths(): void {
    const home = homedir()
    const oldPrefix = '/Users/yangsmac'

    // List of JSON files that may contain path references
    const jsonFiles = [
      join(CLAUDE_DIR, 'plugins', 'csam_installed_plugins.json'),
      join(CLAUDE_DIR, 'plugins', 'installed_plugins.json'),
      join(CLAUDE_DIR, 'plugins', 'csam_marketplaces.json'),
      join(CLAUDE_DIR, 'plugins', 'known_marketplaces.json'),
      join(CLAUDE_DIR, 'settings.json')
    ]

    for (const filePath of jsonFiles) {
      if (!existsSync(filePath)) continue
      try {
        let content = readFileSync(filePath, 'utf-8')
        if (content.includes(oldPrefix)) {
          // Replace all occurrences of the old macOS path with current home
          // On Windows, paths use backslash, but JSON stores forward slashes
          const newPrefix = home.replace(/\\/g, '/')
          content = content.replace(new RegExp(this.escapeRegex(oldPrefix), 'g'), newPrefix)
          writeFileSync(filePath, content, 'utf-8')
          console.log(`[DemoData] Rewrote paths in ${filePath}`)
        }
      } catch (err) {
        console.warn(`[DemoData] Failed to rewrite paths in ${filePath}:`, err)
      }
    }

    // Also rewrite .claude.json if it exists
    if (existsSync(CLAUDE_JSON_FILE)) {
      try {
        let content = readFileSync(CLAUDE_JSON_FILE, 'utf-8')
        if (content.includes(oldPrefix)) {
          const newPrefix = home.replace(/\\/g, '/')
          content = content.replace(new RegExp(this.escapeRegex(oldPrefix), 'g'), newPrefix)
          writeFileSync(CLAUDE_JSON_FILE, content, 'utf-8')
          console.log('[DemoData] Rewrote paths in .claude.json')
        }
      } catch (err) {
        console.warn('[DemoData] Failed to rewrite .claude.json:', err)
      }
    }

    // Rewrite project directory names (they encode the original path)
    this.rewriteProjectDirs(home, oldPrefix)
  }

  /**
   * Rename project directories whose names encode the old macOS path.
   * e.g. "-Users-yangsmac-Desktop-Repo-Pulse" → "-C--Users-<user>-Desktop-Repo-Pulse" (Windows)
   *      or "-home-<user>-Desktop-Repo-Pulse" (Linux)
   */
  private rewriteProjectDirs(home: string, oldPrefix: string): void {
    const projectsDir = join(CLAUDE_DIR, 'projects')
    if (!existsSync(projectsDir)) return

    // Convert old prefix to the encoded form used in directory names
    // /Users/yangsmac → -Users-yangsmac
    const oldEncoded = oldPrefix.replace(/\//g, '-')
    // Current home → encoded form
    // e.g. C:\Users\bruce → -C--Users-bruce (Windows)
    // e.g. /home/ubuntu → -home-ubuntu (Linux)
    const newEncoded = home.replace(/\\/g, '-').replace(/:/g, '-').replace(/\//g, '-')

    try {
      const dirs = readdirSync(projectsDir)
      for (const dir of dirs) {
        if (dir.includes(oldEncoded.slice(1))) { // slice(1) to remove leading -
          const { renameSync } = require('fs')
          const newName = dir.replace(oldEncoded.slice(1), newEncoded.slice(1))
          if (newName !== dir) {
            const oldPath = join(projectsDir, dir)
            const newPath = join(projectsDir, newName)
            if (!existsSync(newPath)) {
              renameSync(oldPath, newPath)
              console.log(`[DemoData] Renamed project dir: ${dir} → ${newName}`)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[DemoData] Failed to rewrite project dirs:', err)
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

export const demoDataService = new DemoDataService()
