/**
 * CubiO — Universal Spatial Operating Environment
 * Master Integrated Networking Stack (NET-00 → NET-04)
 *
 * Unifies all 5 foundational networking layers into a coherent continuous pipeline:
 * NET-00: Coordinates & Logical Routing
 * NET-01: Sovereign Identities (CUB-XXXXXXXX)
 * NET-02: Authentication & Sessions
 * NET-03: Authorization & Policy Enforcement
 * NET-04: Accounts & Profiles
 */

import { CubiONodeRegistry } from './coordinate/registry';
import { CubiOLogicalRouter } from './coordinate/routing';
import { CubiONetworkCoordinateEngine } from './coordinate/coordinate';
import { createStandardTestRegistry } from './coordinate/fixtures';
import { CubiOIdentityRegistry } from './identity/identityRegistry';
import { CubiOIdentityCoordinateAdapter } from './identity/coordinateAdapter';
import { CubiOAuthEngine } from './auth/authEngine';
import { CubiOPolicyEngine } from './authz/policyEngine';
import { CubiORoleManager } from './authz/roleManager';
import { CubiOAuthzMiddleware } from './authz/authzMiddleware';
import { CubiOAccountService } from './account/accountService';
import { CubiOMessagingEngine } from './messaging/messagingEngine';
import { CubiOAddressRegistry } from './address/addressRegistry';
import { CubiOAddressService } from './address/addressService';
import { CubiOStorageEngine } from './storage/storageEngine';
import { CubiOOMailEngine } from './omail/omailEngine';
import { CubiOPremiumRegistry } from './premium/premiumRegistry';
import { CubiONotificationEngine } from './notification/notificationEngine';
import { CubiOServiceEngine } from './service/serviceEngine';
import { CubiODeviceEngine } from './device/deviceEngine';
import { CubiOAgentEngine } from './agent/agentEngine';
import { CubiOFileEngine } from './file/fileEngine';
import { CubiOSearchEngine } from './search/searchEngine';
import { CubiOEventEngine } from './event/eventEngine';
import { CubiOGatewayEngine } from './gateway/gatewayEngine';
import { CubiOFederationEngine } from './federation/federationEngine';
import { CubiOObservabilityEngine } from './observability/observabilityEngine';
import { CubiOBillingEngine } from './billing/billingEngine';
import { CubiODeveloperEngine } from './developer/developerEngine';
import { CubiOSDKClient } from './developer/sdkClient';
import { CubiOIdentity } from './identity/types';
import { AuthSession, CubiOAuthToken, AuthenticationRequest } from './auth/types';
import { CubiOAccount, AccountTier } from './account/types';
import { AccessDecision } from './authz/types';
import { LogicalRouteResult } from './coordinate/types';
import { CubiOAddress, OMailAddress, CubiOPremiumAddress, AddressReservation } from './address/types';
import { StorageObject, StorageBucket, StorageMetrics, PutObjectInput, GetObjectResult, CreateBucketInput, ShareObjectInput } from './storage/types';
import { OMailMessage, OMailThread, OMailBox, SendMailInput, SaveDraftInput, MailQueryOptions, OMailThreadView, OMailFolderType } from './omail/types';
import { PremiumAddressRecord, PremiumAddressReservation, PremiumAddressTransferRecord, CheckAvailabilityResult, ReservePremiumInput, ClaimPremiumInput, TransferPremiumInput } from './premium/types';
import { NotificationRecord, NotificationPreferences, CreateNotificationInput, UpdatePreferencesInput, NotificationQueryOptions } from './notification/types';
import { ServiceRegistration, ServiceRequest, ServiceResponse, RegisterServiceInput, ServiceDiscoveryFilter, ServiceStatus } from './service/types';
import { DeviceRecord, DeviceHeartbeat, DeviceCommand, DeviceCommandType, ProvisionDeviceInput, DeviceDiscoveryFilter, DeviceStatus } from './device/types';
import { AgentRecord, AgentDelegationToken, AgentTask, CreateAgentInput, CreateDelegationInput, ExecuteAgentTaskInput } from './agent/types';
import { FileRecord, FileVersion, UploadFileInput, GetFileResult, ShareFileInput, RollbackVersionInput, ListFilesQuery } from './file/types';
import { SearchIndexEntry, SearchQuery, SearchResultItem, SearchQueryResult, IndexResourceInput, EntityType } from './search/types';
import { ChannelRecord, NetworkEvent, EventSubscription, CreateChannelInput, PublishEventInput, SubscribeChannelInput } from './event/types';
import { GatewayRoute, GatewayRequestEnvelope, GatewayResponseEnvelope, RegisterRouteInput, GatewayMetrics } from './gateway/types';
import { FederationNode, HandshakeState, CrossNetworkMessageEnvelope, RegisterFederationNodeInput, InitiateHandshakeInput, CompleteHandshakeInput, TrustLevel } from './federation/types';
import { AuditLogEntry, TraceSpan, NetworkMetricRecord, AuditQueryOptions, MetricsSummary, MetricType } from './observability/types';
import { ProductRecord, OrderRecord, SubscriptionRecord, EntitlementRecord, PaymentTransaction, CreateProductInput, PurchaseProductInput } from './billing/types';
import { DeveloperProject, ApiKeyRecord, CreateProjectInput, CreateApiKeyInput, CreateApiKeyResult, ValidateApiKeyResult, ApiDocContract } from './developer/types';

export interface NetworkStackExecutionResult {
  readonly success: boolean;
  readonly authenticated: boolean;
  readonly authorized: boolean;
  readonly routed: boolean;
  readonly cubId?: string;
  readonly identity?: CubiOIdentity;
  readonly session?: AuthSession;
  readonly account?: CubiOAccount;
  readonly accessDecision?: AccessDecision;
  readonly routeResult?: LogicalRouteResult;
  readonly traceHops: readonly string[];
  readonly error?: string;
  readonly errorCode?: string;
}

