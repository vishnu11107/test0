/**
 * OpenAI integration test endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';

export async function GET() {
  try {
    // Test OpenAI connection with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with a brief greeting.',
        },
        {
          role: 'user',
          content: 'Hello, can you confirm the OpenAI integration is working?',
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'No response';

    return NextResponse.json({
      success: true,
      message: 'OpenAI integration is working!',
      response,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'OpenAI integration failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, instructions } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: instructions || 'You are a helpful AI assistant. Have a natural conversation with the user. Keep responses conversational and engaging.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Could you try again?';

    return NextResponse.json({
      success: true,
      response,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('OpenAI chat error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'I\'m having trouble connecting right now. Please try again.',
      },
      { status: 500 }
    );
  }
}