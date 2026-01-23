/**
 * Comprehensive tests for cognitive development MCP server
 * Tests MVP functionality for all 6 cognitive tools
 */

import { promises as fs } from 'fs';
import { CognitiveDevelopmentServer } from './src/cognitive-server.js';
import { writeMemory } from './memory.js';

describe('Cognitive Development MCP Server', () => {
  let cognitiveServer;

  // Clean up before and after tests
  beforeEach(async () => {
    try {
      await fs.rm('./memory', { recursive: true, force: true });
    } catch {
      // Directory might not exist, ignore error
    }
    
    cognitiveServer = new CognitiveDevelopmentServer();
  });

  afterAll(async () => {
    try {
      await fs.rm('./memory', { recursive: true, force: true });
    } catch {
      // Directory might not exist, ignore error
    }
  });

  describe('add_session_note tool', () => {
    test('adds context note to session memory', async () => {
      const result = await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Working on MCP server testing',
        importance: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('context note added to session');

      // Verify file was created with proper formatting
      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(sessionContent).toContain('# Current Session');
      expect(sessionContent).toContain('### CONTEXT - HIGH');
      expect(sessionContent).toContain('Working on MCP server testing');
    });

    test('adds insight note with medium importance default', async () => {
      const result = await cognitiveServer.addSessionNote({
        note_type: 'insight',
        content: 'TDD violation teaches importance of test-first approach'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('insight note added to session');

      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(sessionContent).toContain('### INSIGHT - MEDIUM');
      expect(sessionContent).toContain('TDD violation teaches importance');
    });

    test('adds decision note with low importance', async () => {
      const result = await cognitiveServer.addSessionNote({
        note_type: 'decision',
        content: 'Decided to test tool methods directly rather than full MCP protocol',
        importance: 'low'
      });

      expect(result.success).toBe(true);

      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(sessionContent).toContain('### DECISION - LOW');
    });

    test('appends multiple notes to same session', async () => {
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'First note'
      });

      await cognitiveServer.addSessionNote({
        note_type: 'insight',
        content: 'Second note'
      });

      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(sessionContent).toContain('First note');
      expect(sessionContent).toContain('Second note');
      expect(sessionContent).toContain('### CONTEXT - MEDIUM');
      expect(sessionContent).toContain('### INSIGHT - MEDIUM');
    });

    test('includes ISO timestamp in note formatting', async () => {
      const beforeTime = new Date().toISOString();
      
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Timestamp test note'
      });

      const afterTime = new Date().toISOString();
      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      
      // Extract timestamp from note content
      const timestampMatch = sessionContent.match(/\((.+)\)/);
      expect(timestampMatch).toBeTruthy();
      
      const noteTimestamp = timestampMatch[1];
      expect(noteTimestamp >= beforeTime).toBe(true);
      expect(noteTimestamp <= afterTime).toBe(true);
    });
  });

  describe('read_entity and write_entity tools', () => {
    test('writes entity to long-term memory', async () => {
      const result = await cognitiveServer.writeEntity({
        entity_path: 'people/john-doe',
        content: '# John Doe\n\nSoftware engineer with expertise in AI systems.'
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe('people/john-doe');

      // Verify file was created
      const exists = await fs.access('./memory/people/john-doe.md')
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    test('reads entity from long-term memory', async () => {
      const entityContent = '# MCP Servers Project\n\nBuilding cognitive development tools.';

      await cognitiveServer.writeEntity({
        entity_path: 'projects/mcp-servers',
        content: entityContent
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'projects/mcp-servers'
      });

      expect(result.path).toBe('projects/mcp-servers');
      expect(result.content).toBe(entityContent);
      expect(result.total_lines).toBe(3);
      expect(result.returned_lines).toBe(3);
    });

    test('writes to concepts directory for abstract knowledge', async () => {
      const result = await cognitiveServer.writeEntity({
        entity_path: 'concepts/archaeological-engineering',
        content: '# Archaeological Engineering\n\nMethodology for understanding existing systems.'
      });

      expect(result.success).toBe(true);

      // Verify concepts directory organization
      const exists = await fs.access('./memory/concepts/archaeological-engineering.md')
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    test('overwrites existing entity content', async () => {
      // Create initial entity
      await cognitiveServer.writeEntity({
        entity_path: 'people/jane-smith',
        content: 'Initial content'
      });

      // Overwrite with new content
      await cognitiveServer.writeEntity({
        entity_path: 'people/jane-smith',
        content: '# Jane Smith\n\nUpdated profile information.'
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'people/jane-smith'
      });

      expect(result.content).toBe('# Jane Smith\n\nUpdated profile information.');
      expect(result.content).not.toContain('Initial content');
    });

    test('throws error when reading non-existent entity', async () => {
      await expect(cognitiveServer.readEntity({
        entity_path: 'people/non-existent'
      })).rejects.toThrow();
    });

    test('returns line count metadata', async () => {
      const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'];
      await cognitiveServer.writeEntity({
        entity_path: 'test/line-count',
        content: lines.join('\n')
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'test/line-count'
      });

      expect(result.total_lines).toBe(5);
      expect(result.returned_lines).toBe(5);
    });

    test('offset skips first N lines', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await cognitiveServer.writeEntity({
        entity_path: 'test/offset-test',
        content: lines.join('\n')
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'test/offset-test',
        offset: 90
      });

      expect(result.total_lines).toBe(100);
      expect(result.returned_lines).toBe(10);
      expect(result.offset).toBe(90);
      expect(result.content).toContain('Line 91');
      expect(result.content).toContain('Line 100');
      expect(result.content).not.toContain('Line 90');
    });

    test('limit returns first N lines', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await cognitiveServer.writeEntity({
        entity_path: 'test/limit-test',
        content: lines.join('\n')
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'test/limit-test',
        limit: 5
      });

      expect(result.total_lines).toBe(100);
      expect(result.returned_lines).toBe(5);
      expect(result.offset).toBe(0);
      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 5');
      expect(result.content).not.toContain('Line 6');
    });

    test('offset and limit together return a slice', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await cognitiveServer.writeEntity({
        entity_path: 'test/slice-test',
        content: lines.join('\n')
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'test/slice-test',
        offset: 50,
        limit: 10
      });

      expect(result.total_lines).toBe(100);
      expect(result.returned_lines).toBe(10);
      expect(result.offset).toBe(50);
      expect(result.content).toContain('Line 51');
      expect(result.content).toContain('Line 60');
      expect(result.content).not.toContain('Line 50');
      expect(result.content).not.toContain('Line 61');
    });

    test('offset beyond file length returns empty', async () => {
      const lines = ['Line 1', 'Line 2', 'Line 3'];
      await cognitiveServer.writeEntity({
        entity_path: 'test/small-file',
        content: lines.join('\n')
      });

      const result = await cognitiveServer.readEntity({
        entity_path: 'test/small-file',
        offset: 100
      });

      expect(result.total_lines).toBe(3);
      expect(result.returned_lines).toBe(0);
    });
  });

  describe('list_entities tool', () => {
    beforeEach(async () => {
      // Set up test entities across different categories
      await cognitiveServer.writeEntity({
        entity_path: 'people/john-doe',
        content: 'John profile'
      });
      await cognitiveServer.writeEntity({
        entity_path: 'people/jane-smith',
        content: 'Jane profile'
      });
      await cognitiveServer.writeEntity({
        entity_path: 'projects/mcp-servers',
        content: 'MCP project'
      });
      await cognitiveServer.writeEntity({
        entity_path: 'concepts/learning',
        content: 'Learning concept'
      });
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Session note'
      });
    });

    test('lists all entities without filter', async () => {
      const result = await cognitiveServer.listEntities({ filter_prefix: '' });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('people/john-doe');
      expect(result).toContain('people/jane-smith');
      expect(result).toContain('projects/mcp-servers');
      expect(result).toContain('concepts/learning');
      expect(result).toContain('current_session');
      expect(result).toHaveLength(5);
    });

    test('filters entities by people/ prefix', async () => {
      const result = await cognitiveServer.listEntities({ filter_prefix: 'people/' });

      expect(result).toContain('people/john-doe');
      expect(result).toContain('people/jane-smith');
      expect(result).not.toContain('projects/mcp-servers');
      expect(result).not.toContain('concepts/learning');
      expect(result).toHaveLength(2);
    });

    test('filters entities by projects/ prefix', async () => {
      const result = await cognitiveServer.listEntities({ filter_prefix: 'projects/' });

      expect(result).toContain('projects/mcp-servers');
      expect(result).not.toContain('people/john-doe');
      expect(result).toHaveLength(1);
    });

    test('filters entities by concepts/ prefix', async () => {
      const result = await cognitiveServer.listEntities({ filter_prefix: 'concepts/' });

      expect(result).toContain('concepts/learning');
      expect(result).not.toContain('people/john-doe');
      expect(result).toHaveLength(1);
    });

    test('returns empty array for non-matching prefix', async () => {
      const result = await cognitiveServer.listEntities({ filter_prefix: 'nonexistent/' });

      expect(result).toEqual([]);
    });

    test('uses default empty filter when not provided', async () => {
      const result = await cognitiveServer.listEntities({});

      expect(result).toHaveLength(5); // All entities
    });
  });

  describe('synthesis_reflection dream journal tool', () => {
    test('appends daily reflection to dream journal', async () => {
      const keyInsights = [
        'TDD violation provides learning opportunity',
        'Direct method testing enables rapid validation',
        'Brain-analogous organization supports cognitive development'
      ];

      const result = await cognitiveServer.synthesisReflection({
        reflection_type: 'daily',
        key_insights: keyInsights,
        cognitive_growth: 'Improved understanding of test-first development benefits',
        future_focus: 'Implement TDD methodology for future cognitive tools'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('daily reflection saved to dream journal');

      // Verify dream journal was created
      const journalPath = './memory/dream_journal.md';

      const exists = await fs.access(journalPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const journalContent = await fs.readFile(journalPath, 'utf-8');
      expect(journalContent).toContain('# Dream Journal');
      expect(journalContent).toContain('# Daily Reflection');
      expect(journalContent).toContain('## Key Insights');
      expect(journalContent).toContain('- TDD violation provides learning opportunity');
      expect(journalContent).toContain('- Direct method testing enables rapid validation');
      expect(journalContent).toContain('- Brain-analogous organization supports cognitive development');
      expect(journalContent).toContain('## Cognitive Growth Observed');
      expect(journalContent).toContain('Improved understanding of test-first development');
      expect(journalContent).toContain('## Future Development Focus');
      expect(journalContent).toContain('Implement TDD methodology');
      expect(journalContent).toContain('*Generated via Dream Tool for meta-cognitive development*');
    });

    test('appends session reflection with minimal required fields', async () => {
      const result = await cognitiveServer.synthesisReflection({
        reflection_type: 'session',
        key_insights: ['MVP functionality validated successfully']
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('session reflection saved to dream journal');

      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(journalContent).toContain('# Session Reflection');
      expect(journalContent).toContain('- MVP functionality validated successfully');
      expect(journalContent).not.toContain('## Cognitive Growth Observed');
      expect(journalContent).not.toContain('## Future Development Focus');
    });

    test('appends project reflection with all optional fields', async () => {
      const result = await cognitiveServer.synthesisReflection({
        reflection_type: 'project',
        key_insights: [
          'Cognitive development tools enable meta-learning',
          'Brain-analogous patterns improve memory organization'
        ],
        cognitive_growth: 'Enhanced ability to structure cognitive workflows',
        future_focus: 'Integrate with custom_modes.yaml for mode development'
      });

      expect(result.success).toBe(true);

      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(journalContent).toContain('# Project Reflection');
      expect(journalContent).toContain('Enhanced ability to structure cognitive workflows');
      expect(journalContent).toContain('Integrate with custom_modes.yaml');
    });

    test('includes ISO timestamp in reflection header', async () => {
      const beforeTime = new Date().toISOString();

      await cognitiveServer.synthesisReflection({
        reflection_type: 'session',
        key_insights: ['Timestamp test reflection']
      });

      const afterTime = new Date().toISOString();
      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');

      // Extract timestamp from reflection header
      const timestampMatch = journalContent.match(/# Session Reflection - (.+)/);
      expect(timestampMatch).toBeTruthy();

      const reflectionTimestamp = timestampMatch[1];
      expect(reflectionTimestamp >= beforeTime).toBe(true);
      expect(reflectionTimestamp <= afterTime).toBe(true);
    });

    test('appends multiple reflections to same journal', async () => {
      await cognitiveServer.synthesisReflection({
        reflection_type: 'daily',
        key_insights: ['First reflection insight']
      });

      await cognitiveServer.synthesisReflection({
        reflection_type: 'session',
        key_insights: ['Second reflection insight']
      });

      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(journalContent).toContain('# Daily Reflection');
      expect(journalContent).toContain('# Session Reflection');
      expect(journalContent).toContain('First reflection insight');
      expect(journalContent).toContain('Second reflection insight');
    });

    test('rotates journal when size exceeds 1MiB threshold', async () => {
      // Create a large dream journal exceeding 1MiB
      const largeContent = '# Dream Journal\n' + 'x'.repeat(1048577); // Just over 1MiB
      await writeMemory('dream_journal', largeContent);

      const result = await cognitiveServer.synthesisReflection({
        reflection_type: 'daily',
        key_insights: ['Post-rotation insight']
      });

      expect(result.success).toBe(true);
      expect(result.rotated).toBe(true);
      expect(result.archived_to).toMatch(/dream_journal_\d{4}-\d{2}-\d{2}\.md/);

      // Verify archived file exists
      const today = new Date().toISOString().split('T')[0];
      const archivedPath = `./memory/dream_journal_${today}.md`;
      const archivedExists = await fs.access(archivedPath)
        .then(() => true)
        .catch(() => false);
      expect(archivedExists).toBe(true);

      // Verify new journal has pointer and new content
      const newJournalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(newJournalContent).toContain('Previous journal archived to');
      expect(newJournalContent).toContain('Post-rotation insight');
      expect(newJournalContent.length).toBeLessThan(largeContent.length);
    });

    test('includes context from context_anchors when available', async () => {
      // Create a context_anchors.md file
      const contextAnchors = `# Context Anchors

## Some Anchor
**Entity Path**: /home/user/memory/people/john

## Another Anchor
**Entity Path**: /home/user/memory/projects/mcp-server

## Third Anchor
**Entity Path**: /home/user/memory/concepts/learning
`;
      await writeMemory('context_anchors', contextAnchors);

      await cognitiveServer.synthesisReflection({
        reflection_type: 'daily',
        key_insights: ['Testing context integration']
      });

      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(journalContent).toContain('## Context from Anchors');
      expect(journalContent).toContain('Active entities: 3 referenced');
    });
  });

  describe('deep_learn tool', () => {
    test('creates multiple entities and resets session', async () => {
      const entities = [
        {
          path: 'concepts/test-pattern',
          content: '# Test Pattern\n\nA pattern discovered during testing.',
          anchor_summary: 'Testing pattern discovered'
        },
        {
          path: 'projects/test-project',
          content: '# Test Project\n\nProject for testing deep learn.',
          anchor_summary: 'Deep learn test project'
        }
      ];

      const result = await cognitiveServer.deepLearn({ entities });

      expect(result.success).toBe(true);
      expect(result.entities_created).toHaveLength(2);
      expect(result.entities_created).toContain('concepts/test-pattern');
      expect(result.entities_created).toContain('projects/test-project');
      expect(result.session_reset).toBe(true);
      expect(result.context_anchors_updated).toBe(true);

      // Verify entities were created
      const pattern = await fs.readFile('./memory/concepts/test-pattern.md', 'utf-8');
      expect(pattern).toContain('# Test Pattern');
      expect(pattern).toContain('A pattern discovered during testing');

      const project = await fs.readFile('./memory/projects/test-project.md', 'utf-8');
      expect(project).toContain('# Test Project');
    });

    test('updates context_anchors with new entity references', async () => {
      const entities = [{
        path: 'concepts/anchor-test',
        content: '# Anchor Test\n\nTesting context anchors.',
        anchor_summary: 'Test anchor integration'
      }];

      await cognitiveServer.deepLearn({ entities });

      const anchors = await fs.readFile('./memory/context_anchors.md', 'utf-8');
      expect(anchors).toContain('# Context Anchors');
      expect(anchors).toContain('## Deep Learn Session');
      expect(anchors).toContain('- **concepts/anchor-test**: Test anchor integration');
    });

    test('resets current_session with proper message', async () => {
      // Create initial session content
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Some work in progress'
      });

      const entities = [{
        path: 'concepts/session-reset-test',
        content: '# Session Reset Test',
        anchor_summary: 'Testing session reset'
      }];

      await cognitiveServer.deepLearn({ entities });

      const session = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(session).toContain('# Current Session');
      expect(session).toContain('Session reset');
      expect(session).toContain('after Deep Learn integration');
      expect(session).not.toContain('Some work in progress');
    });

    test('preserves existing context_anchors content', async () => {
      // Create initial context anchors
      const initialAnchors = `# Context Anchors

## Existing Anchor
**Entity Path**: /existing/path

---

`;
      await writeMemory('context_anchors', initialAnchors);

      const entities = [{
        path: 'concepts/new-anchor',
        content: '# New Anchor',
        anchor_summary: 'New anchor added'
      }];

      await cognitiveServer.deepLearn({ entities });

      const anchors = await fs.readFile('./memory/context_anchors.md', 'utf-8');
      expect(anchors).toContain('## Existing Anchor');
      expect(anchors).toContain('## Deep Learn Session');
      expect(anchors).toContain('**concepts/new-anchor**: New anchor added');
    });

    test('handles single entity correctly', async () => {
      const entities = [{
        path: 'projects/single-entity',
        content: '# Single Entity\n\nSingle entity test.',
        anchor_summary: 'Single entity test'
      }];

      const result = await cognitiveServer.deepLearn({ entities });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Deep Learn complete: 1 entities created/updated');
      expect(result.entities_created).toHaveLength(1);
    });
  });

  describe('learn tool', () => {
    test('creates me.md with new behavioral learning', async () => {
      const result = await cognitiveServer.learn({
        content: '- Always validate inputs\n- Document decisions clearly',
        rationale: 'Improved code quality through systematic validation'
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.section_updated).toBe('Behavioral Learnings');

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain('# Base Instructions (me.md)');
      expect(meContent).toContain('### Behavioral Learnings');
      expect(meContent).toContain('**Rationale**: Improved code quality through systematic validation');
      expect(meContent).toContain('- Always validate inputs');
      expect(meContent).toContain('- Document decisions clearly');
    });

    test('updates existing section in me.md', async () => {
      // Create initial me.md
      const initialMe = `# Base Instructions (me.md)

### Behavioral Learnings - Updated 2025-01-01

**Rationale**: Initial learning

Old content here

---

### Other Section

Other content

---
`;
      await writeMemory('me', initialMe);

      const result = await cognitiveServer.learn({
        content: 'Updated behavioral pattern',
        rationale: 'Refined through experience'
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('replaced');

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain('Updated behavioral pattern');
      expect(meContent).toContain('**Rationale**: Refined through experience');
      expect(meContent).not.toContain('Old content here');
      expect(meContent).toContain('### Other Section'); // Preserves other sections
    });

    test('appends new section to existing me.md', async () => {
      const initialMe = `# Base Instructions (me.md)

### Existing Section

Existing content

---
`;
      await writeMemory('me', initialMe);

      const result = await cognitiveServer.learn({
        section: 'Communication Style',
        content: 'Be concise and direct',
        rationale: 'User preference for brevity'
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('appended');
      expect(result.section_updated).toBe('Communication Style');

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain('### Existing Section');
      expect(meContent).toContain('### Communication Style');
      expect(meContent).toContain('Be concise and direct');
    });

    test('uses custom section name', async () => {
      const result = await cognitiveServer.learn({
        section: 'Custom Learning',
        content: 'Custom learning content',
        rationale: 'Testing custom sections'
      });

      expect(result.success).toBe(true);
      expect(result.section_updated).toBe('Custom Learning');

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain('### Custom Learning');
    });

    test('includes timestamp in section header', async () => {
      const today = new Date().toISOString().split('T')[0];

      await cognitiveServer.learn({
        content: 'Timestamp test',
        rationale: 'Testing timestamps'
      });

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain(`### Behavioral Learnings - Updated ${today}`);
    });

    test('includes reference comment in created file', async () => {
      await cognitiveServer.learn({
        content: 'Test content',
        rationale: 'Test rationale'
      });

      const meContent = await fs.readFile('./memory/me.md', 'utf-8');
      expect(meContent).toContain('Interface files (CLAUDE.md, custom_modes.yaml, etc.) should reference this location');
    });
  });

  describe('Integration with Memory Foundation', () => {
    test('cognitive tools integrate seamlessly with memory.js functions', async () => {
      // Test that cognitive tools create brain-analogous file structure
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Testing integration'
      });

      await cognitiveServer.writeEntity({
        entity_path: 'people/test-user',
        content: 'Test user profile'
      });

      // Verify brain-analogous organization
      const allFiles = await fs.readdir('./memory', { recursive: true });
      expect(allFiles).toContain('current_session.md');
      expect(allFiles).toContain('people');
      expect(allFiles.some(f => f.includes('people/test-user.md'))).toBe(true);
    });

    test('maintains hierarchical memory structure', async () => {
      // Create entities across different categories
      await cognitiveServer.writeEntity({
        entity_path: 'people/alice',
        content: 'Alice profile'
      });

      await cognitiveServer.writeEntity({
        entity_path: 'projects/cognitive-mcp',
        content: 'Cognitive MCP project'
      });

      await cognitiveServer.writeEntity({
        entity_path: 'concepts/meta-learning',
        content: 'Meta-learning concepts'
      });

      // Verify proper directory structure
      const peopleExists = await fs.access('./memory/people')
        .then(() => true)
        .catch(() => false);
      const projectsExists = await fs.access('./memory/projects')
        .then(() => true)
        .catch(() => false);
      const conceptsExists = await fs.access('./memory/concepts')
        .then(() => true)
        .catch(() => false);

      expect(peopleExists).toBe(true);
      expect(projectsExists).toBe(true);
      expect(conceptsExists).toBe(true);
    });

    test('cognitive development workflow end-to-end', async () => {
      // Simulate complete cognitive development workflow
      // 1. Session work with notes
      await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: 'Starting cognitive development workflow testing'
      });

      await cognitiveServer.addSessionNote({
        note_type: 'insight',
        content: 'End-to-end testing validates complete workflow'
      });

      // 2. Entity access for long-term memory
      await cognitiveServer.writeEntity({
        entity_path: 'concepts/workflow-testing',
        content: '# Workflow Testing\n\nValidating end-to-end cognitive development patterns.'
      });

      const workflowConcept = await cognitiveServer.readEntity({
        entity_path: 'concepts/workflow-testing'
      });

      // 3. Dream synthesis reflection
      await cognitiveServer.synthesisReflection({
        reflection_type: 'session',
        key_insights: [
          'Cognitive tools work together seamlessly',
          'Brain-analogous organization supports natural workflow',
          'Memory foundation provides reliable infrastructure'
        ],
        cognitive_growth: 'Validated complete cognitive development architecture',
        future_focus: 'Apply TDD methodology to future cognitive tool development'
      });

      // Verify complete workflow created proper memory structure
      const entities = await cognitiveServer.listEntities({});
      expect(entities).toContain('current_session');
      expect(entities).toContain('concepts/workflow-testing');
      expect(entities).toContain('dream_journal');

      // Verify workflow concept was properly stored
      expect(workflowConcept.content).toContain('Workflow Testing');
      expect(workflowConcept.content).toContain('end-to-end cognitive development patterns');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles session note with empty content gracefully', async () => {
      const result = await cognitiveServer.addSessionNote({
        note_type: 'context',
        content: ''
      });

      expect(result.success).toBe(true);
      
      const sessionContent = await fs.readFile('./memory/current_session.md', 'utf-8');
      expect(sessionContent).toContain('### CONTEXT - MEDIUM');
    });

    test('handles entity paths with special characters', async () => {
      const result = await cognitiveServer.writeEntity({
        entity_path: 'projects/website-redesign-v2.0',
        content: 'Project with special characters in name'
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe('projects/website-redesign-v2.0');

      const readResult = await cognitiveServer.readEntity({
        entity_path: 'projects/website-redesign-v2.0'
      });

      expect(readResult.content).toBe('Project with special characters in name');
    });

    test('handles synthesis reflection with empty key insights array', async () => {
      const result = await cognitiveServer.synthesisReflection({
        reflection_type: 'daily',
        key_insights: []
      });

      expect(result.success).toBe(true);

      const journalContent = await fs.readFile('./memory/dream_journal.md', 'utf-8');
      expect(journalContent).toContain('## Key Insights');
      // Should have empty insights section but still be valid
    });

    test('creates memory directory if it does not exist', async () => {
      // Remove memory directory
      await fs.rm('./memory', { recursive: true, force: true });

      // Should create directory automatically
      const result = await cognitiveServer.writeEntity({
        entity_path: 'test/auto-create',
        content: 'Testing automatic directory creation'
      });

      expect(result.success).toBe(true);

      const exists = await fs.access('./memory/test/auto-create.md')
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });
});