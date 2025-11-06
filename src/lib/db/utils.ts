import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const result = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);

    return result;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    throw error;
  }
}

/**
 * Clear all data from tables (useful for testing)
 * WARNING: This will delete all data!
 */
export async function clearAllTables() {
  try {
    await db.execute(sql`
      TRUNCATE TABLE 
        meetings,
        agents,
        accounts,
        sessions,
        users
      CASCADE;
    `);
    console.log('✅ All tables cleared');
  } catch (error) {
    console.error('Failed to clear tables:', error);
    throw error;
  }
}

/**
 * Reset database sequences (useful after manual inserts)
 */
export async function resetSequences() {
  try {
    await db.execute(sql`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
    `);
    console.log('✅ Sequences reset');
  } catch (error) {
    console.error('Failed to reset sequences:', error);
    throw error;
  }
}
