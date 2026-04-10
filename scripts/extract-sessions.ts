import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const projectsDir = path.join(os.homedir(), '.claude', 'projects');
const outputDir = path.join(__dirname, '../src/data/mock');

interface SessionInfo {
  project: string;
  file: string;
  lines: number;
  path: string;
}

const sessions: SessionInfo[] = [];

// 扫描所有项目目录
const projectDirs = fs.readdirSync(projectsDir);
for (const projectDir of projectDirs) {
  const projectPath = path.join(projectsDir, projectDir);
  if (!fs.statSync(projectPath).isDirectory()) continue;

  const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
  for (const file of files) {
    const filePath = path.join(projectPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length;
    sessions.push({ project: projectDir, file, lines, path: filePath });
  }
}

// 按行数排序，筛选行数 >= 100 的，然后随机选择
const validSessions = sessions.filter(s => s.lines >= 100).sort(() => Math.random() - 0.5);

// 选择不同项目的会话，最多 30 个
const selected: SessionInfo[] = [];
const seenProjects = new Set<string>();
for (const s of validSessions) {
  if (selected.length >= 30) break;
  if (!seenProjects.has(s.project)) {
    seenProjects.add(s.project);
    selected.push(s);
  }
}

console.log(`Selected ${selected.length} sessions from ${seenProjects.size} projects:`);
for (const s of selected) {
  console.log(`  ${s.project}/${s.file}: ${s.lines} lines`);
}

// 创建输出目录
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, 'sessions'), { recursive: true });

// 复制会话文件
for (const s of selected) {
  const destPath = path.join(outputDir, 'sessions', `${s.project}-${s.file}`);
  fs.copyFileSync(s.path, destPath);
}

console.log(`Copied sessions to ${outputDir}/sessions/`);