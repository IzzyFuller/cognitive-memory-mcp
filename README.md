# Cognitive Memory MCP Server

Entity-based memory architecture for AI assistants, implemented as an MCP (Model Context Protocol) server.

## Overview

This MCP server provides structured memory operations for AI assistants, enabling:
- **Entity-based storage**: Organize knowledge into typed entities (people, projects, patterns, protocols, etc.)
- **Session continuity**: Track work-in-progress through session notes
- **Learning integration**: Consolidate session learnings into permanent memory

## Tools

| Tool | Description |
|------|-------------|
| `read_entity` | Read entity with optional offset/limit pagination |
| `write_entity` | Create or update an entity |
| `list_entities` | List entities with optional prefix filter |
| `add_session_note` | Append timestamped note to current session |
| `deep_learn` | Consolidate session → entities, archive session |
| `learn` | Update identity document with validated patterns |
| `synthesis_reflection` | Append philosophical synthesis to dream journal |

## Installation

```bash
npm install
```

## Usage

```bash
# Run the server
npm start

# Run tests
npm test
```

## Configuration

The server reads/writes to a memory directory specified by the `COGNITIVE_MEMORY_PATH` environment variable.

## Architecture

```
memory/
├── me.md                 # Identity document
├── current_session.md    # Active session notes
├── context_anchors.md    # Working memory pointers
├── dream_journal.md      # Philosophical reflections
├── session_archives/     # Archived sessions
├── people/               # People entities
├── projects/             # Project entities
├── patterns/             # Pattern entities
├── protocols/            # Protocol entities
├── anti-patterns/        # Anti-pattern entities
└── concepts/             # Concept entities
```

## License

MIT
