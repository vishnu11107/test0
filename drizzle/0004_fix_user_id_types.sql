-- Drop existing foreign key constraints
ALTER TABLE "agents" DROP CONSTRAINT IF EXISTS "agents_user_id_users_id_fk";
ALTER TABLE "meetings" DROP CONSTRAINT IF EXISTS "meetings_user_id_users_id_fk";

-- Delete existing data (since user IDs won't match after migration)
DELETE FROM "meetings";
DELETE FROM "agents";

-- Change column types from uuid to text
ALTER TABLE "agents" ALTER COLUMN "user_id" SET DATA TYPE text;
ALTER TABLE "meetings" ALTER COLUMN "user_id" SET DATA TYPE text;

-- Add new foreign key constraints referencing the Better Auth user table
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "meetings" ADD CONSTRAINT "meetings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
