/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F70: Universal UI Bridge
 *
 * Client-side bridge connecting the UI strictly to POST /intelligence.
 * Decoupling rule: Frontend has zero direct knowledge of internal engines.
 */

import { UniversalApiResponse } from '../api/types';
import { CubiOUniversalApiGateway } from '../api/universalApiGateway';
import { IUniversalUIBridge, UniversalUIState } from './types';

export class UniversalUIBridge implements IUniversalUIBridge {
  private gateway = new CubiOUniversalApiGateway();

  /**
   * Dispatches an omni-modal request from the UI to POST /intelligence.
   */
  public async sendOmniRequest(
    state: Partial<UniversalUIState>
  ): Promise<Readonly<UniversalApiResponse>> {
    const payload = {
      text: state.inputText?.trim() || undefined,
      image: state.selectedImage
        ? {
            url: state.selectedImage.url,
            width: state.selectedImage.width,
            height: state.selectedImage.height,
          }
        : undefined,
      audio: state.isRecordingVoice
        ? { text: 'Voice prompt transmitted from UI microphone.' }
        : undefined,
      files: state.attachedFiles && state.attachedFiles.length > 0
        ? state.attachedFiles.map((f) => ({ path: f.path }))
        : undefined,
      code: state.codeBuffer?.trim()
        ? { sourceCode: state.codeBuffer, language: 'typescript' }
        : undefined,
      workflows: state.activeTab === 'WORKFLOW'
        ? { action: state.inputText || 'AUTONOMOUS_CREATE_JEWELRY_STOREFRONT' }
        : undefined,
      projects: state.activeTab === 'PROJECT'
        ? { goal: state.inputText || 'Universal Spatial Project' }
        : undefined,
      agents: state.activeTab === 'AGENTS'
        ? { agentIds: ['MASTER_COORDINATOR', 'CODING_AGENT', 'SPATIAL_AGENT'] }
        : undefined,
    };

    return this.gateway.handleRequest('/intelligence', 'POST', payload);
  }

  /**
   * Approves a pending autonomous workflow execution via human authorization gate.
   */
  public async authorizeCurrentWorkflow(): Promise<Readonly<UniversalApiResponse>> {
    return this.gateway.handleRequest('/intelligence', 'POST', {
      workflows: { action: 'AUTHORIZE_PENDING_DEPLOYMENT', autoAuthorize: true },
      authHeader: 'Bearer AUTH_SIG_SOVEREIGN_OPERATOR',
    });
  }
}
