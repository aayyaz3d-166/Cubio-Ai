/**
 * 3D Memory Studio — Funnel 64
 * Workspace LLM Model Registry
 */

export type LLMProviderName = 'GEMINI' | 'GPT' | 'CLAUDE' | 'GROK' | 'OTHER';

export interface WorkspaceModelInfo {
  readonly modelId: string;
  readonly provider: LLMProviderName;
  readonly displayName: string;
  readonly capabilities: readonly string[];
  readonly available: boolean;
  selected: boolean;
}

export class WorkspaceModelRegistry {
  private models: Map<string, WorkspaceModelInfo> = new Map();
  private selectedId: string = 'gemini-2.5-pro';

  constructor() {
    this.registerStandardModels();
  }

  private registerStandardModels(): void {
    const standard: WorkspaceModelInfo[] = [
      {
        modelId: 'gemini-2.5-pro',
        provider: 'GEMINI',
        displayName: 'Google Gemini 2.5 Pro',
        capabilities: ['Deep Reasoning', 'Multimodal 3D Analysis', '1M Context'],
        available: true,
        selected: true,
      },
      {
        modelId: 'gemini-2.5-flash',
        provider: 'GEMINI',
        displayName: 'Google Gemini 2.5 Flash',
        capabilities: ['Ultra-Low Latency', 'Fast Index Query'],
        available: true,
        selected: false,
      },
      {
        modelId: 'gpt-4o',
        provider: 'GPT',
        displayName: 'OpenAI GPT-4o',
        capabilities: ['General Knowledge', 'Multimodal Code Synthesis'],
        available: true,
        selected: false,
      },
      {
        modelId: 'claude-3-7-sonnet',
        provider: 'CLAUDE',
        displayName: 'Anthropic Claude 3.7 Sonnet',
        capabilities: ['Hybrid Reasoning', 'Deep Spatial Logic'],
        available: true,
        selected: false,
      },
      {
        modelId: 'grok-2',
        provider: 'GROK',
        displayName: 'xAI Grok-2',
        capabilities: ['Real-time Synthesis', 'Spatial Inference'],
        available: true,
        selected: false,
      },
      {
        modelId: 'local-deepseek-r1',
        provider: 'OTHER',
        displayName: 'Local DeepSeek-R1',
        capabilities: ['On-Device Bounded Processing'],
        available: true,
        selected: false,
      },
    ];

    for (const m of standard) {
      this.models.set(m.modelId, { ...m });
    }
  }

  public registerModel(model: WorkspaceModelInfo): boolean {
    if (this.models.has(model.modelId)) return false;
    this.models.set(model.modelId, { ...model });
    return true;
  }

  public removeModel(modelId: string): boolean {
    return this.models.delete(modelId);
  }

  public getModel(modelId: string): WorkspaceModelInfo | undefined {
    return this.models.get(modelId);
  }

  public getAvailableModels(): readonly WorkspaceModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.available);
  }

  public selectModel(modelId: string): boolean {
    if (!this.models.has(modelId)) return false;
    for (const [id, m] of this.models) {
      m.selected = id === modelId;
    }
    this.selectedId = modelId;
    return true;
  }

  public get selectedModel(): WorkspaceModelInfo {
    return this.models.get(this.selectedId) || Array.from(this.models.values())[0];
  }

  public get count(): number {
    return this.models.size;
  }
}
