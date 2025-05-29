// OpenAI API Client for Human-First SEO MVP

import OpenAI from 'openai';
import { BaseAPIClient, createAPIConfig } from './base-client';
import type {
  APIResponse,

  ContentAnalysisRequest,
  ContentAnalysisResponse,
  CompetitorAnalysisRequest,
  CompetitorAnalysisResponse
} from '@/lib/types/api';

export class OpenAIClient extends BaseAPIClient {
  private openai: OpenAI;

  constructor() {
    const config = createAPIConfig('openai');
    super(config);
    
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async analyzeContent(request: ContentAnalysisRequest): Promise<APIResponse<ContentAnalysisResponse>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-content', request);
    
    try {
      // Check cache first
      const cached = this.getCachedResponse<ContentAnalysisResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildContentAnalysisPrompt(request);
      
      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO content analyst specializing in human-first content evaluation. Provide detailed, actionable analysis in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        });
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}') as ContentAnalysisResponse;
      
      // Cache the response
      this.setCachedResponse(cacheKey, response, 3600); // 1 hour cache

      return this.createSuccessResponse(
        response,
        startTime,
        false,
        completion.usage?.total_tokens,
        this.calculateCost(completion.usage?.total_tokens || 0)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('CONTENT_ANALYSIS_FAILED', error.message, true)
        : this.createError('CONTENT_ANALYSIS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async analyzeCompetitors(request: CompetitorAnalysisRequest): Promise<APIResponse<CompetitorAnalysisResponse>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-competitors', request);
    
    try {
      // Check cache first (longer cache for competitor data)
      const cached = this.getCachedResponse<CompetitorAnalysisResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildCompetitorAnalysisPrompt(request);
      
      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO strategist specializing in competitive analysis. Provide strategic insights and actionable recommendations in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        });
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}') as CompetitorAnalysisResponse;
      
      // Cache competitor data for 24 hours
      this.setCachedResponse(cacheKey, response, 86400);

      return this.createSuccessResponse(
        response,
        startTime,
        false,
        completion.usage?.total_tokens,
        this.calculateCost(completion.usage?.total_tokens || 0)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('COMPETITOR_ANALYSIS_FAILED', error.message, true)
        : this.createError('COMPETITOR_ANALYSIS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async generateSEORecommendations(content: string, targetKeywords: string[]): Promise<APIResponse<string[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('seo-recommendations', { content, targetKeywords });
    
    try {
      const cached = this.getCachedResponse<string[]>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = `Analyze this content and provide 5-10 specific SEO improvement recommendations:

Content: "${content.substring(0, 2000)}..."
Target Keywords: ${targetKeywords.join(', ')}

Focus on:
1. Keyword optimization and placement
2. Content structure and readability
3. Meta elements optimization
4. Internal linking opportunities
5. User experience improvements

Provide recommendations as a JSON array of strings.`;

      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an SEO expert. Provide specific, actionable recommendations in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      const recommendations = result.recommendations || [];
      
      this.setCachedResponse(cacheKey, recommendations, 3600);

      return this.createSuccessResponse(
        recommendations,
        startTime,
        false,
        completion.usage?.total_tokens,
        this.calculateCost(completion.usage?.total_tokens || 0)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('SEO_RECOMMENDATIONS_FAILED', error.message, true)
        : this.createError('SEO_RECOMMENDATIONS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  private buildContentAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `Analyze this content for SEO and human-first quality metrics:

Title: "${request.title}"
Meta Description: "${request.metaDescription}"
Content: "${request.content}"
Target Keywords: ${request.targetKeywords.join(', ')}
Human Insights: "${request.humanInsights || 'None provided'}"
Sources: ${request.sources?.join('\n') || 'None provided'}

Provide a comprehensive analysis in this JSON format:
{
  "scores": {
    "overall": 0-100,
    "readability": 0-100,
    "seo": 0-100,
    "originality": 0-100,
    "factCheck": 0-100,
    "humanAuthenticity": 0-100,
    "engagement": 0-100
  },
  "suggestions": [
    {
      "type": "improvement|warning|optimization",
      "category": "readability|seo|structure|content|technical",
      "message": "specific suggestion",
      "impact": "high|medium|low",
      "effort": "easy|moderate|complex",
      "implementation": "how to implement"
    }
  ],
  "readabilityAnalysis": {
    "gradeLevel": number,
    "fleschScore": number,
    "avgSentenceLength": number,
    "avgSyllablesPerWord": number,
    "complexWords": number,
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "seoAnalysis": {
    "titleOptimization": {
      "score": 0-100,
      "length": number,
      "keywordPresence": boolean,
      "suggestions": ["suggestion1"]
    },
    "metaDescription": {
      "score": 0-100,
      "length": number,
      "compelling": boolean,
      "suggestions": ["suggestion1"]
    },
    "keywordOptimization": {
      "score": 0-100,
      "density": number,
      "distribution": "description",
      "suggestions": ["suggestion1"]
    }
  },
  "originalityAnalysis": {
    "score": 0-100,
    "aiDetectionScore": 0-100,
    "plagiarismScore": 0-100,
    "uniquenessIndicators": ["indicator1"],
    "humanMarkers": ["marker1"],
    "suggestions": ["suggestion1"]
  },
  "factCheckAnalysis": {
    "score": 0-100,
    "claimsVerified": number,
    "sourcesProvided": number,
    "sourceQuality": 0-100,
    "factualAccuracy": 0-100,
    "suggestions": ["suggestion1"],
    "flaggedClaims": []
  }
}`;
  }

  private buildCompetitorAnalysisPrompt(request: CompetitorAnalysisRequest): string {
    return `Analyze competitors for this website and provide strategic insights:

Website: ${request.websiteUrl}
Target Keywords: ${request.targetKeywords.join(', ')}
Analysis Depth: ${request.analysisDepth}

Based on the website and keywords, identify 3-5 main competitors and provide analysis in this JSON format:
{
  "competitors": [
    {
      "domain": "competitor.com",
      "domainAuthority": 0-100,
      "monthlyTraffic": "estimated traffic",
      "topKeywords": ["keyword1", "keyword2"],
      "contentGaps": ["gap1", "gap2"],
      "backlinks": number,
      "avgPageSpeed": number,
      "contentQuality": 0-100,
      "technicalSEO": 0-100,
      "lastAnalyzed": "2025-05-29T00:00:00.000Z"
    }
  ],
  "opportunities": [
    {
      "topic": "content topic",
      "keywords": ["keyword1"],
      "difficulty": 0-100,
      "potential": 0-100,
      "contentType": "blog|guide|tutorial|comparison|review",
      "reasoning": "why this is an opportunity",
      "competitorGaps": ["what competitors are missing"]
    }
  ],
  "marketInsights": [
    {
      "insight": "market insight",
      "category": "trend|gap|opportunity|threat",
      "impact": "high|medium|low",
      "timeframe": "immediate|short-term|long-term",
      "actionable": true,
      "recommendations": ["action1", "action2"]
    }
  ],
  "analysisMetadata": {
    "totalCompetitors": number,
    "analysisTime": number,
    "confidence": 0-100
  }
}`;
  }

  private calculateCost(tokens: number): number {
    // GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
    // Simplified calculation assuming 50/50 split
    return (tokens / 1000) * 0.045;
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
