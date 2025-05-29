// Google Gemini API Client for Human-First SEO MVP

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseAPIClient, createAPIConfig } from './base-client';
import type {
  APIResponse,
  KeywordResearchRequest,
  KeywordResearchResponse,
  SEOAnalysis,
  ContentSuggestion
} from '@/lib/types/api';

export class GeminiClient extends BaseAPIClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const config = createAPIConfig('gemini');
    super(config);
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
  }

  async analyzeKeywords(request: KeywordResearchRequest): Promise<APIResponse<KeywordResearchResponse>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('analyze-keywords', request);
    
    try {
      // Check cache first
      const cached = this.getCachedResponse<KeywordResearchResponse>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildKeywordAnalysisPrompt(request);
      
      const result = await this.executeWithRetry(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const analysisText = response.text();
      const analysis = JSON.parse(analysisText) as KeywordResearchResponse;
      
      // Cache the response for 24 hours (keywords don't change frequently)
      this.setCachedResponse(cacheKey, analysis, 86400);

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        this.estimateTokens(prompt + analysisText),
        this.calculateCost(this.estimateTokens(prompt + analysisText))
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('KEYWORD_ANALYSIS_FAILED', error.message, true)
        : this.createError('KEYWORD_ANALYSIS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async optimizeSEO(title: string, content: string, targetKeywords: string[]): Promise<APIResponse<SEOAnalysis>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('optimize-seo', { title, content, targetKeywords });
    
    try {
      const cached = this.getCachedResponse<SEOAnalysis>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = this.buildSEOOptimizationPrompt(title, content, targetKeywords);
      
      const result = await this.executeWithRetry(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const analysisText = response.text();
      const analysis = JSON.parse(analysisText) as SEOAnalysis;
      
      this.setCachedResponse(cacheKey, analysis, 3600); // 1 hour cache

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        this.estimateTokens(prompt + analysisText),
        this.calculateCost(this.estimateTokens(prompt + analysisText))
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('SEO_OPTIMIZATION_FAILED', error.message, true)
        : this.createError('SEO_OPTIMIZATION_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async generateContentSuggestions(topic: string, targetAudience: string, contentType: string): Promise<APIResponse<ContentSuggestion[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('content-suggestions', { topic, targetAudience, contentType });
    
    try {
      const cached = this.getCachedResponse<ContentSuggestion[]>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = `Generate 8-10 specific content improvement suggestions for this topic:

Topic: "${topic}"
Target Audience: "${targetAudience}"
Content Type: "${contentType}"

Focus on human-first content principles and provide actionable suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "improvement|warning|optimization",
      "category": "readability|seo|structure|content|technical",
      "message": "specific, actionable suggestion",
      "impact": "high|medium|low",
      "effort": "easy|moderate|complex",
      "implementation": "detailed steps to implement this suggestion"
    }
  ]
}

Prioritize suggestions that:
1. Improve user experience and readability
2. Add authentic, personal value
3. Enhance SEO without keyword stuffing
4. Make content more engaging and shareable
5. Improve technical performance`;

      const result = await this.executeWithRetry(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const resultText = response.text();
      const parsed = JSON.parse(resultText);
      const suggestions = parsed.suggestions || [];
      
      this.setCachedResponse(cacheKey, suggestions, 3600);

      return this.createSuccessResponse(
        suggestions,
        startTime,
        false,
        this.estimateTokens(prompt + resultText),
        this.calculateCost(this.estimateTokens(prompt + resultText))
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('CONTENT_SUGGESTIONS_FAILED', error.message, true)
        : this.createError('CONTENT_SUGGESTIONS_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  async analyzeContentStructure(content: string): Promise<APIResponse<{
    headingStructure: { level: number; text: string; seoScore: number }[];
    recommendations: string[];
    overallScore: number;
  }>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('content-structure', { content });
    
    try {
      const cached = this.getCachedResponse<{
        headingStructure: { level: number; text: string; seoScore: number }[];
        recommendations: string[];
        overallScore: number;
      }>(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached, startTime, true);
      }

      await this.checkRateLimit();
      this.validateConfig();

      const prompt = `Analyze the content structure and heading hierarchy:

Content: "${content}"

Provide a detailed analysis in JSON format:
{
  "headingStructure": [
    {
      "level": 1,
      "text": "heading text",
      "seoScore": 0-100
    }
  ],
  "recommendations": [
    "specific recommendation for improving structure",
    "another actionable suggestion"
  ],
  "overallScore": 0-100
}

Evaluate:
- Logical heading hierarchy (H1 → H2 → H3)
- Keyword usage in headings
- Content organization and flow
- Readability and scannability
- SEO optimization opportunities`;

      const result = await this.executeWithRetry(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const analysisText = response.text();
      const analysis = JSON.parse(analysisText);
      
      this.setCachedResponse(cacheKey, analysis, 3600);

      return this.createSuccessResponse(
        analysis,
        startTime,
        false,
        this.estimateTokens(prompt + analysisText),
        this.calculateCost(this.estimateTokens(prompt + analysisText))
      );

    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('CONTENT_STRUCTURE_FAILED', error.message, true)
        : this.createError('CONTENT_STRUCTURE_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  private buildKeywordAnalysisPrompt(request: KeywordResearchRequest): string {
    return `Perform comprehensive keyword research and analysis:

Seed Keywords: ${request.seedKeywords.join(', ')}
Target Audience: ${request.targetAudience || 'General'}
Industry: ${request.industry || 'General'}
Location: ${request.location || 'Global'}

Provide detailed keyword analysis in JSON format:
{
  "keywords": [
    {
      "keyword": "specific keyword phrase",
      "searchVolume": estimated_monthly_searches,
      "difficulty": 0-100,
      "cpc": "$X.XX",
      "trend": "up|down|stable",
      "opportunity": "high|medium|low",
      "intent": "informational|commercial|transactional|navigational",
      "relatedKeywords": ["related1", "related2"]
    }
  ],
  "clusters": [
    {
      "theme": "cluster theme",
      "keywords": [keyword_objects],
      "priority": "high|medium|low",
      "contentSuggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "suggestions": ["additional keyword suggestions"],
  "metadata": {
    "totalKeywords": number,
    "avgDifficulty": number,
    "totalSearchVolume": number
  }
}

Focus on:
1. Long-tail keywords with commercial intent
2. Question-based keywords for FAQ content
3. Local SEO opportunities if location specified
4. Semantic keyword variations
5. Content gap opportunities`;
  }

  private buildSEOOptimizationPrompt(title: string, content: string, targetKeywords: string[]): string {
    return `Analyze and optimize this content for SEO:

Title: "${title}"
Content: "${content}"
Target Keywords: ${targetKeywords.join(', ')}

Provide comprehensive SEO analysis in JSON format:
{
  "titleOptimization": {
    "score": 0-100,
    "length": number,
    "keywordPresence": boolean,
    "suggestions": ["improvement suggestions"]
  },
  "metaDescription": {
    "score": 0-100,
    "length": number,
    "compelling": boolean,
    "suggestions": ["meta description suggestions"]
  },
  "headingStructure": {
    "score": 0-100,
    "h1Count": number,
    "h2Count": number,
    "hierarchy": boolean,
    "suggestions": ["heading improvements"]
  },
  "keywordOptimization": {
    "score": 0-100,
    "density": percentage,
    "distribution": "description of keyword placement",
    "suggestions": ["keyword optimization tips"]
  },
  "internalLinking": {
    "score": 0-100,
    "count": number,
    "suggestions": ["internal linking opportunities"]
  },
  "externalLinking": {
    "score": 0-100,
    "count": number,
    "authorityScore": 0-100,
    "suggestions": ["external linking recommendations"]
  }
}

Evaluate:
- Keyword placement and density
- Content structure and organization
- Technical SEO elements
- User experience factors
- E-A-T (Expertise, Authoritativeness, Trustworthiness)`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateCost(tokens: number): number {
    // Gemini pricing: $0.00025 per 1K input tokens, $0.0005 per 1K output tokens
    // Simplified calculation assuming 60/40 split
    return (tokens / 1000) * 0.00035;
  }
}

// Export singleton instance
export const geminiClient = new GeminiClient();
