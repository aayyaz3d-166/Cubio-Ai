import { deterministicHash } from '../../../state/determinism';
import { EntityClassRegistration } from '../types';
export class OpenWorldEntityExtensibilityEngine {
  public registerNewEntityClass(className: string, facetsCount: number = 8): EntityClassRegistration {
    return Object.freeze({ registrationId: 'REG_' + deterministicHash(className).slice(2,10), newEntityClassName: className, inheritedFacetsCount: facetsCount, registrationVerified: true });
  }
}
