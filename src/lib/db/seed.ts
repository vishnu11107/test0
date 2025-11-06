import { config } from 'dotenv';

// Load environment variables BEFORE importing db
config({ path: '.env.local' });

import { db } from './index';
import { users, agents, meetings } from './schema';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const [demoUser] = await db
      .insert(users)
      .values({
        name: 'Demo User',
        email: 'demo@meetai.com',
        emailVerified: true,
        subscriptionTier: 'pro',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })
      .returning();

    console.log('✅ Created demo user:', demoUser.email);

    // Create demo agents
    const agentData = [
      {
        id: nanoid(),
        name: 'Language Tutor',
        userId: demoUser.id,
        instructions:
          'You are a friendly and patient language tutor. Help users practice conversation, correct their grammar gently, and provide cultural context. Adapt to their proficiency level and encourage them to speak more.',
        avatarSeed: 'language-tutor',
      },
      {
        id: nanoid(),
        name: 'Interview Coach',
        userId: demoUser.id,
        instructions:
          'You are an experienced interview coach. Conduct mock interviews, ask relevant questions based on the job role, provide constructive feedback, and help candidates improve their responses. Be professional but encouraging.',
        avatarSeed: 'interview-coach',
      },
      {
        id: nanoid(),
        name: 'Sales Assistant',
        userId: demoUser.id,
        instructions:
          'You are a knowledgeable sales assistant. Help practice sales pitches, handle objections, and improve closing techniques. Provide realistic customer scenarios and actionable feedback.',
        avatarSeed: 'sales-assistant',
      },
    ];

    const createdAgents = await db.insert(agents).values(agentData).returning();

    console.log(`✅ Created ${createdAgents.length} demo agents`);

    // Create demo meetings
    const meetingData = [
      {
        id: nanoid(),
        name: 'Spanish Conversation Practice',
        userId: demoUser.id,
        agentId: createdAgents[0].id,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min duration
        durationSeconds: 1800,
        summary:
          'Great conversation practice session focusing on everyday vocabulary and past tense conjugations. The user showed improvement in pronunciation and confidence.',
      },
      {
        id: nanoid(),
        name: 'Mock Technical Interview',
        userId: demoUser.id,
        agentId: createdAgents[1].id,
        status: 'completed' as const,
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 min duration
        durationSeconds: 2700,
        summary:
          'Comprehensive technical interview covering data structures and system design. Strong performance on algorithms, could improve on explaining trade-offs in system design decisions.',
      },
      {
        id: nanoid(),
        name: 'Product Demo Practice',
        userId: demoUser.id,
        agentId: createdAgents[2].id,
        status: 'upcoming' as const,
      },
    ];

    const createdMeetings = await db.insert(meetings).values(meetingData).returning();

    console.log(`✅ Created ${createdMeetings.length} demo meetings`);

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

export { seed };
