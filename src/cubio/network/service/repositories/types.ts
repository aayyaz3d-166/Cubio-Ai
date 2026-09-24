/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-10: Service Repository Interfaces
 */

import {
  ServiceRegistration,
  ServiceDiscoveryFilter,
  ServiceStatus,
} from '../types';

export interface IServiceRepository {
  saveService(service: ServiceRegistration): Promise<void>;
  getService(serviceId: string): Promise<ServiceRegistration | undefined>;
  getServiceByName(name: string): Promise<ServiceRegistration | undefined>;
  getServiceByCoordinate(coordinateUri: string): Promise<ServiceRegistration | undefined>;
  listServices(filter?: ServiceDiscoveryFilter): Promise<readonly ServiceRegistration[]>;
  updateServiceStatus(serviceId: string, status: ServiceStatus): Promise<ServiceRegistration | undefined>;
  deleteService(serviceId: string): Promise<boolean>;
}
