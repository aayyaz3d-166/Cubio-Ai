import { EnvironmentAction } from '../types';
export class EnvironmentInterface {
  public executeAction(actionType: EnvironmentAction['actionType'], targetPath: string): EnvironmentAction {
    return Object.freeze({ actionId: 'ENV_' + Date.now(), actionType, targetPath, result: 'SUCCESS: ' + actionType + ' completed on ' + targetPath });
  }
}
