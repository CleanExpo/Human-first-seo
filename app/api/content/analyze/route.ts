// API Route: Content Analysis with Multi-LLM Integration

import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/lib/api/openai-client';
import { claudeClient } from '@/lib/api/claude-client';
import { geminiClient } from '@/lib/api/gemini-client';
import type { 
  ContentAnalysisRequest, 
  ContentAnalysisResponse,
  APIResponse 
} from '@/lib/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContentAnalysisRequest;
    
    // Validate request
    if (!body.title || !body.content) {
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'INVALID_REQUEST',
            message: 'Title and content are required',
            retryable: false,
            timestamp: new Date()
          }
        },
        { status: 400 }
      );
    }

    console.log('🔍 Starting multi-LLM content analysis...');
    const startTime = Date.now();

    // Step 1: OpenAI - Primary content analysis
    console.log('🤖 OpenAI analyzing content structure and SEO...');
    const openaiResponse = await openaiClient.analyzeContent(body);

    if (!openaiResponse.success || !openaiResponse.data) {
      console.error('❌ OpenAI content analysis failed:', openaiResponse.error);
      return NextResponse.json(openaiResponse, { status: 500 });
    }

    // Step 2: Claude - Readability and originality analysis
    console.log('🧠 Claude analyzing readability and originality...');
    const [claudeReadabilityResponse, claudeOriginalityResponse] = await Promise.allSettled([
      claudeClient.analyzeReadability(body.content),
      claudeClient.analyzeOriginality(body.content, body.humanInsights)
    ]);

    // Step 3: Gemini - SEO optimization and content suggestions
    console.log('💎 Gemini optimizing SEO and generating suggestions...');
    const [geminiSEOResponse, geminiSuggestionsResponse] = await Promise.allSettled([
      geminiClient.optimizeSEO(body.title, body.content, body.targetKeywords),
      geminiClient.generateContentSuggestions(
        body.title, 
        'General audience', 
        'blog post'
      )
    ]);

    // Step 4: Merge and enhance the analysis
    console.log('🔄 Merging multi-LLM insights...');
    const enhancedResponse = { ...openaiResponse.data };

    // Enhance readability analysis with Claude's insights
    if (claudeReadabilityResponse.status === 'fulfilled' && claudeReadabilityResponse.value.success) {
      console.log('✅ Claude readability analysis successful');
      enhancedResponse.readabilityAnalysis = {
        ...enhancedResponse.readabilityAnalysis,
        ...claudeReadabilityResponse.value.data
      };
      
      // Update readability score with Claude's analysis
      enhancedResponse.scores.readability = Math.round(
        (enhancedResponse.scores.readability + (claudeReadabilityResponse.value.data?.fleschScore || 0)) / 2
      );
    }

    // Enhance originality analysis with Claude's insights
    if (claudeOriginalityResponse.status === 'fulfilled' && claudeOriginalityResponse.value.success) {
      console.log('✅ Claude originality analysis successful');
      enhancedResponse.originalityAnalysis = {
        ...enhancedResponse.originalityAnalysis,
        ...claudeOriginalityResponse.value.data
      };
      
      // Update originality score with Claude's analysis
      enhancedResponse.scores.originality = Math.round(
        (enhancedResponse.scores.originality + (claudeOriginalityResponse.value.data?.score || 0)) / 2
      );
    }

    // Enhance SEO analysis with Gemini's insights
    if (geminiSEOResponse.status === 'fulfilled' && geminiSEOResponse.value.success && geminiSEOResponse.value.data) {
      console.log('✅ Gemini SEO analysis successful');
      const geminiSEO = geminiSEOResponse.value.data;
      
      // Merge SEO analyses
      enhancedResponse.seoAnalysis = {
        titleOptimization: {
          ...enhancedResponse.seoAnalysis.titleOptimization,
          score: Math.round((enhancedResponse.seoAnalysis.titleOptimization.score + geminiSEO.titleOptimization.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.titleOptimization.suggestions,
            ...geminiSEO.titleOptimization.suggestions
          ].slice(0, 5) // Limit to top 5 suggestions
        },
        metaDescription: {
          ...enhancedResponse.seoAnalysis.metaDescription,
          score: Math.round((enhancedResponse.seoAnalysis.metaDescription.score + geminiSEO.metaDescription.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.metaDescription.suggestions,
            ...geminiSEO.metaDescription.suggestions
          ].slice(0, 5)
        },
        headingStructure: {
          ...enhancedResponse.seoAnalysis.headingStructure,
          score: Math.round((enhancedResponse.seoAnalysis.headingStructure.score + geminiSEO.headingStructure.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.headingStructure.suggestions,
            ...geminiSEO.headingStructure.suggestions
          ].slice(0, 5)
        },
        keywordOptimization: {
          ...enhancedResponse.seoAnalysis.keywordOptimization,
          score: Math.round((enhancedResponse.seoAnalysis.keywordOptimization.score + geminiSEO.keywordOptimization.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.keywordOptimization.suggestions,
            ...geminiSEO.keywordOptimization.suggestions
          ].slice(0, 5)
        },
        internalLinking: {
          ...enhancedResponse.seoAnalysis.internalLinking,
          score: Math.round((enhancedResponse.seoAnalysis.internalLinking.score + geminiSEO.internalLinking.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.internalLinking.suggestions,
            ...geminiSEO.internalLinking.suggestions
          ].slice(0, 5)
        },
        externalLinking: {
          ...enhancedResponse.seoAnalysis.externalLinking,
          score: Math.round((enhancedResponse.seoAnalysis.externalLinking.score + geminiSEO.externalLinking.score) / 2),
          suggestions: [
            ...enhancedResponse.seoAnalysis.externalLinking.suggestions,
            ...geminiSEO.externalLinking.suggestions
          ].slice(0, 5)
        }
      };

      // Update overall SEO score
      const avgSEOScore = Object.values(enhancedResponse.seoAnalysis).reduce((sum, section) => {
        return sum + (section.score || 0);
      }, 0) / 6;
      enhancedResponse.scores.seo = Math.round(avgSEOScore);
    }

    // Add Gemini's content suggestions
    if (geminiSuggestionsResponse.status === 'fulfilled' && geminiSuggestionsResponse.value.success) {
      console.log('✅ Gemini content suggestions successful');
      const geminiSuggestions = geminiSuggestionsResponse.value.data || [];
      
      // Add Gemini suggestions to the existing suggestions
      enhancedResponse.suggestions = [
        ...enhancedResponse.suggestions,
        ...geminiSuggestions
      ].slice(0, 15); // Limit to top 15 suggestions
    }

    // Calculate enhanced overall score
    const scores = enhancedResponse.scores;
    enhancedResponse.scores.overall = Math.round(
      (scores.readability + scores.seo + scores.originality + scores.factCheck + scores.humanAuthenticity + scores.engagement) / 6
    );

    console.log('🎉 Multi-LLM content analysis completed successfully');

    // Calculate total cost and tokens
    const totalTokens = (openaiResponse.metadata.tokensUsed || 0) +
      (claudeReadabilityResponse.status === 'fulfilled' ? claudeReadabilityResponse.value.metadata?.tokensUsed || 0 : 0) +
      (claudeOriginalityResponse.status === 'fulfilled' ? claudeOriginalityResponse.value.metadata?.tokensUsed || 0 : 0) +
      (geminiSEOResponse.status === 'fulfilled' ? geminiSEOResponse.value.metadata?.tokensUsed || 0 : 0) +
      (geminiSuggestionsResponse.status === 'fulfilled' ? geminiSuggestionsResponse.value.metadata?.tokensUsed || 0 : 0);

    const totalCost = (openaiResponse.metadata.cost || 0) +
      (claudeReadabilityResponse.status === 'fulfilled' ? claudeReadabilityResponse.value.metadata?.cost || 0 : 0) +
      (claudeOriginalityResponse.status === 'fulfilled' ? claudeOriginalityResponse.value.metadata?.cost || 0 : 0) +
      (geminiSEOResponse.status === 'fulfilled' ? geminiSEOResponse.value.metadata?.cost || 0 : 0) +
      (geminiSuggestionsResponse.status === 'fulfilled' ? geminiSuggestionsResponse.value.metadata?.cost || 0 : 0);

    // Return enhanced response
    const finalResponse: APIResponse<ContentAnalysisResponse> = {
      success: true,
      data: enhancedResponse,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        provider: 'openai', // Primary provider
        cached: openaiResponse.metadata.cached,
        tokensUsed: totalTokens,
        cost: totalCost
      }
    };

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('💥 Content analysis API error:', error);
    
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
    const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_AI_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        timestamp: new Date()
      }, { status: 500 });
    }

    // Test API clients
    const [openaiHealth, claudeHealth, geminiHealth] = await Promise.allSettled([
      openaiClient.healthCheck(),
      claudeClient.healthCheck(),
      geminiClient.healthCheck()
    ]);

    const healthStatus = {
      status: 'healthy',
      services: {
        openai: openaiHealth.status === 'fulfilled' && openaiHealth.value.success,
        claude: claudeHealth.status === 'fulfilled' && claudeHealth.value.success,
        gemini: geminiHealth.status === 'fulfilled' && geminiHealth.value.success
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
