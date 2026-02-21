import {
  readFile,
  writeFile,
  readdir,
  stat,
  mkdir,
  unlink,
  rename,
  copyFile,
  readlink,
  symlink,
  realpath,
} from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export class FileSystemService {
  async readFile(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  async writeFileAtomic(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const tmp = join(tmpdir(), `csam-${randomUUID()}.tmp`);
    await writeFile(tmp, content, "utf-8");
    await rename(tmp, path);
  }

  async readJSON<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content);
  }

  async writeJSON(path: string, data: unknown): Promise<void> {
    await this.writeFileAtomic(path, JSON.stringify(data, null, 2) + "\n");
  }

  async listFiles(dir: string, ext?: string): Promise<string[]> {
    if (!existsSync(dir)) return [];
    const entries = await readdir(dir, { withFileTypes: true });
    let files = entries.filter((e) => e.isFile()).map((e) => e.name);
    if (ext) files = files.filter((f) => f.endsWith(ext));
    return files;
  }

  async listDirs(dir: string): Promise<string[]> {
    if (!existsSync(dir)) return [];
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  async exists(path: string): Promise<boolean> {
    return existsSync(path);
  }

  async deleteFile(path: string): Promise<void> {
    await unlink(path);
  }

  async ensureDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  async getFileMtime(path: string): Promise<Date> {
    const s = await stat(path);
    return s.mtime;
  }

  async copyDirectory(
    src: string,
    dest: string,
    copiedPaths = new Set<string>(),
  ): Promise<void> {
    const resolvedDest = resolve(dest);
    const realSrc = await realpath(src).catch(() => resolve(src));

    if (copiedPaths.has(realSrc)) {
      return;
    }
    copiedPaths.add(realSrc);

    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      // Skip if this entry IS the destination (prevents self-copy loop)
      const resolvedSrcPath = resolve(srcPath);
      if (
        resolvedSrcPath === resolvedDest ||
        resolvedDest.startsWith(resolvedSrcPath + "/")
      ) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        const linkTarget = await readlink(srcPath);
        await symlink(linkTarget, destPath);
      } else if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, copiedPaths);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  async readDirectoryTree(
    dir: string,
    maxDepth: number = 3,
  ): Promise<FileNode[]> {
    if (!existsSync(dir)) return [];

    const entries = await readdir(dir, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // Skip hidden files

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const node: FileNode = {
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children: [],
        };

        if (maxDepth > 1) {
          node.children = await this.readDirectoryTree(fullPath, maxDepth - 1);
        }

        nodes.push(node);
      } else {
        nodes.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false,
        });
      }
    }

    // Sort: directories first, then files, alphabetically
    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}

export const fsService = new FileSystemService();
