// Core API Types for Human-First SEO MVP

export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'perplexity';

export interface LLMResponse<T = unknown> {
  provider: LLMProvider;
  confidence: number;
  data: T;
  timestamp: Date;
  tokens_used?: number;
  cost?: number;
}

export interface ConsensusResult<T = unknown> {
  finalScore: number;
  confidence: number;
  sources: LLMResponse<T>[];
  reasoning: string;
  metadata?: Record<string, unknown>;
}

export interface APIError {
  code: string;
  message: string;
  provider?: LLMProvider;
  retryable: boolean;
  timestamp: Date;
}

// Competitor Analysis Types
export interface CompetitorData {
  domain: string;
  domainAuthority: number;
  monthlyTraffic: string;
  topKeywords: string[];
  contentGaps: string[];
  backlinks: number;
  avgPageSpeed: number;
  contentQuality: number;
  technicalSEO: number;
  lastAnalyzed: Date;
}

export interface CompetitorAnalysisRequest {
  websiteUrl: string;
  targetKeywords: string[];
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface CompetitorAnalysisResponse {
  competitors: CompetitorData[];
  opportunities: ContentOpportunity[];
  marketInsights: MarketInsight[];
  analysisMetadata: {
    totalCompetitors: number;
    analysisTime: number;
    confidence: number;
  };
}

// Keyword Research Types
export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: string;
  trend: 'up' | 'down' | 'stable';
  opportunity: 'high' | 'medium' | 'low';
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  relatedKeywords: string[];
}

export interface KeywordResearchRequest {
  seedKeywords: string[];
  targetAudience?: string;
  industry?: string;
  location?: string;
}

export interface KeywordResearchResponse {
  keywords: KeywordData[];
  clusters: KeywordCluster[];
  suggestions: string[];
  metadata: {
    totalKeywords: number;
    avgDifficulty: number;
    totalSearchVolume: number;
  };
}

export interface KeywordCluster {
  theme: string;
  keywords: KeywordData[];
  priority: 'high' | 'medium' | 'low';
  contentSuggestions: string[];
}

// Content Analysis Types
export interface ContentAnalysisRequest {
  title: string;
  metaDescription: string;
  content: string;
  targetKeywords: string[];
  humanInsights?: string;
  sources?: string[];
}

export interface ContentAnalysisResponse {
  scores: ContentScores;
  suggestions: ContentSuggestion[];
  readabilityAnalysis: ReadabilityAnalysis;
  seoAnalysis: SEOAnalysis;
  originalityAnalysis: OriginalityAnalysis;
  factCheckAnalysis: FactCheckAnalysis;
}

export interface ContentScores {
  overall: number;
  readability: number;
  seo: number;
  originality: number;
  factCheck: number;
  humanAuthenticity: number;
  engagement: number;
}

export interface ContentSuggestion {
  type: 'improvement' | 'warning' | 'optimization';
  category: 'readability' | 'seo' | 'structure' | 'content' | 'technical';
  message: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  implementation?: string;
}

export interface ReadabilityAnalysis {
  gradeLevel: number;
  fleschScore: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  complexWords: number;
  suggestions: string[];
}

export interface SEOAnalysis {
  titleOptimization: {
    score: number;
    length: number;
    keywordPresence: boolean;
    suggestions: string[];
  };
  metaDescription: {
    score: number;
    length: number;
    compelling: boolean;
    suggestions: string[];
  };
  headingStructure: {
    score: number;
    h1Count: number;
    h2Count: number;
    hierarchy: boolean;
    suggestions: string[];
  };
  keywordOptimization: {
    score: number;
    density: number;
    distribution: string;
    suggestions: string[];
  };
  internalLinking: {
    score: number;
    count: number;
    suggestions: string[];
  };
  externalLinking: {
    score: number;
    count: number;
    authorityScore: number;
    suggestions: string[];
  };
}

export interface OriginalityAnalysis {
  score: number;
  aiDetectionScore: number;
  plagiarismScore: number;
  uniquenessIndicators: string[];
  humanMarkers: string[];
  suggestions: string[];
}

export interface FactCheckAnalysis {
  score: number;
  claimsVerified: number;
  sourcesProvided: number;
  sourceQuality: number;
  factualAccuracy: number;
  suggestions: string[];
  flaggedClaims: FlaggedClaim[];
}

export interface FlaggedClaim {
  claim: string;
  confidence: number;
  reasoning: string;
  suggestedSources: string[];
}

// Content Opportunities
export interface ContentOpportunity {
  topic: string;
  keywords: string[];
  difficulty: number;
  potential: number;
  contentType: 'blog' | 'guide' | 'tutorial' | 'comparison' | 'review';
  reasoning: string;
  competitorGaps: string[];
}

export interface MarketInsight {
  insight: string;
  category: 'trend' | 'gap' | 'opportunity' | 'threat';
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  actionable: boolean;
  recommendations: string[];
}

// API Configuration
export interface APIConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

export interface CacheConfig {
  ttl: number; // time to live in seconds
  maxSize?: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

// Rate Limiting
export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
  provider: LLMProvider;
}

// Request/Response Wrappers
export interface APIRequest<T = unknown> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata: {
    timestamp: Date;
    duration: number;
    provider?: LLMProvider;
    cached?: boolean;
    tokensUsed?: number;
    cost?: number;
  };
}

// Webhook and Real-time Types
export interface WebhookPayload {
  event: string;
  data: unknown;
  timestamp: Date;
  signature?: string;
}

export interface RealtimeUpdate {
  type: 'score_update' | 'analysis_complete' | 'error' | 'progress';
  data: unknown;
  timestamp: Date;
}

// Analytics and Monitoring
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  apiLatency: Record<LLMProvider, number>;
  successRate: Record<LLMProvider, number>;
  errorRate: Record<LLMProvider, number>;
  costPerRequest: Record<LLMProvider, number>;
  cacheHitRate: number;
}
