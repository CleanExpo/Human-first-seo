// Claude (Anthropic) API Client for Human-First SEO MVP

import Anthropic from '@anthropic-ai/sdk';
import { BaseAPIClient, createAPIConfig } from './base-client';
import type {
  APIResponse,
  ContentAnalysisRequest,
  ContentAnalysisResponse,
  ReadabilityAnalysis,
  OriginalityAnalysis
} from '@/lib/types/api';

export class ClaudeClient extends BaseAPIClient {
  private anthropic: Anthropic;

  constructor() {
    const config = createAPIConfig('claude');
    super(config);
    
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async analyzeReadability(content: string): Promise<APIResponse<ReadabilityAnalysis>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-readability', { content });
    
    try {
      // Check cache first
      const cached = this.getCachedResponse<ReadabilityAnalysis>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildReadabilityPrompt(content);
      
      const response = await this.executeWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = JSON.parse(analysisText) as ReadabilityAnalysis;
      
      // Cache the response
      this.setCachedResponse(cacheKey, analysis, 3600);

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        response.usage.input_tokens + response.usage.output_tokens,
        this.calculateCost(response.usage.input_tokens + response.usage.output_tokens)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('READABILITY_ANALYSIS_FAILED', error.message, true)
        : this.createError('READABILITY_ANALYSIS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async analyzeOriginality(content: string, humanInsights?: string): Promise<APIResponse<OriginalityAnalysis>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-originality', { content, humanInsights });
    
    try {
      const cached = this.getCachedResponse<OriginalityAnalysis>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildOriginalityPrompt(content, humanInsights);
      
      const response = await this.executeWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 1500,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = JSON.parse(analysisText) as OriginalityAnalysis;
      
      this.setCachedResponse(cacheKey, analysis, 3600);

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        response.usage.input_tokens + response.usage.output_tokens,
        this.calculateCost(response.usage.input_tokens + response.usage.output_tokens)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('ORIGINALITY_ANALYSIS_FAILED', error.message, true)
        : this.createError('ORIGINALITY_ANALYSIS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async enhanceContent(request: ContentAnalysisRequest): Promise<APIResponse<ContentAnalysisResponse>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('enhance-content', request);
    
    try {
      const cached = this.getCachedResponse<ContentAnalysisResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildContentEnhancementPrompt(request);
      
      const response = await this.executeWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 3000,
          temperature: 0.4,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = JSON.parse(analysisText) as ContentAnalysisResponse;
      
      this.setCachedResponse(cacheKey, analysis, 3600);

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        response.usage.input_tokens + response.usage.output_tokens,
        this.calculateCost(response.usage.input_tokens + response.usage.output_tokens)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('CONTENT_ENHANCEMENT_FAILED', error.message, true)
        : this.createError('CONTENT_ENHANCEMENT_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async generateContentGaps(competitorContent: string[], targetKeywords: string[]): Promise<APIResponse<string[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('content-gaps', { competitorContent, targetKeywords });
    
    try {
      const cached = this.getCachedResponse<string[]>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = `Analyze competitor content and identify content gaps and opportunities:

Competitor Content Summaries:
${competitorContent.map((content, i) => `Competitor ${i + 1}: ${content.substring(0, 500)}...`).join('\n\n')}

Target Keywords: ${targetKeywords.join(', ')}

Identify 5-10 specific content gaps where our content could provide unique value. Focus on:
1. Topics competitors haven't covered thoroughly
2. Unique angles or perspectives missing
3. User questions left unanswered
4. Technical details overlooked
5. Human experiences and insights missing

Return as JSON: {"gaps": ["gap1", "gap2", ...]}`;

      const response = await this.executeWithRetry(async () => {
        return await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 1000,
          temperature: 0.5,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
      });

      const resultText = response.content[0].type === 'text' ? response.content[0].text : '';
      const result = JSON.parse(resultText);
      const gaps = result.gaps || [];
      
      this.setCachedResponse(cacheKey, gaps, 86400); // 24 hour cache

      return this.createSuccessResponse(
        gaps,
        startTime,
        false,
        response.usage.input_tokens + response.usage.output_tokens,
        this.calculateCost(response.usage.input_tokens + response.usage.output_tokens)
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('CONTENT_GAPS_FAILED', error.message, true)
        : this.createError('CONTENT_GAPS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  private buildReadabilityPrompt(content: string): string {
    return `Analyze the readability of this content and provide detailed metrics:

Content: "${content}"

Provide a comprehensive readability analysis in JSON format:
{
  "gradeLevel": number (Flesch-Kincaid grade level),
  "fleschScore": number (0-100, higher = more readable),
  "avgSentenceLength": number,
  "avgSyllablesPerWord": number,
  "complexWords": number (words with 3+ syllables),
  "suggestions": [
    "specific suggestion to improve readability",
    "another actionable suggestion"
  ]
}

Focus on:
- Sentence structure and length
- Word choice and complexity
- Paragraph organization
- Transition quality
- Overall flow and clarity`;
  }

  private buildOriginalityPrompt(content: string, humanInsights?: string): string {
    return `Analyze this content for originality and human authenticity:

Content: "${content}"
Human Insights: "${humanInsights || 'None provided'}"

Evaluate the content for originality and human markers. Provide analysis in JSON format:
{
  "score": number (0-100, higher = more original),
  "aiDetectionScore": number (0-100, higher = more likely AI-generated),
  "plagiarismScore": number (0-100, higher = more likely plagiarized),
  "uniquenessIndicators": [
    "personal anecdotes",
    "specific examples",
    "unique perspectives"
  ],
  "humanMarkers": [
    "conversational tone",
    "personal experience",
    "emotional language"
  ],
  "suggestions": [
    "Add more personal experiences",
    "Include specific examples from your work"
  ]
}

Look for:
- Personal experiences and anecdotes
- Unique insights and perspectives
- Conversational and natural language
- Specific examples and case studies
- Emotional resonance and authenticity
- Original research or data`;
  }

  private buildContentEnhancementPrompt(request: ContentAnalysisRequest): string {
    return `Enhance and analyze this content for human-first quality:

Title: "${request.title}"
Meta Description: "${request.metaDescription}"
Content: "${request.content}"
Target Keywords: ${request.targetKeywords.join(', ')}
Human Insights: "${request.humanInsights || 'None provided'}"

Provide comprehensive enhancement suggestions in JSON format:
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
      "message": "specific enhancement suggestion",
      "impact": "high|medium|low",
      "effort": "easy|moderate|complex",
      "implementation": "detailed implementation steps"
    }
  ],
  "readabilityAnalysis": {
    "gradeLevel": number,
    "fleschScore": number,
    "avgSentenceLength": number,
    "avgSyllablesPerWord": number,
    "complexWords": number,
    "suggestions": ["readability improvement"]
  },
  "originalityAnalysis": {
    "score": 0-100,
    "aiDetectionScore": 0-100,
    "plagiarismScore": 0-100,
    "uniquenessIndicators": ["unique element"],
    "humanMarkers": ["human marker"],
    "suggestions": ["originality improvement"]
  }
}

Focus on human-first content principles:
- Authenticity and personal voice
- Clear, accessible language
- Valuable insights and experiences
- Engaging storytelling
- Practical, actionable advice`;
  }

  private calculateCost(tokens: number): number {
    // Claude pricing: $0.003 per 1K input tokens, $0.015 per 1K output tokens
    // Simplified calculation assuming 60/40 split (more input than output)
    return (tokens / 1000) * 0.009;
  }
}

// Export singleton instance
export const claudeClient = new ClaudeClient();
