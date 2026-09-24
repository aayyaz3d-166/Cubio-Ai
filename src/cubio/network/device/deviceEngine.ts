/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-11: Master Device / Node Management Engine
 *
 * Implements sovereign device provisioning, hardware binding to CUB-XXXXXXXX,
 * telemetry/heartbeat updates, remote command dispatching, and CNC coordinate integration.
 *
 * CRITICAL INVARIANT:
 * - A device (DEV_... / NODE_...) MUST NEVER automatically become a USER identity (CUB-XXXXXXXX).
 * - Devices cannot self-promote to user accounts or forge user credentials.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiONodeRegistry } from '../coordinate/registry';
import { CubiOLogicalRouter } from '../coordinate/routing';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOMessagingEngine } from '../messaging/messagingEngine';
import {
  DeviceRecord,
  DeviceHeartbeat,
  DeviceCommand,
  DeviceCommandType,
  ProvisionDeviceInput,
  DeviceDiscoveryFilter,
  DeviceStatus,
} from './types';
import { IDeviceRepository } from './repositories/types';
import { MemoryDeviceRepository } from './repositories/memoryRepositories';

export class CubiODeviceEngine {
  private repository: IDeviceRepository;
  private coordinateRegistry?: CubiONodeRegistry;
  private router?: CubiOLogicalRouter;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private messagingEngine?: CubiOMessagingEngine;

  constructor(options: {
    repository?: IDeviceRepository;
    coordinateRegistry?: CubiONodeRegistry;
    router?: CubiOLogicalRouter;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    messagingEngine?: CubiOMessagingEngine;
  } = {}) {
    this.repository = options.repository || new MemoryDeviceRepository();
    this.coordinateRegistry = options.coordinateRegistry;
    this.router = options.router;
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.messagingEngine = options.messagingEngine;
  }

  public getRepository(): IDeviceRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in DeviceEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Device Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Invariant Guard: Verifies that an identifier is NOT a device trying to act as a user.
   */
  public static assertNotDeviceIdentity(identifier: string): void {
    if (identifier.startsWith('DEV_') || identifier.startsWith('NODE_') || identifier.startsWith('DEV-')) {
      throw new Error(`Architectural Security Violation: Device '${identifier}' cannot be treated as a sovereign USER identity.`);
    }
  }

