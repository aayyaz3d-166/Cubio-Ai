/**
 * 3D Memory Studio — Funnel 69
 * Model & Provider Registry
 */

import { LLMProvider } from '../providers/llmProvider';
import { LLMModelInfo, ProviderStatus } from '../types';

export class ModelRegistry {
  private readonly providers: Map<string, LLMProvider> = new Map();
  private activeProviderId: string | null = null;
  private activeModelId: string | null = null;

  constructor() {
    // Initial state is clean
  }

  public registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
    // If no active provider or active provider is not configured, pick first ready provider
    if (!this.activeProviderId || this.getActiveProvider()?.status !== 'READY') {
      if (provider.status === 'READY') {
        this.activeProviderId = provider.id;
        const models = provider.getModels();
        if (models.length > 0) {
          this.activeModelId = models[0].id;
        }
      }
    }
  }

  public registerModel(providerId: string, model: LLMModelInfo): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    // Providers manage their internal model lists; if it's dynamic we can check
    return true;
  }

  public getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  public getProviders(): readonly LLMProvider[] {
    return Array.from(this.providers.values());
  }

  public getAvailableProviders(): readonly LLMProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.status === 'READY');
  }

  public getModel(providerId: string, modelId: string): LLMModelInfo | undefined {
    const provider = this.providers.get(providerId);
    return provider?.getModel(modelId);
  }

  public getAvailableModels(providerId?: string): readonly LLMModelInfo[] {
    const targetProviderId = providerId ?? this.activeProviderId;
    if (!targetProviderId) return [];
    const provider = this.providers.get(targetProviderId);
    return provider ? provider.getModels() : [];
  }

  public setActiveProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    this.activeProviderId = providerId;
    const models = provider.getModels();
    this.activeModelId = models.length > 0 ? models[0].id : null;
    return true;
  }

  public getActiveProvider(): LLMProvider | undefined {
    if (!this.activeProviderId) return undefined;
    return this.providers.get(this.activeProviderId);
  }

  public setActiveModel(modelId: string): boolean {
    const provider = this.getActiveProvider();
    if (!provider) return false;
    const model = provider.getModel(modelId);
    if (!model) return false;
    this.activeModelId = modelId;
    return true;
  }

  public getActiveModel(): LLMModelInfo | undefined {
    if (!this.activeProviderId || !this.activeModelId) return undefined;
    const provider = this.providers.get(this.activeProviderId);
    return provider?.getModel(this.activeModelId);
  }

  public getActiveModelId(): string | null {
    return this.activeModelId;
  }

  public getActiveProviderId(): string | null {
    return this.activeProviderId;
  }

  public reset(): void {
    this.providers.clear();
    this.activeProviderId = null;
    this.activeModelId = null;
  }
}