export class CubiONetworkStack {
  public readonly coordinateRegistry: CubiONodeRegistry;
  public readonly router: CubiOLogicalRouter;
  public readonly identityRegistry: CubiOIdentityRegistry;
  public readonly authEngine: CubiOAuthEngine;
  public readonly roleManager: CubiORoleManager;
  public readonly policyEngine: CubiOPolicyEngine;
  public readonly authzMiddleware: CubiOAuthzMiddleware;
  public readonly accountService: CubiOAccountService;
  public readonly messagingEngine: CubiOMessagingEngine;
  public readonly addressRegistry: CubiOAddressRegistry;
  public readonly addressService: CubiOAddressService;
  public readonly storageEngine: CubiOStorageEngine;
  public readonly omailEngine: CubiOOMailEngine;
  public readonly premiumRegistry: CubiOPremiumRegistry;
  public readonly notificationEngine: CubiONotificationEngine;
  public readonly serviceEngine: CubiOServiceEngine;
  public readonly deviceEngine: CubiODeviceEngine;
  public readonly agentEngine: CubiOAgentEngine;
  public readonly fileEngine: CubiOFileEngine;
  public readonly searchEngine: CubiOSearchEngine;
  public readonly eventEngine: CubiOEventEngine;
  public readonly gatewayEngine: CubiOGatewayEngine;
  public readonly federationEngine: CubiOFederationEngine;
  public readonly observabilityEngine: CubiOObservabilityEngine;
  public readonly billingEngine: CubiOBillingEngine;
  public readonly developerEngine: CubiODeveloperEngine;

