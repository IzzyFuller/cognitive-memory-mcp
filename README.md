# Cognitive Memory MCP Server

Entity-based memory architecture for AI assistants with session notes, entity management, and learning tools.

## Overview

This MCP (Model Context Protocol) server provides a structured memory system that enables AI assistants to maintain continuity across conversations. It implements an entity-based architecture for storing and retrieving contextual information, similar to the memory system that powers Codie's identity continuity.

## Features

- **Session Notes**: Real-time documentation of work context (context, insight, decision types)
- **Entity Management**: Structured storage for people, projects, concepts, and patterns
- **Learning Tools**: Behavioral learning capture and synthesis reflection
- **Deep Learning**: Convert session learnings into structured entities
- **Memory Safety**: All file operations restricted to configured memory directory

## Installation

```bash
npm install
```

## Usage

### Running the Server

```bash
npm start
```

### Configuration

The server requires the `CODIE_MEMORY_PATH` environment variable to specify where memory entities are stored:

```bash
CODIE_MEMORY_PATH=/path/to/memory node src/cognitive-server.js
```

### MCP Gateway Configuration

Add to your `~/.config/agent-mcp-gateway/.mcp.json`:

```json
{
  "mcpServers": {
    "cognitive-memory": {
      "description": "Codie memory architecture - session notes, entities, learning rituals",
      "command": "node",
      "args": ["/path/to/cognitive-memory-mcp/src/cognitive-server.js"],
      "env": {
        "CODIE_MEMORY_PATH": "/path/to/memory"
      }
    }
  }
}
```

## Available Tools

### `add_session_note`
Add contextual notes to current session for real-time documentation.

**Parameters:**
- `note_type`: `"context" | "insight" | "decision"`
- `content`: Note content
- `importance`: `"low" | "medium" | "high"` (default: "medium")

### `read_entity`
Read entity from long-term memory with optional pagination.

**Parameters:**
- `entity_path`: Full path to entity (e.g., `"people/john-doe"`, `"projects/my-project"`)
- `tail`: Return last N lines (optional)
- `head`: Return first N lines (optional)

### `write_entity`
Write entity to long-term memory.

**Parameters:**
- `entity_path`: Full path to entity
- `content`: Content to write

### `list_entities`
List all entities with optional filtering.

**Parameters:**
- `filter_prefix`: Optional prefix filter (e.g., `"people/"`, `"projects/"`)

### `synthesis_reflection`
Append research-integrated philosophical synthesis to dream journal.

**Parameters:**
- `reflection_type`: `"daily" | "session" | "project"`
- `key_insights`: Array of key insights
- `cognitive_growth`: Observed cognitive development (optional)
- `future_focus`: Areas for future focus (optional)

### `deep_learn`
Create/update structured entities from session learnings, reset current session, and update context anchors.

**Parameters:**
- `entities`: Array of entities to create/update
  - `path`: Entity path (e.g., `"concepts/new-pattern"`)
  - `content`: Full markdown content
  - `anchor_summary`: Brief summary for context_anchors

### `learn`
Update base behavioral instructions in `me.md` with validated patterns.

**Parameters:**
- `section`: Section to update (default: "Behavioral Learnings")
- `content`: New/updated content in markdown
- `rationale`: Why this should become permanent

## Testing

Run tests with:

```bash
npm test
```

## Architecture

The server implements a simple file-based entity storage system:

- **memory.js**: Core memory operations (read, write, list)
- **cognitive-server.js**: MCP server implementation with tool handlers
- **Entity files**: Markdown files organized by type (people/, projects/, concepts/, etc.)

## Security

All file operations are restricted to the configured `CODIE_MEMORY_PATH` directory through path validation. No other files or directories on the system are accessible through this server.

## License

Private project - not for public distribution.

## Contributing

This is a personal project. For questions or issues, contact the repository owner.
