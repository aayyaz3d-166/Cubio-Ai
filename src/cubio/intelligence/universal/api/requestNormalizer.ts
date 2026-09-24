/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F69: Universal Request Normalizer
 *
 * Normalizes, validates, and discovers active modalities in incoming UniversalApiRequest payloads.
 */

import { UniversalApiRequest } from './types';

export class UniversalRequestNormalizer {
  public normalizeAndInspect(request: UniversalApiRequest): {
    normalizedText: string;
    modalitiesDetected: readonly string[];
    isValid: boolean;
    error?: string;
  } {
    const modalities: string[] = [];

    if (request.text?.trim()) modalities.push('TEXT');
    if (request.image?.url || request.image?.data) modalities.push('IMAGE');
    if (request.audio?.text || request.audio?.data) modalities.push('AUDIO');
    if (request.files && request.files.length > 0) modalities.push('FILES');
    if (request.code?.sourceCode) modalities.push('CODE');
    if (request.tools && request.tools.length > 0) modalities.push('TOOLS');
    if (request.workflows?.action) modalities.push('WORKFLOWS');
    if (request.projects?.projectId || request.projects?.goal) modalities.push('PROJECTS');
    if (request.agents?.agentIds && request.agents.agentIds.length > 0) modalities.push('AGENTS');

    if (modalities.length === 0) {
      return {
        normalizedText: '',
        modalitiesDetected: [],
        isValid: false,
        error: 'Universal request must specify at least one valid modality payload (text, image, audio, files, code, tools, workflows, projects, agents).',
      };
    }

    // Determine primary textual prompt
    let normalizedText = request.text?.trim() || '';
    if (!normalizedText && request.audio?.text) {
      normalizedText = request.audio.text.trim();
    } else if (!normalizedText && request.workflows?.action) {
      normalizedText = request.workflows.action.trim();
    } else if (!normalizedText && request.projects?.goal) {
      normalizedText = request.projects.goal.trim();
    } else if (!normalizedText && request.code?.sourceCode) {
      normalizedText = `Process code: ${request.code.language || 'typescript'}`;
    }

    return {
      normalizedText,
      modalitiesDetected: Object.freeze(modalities),
      isValid: true,
    };
  }
}
