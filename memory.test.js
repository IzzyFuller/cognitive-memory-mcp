/**
 * Jest tests for brain-analogous memory functions
 * Converted from custom test framework to Jest
 */

import { promises as fs } from 'fs';
import { writeMemory, readMemory, listMemory } from './memory.js';

describe('Brain-analogous Memory System', () => {
  // Clean up before and after tests
  beforeEach(async () => {
    try {
      await fs.rm('./memory', { recursive: true, force: true });
    } catch {
      // Directory might not exist, ignore error
    }
  });

  afterAll(async () => {
    try {
      await fs.rm('./memory', { recursive: true, force: true });
    } catch {
      // Directory might not exist, ignore error
    }
  });

  describe('writeMemory', () => {
    test('creates file when writing memory', async () => {
      await writeMemory('test-note', 'Hello memory!');
      
      const exists = await fs.access('./memory/test-note.md')
        .then(() => true)
        .catch(() => false);
      
      expect(exists).toBe(true);
    });

    test('creates nested directories when needed', async () => {
      await writeMemory('people/john', 'John Doe info');
      
      const exists = await fs.access('./memory/people/john.md')
        .then(() => true)
        .catch(() => false);
      
      expect(exists).toBe(true);
    });
  });

  describe('readMemory', () => {
    test('returns content that was written', async () => {
      await writeMemory('test-note', 'Hello memory!');
      const content = await readMemory('test-note');
      
      expect(content).toBe('Hello memory!');
    });

    test('handles content with special characters', async () => {
      const specialContent = 'Hello 🧠! This has émojis and açcents.';
      await writeMemory('special-test', specialContent);
      const content = await readMemory('special-test');
      
      expect(content).toBe(specialContent);
    });
  });

  describe('listMemory', () => {
    test('finds files in root directory', async () => {
      await writeMemory('test-note', 'Hello memory!');
      const list = await listMemory();
      
      expect(list).toContain('test-note');
    });

    test('finds files in nested directories', async () => {
      await writeMemory('people/john', 'John Doe info');
      await writeMemory('projects/website', 'Website project');
      const list = await listMemory();
      
      expect(list).toContain('people/john');
      expect(list).toContain('projects/website');
    });

    test('returns empty array when no files exist', async () => {
      const list = await listMemory();
      
      expect(list).toEqual([]);
    });
  });

  describe('Brain-analogous Organization', () => {
    test('organizes people in people/ directory', async () => {
      await writeMemory('people/john', 'John Doe info');
      
      const exists = await fs.access('./memory/people/john.md')
        .then(() => true)
        .catch(() => false);
      
      expect(exists).toBe(true);
    });

    test('organizes projects in projects/ directory', async () => {
      await writeMemory('projects/website', 'Website project');
      
      const exists = await fs.access('./memory/projects/website.md')
        .then(() => true)
        .catch(() => false);
      
      expect(exists).toBe(true);
    });

    test('maintains hierarchical structure', async () => {
      await writeMemory('test-note', 'Root level note');
      await writeMemory('people/john', 'John Doe info');
      await writeMemory('projects/website', 'Website project');
      
      const list = await listMemory();
      
      expect(list).toHaveLength(3);
      expect(list).toContain('test-note');
      expect(list).toContain('people/john');
      expect(list).toContain('projects/website');
    });
  });
});