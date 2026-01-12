# Shared Validation Utilities

Common validation helpers, Zod schemas, and error handling utilities for all MCP servers in this repository.

## Purpose

This shared module provides:
- **Consistent validation** across all MCP servers
- **Standardized error handling** with proper `McpError` mapping
- **Reusable Zod schemas** for common fields
- **Type-safe helpers** that leverage TypeScript inference

## Installation

Since this is a local package, import directly from the shared directory:

```typescript
import { safeParseWithMcpError, CommonSchemas, handleMcpError } from '../shared/validation-utils.js';
```

## Core Functions

### `safeParseWithMcpError()`

Validate data with automatic error conversion to `McpError`:

```typescript
import { safeParseWithMcpError } from '../shared/validation-utils.js';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

// Automatically throws McpError(InvalidParams) if validation fails
const validated = safeParseWithMcpError(UserSchema, userInput);
```

### `handleMcpError()`

Standardize error handling in tool handlers:

```typescript
import { handleMcpError } from '../shared/validation-utils.js';

try {
  // ... your operation
} catch (error) {
  handleMcpError(error, 'read_collection');
  // Throws properly formatted McpError based on error type
}
```

## Common Schemas

### Field Validators

Pre-built schemas for common fields:

```typescript
import { CommonSchemas } from '../shared/validation-utils.js';

const MyToolSchema = z.object({
  matterId: CommonSchemas.matterId,
  limit: CommonSchemas.limit,
  email: CommonSchemas.email,
});
```

Available schemas:
- `matterId` - Non-empty string for matter/case IDs
- `limit` - Positive integer (1-1000, default 10)
- `timestamp` - ISO 8601 datetime string
- `collectionName` - Non-empty collection name
- `searchQuery` - Non-empty search string
- `email` - Email address with validation
- `projectId` - Non-empty project identifier
- `apiKey` - Non-empty API key

### Enum Validators

Common enums used across servers:

```typescript
import { CommonEnums } from '../shared/validation-utils.js';

const LogSchema = z.object({
  severity: CommonEnums.logSeverity,
  environment: CommonEnums.environment,
  method: CommonEnums.httpMethod,
});
```

Available enums:
- `logSeverity` - Google Cloud Logging levels (DEFAULT, DEBUG, INFO, WARNING, ERROR, etc.)
- `environment` - development, staging, production
- `httpMethod` - GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

## Helper Functions

### `createEnumSchema()`

Create enum schemas from runtime arrays:

```typescript
import { createEnumSchema } from '../shared/validation-utils.js';

const ALLOWED_COLLECTIONS = ['files', 'matters', 'requests'] as const;
const CollectionSchema = createEnumSchema(
  ALLOWED_COLLECTIONS,
  'Firestore collection name'
);
```

### `createOptionalWithDefault()`

Create optional fields with defaults:

```typescript
import { createOptionalWithDefault, z } from '../shared/validation-utils.js';

const limitSchema = createOptionalWithDefault(
  z.number().int().positive(),
  10,
  'Maximum results to return'
);
```

## Type Guards

Check error types safely:

```typescript
import { isMcpError, isZodError, isError } from '../shared/validation-utils.js';

if (isMcpError(error)) {
  // error is McpError
} else if (isZodError(error)) {
  // error is z.ZodError
} else if (isError(error)) {
  // error is Error
}
```

## Response Formatters

### Text Responses

```typescript
import { createTextResponse } from '../shared/validation-utils.js';

return createTextResponse('Operation completed successfully');
// Returns: { content: [{ type: 'text', text: '...' }] }
```

### Structured Responses

Return both human-readable text and machine-readable data:

```typescript
import { createStructuredResponse } from '../shared/validation-utils.js';

return createStructuredResponse(
  'Found 5 results',
  { count: 5, items: [...] }
);
// Returns: { content: [...], structuredContent: {...} }
```

### JSON Formatting

```typescript
import { formatJsonResponse } from '../shared/validation-utils.js';

const json = formatJsonResponse(data, 2);  // 2-space indent
```

## Usage Examples

### Complete Tool Handler

```typescript
import {
  safeParseWithMcpError,
  handleMcpError,
  CommonSchemas,
  createStructuredResponse,
  z,
} from '../shared/validation-utils.js';

// Define schema
const ReadCollectionSchema = z.object({
  collectionName: z.enum(['files', 'matters']).describe('Collection to read'),
  limit: CommonSchemas.limit,
});

// Tool handler
async function handleReadCollection(args: unknown) {
  try {
    // Validate input
    const validated = safeParseWithMcpError(ReadCollectionSchema, args);

    // Execute operation
    const results = await db.collection(validated.collectionName)
      .limit(validated.limit)
      .get();

    // Return structured response
    return createStructuredResponse(
      `Found ${results.length} documents`,
      { count: results.length, documents: results }
    );
  } catch (error) {
    handleMcpError(error, 'read_collection');
  }
}
```

### Validation Only

```typescript
import { safeParseWithMcpError, z } from '../shared/validation-utils.js';

const InputSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().int().positive().max(100),
});

// Throws McpError(InvalidParams) automatically if validation fails
const validated = safeParseWithMcpError(InputSchema, userInput);
```

## Integration with McpServer Pattern

These utilities work seamlessly with the modern `McpServer.registerTool()` pattern:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CommonSchemas, z } from '../shared/validation-utils.js';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

server.registerTool(
  'my_tool',
  {
    description: 'Example tool',
    inputSchema: {
      matterId: CommonSchemas.matterId,
      limit: CommonSchemas.limit,
    },
  },
  async ({ matterId, limit }) => {
    // Fully typed and validated parameters
    // ...
  }
);
```

## Building

```bash
cd shared
npm install
npm run build
```

This generates `.js`, `.d.ts`, and source map files for TypeScript consumption.

## Best Practices

1. **Always use `safeParseWithMcpError()`** instead of manual `.parse()` for automatic error conversion
2. **Use `handleMcpError()`** in catch blocks to ensure consistent error formatting
3. **Prefer `CommonSchemas`** over defining custom schemas for standard fields
4. **Use `createStructuredResponse()`** to provide both human and machine-readable output
5. **Import only what you need** to minimize bundle size

## Error Handling Flow

```
User Input
    ↓
safeParseWithMcpError()
    ↓
[Validation Fails] → McpError(InvalidParams)
[Validation Succeeds] → Typed Data
    ↓
Business Logic
    ↓
[Error Occurs] → handleMcpError()
    ↓
Properly Formatted McpError
```

## TypeScript Support

All utilities are fully typed with:
- **Automatic type inference** from Zod schemas
- **Strict null checking** enabled
- **JSDoc comments** for IDE intellisense
- **Declaration maps** for "Go to Definition" support

## License

MIT
