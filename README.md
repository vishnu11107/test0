# Meet AI Platform

A SaaS platform that enables users to conduct real-time video calls with custom AI agents.

## Features

- 🤖 Custom AI agents with specialized instructions
- 📹 Real-time video calls with AI participants
- 📝 AI-generated summaries and transcripts
- 💳 Subscription management with usage tracking
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 Secure authentication with Better Auth

## Tech Stack

- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **UI Components**: Shadcn/ui + Radix UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Video**: Stream Video SDK
- **AI**: OpenAI Realtime API
- **Payments**: Polar
- **Background Jobs**: Inngest

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL database (or Neon account)
- API keys for Stream, OpenAI, Polar, and Inngest

### Installation

1. Clone the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `STREAM_API_KEY` & `STREAM_API_SECRET` - Stream Video SDK credentials
- `OPENAI_API_KEY` - OpenAI API key for AI agents
- `POLAR_ACCESS_TOKEN` - Polar payment integration
- `INNGEST_EVENT_KEY` - Inngest background jobs

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # Reusable UI components
├── lib/                # Utility functions and configurations
│   └── utils.ts        # Helper functions
└── types/              # TypeScript type definitions
    ├── env.ts          # Environment variable types
    └── index.ts        # Core domain types
```

## License

This project is private and proprietary.
