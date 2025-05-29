// API Route: Competitor Analysis with Real LLM Integration

import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/lib/api/openai-client';
import { claudeClient } from '@/lib/api/claude-client';
import type { 
  CompetitorAnalysisRequest, 
  CompetitorAnalysisResponse,
  APIResponse 
} from '@/lib/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CompetitorAnalysisRequest;
    
    // Validate request
    if (!body.websiteUrl || !body.targetKeywords || body.targetKeywords.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'INVALID_REQUEST',
            message: 'Website URL and target keywords are required',
            retryable: false,
            timestamp: new Date()
          }
        },
        { status: 400 }
      );
    }

    // Set default analysis depth
    const analysisDepth = body.analysisDepth || 'detailed';

    // Step 1: Get competitor analysis from OpenAI
    console.log('🔍 Starting competitor analysis for:', body.websiteUrl);
    const openaiResponse = await openaiClient.analyzeCompetitors({
      websiteUrl: body.websiteUrl,
      targetKeywords: body.targetKeywords,
      analysisDepth
    });

    if (!openaiResponse.success || !openaiResponse.data) {
      console.error('❌ OpenAI competitor analysis failed:', openaiResponse.error);
      return NextResponse.json(openaiResponse, { status: 500 });
    }

    // Step 2: Enhance content gaps analysis with Claude
    console.log('🧠 Enhancing content gaps with Claude...');
    const competitorContent = openaiResponse.data.competitors.map(
      comp => `${comp.domain}: ${comp.topKeywords.join(', ')} - ${comp.contentGaps.join(', ')}`
    );

    const claudeGapsResponse = await claudeClient.generateContentGaps(
      competitorContent,
      body.targetKeywords
    );

    // Step 3: Merge and enhance the analysis
    const enhancedResponse = { ...openaiResponse.data };

    if (claudeGapsResponse.success && claudeGapsResponse.data) {
      console.log('✅ Claude content gaps analysis successful');
      
      // Enhance competitors with Claude's gap analysis
      enhancedResponse.competitors = enhancedResponse.competitors.map((competitor, index) => ({
        ...competitor,
        contentGaps: [
          ...competitor.contentGaps,
          ...(claudeGapsResponse.data?.slice(index * 2, (index + 1) * 2) || [])
        ].slice(0, 8) // Limit to 8 gaps per competitor
      }));

      // Add Claude's insights to opportunities
      const claudeOpportunities = claudeGapsResponse.data.map((gap, index) => ({
        topic: gap,
        keywords: body.targetKeywords.slice(0, 3),
        difficulty: 30 + (index * 10), // Estimated difficulty
        potential: 70 + (index * 5), // Estimated potential
        contentType: (['blog', 'guide', 'tutorial', 'comparison', 'review'] as const)[index % 5],
        reasoning: `Content gap identified through AI analysis: ${gap}`,
        competitorGaps: [gap]
      }));

      enhancedResponse.opportunities = [
        ...enhancedResponse.opportunities,
        ...claudeOpportunities
      ].slice(0, 10); // Limit to 10 opportunities
    } else {
      console.warn('⚠️ Claude content gaps analysis failed, using OpenAI data only');
    }

    // Step 4: Add analysis metadata
    enhancedResponse.analysisMetadata = {
      ...enhancedResponse.analysisMetadata,
      analysisTime: Date.now() - (openaiResponse.metadata.timestamp.getTime()),
      confidence: claudeGapsResponse.success ? 95 : 85 // Higher confidence with multi-LLM analysis
    };

    console.log('🎉 Competitor analysis completed successfully');

    // Return enhanced response
    const finalResponse: APIResponse<CompetitorAnalysisResponse> = {
      success: true,
      data: enhancedResponse,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - (openaiResponse.metadata.timestamp.getTime()),
        provider: 'openai',
        cached: openaiResponse.metadata.cached,
        tokensUsed: (openaiResponse.metadata.tokensUsed || 0) + (claudeGapsResponse.metadata?.tokensUsed || 0),
        cost: (openaiResponse.metadata.cost || 0) + (claudeGapsResponse.metadata?.cost || 0)
      }
    };

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('💥 Competitor analysis API error:', error);
    
    const errorResponse: APIResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
        timestamp: new Date()
      },
      metadata: {
        timestamp: new Date(),
        duration: 0,
        cached: false
      }
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date()
      }, { status: 500 });
    }

    // Test API clients
    const [openaiHealth, claudeHealth] = await Promise.allSettled([
      openaiClient.healthCheck(),
      claudeClient.healthCheck()
    ]);

    const healthStatus = {
      status: 'healthy',
      services: {
        openai: openaiHealth.status === 'fulfilled' && openaiHealth.value.success,
        claude: claudeHealth.status === 'fulfilled' && claudeHealth.value.success
      },
      timestamp: new Date()
    };

    const allHealthy = Object.values(healthStatus.services).every(Boolean);
    
    return NextResponse.json(healthStatus, { 
      status: allHealthy ? 200 : 503 
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
