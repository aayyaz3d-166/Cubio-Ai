/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-10: In-Memory Service Repository
 */

import {
  ServiceRegistration,
  ServiceDiscoveryFilter,
  ServiceStatus,
} from '../types';
import { IServiceRepository } from './types';

export class MemoryServiceRepository implements IServiceRepository {
  private servicesById: Map<string, ServiceRegistration> = new Map();
  private servicesByName: Map<string, string> = new Map(); // name.toLowerCase() -> serviceId
  private servicesByCoordinate: Map<string, string> = new Map(); // coordinateUri -> serviceId

  public async saveService(service: ServiceRegistration): Promise<void> {
    const frozen = Object.freeze({ ...service });
    this.servicesById.set(service.serviceId, frozen);
    this.servicesByName.set(service.name.toLowerCase(), service.serviceId);
    this.servicesByCoordinate.set(service.coordinateUri, service.serviceId);
  }

  public async getService(serviceId: string): Promise<ServiceRegistration | undefined> {
    return this.servicesById.get(serviceId);
  }

  public async getServiceByName(name: string): Promise<ServiceRegistration | undefined> {
    const id = this.servicesByName.get(name.toLowerCase());
    return id ? this.servicesById.get(id) : undefined;
  }

  public async getServiceByCoordinate(coordinateUri: string): Promise<ServiceRegistration | undefined> {
    const id = this.servicesByCoordinate.get(coordinateUri);
    return id ? this.servicesById.get(id) : undefined;
  }

  public async listServices(filter: ServiceDiscoveryFilter = {}): Promise<readonly ServiceRegistration[]> {
    const matches: ServiceRegistration[] = [];

    for (const service of this.servicesById.values()) {
      if (filter.serviceType && service.serviceType !== filter.serviceType) continue;
      if (filter.status && service.status !== filter.status) continue;
      if (filter.providerCubId && service.providerCubId !== filter.providerCubId) continue;
      matches.push(service);
    }

    return Object.freeze(matches);
  }

  public async updateServiceStatus(
    serviceId: string,
    status: ServiceStatus
  ): Promise<ServiceRegistration | undefined> {
    const existing = this.servicesById.get(serviceId);
    if (!existing) return undefined;

    const updated: ServiceRegistration = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });

    this.servicesById.set(serviceId, updated);
    return updated;
  }

  public async deleteService(serviceId: string): Promise<boolean> {
    const existing = this.servicesById.get(serviceId);
    if (!existing) return false;

    this.servicesByName.delete(existing.name.toLowerCase());
    this.servicesByCoordinate.delete(existing.coordinateUri);
    return this.servicesById.delete(serviceId);
  }
}
