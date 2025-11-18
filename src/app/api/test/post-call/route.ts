/**
 * Test post-call processing endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredSummary } from '@/lib/post-call';

const SAMPLE_TRANSCRIPT = `user: Hello, I'd like to discuss our upcoming product launch strategy.
agent: Great! I'd be happy to help you plan your product launch. What type of product are you launching?
user: It's a new SaaS platform for project management. We're targeting small to medium businesses.
agent: Excellent choice of market. What's your timeline for the launch?
user: We're planning to launch in about 3 months. We need to finalize our marketing strategy and pricing.
agent: That's a good timeline. For SaaS products targeting SMBs, I'd recommend focusing on content marketing, free trials, and competitive pricing. What's your current pricing model?
user: We're thinking of a tiered approach - basic at $10/month, professional at $25/month, and enterprise at $50/month.
agent: Those price points look competitive. I'd suggest also offering an annual discount to improve cash flow. Have you considered your go-to-market channels?
user: We're planning to use content marketing, social media, and maybe some paid ads. We also want to partner with business consultants.
agent: That's a solid multi-channel approach. I'd recommend starting with content marketing and free trials to build trust, then scaling paid acquisition once you validate your conversion rates.
user: That makes sense. What about measuring success? What KPIs should we track?
agent: For a SaaS launch, focus on: Monthly Recurring Revenue (MRR), Customer Acquisition Cost (CAC), Customer Lifetime Value (LTV), churn rate, and trial-to-paid conversion rate.
user: Perfect. Can you help us create a launch timeline with these recommendations?
agent: Absolutely! I'll help you create a comprehensive 3-month launch plan with all the key milestones and KPIs we discussed.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, agentInstructions } = body;

    const testTranscript = transcript || SAMPLE_TRANSCRIPT;
    const testInstructions = agentInstructions || 'You are a business strategy consultant helping with product launches.';

    console.log('Testing post-call processing...');
    
    const summary = await generateStructuredSummary(testTranscript, testInstructions);

    return NextResponse.json({
      success: true,
      message: 'Post-call processing test completed successfully',
      summary,
      transcriptLength: testTranscript.length,
    });
  } catch (error) {
    console.error('Post-call processing test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Post-call processing test failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test post-call processing',
    endpoint: '/api/test/post-call',
    samplePayload: {
      transcript: 'Optional: custom transcript text',
      agentInstructions: 'Optional: custom agent instructions',
    },
  });
}