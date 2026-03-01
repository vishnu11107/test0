import { db } from './src/lib/db';
import { meetings } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const result = await db.select().from(meetings);
  console.log(result);
}
main();
