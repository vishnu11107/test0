export interface Env {
  // Database
  DATABASE_URL: "postgresql://neondb_owner:npg_cO3KXi7wbHqB@ep-summer-sound-a4oa0opd-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // OAuth Providers (optional)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  // Stream Video SDK
  STREAM_API_KEY: string;
  STREAM_API_SECRET: string;

  // OpenAI
  OPENAI_API_KEY: string;
  NEXT_PUBLIC_OPENAI_API_KEY?: string; // For client-side (development only)

  // Polar (Payments)
  POLAR_ACCESS_TOKEN: string;
  POLAR_WEBHOOK_SECRET: string;

  // Inngest (Background Jobs)
  INNGEST_EVENT_KEY: string;
  INNGEST_SIGNING_KEY: string;

  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
