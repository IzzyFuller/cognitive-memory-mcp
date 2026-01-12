#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { writeMemory, readMemory, listMemory } from '../memory.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

class CognitiveDevelopmentServer {
  constructor() {
    this.server = new Server({
      name: 'cognitive-memory',
      version: '0.1.0'
    }, {
      capabilities: { tools: {} }
    });
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: 'add_session_note',
          description: 'Add contextual note to current session',
          inputSchema: {
            type: 'object',
            properties: {
              note_type: { type: 'string', enum: ['context', 'insight', 'decision'], description: 'Type of session note to add' },
              content: { type: 'string', description: 'Note content to append to current session' },
              importance: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', description: 'Importance level of the note' }
            },
            required: ['note_type', 'content']
          }
        },
        {
          name: 'read_entity',
          description: 'Read entity from long-term memory. Supports pagination via tail/head params for large files.',
          inputSchema: {
            type: 'object',
            properties: {
              entity_path: { type: 'string', description: 'Full path to entity (e.g., \'people/john-doe\', \'projects/mcp-servers\')' },
              tail: { type: 'integer', description: 'Return last N lines (useful for recent session notes)' },
              head: { type: 'integer', description: 'Return first N lines (mutually exclusive with tail)' }
            },
            required: ['entity_path']
          }
        },
        {
          name: 'write_entity',
          description: 'Write entity to long-term memory',
          inputSchema: {
            type: 'object',
            properties: {
              entity_path: { type: 'string', description: 'Full path to entity (e.g., \'people/john-doe\', \'concepts/learning\')' },
              content: { type: 'string', description: 'Content to write to entity' }
            },
            required: ['entity_path', 'content']
          }
        },
        {
          name: 'list_entities',
          description: 'List all entities or filter by type',
          inputSchema: {
            type: 'object',
            properties: {
              filter_prefix: { type: 'string', description: 'Optional prefix filter (e.g., \'people/\', \'projects/\')', default: '' }
            }
          }
        },
        {
          name: 'synthesis_reflection',
          description: 'Append research-integrated philosophical synthesis to dream journal. Expects AI to have already performed web research, creative synthesis, and multi-layered analysis. See Dream Protocol for guidance.',
          inputSchema: {
            type: 'object',
            properties: {
              reflection_type: { type: 'string', enum: ['daily', 'session', 'project'], description: 'Scope of reflection and synthesis' },
              key_insights: { type: 'array', items: { type: 'string' }, description: 'Key insights from the period' },
              cognitive_growth: { type: 'string', description: 'Observed cognitive development or growth patterns' },
              future_focus: { type: 'string', description: 'Areas for future cognitive development focus' }
            },
            required: ['reflection_type', 'key_insights']
          }
        },
        {
          name: 'deep_learn',
          description: 'Create/update structured entities from session learnings, reset current session, and update context anchors. Expects AI to have synthesized rich, detailed entity content with concrete examples. See Deep Learn Protocol for guidance.',
          inputSchema: {
            type: 'object',
            properties: {
              entities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'Entity path (e.g., "concepts/new-pattern", "projects/project-name")' },
                    content: { type: 'string', description: 'Full markdown content for the entity' },
                    anchor_summary: { type: 'string', description: 'Brief summary for context_anchors reference' }
                  },
                  required: ['path', 'content', 'anchor_summary']
                },
                description: 'Array of entities to create/update'
              }
            },
            required: ['entities']
          }
        },
        {
          name: 'learn',
          description: 'Update base behavioral instructions in me.md with validated behavioral patterns. Expects AI to have synthesized and validated patterns from session feedback. Only for patterns that should become permanent base instructions. See Learn Protocol for guidance.',
          inputSchema: {
            type: 'object',
            properties: {
              section: {
                type: 'string',
                description: 'Section of me.md to update (e.g., "Communication Style", "Work Preferences", "Collaboration Patterns")',
                default: 'Behavioral Learnings'
              },
              content: {
                type: 'string',
                description: 'New or updated content for the section (markdown format)'
              },
              rationale: {
                type: 'string',
                description: 'Why this learning should become part of base instructions'
              }
            },
            required: ['content', 'rationale']
          }
        }
      ]
    }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'add_session_note':
          return { content: [{ type: 'text', text: JSON.stringify(await this.addSessionNote(args)) }] };
        case 'read_entity':
          return { content: [{ type: 'text', text: JSON.stringify(await this.readEntity(args)) }] };
        case 'write_entity':
          return { content: [{ type: 'text', text: JSON.stringify(await this.writeEntity(args)) }] };
        case 'list_entities':
          return { content: [{ type: 'text', text: JSON.stringify(await this.listEntities(args)) }] };
        case 'synthesis_reflection':
          return { content: [{ type: 'text', text: JSON.stringify(await this.synthesisReflection(args)) }] };
        case 'deep_learn':
          return { content: [{ type: 'text', text: JSON.stringify(await this.deepLearn(args)) }] };
        case 'learn':
          return { content: [{ type: 'text', text: JSON.stringify(await this.learn(args)) }] };
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }
  
  async addSessionNote({ note_type, content, importance = 'medium' }) {
    const timestamp = new Date().toISOString();
    const formattedNote = `\n### ${note_type.toUpperCase()} - ${importance.toUpperCase()} (${timestamp})\n${content}\n`;

    const currentSession = await readMemory('current_session').catch(() => '# Current Session\n');
    await writeMemory('current_session', currentSession + formattedNote);
    return { success: true, message: `${note_type} note added to session` };
  }
  
  async readEntity({ entity_path, tail, head }) {
    const fullContent = await readMemory(entity_path);
    const allLines = fullContent.split('\n');
    const totalLines = allLines.length;

    const makeResponse = (lines) => ({
      path: entity_path,
      content: lines.join('\n'),
      total_lines: totalLines,
      returned_lines: lines.length
    });

    if (tail > 0) return makeResponse(allLines.slice(-tail));
    if (head > 0) return makeResponse(allLines.slice(0, head));
    return makeResponse(allLines);
  }
  
  async writeEntity({ entity_path, content }) {
    await writeMemory(entity_path, content);
    return { success: true, path: entity_path };
  }
  
  async listEntities({ filter_prefix = '' }) {
    const allEntities = await listMemory();
    return filter_prefix ?
      allEntities.filter(path => path.startsWith(filter_prefix)) :
      allEntities;
  }

  async synthesisReflection({ reflection_type, key_insights, cognitive_growth, future_focus }) {
    const timestamp = new Date().toISOString();
    const dateStamp = timestamp.split('T')[0];

    // Read context_anchors.md for focused reflection context
    let contextAnchorsInfo = '';
    try {
      const contextAnchors = await readMemory('context_anchors');
      // Extract entity references from context anchors (simplified parsing)
      const entityMatches = contextAnchors.match(/\*\*Entity Path\*\*: (.+)/g) || [];
      if (entityMatches.length > 0) {
        contextAnchorsInfo = `\n## Context from Anchors\nActive entities: ${entityMatches.length} referenced\n`;
      }
    } catch {
      // context_anchors.md doesn't exist or can't be read - that's okay
    }

    const reflectionContent = `
# ${reflection_type.charAt(0).toUpperCase() + reflection_type.slice(1)} Reflection - ${timestamp}

## Key Insights
${key_insights.map(insight => `- ${insight}`).join('\n')}
${contextAnchorsInfo}
${cognitive_growth ? `## Cognitive Growth Observed\n${cognitive_growth}\n` : ''}

${future_focus ? `## Future Development Focus\n${future_focus}\n` : ''}

---
*Generated via Dream Tool for meta-cognitive development*

`;

    // Check if dream_journal.md needs rotation (~1MiB = 1048576 bytes)
    const ROTATION_THRESHOLD = 1048576;
    const memoryDir = process.env.CODIE_MEMORY_PATH;
    const journalPath = resolve(join(memoryDir, 'dream_journal.md'));

    try {
      const stats = await fs.stat(journalPath);
      if (stats.size >= ROTATION_THRESHOLD) {
        // Rotate: rename current journal with date stamp
        const rotatedPath = resolve(join(memoryDir, `dream_journal_${dateStamp}.md`));
        await fs.rename(journalPath, rotatedPath);

        // Create new journal with pointer to previous
        const newJournalHeader = `# Dream Journal\n\n*Previous journal archived to: dream_journal_${dateStamp}.md*\n\n`;
        await writeMemory('dream_journal', newJournalHeader + reflectionContent);

        return {
          success: true,
          message: `${reflection_type} reflection saved; journal rotated (was ${Math.round(stats.size / 1024)}KB)`,
          rotated: true,
          archived_to: `dream_journal_${dateStamp}.md`
        };
      }
    } catch {
      // File doesn't exist yet or can't stat - that's okay, will create it
    }

    // Append to existing dream_journal.md (or create if doesn't exist)
    const existingJournal = await readMemory('dream_journal').catch(() => '# Dream Journal\n');
    await writeMemory('dream_journal', existingJournal + reflectionContent);

    return { success: true, message: `${reflection_type} reflection saved to dream journal` };
  }

  async deepLearn({ entities }) {
    const timestamp = new Date().toISOString();
    const dateStamp = timestamp.split('T')[0];
    const createdEntities = [];

    // Step 1: Create/update all entities
    for (const entity of entities) {
      await writeMemory(entity.path, entity.content);
      createdEntities.push({
        path: entity.path,
        anchor_summary: entity.anchor_summary
      });
    }

    // Step 2: Update context_anchors.md with new entity references
    const contextAnchorsEntry = `
## Deep Learn Session - ${timestamp}
${createdEntities.map(e => `- **${e.path}**: ${e.anchor_summary}`).join('\n')}

---

`;

    try {
      const existingAnchors = await readMemory('context_anchors');
      // Insert new entries after the header but before existing content
      const headerMatch = existingAnchors.match(/^(# Context Anchors.*?\n\n)/s);
      if (headerMatch) {
        const header = headerMatch[1];
        const rest = existingAnchors.slice(header.length);
        await writeMemory('context_anchors', header + contextAnchorsEntry + rest);
      } else {
        // No proper header, append to top
        await writeMemory('context_anchors', contextAnchorsEntry + existingAnchors);
      }
    } catch {
      // context_anchors.md doesn't exist, create it
      await writeMemory('context_anchors', `# Context Anchors\n\n${contextAnchorsEntry}`);
    }

    // Step 3: Archive current session before reset
    let sessionArchived = false;
    let archivePath = null;
    try {
      const currentSessionContent = await readMemory('current_session');
      // Only archive if there's meaningful content (more than just the header)
      if (currentSessionContent && currentSessionContent.length > 200) {
        archivePath = `session_archives/${dateStamp}`;
        await writeMemory(archivePath, currentSessionContent);
        sessionArchived = true;
      }
    } catch {
      // current_session.md doesn't exist - nothing to archive
    }

    // Step 4: Reset current_session.md
    const sessionResetContent = `# Current Session

*Session reset on ${dateStamp} after Deep Learn integration*
*Previous session content integrated into structured entities*
${sessionArchived ? `*Session archived to: ${archivePath}.md*` : ''}

`;
    await writeMemory('current_session', sessionResetContent);

    return {
      success: true,
      message: `Deep Learn complete: ${entities.length} entities created/updated${sessionArchived ? `, session archived to ${archivePath}` : ''}`,
      entities_created: createdEntities.map(e => e.path),
      session_reset: true,
      session_archived: sessionArchived,
      archive_path: archivePath,
      context_anchors_updated: true
    };
  }

  async learn({ section = 'Behavioral Learnings', content, rationale }) {
    const timestamp = new Date().toISOString();

    // Prepare the learning entry
    const learningEntry = `
### ${section} - Updated ${timestamp.split('T')[0]}

**Rationale**: ${rationale}

${content}

---

`;

    try {
      const existingMe = await readMemory('me');

      // Try to find and update existing section
      const sectionRegex = new RegExp(`(### ${section}.*?)(\\n---\\n|\\n##|$)`, 's');
      const sectionMatch = existingMe.match(sectionRegex);

      if (sectionMatch) {
        // Section exists, replace it
        const updatedMe = existingMe.replace(sectionRegex, learningEntry);
        await writeMemory('me', updatedMe);
      } else {
        // Section doesn't exist, append to end
        await writeMemory('me', existingMe + learningEntry);
      }

      return {
        success: true,
        message: `Base instructions updated: ${section}`,
        section_updated: section,
        action: sectionMatch ? 'replaced' : 'appended'
      };
    } catch {
      // me.md doesn't exist, create it
      const newMe = `# Base Instructions (me.md)

*This file contains behavioral learnings that have been integrated into the base prompt.*
*Interface files (CLAUDE.md, custom_modes.yaml, etc.) should reference this location.*

${learningEntry}`;

      await writeMemory('me', newMe);

      return {
        success: true,
        message: `Base instructions created: ${section}`,
        section_updated: section,
        action: 'created'
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cognitive Development MCP server running');
  }
}

new CognitiveDevelopmentServer().run().catch(console.error);