  /**
   * Provisions a new physical or virtual spatial device bound to the caller's CUB-ID.
   */
  public async provisionDevice(
    tokenOrSession: string,
    input: ProvisionDeviceInput
  ): Promise<Readonly<DeviceRecord>> {
    // 1. Authenticate owner caller (NET-02)
    const ownerCubId = await this.authenticateCaller(tokenOrSession);
    CubiODeviceEngine.assertNotDeviceIdentity(ownerCubId);

    // 2. Verify owner exists in NET-01 identity registry
    if (this.identityRegistry && !this.identityRegistry.has(ownerCubId)) {
      throw new Error(`Device Provisioning Error: Sovereign Identity '${ownerCubId}' not found in NET-01 registry.`);
    }

    // 3. Evaluate NET-03 authorization for DEVICE_PROVISION
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: ownerCubId,
        action: 'DEVICE_PROVISION',
        resourceUri: input.coordinateUri || 'CUBIO://NETWORK/0/01/00001/TERMINAL',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${ownerCubId}' lacks permission 'DEVICE_PROVISION'.`);
      }
    }

    // 4. Duplicate hardware fingerprint check
    const existing = await this.repository.getDeviceByFingerprint(input.fingerprint);
    if (existing && existing.status !== 'REVOKED') {
      throw new Error(`Device Provisioning Error: Hardware fingerprint '${input.fingerprint}' is already provisioned to device '${existing.deviceId}'.`);
    }

    const now = Date.now();
    const deviceId = `DEV_${deterministicHash(`${ownerCubId}:${input.fingerprint}:${now}`).slice(2, 18)}`;
    const nodeId = `NODE_${deterministicHash(`${deviceId}:${now}`).slice(2, 18)}`;
    const coordinateUri = input.coordinateUri || 'CUBIO://NETWORK/0/01/00001/TERMINAL';

    const device: DeviceRecord = Object.freeze({
      deviceId,
      nodeId,
      name: input.name.trim(),
      deviceType: input.deviceType,
      deviceRole: input.deviceRole || 'EDGE_TERMINAL',
      ownerCubId,
      publicKey: input.publicKey,
      fingerprint: input.fingerprint,
      coordinateUri,
      status: 'ONLINE',
      capabilities: Object.freeze([...(input.capabilities || ['SPATIAL_RENDER', 'P2P_RELAY'])]),
      provisionedAt: now,
      lastHeartbeatAt: now,
      telemetry: Object.freeze({
        cpuUsage: 5.0,
        memoryUsage: 20.0,
        latencyMs: 12,
      }),
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveDevice(device);
    return device;
  }

  /**
   * Records a telemetry heartbeat from a device.
   */
  public async recordHeartbeat(
    deviceId: string,
    heartbeat: DeviceHeartbeat
  ): Promise<Readonly<DeviceRecord>> {
    const updated = await this.repository.updateDeviceHeartbeat(deviceId, heartbeat);
    if (!updated) {
      throw new Error(`Device '${deviceId}' not found for heartbeat update.`);
    }
    return updated;
  }

  /**
   * Dispatches a control command to a provisioned device.
   */
  public async sendCommand(
    tokenOrSession: string,
    targetDeviceId: string,
    commandType: DeviceCommandType,
    payload?: any
  ): Promise<Readonly<DeviceCommand>> {
    const senderCubId = await this.authenticateCaller(tokenOrSession);
    const device = await this.repository.getDevice(targetDeviceId);

    if (!device) {
      throw new Error(`Device Command Error: Device '${targetDeviceId}' not found.`);
    }

    // Verify caller is the device owner or administrator
    if (device.ownerCubId !== senderCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: senderCubId,
          action: 'DEVICE_MANAGE',
          resourceUri: device.coordinateUri,
        });
        if (!decision.allowed) {
          throw new Error(`Security Violation: Identity '${senderCubId}' does not own device '${targetDeviceId}'.`);
        }
      } else {
        throw new Error(`Security Violation: Identity '${senderCubId}' does not own device '${targetDeviceId}'.`);
      }
    }

    if (device.status === 'REVOKED' || device.status === 'SUSPENDED') {
      throw new Error(`Device Command Error: Cannot dispatch command to device in '${device.status}' state.`);
    }

    const now = Date.now();
    const commandId = `CMD_${deterministicHash(`${targetDeviceId}:${commandType}:${now}`).slice(2, 18)}`;

    const command: DeviceCommand = Object.freeze({
      commandId,
      targetDeviceId,
      senderCubId,
      commandType,
      payload: payload ? Object.freeze({ ...payload }) : undefined,
      issuedAt: now,
      status: 'PENDING',
    });

    await this.repository.saveCommand(command);

    // Simulate instant execution on online devices
    const executedCommand: DeviceCommand = Object.freeze({
      ...command,
      status: 'SUCCESS',
      executedAt: now + 5,
      result: Object.freeze({ acknowledged: true, deviceId: targetDeviceId, commandType }),
    });

    await this.repository.updateCommand(commandId, executedCommand);
    return executedCommand;
  }

  /**
   * Lists all devices owned by the caller.
   */
  public async listMyDevices(tokenOrSession: string): Promise<readonly DeviceRecord[]> {
    const ownerCubId = await this.authenticateCaller(tokenOrSession);
    return this.repository.getDevicesByOwner(ownerCubId);
  }

  /**
   * Retrieves details for a specific device.
   */
  public async getDevice(
    tokenOrSession: string,
    deviceId: string
  ): Promise<Readonly<DeviceRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const device = await this.repository.getDevice(deviceId);

    if (!device) {
      throw new Error(`Device '${deviceId}' not found.`);
    }

    if (device.ownerCubId !== callerCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'ADMIN_MANAGE',
          resourceUri: device.coordinateUri,
        });
        if (!decision.allowed) {
          throw new Error('Access Denied: Caller is not authorized to view this device.');
        }
      }
    }

    return device;
  }

  /**
   * Revokes a device (Device de-provisioning).
   */
  public async revokeDevice(
    tokenOrSession: string,
    deviceId: string
  ): Promise<boolean> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const device = await this.repository.getDevice(deviceId);

    if (!device) return false;

    if (device.ownerCubId !== callerCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'DEVICE_REVOKE',
          resourceUri: device.coordinateUri,
        });
        if (!decision.allowed) {
          throw new Error('Authorization Denied: Caller cannot revoke this device.');
        }
      } else {
        throw new Error('Security Violation: Only device owner can revoke device.');
      }
    }

    const updated = await this.repository.updateDeviceStatus(deviceId, 'REVOKED');
    return !!updated;
  }
}
