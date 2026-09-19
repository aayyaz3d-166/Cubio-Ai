/**
 * CubiO — Step 85 Node Authentication Guard
 * Validates cryptographic tokens for all cluster nodes joining the distributed session.
 */

import { deterministicHash } from '../../../state/determinism';

export class NodeAuthenticationGuard {
  public static authenticateNode(rank: number, providedToken: string): boolean {
    const expectedHash = deterministicHash(`AUTH_SECRET_RANK_${rank}`);
    return providedToken === expectedHash;
  }
}
