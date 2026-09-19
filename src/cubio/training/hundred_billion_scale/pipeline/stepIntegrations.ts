/**
 * CubiO — Step 86 Interop Bridges & Step Integrations
 */

import { ProvenanceLedger } from '../audit/provenanceLedger';

export class StepIntegrations {
  public static verifyPriorStepCompatibility(step85EndingHash: string): boolean {
    return ProvenanceLedger.verifyContinuity(step85EndingHash);
  }
}
