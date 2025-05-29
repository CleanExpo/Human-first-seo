// Base API Client with Error Handling and Rate Limiting

import NodeCache from 'node-cache';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import type {
  APIConfig,
  APIError,
  APIResponse,
  LLMProvider,
  RateLimitInfo,
  CacheConfig
} from '@/lib/types/api';

export class BaseAPIClient {
  protected config: APIConfig;
  protected cache: NodeCache;
  protected rateLimiter: RateLimiterMemory;
  protected provider: LLMProvider;

  constructor(config: APIConfig, cacheConfig?: CacheConfig) {
    this.config = config;
    this.provider = config.provider;
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: cacheConfig?.ttl || 3600, // 1 hour default
      maxKeys: cacheConfig?.maxSize || 1000,
      useClones: false
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      points: config.rateLimit?.requests || 100,
      duration: config.rateLimit?.window || 60, // per 60 seconds
    });
  }

  protected async checkRateLimit(): Promise<void> {
    try {
      await this.rateLimiter.consume(this.provider);
    } catch (rateLimiterRes: unknown) {
      const res = rateLimiterRes as { msBeforeNext?: number };
      const secs = Math.round((res.msBeforeNext || 60000) / 1000) || 1;
      throw this.createError(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. Try again in ${secs} seconds.`,
        true
      );
    }
  }

  protected getRateLimitInfo(): RateLimitInfo {
    // Note: rate-limiter-flexible doesn't provide direct access to remaining points
    return {
      remaining: this.config.rateLimit?.requests || 100,
      reset: new Date(Date.now() + 60000), // 1 minute from now
      limit: this.config.rateLimit?.requests || 100,
      provider: this.provider
    };
  }

  protected getCacheKey(endpoint: string, data?: unknown): string {
    const dataHash = data ? JSON.stringify(data) : '';
    return `${this.provider}:${endpoint}:${Buffer.from(dataHash).toString('base64')}`;
  }

  protected getCachedResponse<T>(cacheKey: string): T | null {
    return this.cache.get<T>(cacheKey) || null;
  }

  protected setCachedResponse<T>(cacheKey: string, data: T, ttl?: number): void {
    this.cache.set(cacheKey, data, ttl || 3600);
  }

  protected createError(
    code: string,
    message: string,
    retryable: boolean = false
  ): APIError {
    return {
      code,
      message,
      provider: this.provider,
      retryable,
      timestamp: new Date()
    };
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on non-retryable errors
        if (error instanceof Error && error.message.includes('RATE_LIMIT_EXCEEDED')) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  protected createSuccessResponse<T>(
    data: T,
    startTime: number,
    cached: boolean = false,
    tokensUsed?: number,
    cost?: number
  ): APIResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        provider: this.provider,
        cached,
        tokensUsed,
        cost
      }
    };
  }

  protected createErrorResponse<T>(
    error: APIError,
    startTime: number
  ): APIResponse<T> {
    return {
      success: false,
      error,
      metadata: {
        timestamp: new Date(),
        duration: Date.now() - startTime,
        provider: this.provider,
        cached: false
      }
    };
  }

  // Utility method to validate environment variables
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw this.createError(
        'MISSING_API_KEY',
        `API key is required for ${this.provider}`,
        false
      );
    }

    if (!this.config.model) {
      throw this.createError(
        'MISSING_MODEL',
        `Model is required for ${this.provider}`,
        false
      );
    }
  }

  // Health check method
  async healthCheck(): Promise<APIResponse<{ status: string; provider: LLMProvider }>> {
    const startTime = Date.now();
    
    try {
      this.validateConfig();
      await this.checkRateLimit();
      
      return this.createSuccessResponse(
        { status: 'healthy', provider: this.provider },
        startTime
      );
    } catch (error) {
      const apiError = error instanceof Error 
        ? this.createError('HEALTH_CHECK_FAILED', error.message, true)
        : this.createError('HEALTH_CHECK_FAILED', 'Unknown error', true);
      
      return this.createErrorResponse(apiError, startTime);
    }
  }

  // Clear cache method
  clearCache(): void {
    this.cache.flushAll();
  }

  // Get cache statistics
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}

// Utility function to create API config from environment variables
export function createAPIConfig(provider: LLMProvider): APIConfig {
  const envPrefix = provider.toUpperCase();
  
  return {
    provider,
    apiKey: process.env[`${envPrefix}_API_KEY`] || '',
    model: process.env[`${envPrefix}_MODEL`] || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : provider === 'claude' ? 'claude-3-haiku-20240307' : ''),
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3'),
    rateLimit: {
      requests: parseInt(process.env.API_RATE_LIMIT || '100'),
      window: 60
    }
  };
}

// Utility function to validate all required environment variables
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY', 
    'GOOGLE_AI_API_KEY',
    'PERPLEXITY_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}
