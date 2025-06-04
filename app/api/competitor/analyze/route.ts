// API Route: Competitor Analysis with Real LLM Integration

import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/lib/api/openai-client';
import { claudeClient } from '@/lib/api/claude-client';
import { perplexityClient } from '@/lib/api/perplexity-client';
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

    // Step 1: Get competitor analysis from OpenAI and Perplexity in parallel
    console.log('🔍 Starting competitor analysis for:', body.websiteUrl);
    const [openaiResult, perplexityResult] = await Promise.allSettled([
      openaiClient.analyzeCompetitors({
        websiteUrl: body.websiteUrl,
        targetKeywords: body.targetKeywords,
        analysisDepth
      }),
      perplexityClient.analyzeCompetitors({
        websiteUrl: body.websiteUrl,
        targetKeywords: body.targetKeywords,
        analysisDepth
      })
    ]);

    const openaiResponse = openaiResult.status === 'fulfilled' ? openaiResult.value : null;
    const perplexityResponse = perplexityResult.status === 'fulfilled' ? perplexityResult.value : null;

    if (!openaiResponse?.success && !perplexityResponse?.success) {
      console.error('❌ Both OpenAI and Perplexity competitor analysis failed');
      return NextResponse.json(openaiResponse || perplexityResponse, { status: 500 });
    }

    const baseData = openaiResponse?.data || perplexityResponse?.data;

    // Step 2: Enhance content gaps analysis with Claude
    console.log('🧠 Enhancing content gaps with Claude...');
    const competitorContent = baseData!.competitors.map(
      comp => `${comp.domain}: ${comp.topKeywords.join(', ')} - ${comp.contentGaps.join(', ')}`
    );

    const claudeGapsResponse = await claudeClient.generateContentGaps(
      competitorContent,
      body.targetKeywords
    );

    // Step 3: Merge and enhance the analysis
    const enhancedResponse = { ...(baseData as CompetitorAnalysisResponse) };

    if (perplexityResponse?.success && perplexityResponse.data) {
      // Merge Perplexity insights
      const combinedCompetitors = [
        ...enhancedResponse.competitors,
        ...perplexityResponse.data.competitors
      ];
      // Deduplicate by domain
      enhancedResponse.competitors = combinedCompetitors.filter(
        (c, index, arr) => arr.findIndex(o => o.domain === c.domain) === index
      ).slice(0, 5);

      enhancedResponse.opportunities = [
        ...enhancedResponse.opportunities,
        ...perplexityResponse.data.opportunities
      ].slice(0, 10);

      enhancedResponse.marketInsights = [
        ...enhancedResponse.marketInsights,
        ...perplexityResponse.data.marketInsights
      ].slice(0, 10);
    }

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
    const baseTimestamp = (openaiResponse?.metadata.timestamp || perplexityResponse?.metadata.timestamp)!;
    enhancedResponse.analysisMetadata = {
      ...enhancedResponse.analysisMetadata,
      analysisTime: Date.now() - baseTimestamp.getTime(),
      confidence: claudeGapsResponse.success ? 95 : 85
    };

    console.log('🎉 Competitor analysis completed successfully');

    // Return enhanced response
    const finalResponse: APIResponse<CompetitorAnalysisResponse> = {
      success: true,
      data: enhancedResponse,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - baseTimestamp.getTime(),
        provider: 'openai',
        cached: openaiResponse?.metadata.cached ?? perplexityResponse?.metadata.cached,
        tokensUsed:
          (openaiResponse?.metadata.tokensUsed || 0) +
          (perplexityResponse?.metadata.tokensUsed || 0) +
          (claudeGapsResponse.metadata?.tokensUsed || 0),
        cost:
          (openaiResponse?.metadata.cost || 0) +
          (perplexityResponse?.metadata.cost || 0) +
          (claudeGapsResponse.metadata?.cost || 0)
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
    const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date()
      }, { status: 500 });
    }

    // Test API clients
    const [openaiHealth, claudeHealth, perplexityHealth] = await Promise.allSettled([
      openaiClient.healthCheck(),
      claudeClient.healthCheck(),
      perplexityClient.healthCheck()
    ]);

    const healthStatus = {
      status: 'healthy',
      services: {
        openai: openaiHealth.status === 'fulfilled' && openaiHealth.value.success,
        claude: claudeHealth.status === 'fulfilled' && claudeHealth.value.success,
        perplexity: perplexityHealth.status === 'fulfilled' && perplexityHealth.value.success
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
