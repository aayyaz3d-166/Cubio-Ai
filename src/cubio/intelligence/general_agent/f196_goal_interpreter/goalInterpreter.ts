import { GoalSpec } from '../types';
export class GoalInterpreter {
  public interpretGoal(rawGoal: string): GoalSpec {
    const domain = rawGoal.toLowerCase().includes('jewelry') ? 'JEWELRY_DESIGN' : rawGoal.toLowerCase().includes('cad') ? 'CAD_ENGINEERING' : 'GENERAL';
    return Object.freeze({ goalId: 'GOAL_' + Date.now(), rawGoalText: rawGoal, parsedIntent: 'Design and deliver complete ' + domain.toLowerCase().replace('_',' ') + ' workflow', domain, complexityScore: 0.75 });
  }
}
