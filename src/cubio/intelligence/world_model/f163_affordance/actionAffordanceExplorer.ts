import { ActionAffordance, MultiFacetedEntity } from '../types';
export class ActionAffordanceExplorer {
  public discoverAffordances(entity: MultiFacetedEntity): readonly ActionAffordance[] {
    return Object.freeze([
      Object.freeze({ actionId: 'ACT_REFRACT', actionName: 'Refract Optical Ray', targetEntityId: entity.entityId, requiredEnergyJoules: 0.001, isValidInCurrentState: entity.optical.totalInternalReflectionVerified, expectedPreconditions: Object.freeze(['RefractiveIndex > 1.0', 'WatertightManifold']) }),
      Object.freeze({ actionId: 'ACT_TESSELLATE', actionName: 'Tessellate CSG Mesh', targetEntityId: entity.entityId, requiredEnergyJoules: 0.05, isValidInCurrentState: entity.geometry.isWatertight, expectedPreconditions: Object.freeze(['EulerChi == 2']) }),
    ]);
  }
}
