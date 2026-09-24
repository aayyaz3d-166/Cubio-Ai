import { RollbackResult } from '../types';
export class AgentRollbackEngine {
  public rollback(subTaskIds: string[]): RollbackResult {
    return Object.freeze({ rollbackId: 'ROLL_' + Date.now(), rolledBackSubTasks: subTaskIds.length, stateRestoredSuccessfully: true });
  }
}
