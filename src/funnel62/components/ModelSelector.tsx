/**
 * 3D Memory Studio — Funnel 62
 * Component: ModelSelector
 *
 * Provider-agnostic LLM Model Selector dropdown.
 */

import React from 'react';
import { ModelRegistry } from '../ai/modelRegistry';
import { Bot, ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
  modelRegistry: ModelRegistry;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  modelRegistry,
  selectedModelId,
  onSelectModel,
}) => {
  const models = modelRegistry.getAllModels();

  return (
    <div className="flex items-center gap-1.5 bg-[#18181c] border border-zinc-700 px-2 py-1 rounded text-xs font-mono">
      <Bot className="w-3.5 h-3.5 text-cyan-400" />
      <select
        value={selectedModelId}
        onChange={(e) => onSelectModel(e.target.value)}
        className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer text-xs"
      >
        {models.map((m) => (
          <option key={m.modelId} value={m.modelId} className="bg-[#18181c] text-white">
            {m.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};
