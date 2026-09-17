/**
 * 3D Memory Studio — Funnel 73
 * Boot Error Classifier
 *
 * Sanitizes and classifies initialization errors without leaking credentials or private payloads.
 */

import { BootPhase } from '../types';

export interface ClassifiedError {
  phase: BootPhase;
  title: string;
  message: string;
  isRetryable: boolean;
  recommendedAction: string;
}

export class BootErrorClassifier {
  public classify(phase: BootPhase, rawError: any): ClassifiedError {
    const rawMsg = rawError?.message || String(rawError);

    // Sanitize any potential secret patterns
    const safeMsg = rawMsg
      .replace(/key=[^&\s]+/gi, 'key=***')
      .replace(/token=[^&\s]+/gi, 'token=***')
      .replace(/password=[^&\s]+/gi, 'password=***');

    let title = 'Startup Error';
    let isRetryable = true;
    let recommendedAction = 'Click Retry to re-initialize the runtime subsystems.';

    switch (phase) {
      case 'ROOT_READY':
        title = 'DOM Root Mount Failed';
        recommendedAction = 'Verify DOM container and browser extension compatibility.';
        break;
      case 'CHECKING_RENDERER':
        title = 'Renderer Host Unavailable';
        recommendedAction = 'Verify WebGL context support and hardware acceleration.';
        break;
      case 'CHECKING_SCENE':
        title = 'Spatial Scene Graph Error';
        recommendedAction = 'Check scene tree integrity and lighting nodes.';
        break;
      case 'CHECKING_STUDIO':
        title = 'Studio Shell Unavailable';
        recommendedAction = 'Verify panel registry and section configurations.';
        break;
      case 'ACTIVATING_F72':
        title = 'Runtime Activation Failed';
        recommendedAction = 'Retry initialization or launch in degraded Safe Mode.';
        break;
      default:
        break;
    }

    return {
      phase,
      title,
      message: safeMsg,
      isRetryable,
      recommendedAction,
    };
  }
}
