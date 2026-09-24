import { ResourcePlan, TaskDecomposition } from '../types';
export class ResourcePlanner {
  public planResources(decomp: TaskDecomposition): ResourcePlan {
    return Object.freeze({ planId: 'RES_' + Date.now(), requiredTools: Object.freeze(['CAD_KERNEL', 'MESH_VALIDATOR', 'RAY_TRACER', 'MFG_ANALYZER', 'FILE_PACKAGER']), requiredDataSources: Object.freeze(['MaterialDatabase', 'StyleLibrary', 'CostIndex']), estimatedComputeUnits: 150 });
  }
}
