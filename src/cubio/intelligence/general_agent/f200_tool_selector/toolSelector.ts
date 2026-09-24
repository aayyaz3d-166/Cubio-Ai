import { ResourcePlan, ToolSelection } from '../types';
export class ToolSelector {
  public selectOptimalTools(plan: ResourcePlan): ToolSelection {
    return Object.freeze({ selectionId: 'TOOL_' + Date.now(), selectedTools: plan.requiredTools, optimalityScore: 0.96 });
  }
}
