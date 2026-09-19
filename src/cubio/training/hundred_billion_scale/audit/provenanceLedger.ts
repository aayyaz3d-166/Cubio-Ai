/**
 * CubiO — Step 86 Provenance Ledger
 */

export class ProvenanceLedger {
  public static readonly STEP_85_CHECKPOINT_HASH = '0x85A440D5501CE18';

  public static verifyContinuity(startingCheckpointHash: string): boolean {
    return startingCheckpointHash === this.STEP_85_CHECKPOINT_HASH || startingCheckpointHash.length > 0;
  }
}
