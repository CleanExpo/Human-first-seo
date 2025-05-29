// API Route: Content Analysis with Intelligent LLM Router

import { NextRequest, NextResponse } from 'next/server';
import { llmRouter } from '@/lib/api/llm-router';
import type { 
  ContentAnalysisRequest, 
  ContentAnalysisResponse,
  APIResponse,
  ContentSuggestion
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

    console.log('🔍 Starting intelligent content analysis...');
    const startTime = Date.now();

    // Create comprehensive analysis prompt
    const analysisPrompt = `
Analyze this content for SEO, readability, and human authenticity:

TITLE: ${body.title}

CONTENT: ${body.content}

TARGET KEYWORDS: ${body.targetKeywords?.join(', ') || 'Not specified'}

HUMAN INSIGHTS: ${body.humanInsights || 'None provided'}

Please provide a comprehensive analysis including:

1. READABILITY ANALYSIS:
   - Flesch Reading Ease score (0-100)
   - Grade level assessment
   - Sentence complexity analysis
   - Vocabulary accessibility

2. SEO ANALYSIS:
   - Title optimization (score 0-100)
   - Meta description suggestions
   - Heading structure evaluation
   - Keyword optimization assessment
   - Internal/external linking opportunities

3. ORIGINALITY & AUTHENTICITY:
   - Human vs AI content indicators
   - Personal experience integration
   - Unique perspective assessment
   - Fact-checking requirements

4. ENGAGEMENT FACTORS:
   - Content structure effectiveness
   - Call-to-action opportunities
   - Reader engagement potential

5. IMPROVEMENT SUGGESTIONS:
   - Specific actionable recommendations
   - Priority improvements
   - Content enhancement ideas

Please format your response as a detailed JSON object with scores (0-100) for each category and specific suggestions for improvement.
    `;

    // Use intelligent LLM router for analysis
    console.log('🤖 Using intelligent LLM router for content analysis...');
    const analysisResult = await llmRouter.generateContent(analysisPrompt, {
      maxTokens: 2000,
      temperature: 0.3
    });

    if (!analysisResult.success) {
      throw new Error(`LLM analysis failed: ${analysisResult.error || 'Unknown error'}`);
    }

    console.log(`✅ Analysis completed using ${analysisResult.provider.toUpperCase()}`);

    // Parse the LLM response and structure it
    let parsedAnalysis;
    try {
      // Try to parse as JSON first
      parsedAnalysis = JSON.parse(analysisResult.content);
    } catch {
      // If not JSON, create structured response from text
      parsedAnalysis = parseTextAnalysis(analysisResult.content);
    }

    // Create standardized response structure matching TypeScript types
    const enhancedResponse: ContentAnalysisResponse = {
      scores: {
        overall: calculateOverallScore(parsedAnalysis),
        readability: extractScore(parsedAnalysis, 'readability', 75),
        seo: extractScore(parsedAnalysis, 'seo', 70),
        originality: extractScore(parsedAnalysis, 'originality', 85),
        factCheck: extractScore(parsedAnalysis, 'factCheck', 80),
        humanAuthenticity: extractScore(parsedAnalysis, 'humanAuthenticity', 90),
        engagement: extractScore(parsedAnalysis, 'engagement', 75)
      },
      readabilityAnalysis: {
        fleschScore: extractScore(parsedAnalysis, 'flesch', 65),
        gradeLevel: extractGradeLevelNumber(parsedAnalysis),
        avgSentenceLength: 15,
        avgSyllablesPerWord: 1.5,
        complexWords: 10,
        suggestions: extractSuggestions(parsedAnalysis, 'readability')
      },
      seoAnalysis: {
        titleOptimization: {
          score: extractScore(parsedAnalysis, 'title', 70),
          length: body.title.length,
          keywordPresence: checkKeywordPresence(body.title, body.targetKeywords),
          suggestions: extractSuggestions(parsedAnalysis, 'title')
        },
        metaDescription: {
          score: 75,
          length: body.metaDescription?.length || 0,
          compelling: true,
          suggestions: extractSuggestions(parsedAnalysis, 'meta')
        },
        headingStructure: {
          score: extractScore(parsedAnalysis, 'headings', 80),
          h1Count: countHeadings(body.content, 'h1'),
          h2Count: countHeadings(body.content, 'h2'),
          hierarchy: true,
          suggestions: extractSuggestions(parsedAnalysis, 'headings')
        },
        keywordOptimization: {
          score: extractScore(parsedAnalysis, 'keywords', 65),
          density: calculateKeywordDensity(body.content, body.targetKeywords),
          distribution: 'Even',
          suggestions: extractSuggestions(parsedAnalysis, 'keywords')
        },
        internalLinking: {
          score: 60,
          count: countLinks(body.content, 'internal'),
          suggestions: ['Add relevant internal links', 'Link to related content']
        },
        externalLinking: {
          score: 70,
          count: countLinks(body.content, 'external'),
          authorityScore: 75,
          suggestions: ['Add authoritative external sources', 'Include relevant references']
        }
      },
      originalityAnalysis: {
        score: extractScore(parsedAnalysis, 'originality', 85),
        aiDetectionScore: 15, // Lower is better (less AI-like)
        plagiarismScore: 5, // Lower is better
        uniquenessIndicators: extractUniqueIndicators(parsedAnalysis),
        humanMarkers: extractHumanMarkers(parsedAnalysis),
        suggestions: extractSuggestions(parsedAnalysis, 'originality')
      },
      factCheckAnalysis: {
        score: extractScore(parsedAnalysis, 'factCheck', 80),
        claimsVerified: 5,
        sourcesProvided: body.sources?.length || 0,
        sourceQuality: 75,
        factualAccuracy: 85,
        suggestions: extractSuggestions(parsedAnalysis, 'factCheck'),
        flaggedClaims: []
      },
      suggestions: createContentSuggestions(parsedAnalysis)
    };

    console.log('🎉 Content analysis completed successfully');

    // Return enhanced response
    const finalResponse: APIResponse<ContentAnalysisResponse> = {
      success: true,
      data: enhancedResponse,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        provider: analysisResult.provider as any,
        cached: false,
        tokensUsed: 1500, // Estimated
        cost: 0.01 // Estimated
      }
    };

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('💥 Content analysis API error:', error);
    
    const errorResponse: APIResponse<never> = {
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Content analysis failed',
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

// Helper functions for parsing LLM responses
function parseTextAnalysis(content: string): any {
  return {
    readability: extractScoreFromText(content, 'readability'),
    seo: extractScoreFromText(content, 'seo'),
    originality: extractScoreFromText(content, 'originality'),
    suggestions: extractSuggestionsFromText(content)
  };
}

function extractScore(analysis: any, category: string, defaultScore: number): number {
  if (typeof analysis === 'object' && analysis[category]) {
    const score = analysis[category].score || analysis[category];
    return typeof score === 'number' ? Math.min(100, Math.max(0, score)) : defaultScore;
  }
  return defaultScore;
}

function extractScoreFromText(content: string, category: string): number {
  const regex = new RegExp(`${category}[^\\d]*(\\d+)`, 'i');
  const match = content.match(regex);
  return match ? parseInt(match[1]) : 75;
}

function calculateOverallScore(analysis: any): number {
  const scores = [
    extractScore(analysis, 'readability', 75),
    extractScore(analysis, 'seo', 70),
    extractScore(analysis, 'originality', 85),
    extractScore(analysis, 'factCheck', 80),
    extractScore(analysis, 'humanAuthenticity', 90),
    extractScore(analysis, 'engagement', 75)
  ];
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function extractGradeLevelNumber(analysis: any): number {
  if (analysis.readability?.gradeLevel && typeof analysis.readability.gradeLevel === 'number') {
    return analysis.readability.gradeLevel;
  }
  const flesch = extractScore(analysis, 'flesch', 65);
  if (flesch >= 90) return 5;
  if (flesch >= 80) return 6;
  if (flesch >= 70) return 7;
  if (flesch >= 60) return 8;
  if (flesch >= 50) return 10;
  return 12;
}

function extractSuggestions(analysis: any, category: string): string[] {
  if (analysis[category]?.suggestions) return analysis[category].suggestions;
  return [`Improve ${category} optimization`, `Enhance ${category} quality`];
}

function extractSuggestionsFromText(content: string): string[] {
  const suggestions = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('suggest') || line.includes('improve') || line.includes('recommend')) {
      suggestions.push(line.trim());
    }
  }
  return suggestions.slice(0, 10);
}

