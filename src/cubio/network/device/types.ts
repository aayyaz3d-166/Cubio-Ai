/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-11: CubiO Device / Node Network (Types & Models)
 *
 * Formal specification for sovereign device identity, hardware binding,
 * node coordinate provisioning, telemetry/heartbeat metrics, and remote commands.
 *
 * ARCHITECTURAL INVARIANT:
 * - A device (DEV_... / NODE_...) MUST NEVER automatically become a USER identity (CUB-XXXXXXXX).
 * - Devices are physical edge nodes/workers bound to a human owner CUB-ID (NET-01).
 * - Device coordinates integrate with CNC tree (NET-00) for network routing.
 */

export type DeviceType =
  | 'DESKTOP'
  | 'MOBILE'
  | 'XR_HEADSET'
  | 'HAPTIC_RIG'
  | 'COMPUTE_NODE'
  | 'STORAGE_RELAY'
  | 'SPATIAL_SENSOR';

export type DeviceStatus =
  | 'PROVISIONING'
  | 'ONLINE'
  | 'OFFLINE'
  | 'DEGRADED'
  | 'SUSPENDED'
  | 'REVOKED';

export type DeviceRole =
  | 'EDGE_TERMINAL'
  | 'COMPUTE_WORKER'
  | 'RELAY_NODE'
  | 'OBSERVER_SENSOR';

export interface DeviceTelemetry {
  readonly cpuUsage: number; // 0 - 100%
  readonly memoryUsage: number; // 0 - 100%
  readonly latencyMs: number;
  readonly temperatureC?: number;
  readonly activeJobs?: number;
}

export interface DeviceHeartbeat {
  readonly deviceId: string;
  readonly timestamp: number;
  readonly metrics: DeviceTelemetry;
  readonly status: DeviceStatus;
}

export interface DeviceRecord {
  readonly deviceId: string; // DEV_...
  readonly nodeId: string; // NODE_...
  readonly name: string; // e.g. "Vision Pro Headset 01"
  readonly deviceType: DeviceType;
  readonly deviceRole: DeviceRole;
  readonly ownerCubId: string; // Sovereign owner CUB-XXXXXXXX from NET-01
  readonly publicKey: string; // Device cryptographic key
  readonly fingerprint: string; // Hardware signature
  readonly coordinateUri: string; // CNC coordinate: e.g. CUBIO://NETWORK/0/01/00001/TERMINAL or custom node
  readonly status: DeviceStatus;
  readonly capabilities: readonly string[];
  readonly provisionedAt: number;
  readonly lastHeartbeatAt: number;
  readonly telemetry?: Readonly<DeviceTelemetry>;
  readonly ipAddress?: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface ProvisionDeviceInput {
  readonly name: string;
  readonly deviceType: DeviceType;
  readonly deviceRole?: DeviceRole;
  readonly publicKey: string;
  readonly fingerprint: string;
  readonly capabilities?: readonly string[];
  readonly coordinateUri?: string;
  readonly metadata?: Record<string, any>;
}

export type DeviceCommandType =
  | 'PING'
  | 'RESTART'
  | 'SYNC_STATE'
  | 'RUN_JOB'
  | 'TERMINATE';

export interface DeviceCommand {
  readonly commandId: string; // CMD_...
  readonly targetDeviceId: string;
  readonly senderCubId: string;
  readonly commandType: DeviceCommandType;
  readonly payload?: any;
  readonly issuedAt: number;
  readonly executedAt?: number;
  readonly result?: any;
  readonly status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  readonly error?: string;
}

export interface DeviceDiscoveryFilter {
  readonly deviceType?: DeviceType;
  readonly deviceRole?: DeviceRole;
  readonly status?: DeviceStatus;
  readonly ownerCubId?: string;
}
