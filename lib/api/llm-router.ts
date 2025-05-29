import { OpenAIClient } from './openai-client';
import { ClaudeClient } from './claude-client';
import { GeminiClient } from './gemini-client';

export interface LLMProvider {
  name: string;
  client: any;
  priority: number;
  available: boolean;
  lastError?: string;
}

export class LLMRouter {
  private providers: LLMProvider[] = [];
  private currentProvider: LLMProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Priority order: Claude (1) -> Gemini (2) -> OpenAI (3)
    // Claude is now primary due to OpenAI quota issues
    this.providers = [
      {
        name: 'claude',
        client: new ClaudeClient(),
        priority: 1,
        available: true
      },
      {
        name: 'gemini',
        client: new GeminiClient(),
        priority: 2,
        available: true
      },
      {
        name: 'openai',
        client: new OpenAIClient(),
        priority: 3,
        available: false, // Disabled due to quota
        lastError: 'Quota exceeded - temporarily disabled'
      }
    ];

    // Set Claude as current provider
    this.currentProvider = this.providers[0];
  }

  async generateContent(prompt: string, options: any = {}): Promise<any> {
    const maxRetries = this.providers.length;
    let lastError: Error | null = null;

    // Try providers in priority order
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const provider = this.getNextAvailableProvider();
      
      if (!provider) {
        throw new Error('No available LLM providers');
      }

      try {
        console.log(`🤖 Using ${provider.name.toUpperCase()} for content generation`);
        
        const result = await this.callProvider(provider, prompt, options);
        
        // Mark provider as working
        provider.available = true;
        provider.lastError = undefined;
        this.currentProvider = provider;
        
        return {
          content: result,
          provider: provider.name,
          success: true
        };

      } catch (error: any) {
        console.warn(`❌ ${provider.name} failed:`, error.message);
        
        // Mark provider as temporarily unavailable
        provider.available = false;
        provider.lastError = error.message;
        lastError = error;

        // If quota error, disable for longer
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          console.log(`🚫 ${provider.name} quota exceeded - disabling temporarily`);
        }
      }
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
  }

  private getNextAvailableProvider(): LLMProvider | null {
    // Find the highest priority available provider
    const available = this.providers
      .filter(p => p.available)
      .sort((a, b) => a.priority - b.priority);
    
    return available[0] || null;
  }

  private async callProvider(provider: LLMProvider, prompt: string, options: any): Promise<string> {
    switch (provider.name) {
      case 'claude':
        return await provider.client.generateText(prompt, {
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          maxTokens: options.maxTokens || 1000,
          ...options
        });

      case 'gemini':
        return await provider.client.generateText(prompt, {
          model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-pro',
          maxTokens: options.maxTokens || 1000,
          ...options
        });

      case 'openai':
        return await provider.client.generateText(prompt, {
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          maxTokens: options.maxTokens || 1000,
          ...options
        });

      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  // Method to re-enable OpenAI when quota resets
  enableOpenAI() {
    const openaiProvider = this.providers.find(p => p.name === 'openai');
    if (openaiProvider) {
      openaiProvider.available = true;
      openaiProvider.lastError = undefined;
      console.log('✅ OpenAI re-enabled');
    }
  }

  // Get current provider status
  getProviderStatus() {
    return this.providers.map(p => ({
      name: p.name,
      available: p.available,
      priority: p.priority,
      lastError: p.lastError,
      isCurrent: this.currentProvider?.name === p.name
    }));
  }

  // Force switch to specific provider
  switchToProvider(providerName: string) {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider && provider.available) {
      this.currentProvider = provider;
      console.log(`🔄 Switched to ${providerName.toUpperCase()}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
