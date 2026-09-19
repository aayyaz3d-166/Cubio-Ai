/**
 * CubiO — Step 86 Scientific Classifier
 */

import { ScientificClassification } from '../../../distillation/types';

export class ScientificClassifier {
  public static classifyExecution(
    hasPhysicalRun: boolean,
    isLedgerValid: boolean,
    totalTokens: number
  ): ScientificClassification {
    if (hasPhysicalRun && isLedgerValid && totalTokens >= 100_000_000_000) {
      return 'REAL_EXECUTED';
    }
    if (isLedgerValid) {
      return 'SOFTWARE_VALIDATED';
    }
    return 'THEORETICAL';
  }
}
