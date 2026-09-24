/**
 * CubiO — Universal Spatial Operating Environment
 * Process 2: Complete CubiO User Flow (Types & State)
 *
 * Formal state machine for the complete end-to-end user flow:
 * Open App -> Login/Authenticate -> Resolve CUB-ID -> Create Session ->
 * Check Permissions -> Resolve Account -> Connect Coordinate -> Access Services.
 */

import { CubiOIdentity } from '../identity/types';
import { AuthSession, CubiOAuthToken, AuthenticationProviderType } from '../auth/types';
import { CubiOAccount } from '../account/types';
import { NetworkRole, NetworkPermission } from '../authz/types';
import { CubiONetworkCoordinate } from '../coordinate/types';

export type UserFlowStage =
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATING'
  | 'RESOLVING_IDENTITY'
  | 'CREATING_SESSION'
  | 'CHECKING_PERMISSIONS'
  | 'RESOLVING_ACCOUNT'
  | 'CONNECTING_COORDINATE'
  | 'AUTHENTICATED_READY'
  | 'ERROR';

export interface CubiOUserSessionState {
  readonly stage: UserFlowStage;
  readonly isAuthenticated: boolean;
  readonly cubId?: string; // Sovereign CUB-XXXXXXXX
  readonly identity?: CubiOIdentity;
  readonly session?: AuthSession;
  readonly sessionToken?: CubiOAuthToken;
  readonly account?: CubiOAccount;
  readonly role: NetworkRole;
  readonly permissions: readonly NetworkPermission[];
  readonly coordinate?: CubiONetworkCoordinate;
  readonly coordinateUri?: string;
  readonly activeService: string;
  readonly lastError?: string;
  readonly completedHops: readonly string[];
}

export interface UserLoginInput {
  readonly provider: AuthenticationProviderType;
  readonly payload: Record<string, any>;
  readonly username?: string;
  readonly displayName?: string;
  readonly autoProvision?: boolean;
}

export interface ServiceAccessResult {
  readonly success: boolean;
  readonly service: string;
  readonly action: string;
  readonly coordinateUri: string;
  readonly traceHops: readonly string[];
  readonly data?: any;
  readonly error?: string;
}
