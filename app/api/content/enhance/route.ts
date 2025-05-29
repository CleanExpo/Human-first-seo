// API Route: Content Enhancement with LLM Router

import { NextRequest, NextResponse } from 'next/server';
import { llmRouter } from '@/lib/api/llm-router';

interface ContentEnhanceRequest {
  content: string
  mode: 'readability' | 'human' | 'personal'
  targetGradeLevel?: number
  prompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentEnhanceRequest;
    
    // Validate request
    if (!body.content || !body.mode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content and mode are required'
        },
        { status: 400 }
      );
    }

    console.log(`🔧 Starting content enhancement for mode: ${body.mode}`);
    const startTime = Date.now();

    // Create enhancement prompt based on mode
    let enhancementPrompt = '';
    
    switch (body.mode) {
      case 'readability':
        enhancementPrompt = `
Rewrite the following content to be at a ${body.targetGradeLevel || 8}th grade reading level. 

REQUIREMENTS:
- Use shorter sentences (15-20 words max)
- Replace complex words with simpler alternatives
- Maintain all factual information
- Keep the same meaning and tone
- Use active voice where possible
- Break up long paragraphs

ORIGINAL CONTENT:
${body.content}

ENHANCED CONTENT:`;
        break;

      case 'human':
        enhancementPrompt = `
Rewrite the following content to sound more human and authentic while keeping all information accurate.

REQUIREMENTS:
- Add personal pronouns (I, we, you)
- Use conversational language
- Include transitional phrases
- Add human touches and relatable examples
- Make it sound like a real person wrote it
- Keep all facts and information intact

ORIGINAL CONTENT:
${body.content}

ENHANCED CONTENT:`;
        break;

      case 'personal':
        enhancementPrompt = `
Enhance the following content by adding personal experiences, opinions, and authentic insights.

REQUIREMENTS:
- Add personal anecdotes where appropriate
- Include "I" statements and personal opinions
- Add emotional language and personal reactions
- Include lessons learned or personal insights
- Make it sound like it's written by someone with real experience
- Keep all factual information accurate

ORIGINAL CONTENT:
${body.content}

ENHANCED CONTENT:`;
        break;

      default:
        throw new Error(`Unknown enhancement mode: ${body.mode}`);
    }

    // Use custom prompt if provided
    if (body.prompt) {
      enhancementPrompt = body.prompt;
    }

    // Use LLM router for content enhancement
    console.log('🤖 Using LLM router for content enhancement...');
    const enhancementResult = await llmRouter.generateContent(enhancementPrompt, {
      maxTokens: 2000,
      temperature: 0.7 // Higher temperature for more creative enhancement
    });

    if (!enhancementResult.success) {
      throw new Error(`LLM enhancement failed: ${enhancementResult.error || 'Unknown error'}`);
    }

    console.log(`✅ Content enhancement completed using ${enhancementResult.provider.toUpperCase()}`);

    // Clean up the enhanced content
    let enhancedContent = enhancementResult.content.trim();
    
    // Remove any potential prompt artifacts
    enhancedContent = enhancedContent.replace(/^(ENHANCED CONTENT:|Enhanced Content:|Rewritten Content:)/i, '').trim();
    
    // Ensure we have meaningful content
    if (enhancedContent.length < 50) {
      throw new Error('Enhanced content is too short - enhancement may have failed');
    }

    // Return enhanced content
    const response = {
      success: true,
      enhancedContent,
      originalLength: body.content.length,
      enhancedLength: enhancedContent.length,
      mode: body.mode,
      provider: enhancementResult.provider,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        provider: enhancementResult.provider,
        mode: body.mode,
        targetGradeLevel: body.targetGradeLevel
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Content enhancement API error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Content enhancement failed',
      timestamp: new Date()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check LLM router status
    const providerStatus = llmRouter.getProviderStatus();
    const availableProviders = providerStatus.filter(p => p.available);
    
    if (availableProviders.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No LLM providers available for content enhancement',
        providers: providerStatus,
        timestamp: new Date()
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: `Content enhancement ready with ${availableProviders.length} LLM provider(s)`,
      providers: providerStatus,
      currentProvider: providerStatus.find(p => p.isCurrent)?.name || 'none',
      supportedModes: ['readability', 'human', 'personal'],
      timestamp: new Date()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 500 });
  }
}
