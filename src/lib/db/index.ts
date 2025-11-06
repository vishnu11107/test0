import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection with connection pooling
const connectionString = process.env.DATABASE_URL;

// For query purposes (connection pooling)
const queryClient = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in queries
export { schema };

// Type exports
export type Database = typeof db;
