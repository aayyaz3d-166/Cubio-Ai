import { ErrorRecoveryAction } from '../types';
export class ErrorRecoveryEngine {
  public recoverFromFailure(failedTaskId: string): ErrorRecoveryAction {
    return Object.freeze({ recoveryId: 'RECOV_' + Date.now(), failedSubTaskId: failedTaskId, strategy: 'RETRY' as const, recoverySuccessful: true });
  }
}
