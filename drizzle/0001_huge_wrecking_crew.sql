CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_user_id_idx" ON "agents" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agents_user_name_idx" ON "agents" ("user_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_user_id_idx" ON "meetings" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_agent_id_idx" ON "meetings" ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_user_status_idx" ON "meetings" ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meetings_stream_call_id_idx" ON "meetings" ("stream_call_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at");