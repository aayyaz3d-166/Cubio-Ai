/**
 * 3D Memory Studio — Funnel 62
 * Multi-Provider LLM Model Registry
 */

import { LLMModelInfo, LLMProviderId } from './llmTypes';

export class ModelRegistry {
  private models: Map<string, LLMModelInfo> = new Map();

  constructor() {
    this.registerStandardModels();
  }

  private registerStandardModels(): void {
    const standard: LLMModelInfo[] = [
      {
        modelId: 'gemini-2.5-pro',
        providerId: 'GOOGLE_GEMINI',
        providerName: 'Google Gemini',
        displayName: 'Gemini 2.5 Pro (Deep Reasoning)',
        contextWindowTokens: 1048576,
        isAvailable: true,
        isDefault: true,
      },
      {
        modelId: 'gemini-2.5-flash',
        providerId: 'GOOGLE_GEMINI',
        providerName: 'Google Gemini',
        displayName: 'Gemini 2.5 Flash (Ultra Fast)',
        contextWindowTokens: 1048576,
        isAvailable: true,
      },
      {
        modelId: 'gpt-4o',
        providerId: 'OPENAI',
        providerName: 'OpenAI',
        displayName: 'GPT-4o (Omni Multimodal)',
        contextWindowTokens: 128000,
        isAvailable: true,
      },
      {
        modelId: 'gpt-4o-mini',
        providerId: 'OPENAI',
        providerName: 'OpenAI',
        displayName: 'GPT-4o Mini (Efficient)',
        contextWindowTokens: 128000,
        isAvailable: true,
      },
      {
        modelId: 'claude-3-7-sonnet',
        providerId: 'ANTHROPIC',
        providerName: 'Anthropic',
        displayName: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
        contextWindowTokens: 200000,
        isAvailable: true,
      },
      {
        modelId: 'local-deepseek-r1',
        providerId: 'LOCAL_LLM',
        providerName: 'Local LLM Host',
        displayName: 'DeepSeek-R1 (Local On-Device)',
        contextWindowTokens: 32768,
        isAvailable: true,
      },
    ];

    for (const m of standard) {
      this.models.set(m.modelId, m);
    }
  }

  public getAllModels(): readonly LLMModelInfo[] {
    return Array.from(this.models.values());
  }

  public getModel(id: string): LLMModelInfo | undefined {
    return this.models.get(id);
  }

  public getModelsByProvider(providerId: LLMProviderId): readonly LLMModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.providerId === providerId);
  }

  public getDefaultModel(): LLMModelInfo {
    return this.models.get('gemini-2.5-pro') || Array.from(this.models.values())[0];
  }

  public registerModel(model: LLMModelInfo): boolean {
    if (this.models.has(model.modelId)) return false;
    this.models.set(model.modelId, model);
    return true;
  }

  public get count(): number {
    return this.models.size;
  }
}
