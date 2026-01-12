#!/usr/bin/env node
/**
 * SIMPLEST possible test suite for brain-analogous memory
 * No test frameworks, no over-engineering - just basic assertions
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// Test counter
let tests = 0;
let passed = 0;

function assert(condition, message) {
  tests++;
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    console.log(`✗ ${message}`);
  }
}

// Simple test runner
async function runTests() {
  console.log('🧠 Testing SIMPLEST brain-analogous memory...\n');
  
  // Clean up before tests
  try {
    await fs.rm('./memory', { recursive: true, force: true });
  } catch {}

  // Import our memory functions (will create them next)
  const { readMemory, writeMemory, listMemory } = await import('./memory.js');

  // Test 1: Write memory creates file
  console.log('Test 1: Write memory');
  await writeMemory('test-note', 'Hello memory!');
  const exists = await fs.access('./memory/test-note.md').then(() => true).catch(() => false);
  assert(exists, 'writeMemory creates file');

  // Test 2: Read memory returns content
  console.log('\nTest 2: Read memory');
  const content = await readMemory('test-note');
  assert(content === 'Hello memory!', 'readMemory returns content');

  // Test 3: List memory finds files
  console.log('\nTest 3: List memory');
  await writeMemory('people/john', 'John Doe info');
  await writeMemory('projects/website', 'Website project');
  const list = await listMemory();
  assert(list.includes('test-note'), 'listMemory finds root files');
  assert(list.includes('people/john'), 'listMemory finds nested files');
  assert(list.includes('projects/website'), 'listMemory finds project files');

  // Test 4: Brain-analogous organization
  console.log('\nTest 4: Brain-analogous organization');
  const peopleExists = await fs.access('./memory/people/john.md').then(() => true).catch(() => false);
  const projectsExists = await fs.access('./memory/projects/website.md').then(() => true).catch(() => false);
  assert(peopleExists, 'People organized in people/ directory');
  assert(projectsExists, 'Projects organized in projects/ directory');

  // Results
  console.log(`\n📊 Results: ${passed}/${tests} tests passed`);
  if (passed === tests) {
    console.log('🎉 All tests passed! Brain-analogous memory works!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(console.error);