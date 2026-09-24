/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: In-Memory Premium Address Repository
 */

import {
  PremiumAddressRecord,
  PremiumAddressReservation,
  PremiumAddressTransferRecord,
} from '../types';
import { IPremiumAddressRepository } from './types';

export class MemoryPremiumAddressRepository implements IPremiumAddressRepository {
  private addresses: Map<string, PremiumAddressRecord> = new Map(); // username -> PremiumAddressRecord
  private reservations: Map<string, PremiumAddressReservation> = new Map(); // username -> PremiumAddressReservation
  private transfers: Map<string, PremiumAddressTransferRecord[]> = new Map(); // username -> TransferRecord[]

  // --- ADDRESS RECORDS ---

  public async saveAddress(record: PremiumAddressRecord): Promise<void> {
    const key = record.username.toLowerCase();
    this.addresses.set(key, Object.freeze({ ...record }));
  }

  public async getAddress(username: string): Promise<PremiumAddressRecord | undefined> {
    const key = username.toLowerCase();
    return this.addresses.get(key);
  }

  public async getAddressesByOwner(ownerCubId: string): Promise<readonly PremiumAddressRecord[]> {
    const matches: PremiumAddressRecord[] = [];
    for (const record of this.addresses.values()) {
      if (record.ownerCubId === ownerCubId) {
        matches.push(record);
      }
    }
    return Object.freeze(matches);
  }

  public async deleteAddress(username: string): Promise<boolean> {
    const key = username.toLowerCase();
    return this.addresses.delete(key);
  }

  // --- RESERVATIONS ---

  public async saveReservation(reservation: PremiumAddressReservation): Promise<void> {
    const key = reservation.username.toLowerCase();
    this.reservations.set(key, Object.freeze({ ...reservation }));
  }

  public async getReservation(username: string): Promise<PremiumAddressReservation | undefined> {
    const key = username.toLowerCase();
    const res = this.reservations.get(key);
    if (res && res.status === 'ACTIVE' && Date.now() > res.expiresAt) {
      // Auto-expire reservation
      const expired: PremiumAddressReservation = Object.freeze({
        ...res,
        status: 'EXPIRED',
      });
      this.reservations.set(key, expired);
      return expired;
    }
    return res;
  }

  public async getReservationByToken(token: string): Promise<PremiumAddressReservation | undefined> {
    for (const res of this.reservations.values()) {
      if (res.reservationToken === token) {
        if (res.status === 'ACTIVE' && Date.now() > res.expiresAt) {
          const expired: PremiumAddressReservation = Object.freeze({
            ...res,
            status: 'EXPIRED',
          });
          this.reservations.set(res.username.toLowerCase(), expired);
          return expired;
        }
        return res;
      }
    }
    return undefined;
  }

  public async getActiveReservationsByOwner(ownerCubId: string): Promise<readonly PremiumAddressReservation[]> {
    const matches: PremiumAddressReservation[] = [];
    const now = Date.now();

    for (const res of this.reservations.values()) {
      if (res.reservedForCubId === ownerCubId && res.status === 'ACTIVE' && res.expiresAt > now) {
        matches.push(res);
      }
    }
    return Object.freeze(matches);
  }

  public async deleteReservation(username: string): Promise<boolean> {
    const key = username.toLowerCase();
    return this.reservations.delete(key);
  }

  // --- TRANSFERS ---

  public async recordTransfer(transfer: PremiumAddressTransferRecord): Promise<void> {
    const key = transfer.address.toLowerCase();
    const history = this.transfers.get(key) || [];
    history.push(Object.freeze({ ...transfer }));
    this.transfers.set(key, history);
  }

  public async getTransferHistory(username: string): Promise<readonly PremiumAddressTransferRecord[]> {
    const key = username.toLowerCase();
    return Object.freeze(this.transfers.get(key) || []);
  }
}
