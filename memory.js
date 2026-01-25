/**
 * SIMPLEST possible brain-analogous memory functions
 * No over-engineering, no complex validation - just core functionality
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';

const MEMORY_DIR = process.env.COGNITIVE_MEMORY_PATH;

if (!MEMORY_DIR) {
  throw new Error('COGNITIVE_MEMORY_PATH environment variable is required but not set');
}

// Validate path stays within memory directory (prevent path traversal)
function validatePath(userPath) {
  const fullPath = resolve(join(MEMORY_DIR, userPath + '.md'));
  const normalizedMemoryDir = resolve(MEMORY_DIR);

  if (!fullPath.startsWith(normalizedMemoryDir + '/') && fullPath !== normalizedMemoryDir) {
    throw new Error(`Access denied: path '${userPath}' escapes memory directory`);
  }

  return fullPath;
}

// Write memory to file
export async function writeMemory(path, content) {
  const fullPath = validatePath(path);
  await fs.mkdir(dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

// Read memory from file
export async function readMemory(path) {
  const fullPath = validatePath(path);
  return await fs.readFile(fullPath, 'utf-8');
}

// List all memory files recursively
export async function listMemory(dir = MEMORY_DIR, prefix = '') {
  // Validate dir is within MEMORY_DIR
  const normalizedDir = resolve(dir);
  const normalizedMemoryDir = resolve(MEMORY_DIR);

  if (!normalizedDir.startsWith(normalizedMemoryDir)) {
    throw new Error('Access denied: directory escapes memory directory');
  }

  const files = [];
  const items = await fs.readdir(dir).catch(() => []);

  for (const item of items) {
    const itemPath = join(dir, item);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      const subFiles = await listMemory(itemPath, prefix + item + '/');
      files.push(...subFiles);
    } else if (item.endsWith('.md')) {
      files.push(prefix + item.replace('.md', ''));
    }
  }

  return files;
}