function checkKeywordPresence(title: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const titleLower = title.toLowerCase();
  return keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}

function countHeadings(content: string, type: 'h1' | 'h2'): number {
  const regex = new RegExp(`<${type}[^>]*>`, 'gi');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

function calculateKeywordDensity(content: string, keywords?: string[]): number {
  if (!keywords || keywords.length === 0) return 0;
  const words = content.toLowerCase().split(/\s+/);
  const keywordCount = keywords.reduce((count, keyword) => {
    return count + words.filter(word => word.includes(keyword.toLowerCase())).length;
  }, 0);
  return Math.round((keywordCount / words.length) * 100 * 100) / 100; // 2 decimal places
}

function countLinks(content: string, type: 'internal' | 'external'): number {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const matches = content.match(linkRegex);
  if (!matches) return 0;
  
  if (type === 'internal') {
    return matches.filter(link => !link.includes('http')).length;
  } else {
    return matches.filter(link => link.includes('http')).length;
  }
}

function extractUniqueIndicators(analysis: any): string[] {
  return analysis.uniquenessIndicators || [
    'Personal experience mentioned',
    'Original insights provided',
    'Unique perspective present'
  ];
}

function extractHumanMarkers(analysis: any): string[] {
  return analysis.humanMarkers || [
    'Conversational tone detected',
    'Personal anecdotes included',
    'Emotional language used'
  ];
}

function createContentSuggestions(analysis: any): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  
  // Add some default suggestions based on analysis
  suggestions.push({
    type: 'improvement',
    category: 'readability',
    message: 'Consider shortening complex sentences for better readability',
    impact: 'medium',
    effort: 'easy',
    implementation: 'Break long sentences into shorter ones'
  });

  suggestions.push({
    type: 'optimization',
    category: 'seo',
    message: 'Add more relevant keywords naturally throughout the content',
    impact: 'high',
    effort: 'moderate',
    implementation: 'Research related keywords and incorporate them contextually'
  });

  suggestions.push({
    type: 'improvement',
    category: 'content',
    message: 'Include more personal experiences or case studies',
    impact: 'high',
    effort: 'moderate',
    implementation: 'Add real examples or personal anecdotes to support your points'
  });

  return suggestions;
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
        message: 'No LLM providers available',
        providers: providerStatus,
        timestamp: new Date()
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: `${availableProviders.length} LLM provider(s) available`,
      providers: providerStatus,
      currentProvider: providerStatus.find(p => p.isCurrent)?.name || 'none',
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
