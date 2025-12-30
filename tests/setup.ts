/**
 * Jest test setup file
 * Runs before all tests
 */

// Mock environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// Global test timeout
jest.setTimeout(10000);
