import { UserFeedbackIntegration } from '../types';
export class UserFeedbackIntegrator {
  public integrateFeedback(correction: string): UserFeedbackIntegration {
    return Object.freeze({ feedbackId: 'FB_' + Date.now(), correctionApplied: correction, planRevised: true });
  }
}
