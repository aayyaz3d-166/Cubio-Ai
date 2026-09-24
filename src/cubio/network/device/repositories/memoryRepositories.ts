/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-11: In-Memory Device Repository
 */

import {
  DeviceRecord,
  DeviceHeartbeat,
  DeviceCommand,
  DeviceDiscoveryFilter,
  DeviceStatus,
} from '../types';
import { IDeviceRepository } from './types';

export class MemoryDeviceRepository implements IDeviceRepository {
  private devicesById: Map<string, DeviceRecord> = new Map();
  private devicesByFingerprint: Map<string, string> = new Map(); // fingerprint -> deviceId
  private commandsById: Map<string, DeviceCommand> = new Map();

  // --- DEVICE RECORDS ---

  public async saveDevice(device: DeviceRecord): Promise<void> {
    const frozen = Object.freeze({ ...device });
    this.devicesById.set(device.deviceId, frozen);
    this.devicesByFingerprint.set(device.fingerprint, device.deviceId);
  }

  public async getDevice(deviceId: string): Promise<DeviceRecord | undefined> {
    return this.devicesById.get(deviceId);
  }

  public async getDevicesByOwner(ownerCubId: string): Promise<readonly DeviceRecord[]> {
    const matches: DeviceRecord[] = [];
    for (const dev of this.devicesById.values()) {
      if (dev.ownerCubId === ownerCubId) {
        matches.push(dev);
      }
    }
    return Object.freeze(matches);
  }

  public async getDeviceByFingerprint(fingerprint: string): Promise<DeviceRecord | undefined> {
    const id = this.devicesByFingerprint.get(fingerprint);
    return id ? this.devicesById.get(id) : undefined;
  }

  public async listDevices(filter: DeviceDiscoveryFilter = {}): Promise<readonly DeviceRecord[]> {
    const matches: DeviceRecord[] = [];
    for (const dev of this.devicesById.values()) {
      if (filter.deviceType && dev.deviceType !== filter.deviceType) continue;
      if (filter.deviceRole && dev.deviceRole !== filter.deviceRole) continue;
      if (filter.status && dev.status !== filter.status) continue;
      if (filter.ownerCubId && dev.ownerCubId !== filter.ownerCubId) continue;
      matches.push(dev);
    }
    return Object.freeze(matches);
  }

  public async updateDeviceHeartbeat(
    deviceId: string,
    heartbeat: DeviceHeartbeat
  ): Promise<DeviceRecord | undefined> {
    const existing = this.devicesById.get(deviceId);
    if (!existing) return undefined;

    const updated: DeviceRecord = Object.freeze({
      ...existing,
      status: heartbeat.status,
      lastHeartbeatAt: heartbeat.timestamp,
      telemetry: Object.freeze({ ...heartbeat.metrics }),
    });

    this.devicesById.set(deviceId, updated);
    return updated;
  }

  public async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus
  ): Promise<DeviceRecord | undefined> {
    const existing = this.devicesById.get(deviceId);
    if (!existing) return undefined;

    const updated: DeviceRecord = Object.freeze({
      ...existing,
      status,
    });

    this.devicesById.set(deviceId, updated);
    return updated;
  }

  public async deleteDevice(deviceId: string): Promise<boolean> {
    const existing = this.devicesById.get(deviceId);
    if (!existing) return false;

    this.devicesByFingerprint.delete(existing.fingerprint);
    return this.devicesById.delete(deviceId);
  }

  // --- COMMANDS ---

  public async saveCommand(command: DeviceCommand): Promise<void> {
    this.commandsById.set(command.commandId, Object.freeze({ ...command }));
  }

  public async getCommand(commandId: string): Promise<DeviceCommand | undefined> {
    return this.commandsById.get(commandId);
  }

  public async getCommandsByDevice(deviceId: string): Promise<readonly DeviceCommand[]> {
    const matches: DeviceCommand[] = [];
    for (const cmd of this.commandsById.values()) {
      if (cmd.targetDeviceId === deviceId) {
        matches.push(cmd);
      }
    }
    return Object.freeze(matches);
  }

  public async updateCommand(
    commandId: string,
    updates: Partial<DeviceCommand>
  ): Promise<DeviceCommand | undefined> {
    const existing = this.commandsById.get(commandId);
    if (!existing) return undefined;

    const updated: DeviceCommand = Object.freeze({
      ...existing,
      ...updates,
    });

    this.commandsById.set(commandId, updated);
    return updated;
  }
}