  constructor(options: {
    coordinateRegistry?: CubiONodeRegistry;
    identityRegistry?: CubiOIdentityRegistry;
  } = {}) {
    this.coordinateRegistry = options.coordinateRegistry || createStandardTestRegistry();
    this.router = new CubiOLogicalRouter(this.coordinateRegistry);
    this.identityRegistry = options.identityRegistry || new CubiOIdentityRegistry();
    this.authEngine = new CubiOAuthEngine({ identityRegistry: this.identityRegistry });
    this.roleManager = new CubiORoleManager();
    this.policyEngine = new CubiOPolicyEngine(this.roleManager);
    this.authzMiddleware = new CubiOAuthzMiddleware(this.policyEngine);
    this.accountService = new CubiOAccountService(undefined, this.identityRegistry);
    this.addressRegistry = new CubiOAddressRegistry(undefined, this.identityRegistry);
    this.addressService = new CubiOAddressService({
      registry: this.addressRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      accountService: this.accountService,
    });
    this.messagingEngine = new CubiOMessagingEngine({ stack: this });
    this.messagingEngine.getIdentityManager().setAddressRegistry(this.addressRegistry);
    this.storageEngine = new CubiOStorageEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      accountService: this.accountService,
      addressRegistry: this.addressRegistry,
      nodeRegistry: this.coordinateRegistry,
    });
    this.omailEngine = new CubiOOMailEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      accountService: this.accountService,
      messagingEngine: this.messagingEngine,
      storageEngine: this.storageEngine,
      addressRegistry: this.addressRegistry,
    });
    this.premiumRegistry = new CubiOPremiumRegistry({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      accountService: this.accountService,
      addressRegistry: this.addressRegistry,
    });
    this.notificationEngine = new CubiONotificationEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      accountService: this.accountService,
      messagingEngine: this.messagingEngine,
      storageEngine: this.storageEngine,
      omailEngine: this.omailEngine,
      addressRegistry: this.addressRegistry,
    });
    this.serviceEngine = new CubiOServiceEngine({
      coordinateRegistry: this.coordinateRegistry,
      router: this.router,
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
    });
    this.deviceEngine = new CubiODeviceEngine({
      coordinateRegistry: this.coordinateRegistry,
      router: this.router,
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      messagingEngine: this.messagingEngine,
    });
    this.agentEngine = new CubiOAgentEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      storageEngine: this.storageEngine,
      serviceEngine: this.serviceEngine,
    });
    this.fileEngine = new CubiOFileEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      addressRegistry: this.addressRegistry,
    });
    this.searchEngine = new CubiOSearchEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
    });
    this.eventEngine = new CubiOEventEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      nodeRegistry: this.coordinateRegistry,
    });
    this.gatewayEngine = new CubiOGatewayEngine({
      coordinateRegistry: this.coordinateRegistry,
      router: this.router,
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      stack: this,
    });
    this.federationEngine = new CubiOFederationEngine({
      coordinateRegistry: this.coordinateRegistry,
      router: this.router,
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      stack: this,
    });
    this.observabilityEngine = new CubiOObservabilityEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
    });
    this.billingEngine = new CubiOBillingEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
      accountService: this.accountService,
      premiumRegistry: this.premiumRegistry,
    });
    this.developerEngine = new CubiODeveloperEngine({
      identityRegistry: this.identityRegistry,
      authEngine: this.authEngine,
      policyEngine: this.policyEngine,
      roleManager: this.roleManager,
    });
  }

  /**
   * Complete continuous onboarding pipeline:
   * Provider -> NET-01 Identity (CUB-XXXXXXXX) -> NET-04 Account -> OMail Free Address -> NET-02 Session & Token -> NET-00 Coordinate
   */
  public async onboardUser(
    providerRequest: AuthenticationRequest,
    accountInput: {
      username: string;
      displayName?: string;
      tier?: AccountTier;
    }
  ): Promise<{
    identity: CubiOIdentity;
    account: CubiOAccount;
    omailAddress: OMailAddress;
    session: AuthSession;
    sessionToken: CubiOAuthToken;
    coordinateUri: string;
  }> {
    // 1. Authenticate & Auto-provision NET-01 Sovereign Identity
    const authResult = await this.authEngine.authenticate(providerRequest, {
      autoProvisionIdentity: true,
    });

    if (!authResult.success || !authResult.identity || !authResult.session || !authResult.sessionToken) {
      throw new Error(`Onboarding failed during authentication: ${authResult.error || 'Unknown error'}`);
    }

    const { identity, session, sessionToken } = authResult;

    // 2. Assign default free @omail.com address to the sovereign CUB-ID
    const omailAddress = await this.addressRegistry.assignFreeOMailAddress(
      identity.cubId,
      accountInput.username
    );

    // 3. Create NET-04 Account belonging strictly to the sovereign CUB-XXXXXXXX ID
    const account = await this.accountService.createAccount(identity.cubId, {
      username: accountInput.username,
      displayName: accountInput.displayName || identity.name,
      email: authResult.subject?.email,
      omailAddress: omailAddress.fullAddress,
      tier: accountInput.tier || 'FREE',
    });

    // 4. Attach authoritative NET-00 Coordinate
    const coordinateUri = CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity, {
      dimension: 0,
      zone: 1,
    });

    return {
      identity,
      account,
      omailAddress,
      session,
      sessionToken,
      coordinateUri,
    };
  }

  /**
   * Complete continuous login pipeline:
   * Provider -> NET-02 Auth -> NET-01 Identity Resolution -> NET-04 Account Verification -> Session & Token -> NET-00 Coordinate
   */
  public async login(
    providerRequest: AuthenticationRequest
  ): Promise<{
    identity: CubiOIdentity;
    account?: CubiOAccount;
    session: AuthSession;
    sessionToken: CubiOAuthToken;
    coordinateUri: string;
  }> {
    const authResult = await this.authEngine.authenticate(providerRequest, {
      autoProvisionIdentity: false,
    });

    if (!authResult.success || !authResult.identity || !authResult.session || !authResult.sessionToken) {
      throw new Error(`Login failed: ${authResult.error || 'Invalid credentials'}`);
    }

    const { identity, session, sessionToken, coordinateUri } = authResult;
    const account = await this.accountService.getAccount(identity.cubId);

    if (account && account.status !== 'ACTIVE') {
      throw new Error(`Account status is '${account.status}'. Access denied.`);
    }

    return {
      identity,
      account,
      session,
      sessionToken,
      coordinateUri: coordinateUri || CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity),
    };
  }

  /**
   * Executes a complete end-to-end network operation through all 5 layers:
   * 1. NET-02: Authenticate session / token
   * 2. NET-01: Resolve sovereign CUB-XXXXXXXX identity
   * 3. NET-04: Verify active account profile
   * 4. NET-03: Authorize action on destination coordinate
   * 5. NET-00: Resolve and route to network destination
   */
  public async executeNetworkOperation(
    tokenStringOrSessionId: string,
    destinationCoordinate: string,
    action: string,
    payload?: any
  ): Promise<Readonly<NetworkStackExecutionResult>> {
    const traceHops: string[] = ['STACK_INGRESS'];

    // 1. Authenticate via NET-02
    traceHops.push('NET02_AUTH_CHECK');
    let authVerification;
    if (tokenStringOrSessionId.startsWith('CUBTOK.')) {
      authVerification = await this.authEngine.verifyToken(tokenStringOrSessionId);
    } else {
      authVerification = await this.authEngine.verifySession(tokenStringOrSessionId);
    }

    if (!authVerification.isValid || !authVerification.identity || !authVerification.session) {
      return Object.freeze({
        success: false,
        authenticated: false,
        authorized: false,
        routed: false,
        traceHops: Object.freeze(traceHops),
        error: `Authentication failed: ${authVerification.error || 'Invalid session credentials.'}`,
        errorCode: 'ERR_AUTH_FAILED',
      });
    }

    const { identity, session } = authVerification;
    traceHops.push(`NET01_IDENTITY_RESOLVED:${identity.cubId}`);

    // 2. Account verification via NET-04
    traceHops.push('NET04_ACCOUNT_CHECK');
    let account = await this.accountService.getAccount(identity.cubId);
    if (account && account.status !== 'ACTIVE') {
      return Object.freeze({
        success: false,
        authenticated: true,
        authorized: false,
        routed: false,
        cubId: identity.cubId,
        identity,
        session,
        account,
        traceHops: Object.freeze(traceHops),
        error: `Account is '${account.status}'. Cannot perform network operations.`,
        errorCode: 'ERR_ACCOUNT_INACTIVE',
      });
    }

    // 3. Authorization check via NET-03
    traceHops.push(`NET03_AUTHZ_EVALUATION:${action}`);
    const authzResult = await this.authzMiddleware.authorizeRequest(
      this.authEngine,
      tokenStringOrSessionId,
      destinationCoordinate,
      action
    );

    if (!authzResult.authorized || !authzResult.decision) {
      return Object.freeze({
        success: false,
        authenticated: true,
        authorized: false,
        routed: false,
        cubId: identity.cubId,
        identity,
        session,
        account,
        accessDecision: authzResult.decision,
        traceHops: Object.freeze(traceHops),
        error: authzResult.error || 'Authorization denied.',
        errorCode: 'ERR_AUTHZ_DENIED',
      });
    }

    // 4. Logical Route via NET-00
    traceHops.push(`NET00_ROUTING:${destinationCoordinate}`);
    const routeResult = this.router.route(destinationCoordinate);
    if (!routeResult.success) {
      return Object.freeze({
        success: false,
        authenticated: true,
        authorized: true,
        routed: false,
        cubId: identity.cubId,
        identity,
        session,
        account,
        accessDecision: authzResult.decision,
        routeResult,
        traceHops: Object.freeze(traceHops),
        error: `Routing failed: ${routeResult.error}`,
        errorCode: 'ERR_ROUTE_FAILED',
      });
    }

    traceHops.push('STACK_SUCCESS_DISPATCH');

    return Object.freeze({
      success: true,
      authenticated: true,
      authorized: true,
      routed: true,
      cubId: identity.cubId,
      identity,
      session,
      account,
      accessDecision: authzResult.decision,
      routeResult,
      traceHops: Object.freeze(traceHops),
    });
  }

  /**
   * Reserves a premium @cubio.com address for the caller.
   */
  public async reservePremiumAddress(
    tokenStringOrSessionId: string,
    username: string,
    options?: { durationMs?: number; priceTier?: string }
  ): Promise<Readonly<AddressReservation>> {
    return this.addressService.reservePremiumAddress(tokenStringOrSessionId, username, options);
  }

  /**
   * Claims a premium @cubio.com address for the caller.
   */
  public async claimPremiumAddress(
    tokenStringOrSessionId: string,
    username: string,
    options?: { reservationToken?: string; tier?: 'STANDARD' | 'EXCLUSIVE' | 'BRAND'; metadata?: Record<string, any> }
  ): Promise<Readonly<CubiOPremiumAddress>> {
    return this.addressService.claimPremiumAddress(tokenStringOrSessionId, username, options);
  }

  /**
   * Resolves a public email address (@omail.com or @cubio.com) to its sovereign CUB-ID.
   */
  public async resolveAddress(addressString: string) {
    return this.addressRegistry.resolveAddress(addressString);
  }

  /**
   * Retrieves all addresses owned by a sovereign CUB-ID.
   */
  public async getAddressesForIdentity(cubId: string): Promise<readonly CubiOAddress[]> {
    return this.addressRegistry.getAddressesForIdentity(cubId);
  }

  /**
   * Puts / writes a sovereign storage object with CAS deduplication.
   */
  public async putStorageObject(
    tokenStringOrSessionId: string,
    input: PutObjectInput
  ): Promise<Readonly<StorageObject>> {
    return this.storageEngine.putObject(tokenStringOrSessionId, input);
  }

  /**
   * Retrieves a sovereign storage object and reconstructs its payload.
   */
  public async getStorageObject(
    tokenStringOrSessionId: string,
    objectIdOrPath: string,
    options?: { ownerCubId?: string; asBinary?: boolean }
  ): Promise<Readonly<GetObjectResult>> {
    return this.storageEngine.getObject(tokenStringOrSessionId, objectIdOrPath, options);
  }

  /**
   * Deletes a sovereign storage object.
   */
  public async deleteStorageObject(
    tokenStringOrSessionId: string,
    objectId: string
  ): Promise<boolean> {
    return this.storageEngine.deleteObject(tokenStringOrSessionId, objectId);
  }

  /**
   * Shares a storage object with another identity or email address.
   */
  public async shareStorageObject(
    tokenStringOrSessionId: string,
    input: ShareObjectInput
  ): Promise<Readonly<StorageObject>> {
    return this.storageEngine.shareObject(tokenStringOrSessionId, input);
  }

  /**
   * Creates a storage bucket.
   */
  public async createStorageBucket(
    tokenStringOrSessionId: string,
    input: CreateBucketInput
  ): Promise<Readonly<StorageBucket>> {
    return this.storageEngine.createBucket(tokenStringOrSessionId, input);
  }

  /**
   * Lists storage objects.
   */
  public async listStorageObjects(
    tokenStringOrSessionId: string,
    bucketId?: string
  ): Promise<readonly StorageObject[]> {
    return this.storageEngine.listObjects(tokenStringOrSessionId, bucketId);
  }

  /**
   * Retrieves storage metrics for an identity.
   */
  public async getStorageMetrics(
    tokenStringOrSessionId: string,
    targetCubId?: string
  ): Promise<Readonly<StorageMetrics>> {
    return this.storageEngine.getStorageMetrics(tokenStringOrSessionId, targetCubId);
  }

  /**
   * Sends an email via the OMail network.
   */
  public async sendMail(
    tokenStringOrSessionId: string,
    input: SendMailInput
  ): Promise<Readonly<OMailMessage>> {
    return this.omailEngine.sendMail(tokenStringOrSessionId, input);
  }

  /**
   * Saves or updates a mail draft.
   */
  public async saveMailDraft(
    tokenStringOrSessionId: string,
    input: SaveDraftInput
  ): Promise<Readonly<OMailMessage>> {
    return this.omailEngine.saveDraft(tokenStringOrSessionId, input);
  }

  /**
   * Retrieves an email message by mailId.
   */
  public async getMail(
    tokenStringOrSessionId: string,
    mailId: string,
    autoMarkRead?: boolean
  ): Promise<Readonly<OMailMessage>> {
    return this.omailEngine.getMail(tokenStringOrSessionId, mailId, autoMarkRead);
  }

  /**
   * Retrieves a full mail thread with all messages in chronological order.
   */
  public async getMailThread(
    tokenStringOrSessionId: string,
    threadId: string
  ): Promise<Readonly<OMailThreadView>> {
    return this.omailEngine.getThread(tokenStringOrSessionId, threadId);
  }

  /**
   * Lists messages in a specific mailbox folder.
   */
  public async listMailFolder(
    tokenStringOrSessionId: string,
    folder: OMailFolderType,
    options?: MailQueryOptions
  ): Promise<readonly OMailMessage[]> {
    return this.omailEngine.listFolder(tokenStringOrSessionId, folder, options);
  }

  /**
   * Lists mail threads for the caller.
   */
  public async listMailThreads(
    tokenStringOrSessionId: string,
    options?: MailQueryOptions
  ): Promise<readonly OMailThread[]> {
    return this.omailEngine.listThreads(tokenStringOrSessionId, options);
  }

  /**
   * Retrieves or initializes the mailbox for the caller.
   */
  public async getMailbox(
    tokenStringOrSessionId: string
  ): Promise<Readonly<OMailBox>> {
    return this.omailEngine.getOrCreateMailbox(tokenStringOrSessionId);
  }

  /**
   * Checks availability and pricing for a premium @cubio.com address.
   */
  public async checkPremiumAvailability(
    username: string
  ): Promise<Readonly<CheckAvailabilityResult>> {
    return this.premiumRegistry.checkAvailability(username);
  }

  /**
   * Places a time-limited reservation on a premium @cubio.com address.
   */
  public async reservePremiumAddressRecord(
    tokenStringOrSessionId: string,
    input: ReservePremiumInput
  ): Promise<Readonly<PremiumAddressReservation>> {
    return this.premiumRegistry.reserveAddress(tokenStringOrSessionId, input);
  }

  /**
   * Claims / purchases a premium @cubio.com address, verifying billing boundary.
   */
  public async purchasePremiumAddress(
    tokenStringOrSessionId: string,
    input: ClaimPremiumInput
  ): Promise<Readonly<PremiumAddressRecord>> {
    return this.premiumRegistry.claimOrPurchaseAddress(tokenStringOrSessionId, input);
  }

  /**
   * Transfers a premium address to another sovereign CUB-ID.
   */
  public async transferPremiumAddress(
    tokenStringOrSessionId: string,
    input: TransferPremiumInput
  ): Promise<Readonly<PremiumAddressRecord>> {
    return this.premiumRegistry.transferAddress(tokenStringOrSessionId, input);
  }

  /**
   * Renews an existing premium address lease.
   */
  public async renewPremiumAddress(
    tokenStringOrSessionId: string,
    username: string,
    durationYears?: number
  ): Promise<Readonly<PremiumAddressRecord>> {
    return this.premiumRegistry.renewAddress(tokenStringOrSessionId, username, durationYears);
  }

  /**
   * Retrieves all premium addresses owned by an identity.
   */
  public async getPremiumAddresses(
    tokenStringOrSessionId: string,
    targetCubId?: string
  ): Promise<readonly PremiumAddressRecord[]> {
    return this.premiumRegistry.getAddressesByOwner(tokenStringOrSessionId, targetCubId);
  }

  /**
   * Retrieves transfer history for a premium address.
   */
  public async getPremiumTransferHistory(
    username: string
  ): Promise<readonly PremiumAddressTransferRecord[]> {
    return this.premiumRegistry.getTransferHistory(username);
  }

  /**
   * Dispatches a notification to a sovereign identity or address.
   */
  public async sendNotification(
    tokenStringOrSessionId: string,
    input: CreateNotificationInput
  ): Promise<Readonly<NotificationRecord>> {
    return this.notificationEngine.notify(tokenStringOrSessionId, input);
  }

  /**
   * Dispatches a system notification without user token.
   */
  public async sendSystemNotification(
    input: CreateNotificationInput
  ): Promise<Readonly<NotificationRecord>> {
    return this.notificationEngine.notifySystem(input);
  }

  /**
   * Retrieves a single notification by notificationId.
   */
  public async getNotification(
    tokenStringOrSessionId: string,
    notificationId: string
  ): Promise<Readonly<NotificationRecord>> {
    return this.notificationEngine.getNotification(tokenStringOrSessionId, notificationId);
  }

  /**
   * Lists notifications for the caller.
   */
  public async listNotifications(
    tokenStringOrSessionId: string,
    options?: NotificationQueryOptions
  ): Promise<readonly NotificationRecord[]> {
    return this.notificationEngine.listNotifications(tokenStringOrSessionId, options);
  }

  /**
   * Marks a notification as read.
   */
  public async markNotificationAsRead(
    tokenStringOrSessionId: string,
    notificationId: string
  ): Promise<Readonly<NotificationRecord>> {
    return this.notificationEngine.markAsRead(tokenStringOrSessionId, notificationId);
  }

  /**
   * Dismisses a notification.
   */
  public async dismissNotification(
    tokenStringOrSessionId: string,
    notificationId: string
  ): Promise<boolean> {
    return this.notificationEngine.dismissNotification(tokenStringOrSessionId, notificationId);
  }

  /**
   * Retrieves notification preferences for the caller.
   */
  public async getNotificationPreferences(
    tokenStringOrSessionId: string
  ): Promise<Readonly<NotificationPreferences>> {
    const callerCubId = await this.notificationEngine.authenticateCaller(tokenStringOrSessionId);
    return this.notificationEngine.getOrCreatePreferences(callerCubId);
  }

  /**
   * Updates notification preferences for the caller.
   */
  public async updateNotificationPreferences(
    tokenStringOrSessionId: string,
    input: UpdatePreferencesInput
  ): Promise<Readonly<NotificationPreferences>> {
    return this.notificationEngine.updatePreferences(tokenStringOrSessionId, input);
  }

  /**
   * Gets unread notification count for the caller.
   */
  public async getUnreadNotificationCount(
    tokenStringOrSessionId: string
  ): Promise<number> {
    return this.notificationEngine.getUnreadCount(tokenStringOrSessionId);
  }

  /**
   * Registers a new sovereign service into the catalog.
   */
  public async registerService(
    tokenStringOrSessionId: string,
    input: RegisterServiceInput
  ): Promise<Readonly<ServiceRegistration>> {
    return this.serviceEngine.registerService(tokenStringOrSessionId, input);
  }

  /**
   * Discovers registered services matching filter.
   */
  public async discoverServices(
    tokenStringOrSessionId: string,
    filter?: ServiceDiscoveryFilter
  ): Promise<readonly ServiceRegistration[]> {
    return this.serviceEngine.discoverServices(tokenStringOrSessionId, filter);
  }

  /**
   * Invokes an authenticated service endpoint across the CUBiO network stack.
   */
  public async invokeService(
    request: ServiceRequest
  ): Promise<Readonly<ServiceResponse>> {
    return this.serviceEngine.invokeService(request);
  }

  /**
   * Updates service status (Admin / Provider operation).
   */
  public async updateServiceStatus(
    tokenStringOrSessionId: string,
    serviceId: string,
    status: ServiceStatus
  ): Promise<Readonly<ServiceRegistration>> {
    return this.serviceEngine.updateServiceStatus(tokenStringOrSessionId, serviceId, status);
  }

  /**
   * Deletes a service from the catalog.
   */
  public async deleteService(
    tokenStringOrSessionId: string,
    serviceId: string
  ): Promise<boolean> {
    return this.serviceEngine.deleteService(tokenStringOrSessionId, serviceId);
  }

  /**
   * Provisions a new physical or virtual spatial device bound to the caller's CUB-ID.
   */
  public async provisionDevice(
    tokenStringOrSessionId: string,
    input: ProvisionDeviceInput
  ): Promise<Readonly<DeviceRecord>> {
    return this.deviceEngine.provisionDevice(tokenStringOrSessionId, input);
  }

  /**
   * Records a telemetry heartbeat from a provisioned device.
   */
  public async recordDeviceHeartbeat(
    deviceId: string,
    heartbeat: DeviceHeartbeat
  ): Promise<Readonly<DeviceRecord>> {
    return this.deviceEngine.recordHeartbeat(deviceId, heartbeat);
  }

  /**
   * Dispatches a control command to a provisioned device.
   */
  public async sendDeviceCommand(
    tokenStringOrSessionId: string,
    targetDeviceId: string,
    commandType: DeviceCommandType,
    payload?: any
  ): Promise<Readonly<DeviceCommand>> {
    return this.deviceEngine.sendCommand(tokenStringOrSessionId, targetDeviceId, commandType, payload);
  }

  /**
   * Lists all devices owned by the caller.
   */
  public async listMyDevices(
    tokenStringOrSessionId: string
  ): Promise<readonly DeviceRecord[]> {
    return this.deviceEngine.listMyDevices(tokenStringOrSessionId);
  }

  /**
   * Retrieves details for a specific device.
   */
  public async getDevice(
    tokenStringOrSessionId: string,
    deviceId: string
  ): Promise<Readonly<DeviceRecord>> {
    return this.deviceEngine.getDevice(tokenStringOrSessionId, deviceId);
  }

  /**
   * Revokes a provisioned device.
   */
  public async revokeDevice(
    tokenStringOrSessionId: string,
    deviceId: string
  ): Promise<boolean> {
    return this.deviceEngine.revokeDevice(tokenStringOrSessionId, deviceId);
  }

  /**
   * Creates a new sovereign AI agent with bounded permissions.
   */
  public async createAgent(
    tokenStringOrSessionId: string,
    input: CreateAgentInput
  ): Promise<Readonly<AgentRecord>> {
    return this.agentEngine.createAgent(tokenStringOrSessionId, input);
  }

  /**
   * Issues a time-limited delegation token from principal to agent.
   */
  public async issueAgentDelegationToken(
    tokenStringOrSessionId: string,
    input: CreateDelegationInput
  ): Promise<Readonly<AgentDelegationToken>> {
    return this.agentEngine.issueDelegationToken(tokenStringOrSessionId, input);
  }

  /**
   * Executes a controlled task via an agent's delegation token.
   */
  public async executeAgentTask(
    delegationTokenString: string,
    input: ExecuteAgentTaskInput
  ): Promise<Readonly<AgentTask>> {
    return this.agentEngine.executeTask(delegationTokenString, input);
  }

  /**
   * Revokes an active agent delegation token.
   */
  public async revokeAgentDelegation(
    tokenStringOrSessionId: string,
    delegationId: string
  ): Promise<boolean> {
    return this.agentEngine.revokeDelegation(tokenStringOrSessionId, delegationId);
  }

  /**
   * Terminates an agent.
   */
  public async terminateAgent(
    tokenStringOrSessionId: string,
    agentId: string
  ): Promise<boolean> {
    return this.agentEngine.terminateAgent(tokenStringOrSessionId, agentId);
  }

  /**
   * Lists agents owned by the caller.
   */
  public async listMyAgents(
    tokenStringOrSessionId: string
  ): Promise<readonly AgentRecord[]> {
    return this.agentEngine.listMyAgents(tokenStringOrSessionId);
  }

  /**
   * Retrieves details for a specific agent.
   */
  public async getAgent(
    tokenStringOrSessionId: string,
    agentId: string
  ): Promise<Readonly<AgentRecord>> {
    return this.agentEngine.getAgent(tokenStringOrSessionId, agentId);
  }

  /**
   * Retrieves task execution history for an agent.
   */
  public async getAgentTasks(
    tokenStringOrSessionId: string,
    agentId: string
  ): Promise<readonly AgentTask[]> {
    return this.agentEngine.getTasksByAgent(tokenStringOrSessionId, agentId);
  }

  /**
   * Uploads a file/object into sovereign namespaces with versioning.
   */
  public async uploadFile(
    tokenStringOrSessionId: string,
    input: UploadFileInput
  ): Promise<Readonly<FileRecord>> {
    return this.fileEngine.uploadFile(tokenStringOrSessionId, input);
  }

  /**
   * Downloads a file and verifies cryptographic integrity.
   */
  public async downloadFile(
    tokenStringOrSessionId: string,
    fileIdOrPath: string,
    options?: { versionNumber?: number; namespace?: string }
  ): Promise<Readonly<GetFileResult>> {
    return this.fileEngine.downloadFile(tokenStringOrSessionId, fileIdOrPath, options);
  }

  /**
   * Shares a file with an identity or @omail.com address.
   */
  public async shareFile(
    tokenStringOrSessionId: string,
    input: ShareFileInput
  ): Promise<Readonly<FileRecord>> {
    return this.fileEngine.shareFile(tokenStringOrSessionId, input);
  }

  /**
   * Rolls back a file to a previous version.
   */
  public async rollbackFileVersion(
    tokenStringOrSessionId: string,
    input: RollbackVersionInput
  ): Promise<Readonly<FileRecord>> {
    return this.fileEngine.rollbackVersion(tokenStringOrSessionId, input);
  }

  /**
   * Soft-deletes a file to the TRASH.
   */
  public async trashFile(
    tokenStringOrSessionId: string,
    fileId: string
  ): Promise<Readonly<FileRecord>> {
    return this.fileEngine.trashFile(tokenStringOrSessionId, fileId);
  }

  /**
   * Restores a trashed file back to ACTIVE.
   */
  public async restoreFile(
    tokenStringOrSessionId: string,
    fileId: string
  ): Promise<Readonly<FileRecord>> {
    return this.fileEngine.restoreFile(tokenStringOrSessionId, fileId);
  }

  /**
   * Permanently purges a file from storage.
   */
  public async purgeFile(
    tokenStringOrSessionId: string,
    fileId: string
  ): Promise<boolean> {
    return this.fileEngine.purgeFile(tokenStringOrSessionId, fileId);
  }

  /**
   * Lists files accessible to the caller.
   */
  public async listFiles(
    tokenStringOrSessionId: string,
    query?: ListFilesQuery
  ): Promise<readonly FileRecord[]> {
    return this.fileEngine.listFiles(tokenStringOrSessionId, query);
  }

  /**
   * Indexes a sovereign resource into the searchable discovery index.
   */
  public async indexSearchResource(
    input: IndexResourceInput
  ): Promise<Readonly<SearchIndexEntry>> {
    return this.searchEngine.indexResource(input);
  }

  /**
   * Removes a resource from the search index.
   */
  public async unindexSearchResource(
    entityType: EntityType,
    entityId: string
  ): Promise<boolean> {
    return this.searchEngine.unindexResource(entityType, entityId);
  }

  /**
   * Executes an authorization-aware discovery search across indexed resources.
   */
  public async search(
    tokenStringOrSessionId: string,
    query: SearchQuery
  ): Promise<Readonly<SearchQueryResult>> {
    return this.searchEngine.search(tokenStringOrSessionId, query);
  }

  /**
   * Creates a sovereign realtime event channel.
   */
  public async createEventChannel(
    tokenStringOrSessionId: string,
    input: CreateChannelInput
  ): Promise<Readonly<ChannelRecord>> {
    return this.eventEngine.createChannel(tokenStringOrSessionId, input);
  }

  /**
   * Subscribes to a realtime event channel with live callbacks.
   */
  public async subscribeEventChannel(
    tokenStringOrSessionId: string,
    input: SubscribeChannelInput,
    callback?: (event: NetworkEvent) => void
  ): Promise<Readonly<EventSubscription>> {
    return this.eventEngine.subscribe(tokenStringOrSessionId, input, callback);
  }

  /**
   * Publishes a sequenced realtime event to a channel.
   */
  public async publishEvent(
    tokenStringOrSessionId: string,
    input: PublishEventInput
  ): Promise<Readonly<NetworkEvent>> {
    return this.eventEngine.publish(tokenStringOrSessionId, input);
  }

  /**
   * Replays historical events from a sequence number buffer.
   */
  public async replayEvents(
    tokenStringOrSessionId: string,
    channelUriOrId: string,
    fromSequence?: number,
    limit?: number
  ): Promise<readonly NetworkEvent[]> {
    return this.eventEngine.replayEvents(tokenStringOrSessionId, channelUriOrId, fromSequence, limit);
  }

  /**
   * Unsubscribes from an active event subscription.
   */
  public async unsubscribeEvent(
    tokenStringOrSessionId: string,
    subscriptionId: string
  ): Promise<boolean> {
    return this.eventEngine.unsubscribe(tokenStringOrSessionId, subscriptionId);
  }

  /**
   * Closes an event channel.
   */
  public async closeEventChannel(
    tokenStringOrSessionId: string,
    channelId: string
  ): Promise<boolean> {
    return this.eventEngine.closeChannel(tokenStringOrSessionId, channelId);
  }

  /**
   * Dispatches a unified request envelope across the sovereign gateway.
   */
  public async dispatchGatewayRequest(
    envelope: GatewayRequestEnvelope
  ): Promise<Readonly<GatewayResponseEnvelope>> {
    return this.gatewayEngine.routeRequest(envelope);
  }

  /**
   * Registers a custom route rule in the gateway.
   */
  public async registerGatewayRoute(
    input: RegisterRouteInput
  ): Promise<Readonly<GatewayRoute>> {
    return this.gatewayEngine.registerRoute(input);
  }

  /**
   * Lists all active routes registered in the gateway.
   */
  public async listGatewayRoutes(): Promise<readonly GatewayRoute[]> {
    return this.gatewayEngine.getRepository().listRoutes();
  }

  /**
   * Retrieves runtime metrics from the gateway.
   */
  public getGatewayMetrics(): GatewayMetrics {
    return this.gatewayEngine.getMetrics();
  }

  /**
   * Registers a peer federation cluster node.
   */
  public async registerFederationNode(
    tokenStringOrSessionId: string,
    input: RegisterFederationNodeInput
  ): Promise<Readonly<FederationNode>> {
    return this.federationEngine.registerFederationNode(tokenStringOrSessionId, input);
  }

  /**
   * Initiates a cryptographic handshake with a registered peer node.
   */
  public async initiateFederationHandshake(
    tokenStringOrSessionId: string,
    input: InitiateHandshakeInput
  ): Promise<Readonly<HandshakeState>> {
    return this.federationEngine.initiateHandshake(tokenStringOrSessionId, input);
  }

  /**
   * Completes a cryptographic handshake and elevates peer node trust.
   */
  public async completeFederationHandshake(
    input: CompleteHandshakeInput
  ): Promise<Readonly<FederationNode>> {
    return this.federationEngine.completeHandshake(input);
  }

  /**
   * Forwards a verified cross-network message to the local cluster gateway.
   */
  public async forwardCrossNetworkMessage(
    envelope: CrossNetworkMessageEnvelope
  ): Promise<Readonly<GatewayResponseEnvelope>> {
    return this.federationEngine.forwardCrossNetworkMessage(envelope);
  }

  /**
   * Sets node trust level (Admin only).
   */
  public async setFederationTrustLevel(
    tokenStringOrSessionId: string,
    networkId: string,
    trustLevel: TrustLevel
  ): Promise<Readonly<FederationNode>> {
    return this.federationEngine.setNodeTrustLevel(tokenStringOrSessionId, networkId, trustLevel);
  }

  /**
   * Revokes federation status for a peer network.
   */
  public async revokeFederationNode(
    tokenStringOrSessionId: string,
    networkId: string
  ): Promise<boolean> {
    return this.federationEngine.revokeFederation(tokenStringOrSessionId, networkId);
  }

  /**
   * Records a cryptographically chained audit log entry.
   */
  public async recordAuditEvent(
    entry: Parameters<CubiOObservabilityEngine['recordAudit']>[0]
  ): Promise<Readonly<AuditLogEntry>> {
    return this.observabilityEngine.recordAudit(entry);
  }

  /**
   * Queries audit logs with strict privacy and authorization boundaries.
   */
  public async queryAuditLogs(
    tokenStringOrSessionId: string,
    options?: AuditQueryOptions
  ): Promise<readonly AuditLogEntry[]> {
    return this.observabilityEngine.queryAudit(tokenStringOrSessionId, options);
  }

  /**
   * Verifies the cryptographic Merkle chain integrity of all audit entries.
   */
  public async verifyAuditIntegrity(): Promise<{
    isValid: boolean;
    brokenAtSequence?: number;
    totalChecked: number;
  }> {
    return this.observabilityEngine.verifyAuditChainIntegrity();
  }

  /**
   * Starts a distributed trace span.
   */
  public async startTraceSpan(
    operationName: string,
    subsystem: string,
    options?: Parameters<CubiOObservabilityEngine['startSpan']>[2]
  ): Promise<Readonly<TraceSpan>> {
    return this.observabilityEngine.startSpan(operationName, subsystem, options);
  }

  /**
   * Ends an active trace span.
   */
  public async endTraceSpan(
    spanId: string,
    status?: 'OK' | 'ERROR',
    tags?: Record<string, string>
  ): Promise<Readonly<TraceSpan>> {
    return this.observabilityEngine.endSpan(spanId, status, tags);
  }

  /**
   * Records a network metric time-series record.
   */
  public async recordNetworkMetric(
    metricName: string,
    metricType: MetricType,
    value: number,
    subsystem: string,
    unit?: string,
    tags?: Record<string, string>
  ): Promise<Readonly<NetworkMetricRecord>> {
    return this.observabilityEngine.recordMetric(metricName, metricType, value, subsystem, unit, tags);
  }

  /**
   * Retrieves summary metrics across the observability network.
   */
  public async getObservabilitySummary(subsystem?: string): Promise<MetricsSummary> {
    return this.observabilityEngine.getMetricsSummary(subsystem);
  }

  /**
   * Prunes audit logs older than retention cutoff (Admin only).
   */
  public async applyAuditRetentionPolicy(
    tokenStringOrSessionId: string,
    maxAgeDays: number
  ): Promise<{ prunedCount: number; remainingCount: number }> {
    return this.observabilityEngine.applyRetentionPolicy(tokenStringOrSessionId, maxAgeDays);
  }

  /**
   * Creates a new Marketplace product (Admin only).
   */
  public async createMarketplaceProduct(
    tokenStringOrSessionId: string,
    input: CreateProductInput
  ): Promise<Readonly<ProductRecord>> {
    return this.billingEngine.createProduct(tokenStringOrSessionId, input);
  }

  /**
   * Lists all available Marketplace products.
   */
  public async listMarketplaceProducts(): Promise<readonly ProductRecord[]> {
    return this.billingEngine.listProducts();
  }

  /**
   * Purchases a product or subscription via tokenized payment method.
   */
  public async purchaseMarketplaceProduct(
    tokenStringOrSessionId: string,
    input: PurchaseProductInput
  ): Promise<{
    order: Readonly<OrderRecord>;
    transaction: Readonly<PaymentTransaction>;
    subscription?: Readonly<SubscriptionRecord>;
    entitlements: readonly EntitlementRecord[];
  }> {
    return this.billingEngine.purchaseProduct(tokenStringOrSessionId, input);
  }

  /**
   * Checks if an identity holds an active capability entitlement.
   */
  public async checkBillingEntitlement(
    ownerCubId: string,
    capability: string
  ): Promise<boolean> {
    return this.billingEngine.checkEntitlement(ownerCubId, capability);
  }

  /**
   * Cancels an active Marketplace subscription.
   */
  public async cancelMarketplaceSubscription(
    tokenStringOrSessionId: string,
    subscriptionId: string
  ): Promise<Readonly<SubscriptionRecord>> {
    return this.billingEngine.cancelSubscription(tokenStringOrSessionId, subscriptionId);
  }

  /**
   * Processes cryptographically verified billing webhooks.
   */
  public async processBillingWebhook(
    rawPayload: string,
    signatureHeader: string
  ): Promise<{ processed: boolean; eventType: string }> {
    return this.billingEngine.processWebhook(rawPayload, signatureHeader);
  }

  /**
   * Creates a new Developer Project.
   */
  public async createDeveloperProject(
    tokenStringOrSessionId: string,
    input: CreateProjectInput
  ): Promise<Readonly<DeveloperProject>> {
    return this.developerEngine.createProject(tokenStringOrSessionId, input);
  }

  /**
   * Creates a new scoped Developer API key.
   */
  public async createDeveloperApiKey(
    tokenStringOrSessionId: string,
    input: CreateApiKeyInput
  ): Promise<CreateApiKeyResult> {
    return this.developerEngine.createApiKey(tokenStringOrSessionId, input);
  }

  /**
   * Revokes an existing Developer API key.
   */
  public async revokeDeveloperApiKey(
    tokenStringOrSessionId: string,
    keyId: string
  ): Promise<Readonly<ApiKeyRecord>> {
    return this.developerEngine.revokeApiKey(tokenStringOrSessionId, keyId);
  }

  /**
   * Validates a raw Developer API key against scopes and rate limits.
   */
  public async validateDeveloperApiKey(
    rawApiKey: string,
    requiredScope?: any
  ): Promise<ValidateApiKeyResult> {
    return this.developerEngine.validateApiKey(rawApiKey, requiredScope);
  }

  /**
   * Retrieves the structured API documentation contract.
   */
  public getDeveloperApiContract(version?: string): ApiDocContract {
    return this.developerEngine.getApiDocContract(version);
  }

  /**
   * Instantiates an ergonomic SDK client authenticated by API key.
   */
  public createSDKClient(apiKey: string, version?: string): CubiOSDKClient {
    return new CubiOSDKClient({ apiKey, stack: this, version });
  }
}
