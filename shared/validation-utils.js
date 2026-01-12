/**
 * Shared Validation Utilities for MCP Servers
 *
 * This module provides common validation helpers, Zod schemas, and error handling
 * utilities to ensure consistency across all MCP servers in this repository.
 */
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
// ============================================================================
// Error Handling Utilities
// ============================================================================
/**
 * Safely parse data with automatic McpError conversion.
 *
 * This utility wraps Zod's safeParse and automatically converts validation
 * errors into properly formatted McpError instances with InvalidParams code.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated and typed data
 * @throws {McpError} With ErrorCode.InvalidParams if validation fails
 *
 * @example
 * const UserSchema = z.object({ name: z.string(), age: z.number() });
 * const validated = safeParseWithMcpError(UserSchema, userInput);
 */
export function safeParseWithMcpError(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors
            .map(e => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
        throw new McpError(ErrorCode.InvalidParams, `Validation failed: ${errors}`);
    }
    return result.data;
}
/**
 * Handle errors in MCP tool handlers with consistent error mapping.
 *
 * This utility provides standardized error handling that:
 * - Converts Zod validation errors to InvalidParams
 * - Re-throws existing McpErrors unchanged
 * - Wraps other errors as InternalError
 *
 * @param error - The error to handle
 * @param toolName - Optional tool name for better error messages
 * @throws {McpError} With appropriate error code
 *
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   handleMcpError(error, 'read_collection');
 * }
 */
export function handleMcpError(error, toolName) {
    const prefix = toolName ? `Tool ${toolName}: ` : '';
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
        const errorMessages = error.errors
            .map(e => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
        throw new McpError(ErrorCode.InvalidParams, `${prefix}Invalid parameters: ${errorMessages}`);
    }
    // Re-throw if already an McpError
    if (error instanceof McpError) {
        throw error;
    }
    // Wrap all other errors
    throw new McpError(ErrorCode.InternalError, `${prefix}${error instanceof Error ? error.message : 'Unknown error'}`);
}
// ============================================================================
// Common Field Validators
// ============================================================================
/**
 * Common Zod schemas for frequently used fields across MCP servers.
 * These provide consistent validation and descriptions.
 */
export const CommonSchemas = {
    /**
     * Matter/case identifier - non-empty string
     */
    matterId: z.string()
        .min(1)
        .describe('Matter/case identifier'),
    /**
     * Result limit - positive integer with reasonable max (1000)
     */
    limit: z.number()
        .int()
        .positive()
        .max(1000)
        .default(10)
        .describe('Maximum number of results to return'),
    /**
     * ISO 8601 timestamp
     */
    timestamp: z.string()
        .datetime()
        .describe('ISO 8601 timestamp'),
    /**
     * Firestore collection name - must be non-empty
     */
    collectionName: z.string()
        .min(1)
        .describe('Firestore collection name'),
    /**
     * Search query string - must be non-empty
     */
    searchQuery: z.string()
        .min(1)
        .describe('Search query string'),
    /**
     * Email address with basic validation
     */
    email: z.string()
        .email()
        .describe('Email address'),
    /**
     * Project ID - non-empty string
     */
    projectId: z.string()
        .min(1)
        .describe('Project identifier'),
    /**
     * API key - non-empty string
     */
    apiKey: z.string()
        .min(1)
        .describe('API key for authentication'),
};
// ============================================================================
// Common Enum Validators
// ============================================================================
/**
 * Common enums used across multiple MCP servers
 */
export const CommonEnums = {
    /**
     * Standard log severity levels (Google Cloud Logging compatible)
     */
    logSeverity: z.enum([
        'DEFAULT',
        'DEBUG',
        'INFO',
        'NOTICE',
        'WARNING',
        'ERROR',
        'CRITICAL',
        'ALERT',
        'EMERGENCY',
    ]),
    /**
     * Common environment types
     */
    environment: z.enum(['development', 'staging', 'production']),
    /**
     * HTTP methods
     */
    httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
};
// ============================================================================
// Validation Helpers
// ============================================================================
/**
 * Create an enum schema from an array of allowed values.
 * Useful when allowed values are determined at runtime.
 *
 * @param values - Array of allowed string values
 * @param description - Description for the schema
 * @returns Zod enum schema
 *
 * @example
 * const collections = ['files', 'matters', 'requests'] as const;
 * const CollectionSchema = createEnumSchema(collections, 'Collection name');
 */
export function createEnumSchema(values, description) {
    return z.enum(values).describe(description);
}
/**
 * Create a schema for an optional field with a default value.
 *
 * @param baseSchema - The base Zod schema
 * @param defaultValue - The default value to use
 * @param description - Description for the schema
 * @returns Zod schema with default
 *
 * @example
 * const limitSchema = createOptionalWithDefault(z.number().int().positive(), 10, 'Result limit');
 */
export function createOptionalWithDefault(baseSchema, defaultValue, description) {
    return baseSchema.default(defaultValue).describe(description);
}
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if an error is an MCP error
 */
export function isMcpError(error) {
    return error instanceof McpError;
}
/**
 * Check if an error is a Zod validation error
 */
export function isZodError(error) {
    return error instanceof z.ZodError;
}
/**
 * Check if an error is a standard JavaScript Error
 */
export function isError(error) {
    return error instanceof Error;
}
// ============================================================================
// Response Formatters
// ============================================================================
/**
 * Format data as JSON string with proper indentation for MCP responses.
 *
 * @param data - The data to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
export function formatJsonResponse(data, indent = 2) {
    return JSON.stringify(data, null, indent);
}
/**
 * Create a standard MCP text response.
 *
 * @param text - The text content to return
 * @returns MCP-formatted response object
 */
export function createTextResponse(text) {
    return {
        content: [{ type: 'text', text }],
    };
}
/**
 * Create an MCP response with both text and structured content.
 *
 * @param text - Human-readable text representation
 * @param structuredContent - Machine-readable structured data
 * @returns MCP-formatted response with both content types
 */
export function createStructuredResponse(text, structuredContent) {
    return {
        content: [{ type: 'text', text }],
        structuredContent,
    };
}
// ============================================================================
// Exports
// ============================================================================
export { z, McpError, ErrorCode };
//# sourceMappingURL=validation-utils.js.map