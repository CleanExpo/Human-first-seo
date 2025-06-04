// Perplexity API Client for Human-First SEO MVP

import { BaseAPIClient, createAPIConfig } from './base-client';
import type {
  APIResponse,
  ContentAnalysisRequest,
  ContentAnalysisResponse,
  CompetitorAnalysisRequest,
  CompetitorAnalysisResponse
} from '@/lib/types/api';

export class PerplexityClient extends BaseAPIClient {
  private apiUrl: string;

  constructor() {
    const config = createAPIConfig('perplexity');
    super(config);
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
  }

  async analyzeContent(request: ContentAnalysisRequest): Promise<APIResponse<ContentAnalysisResponse>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-content', request);

    try {
      const cached = this.getCachedResponse<ContentAnalysisResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildContentAnalysisPrompt(request);

      const completion = await this.executeWithRetry(async () => {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: 'You are an expert SEO content analyst specializing in human-first content evaluation. Provide detailed, actionable analysis in JSON format.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });
        if (!res.ok) {
          throw new Error(`Perplexity API error: ${res.status} ${await res.text()}`);
        }
        return res.json();
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}') as ContentAnalysisResponse;
      this.setCachedResponse(cacheKey, response, 3600);

      const tokens = completion.usage?.total_tokens || 0;

      return this.createSuccessResponse(
        response,
        startTime,
        false,
        tokens,
        this.calculateCost(tokens)
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
      const cached = this.getCachedResponse<CompetitorAnalysisResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildCompetitorAnalysisPrompt(request);

      const completion = await this.executeWithRetry(async () => {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: 'system', content: 'You are an expert SEO strategist specializing in competitive analysis. Provide strategic insights and actionable recommendations in JSON format.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 3000
          })
        });
        if (!res.ok) {
          throw new Error(`Perplexity API error: ${res.status} ${await res.text()}`);
        }
        return res.json();
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}') as CompetitorAnalysisResponse;
      this.setCachedResponse(cacheKey, response, 86400);

      const tokens = completion.usage?.total_tokens || 0;

      return this.createSuccessResponse(
        response,
        startTime,
        false,
        tokens,
        this.calculateCost(tokens)
      );
    } catch (error) {
      const apiError = error instanceof Error
        ? this.createError('COMPETITOR_ANALYSIS_FAILED', error.message, true)
        : this.createError('COMPETITOR_ANALYSIS_FAILED', 'Unknown error', true);

      return this.createErrorResponse(apiError, startTime);
    }
  }

  private buildContentAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `Analyze this content for SEO and human-first quality metrics:\n\nTitle: "${request.title}"\nMeta Description: "${request.metaDescription}"\nContent: "${request.content}"\nTarget Keywords: ${request.targetKeywords.join(', ')}\nHuman Insights: "${request.humanInsights || 'None provided'}"\nSources: ${request.sources?.join('\\n') || 'None provided'}\n\nProvide a comprehensive analysis in JSON format.`;
  }

  private buildCompetitorAnalysisPrompt(request: CompetitorAnalysisRequest): string {
    return `Analyze competitors for this website and provide strategic insights:\n\nWebsite: ${request.websiteUrl}\nTarget Keywords: ${request.targetKeywords.join(', ')}\nAnalysis Depth: ${request.analysisDepth}\n\nBased on the website and keywords, identify 3-5 main competitors and provide analysis in JSON format.`;
  }

  private calculateCost(tokens: number): number {
    // Approximate Perplexity pricing
    return (tokens / 1000) * 0.008;
  }
}

export const perplexityClient = new PerplexityClient();

