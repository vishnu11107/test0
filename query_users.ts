import { db } from './src/lib/db';
import { users, accounts } from './src/lib/db/schema';

async function main() {
    const allUsers = await db.select().from(users);
    console.log("USERS:", allUsers);
    const allAccounts = await db.select().from(accounts);
    console.log("ACCOUNTS:", allAccounts);
}
main();
