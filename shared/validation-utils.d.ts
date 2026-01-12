/**
 * Shared Validation Utilities for MCP Servers
 *
 * This module provides common validation helpers, Zod schemas, and error handling
 * utilities to ensure consistency across all MCP servers in this repository.
 */
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
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
export declare function safeParseWithMcpError<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T>;
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
export declare function handleMcpError(error: unknown, toolName?: string): never;
/**
 * Common Zod schemas for frequently used fields across MCP servers.
 * These provide consistent validation and descriptions.
 */
export declare const CommonSchemas: {
    /**
     * Matter/case identifier - non-empty string
     */
    matterId: z.ZodString;
    /**
     * Result limit - positive integer with reasonable max (1000)
     */
    limit: z.ZodDefault<z.ZodNumber>;
    /**
     * ISO 8601 timestamp
     */
    timestamp: z.ZodString;
    /**
     * Firestore collection name - must be non-empty
     */
    collectionName: z.ZodString;
    /**
     * Search query string - must be non-empty
     */
    searchQuery: z.ZodString;
    /**
     * Email address with basic validation
     */
    email: z.ZodString;
    /**
     * Project ID - non-empty string
     */
    projectId: z.ZodString;
    /**
     * API key - non-empty string
     */
    apiKey: z.ZodString;
};
/**
 * Common enums used across multiple MCP servers
 */
export declare const CommonEnums: {
    /**
     * Standard log severity levels (Google Cloud Logging compatible)
     */
    logSeverity: z.ZodEnum<["DEFAULT", "DEBUG", "INFO", "NOTICE", "WARNING", "ERROR", "CRITICAL", "ALERT", "EMERGENCY"]>;
    /**
     * Common environment types
     */
    environment: z.ZodEnum<["development", "staging", "production"]>;
    /**
     * HTTP methods
     */
    httpMethod: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>;
};
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
export declare function createEnumSchema<T extends readonly [string, ...string[]]>(values: T, description: string): z.ZodEnum<any>;
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
export declare function createOptionalWithDefault<T extends z.ZodTypeAny, D>(baseSchema: T, defaultValue: D, description: string): z.ZodDefault<T>;
/**
 * Check if an error is an MCP error
 */
export declare function isMcpError(error: unknown): error is McpError;
/**
 * Check if an error is a Zod validation error
 */
export declare function isZodError(error: unknown): error is z.ZodError;
/**
 * Check if an error is a standard JavaScript Error
 */
export declare function isError(error: unknown): error is Error;
/**
 * Format data as JSON string with proper indentation for MCP responses.
 *
 * @param data - The data to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
export declare function formatJsonResponse(data: unknown, indent?: number): string;
/**
 * Create a standard MCP text response.
 *
 * @param text - The text content to return
 * @returns MCP-formatted response object
 */
export declare function createTextResponse(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
/**
 * Create an MCP response with both text and structured content.
 *
 * @param text - Human-readable text representation
 * @param structuredContent - Machine-readable structured data
 * @returns MCP-formatted response with both content types
 */
export declare function createStructuredResponse(text: string, structuredContent: unknown): {
    content: {
        type: "text";
        text: string;
    }[];
    structuredContent: unknown;
};
export { z, McpError, ErrorCode };
//# sourceMappingURL=validation-utils.d.ts.map