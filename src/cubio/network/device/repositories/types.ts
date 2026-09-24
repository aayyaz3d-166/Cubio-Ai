/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-11: Device Repository Interfaces
 */

import {
  DeviceRecord,
  DeviceHeartbeat,
  DeviceCommand,
  DeviceDiscoveryFilter,
  DeviceStatus,
} from '../types';

export interface IDeviceRepository {
  // Device records
  saveDevice(device: DeviceRecord): Promise<void>;
  getDevice(deviceId: string): Promise<DeviceRecord | undefined>;
  getDevicesByOwner(ownerCubId: string): Promise<readonly DeviceRecord[]>;
  getDeviceByFingerprint(fingerprint: string): Promise<DeviceRecord | undefined>;
  listDevices(filter?: DeviceDiscoveryFilter): Promise<readonly DeviceRecord[]>;
  updateDeviceHeartbeat(deviceId: string, heartbeat: DeviceHeartbeat): Promise<DeviceRecord | undefined>;
  updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<DeviceRecord | undefined>;
  deleteDevice(deviceId: string): Promise<boolean>;

  // Commands
  saveCommand(command: DeviceCommand): Promise<void>;
  getCommand(commandId: string): Promise<DeviceCommand | undefined>;
  getCommandsByDevice(deviceId: string): Promise<readonly DeviceCommand[]>;
  updateCommand(commandId: string, updates: Partial<DeviceCommand>): Promise<DeviceCommand | undefined>;
}
