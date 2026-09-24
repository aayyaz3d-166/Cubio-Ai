/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: In-Memory Address Repository
 *
 * Provides thread-safe in-memory index maps for addresses, ownership records, and reservations.
 */

import {
  CubiOAddress,
  AddressOwnership,
  AddressReservation,
  AddressStatus,
} from '../types';
import { IAddressRepository } from './types';

export class MemoryAddressRepository implements IAddressRepository {
  private addresses: Map<string, CubiOAddress> = new Map(); // key: fullAddress
  private addressById: Map<string, string> = new Map(); // addressId -> fullAddress
  private ownerships: Map<string, AddressOwnership> = new Map(); // key: fullAddress
  private reservations: Map<string, AddressReservation> = new Map(); // key: fullAddress
  private reservationByToken: Map<string, string> = new Map(); // token -> fullAddress

  public async saveAddress(address: CubiOAddress): Promise<void> {
    const key = address.fullAddress.toLowerCase();
    this.addresses.set(key, Object.freeze({ ...address }));
    this.addressById.set(address.addressId, key);
  }

  public async getAddress(fullAddress: string): Promise<CubiOAddress | undefined> {
    return this.addresses.get(fullAddress.toLowerCase());
  }

  public async getAddressById(addressId: string): Promise<CubiOAddress | undefined> {
    const key = this.addressById.get(addressId);
    if (!key) return undefined;
    return this.addresses.get(key);
  }

  public async getAddressesByCubId(cubId: string): Promise<readonly CubiOAddress[]> {
    const results: CubiOAddress[] = [];
    for (const addr of this.addresses.values()) {
      if (addr.ownerCubId === cubId) {
        results.push(addr);
      }
    }
    return Object.freeze(results);
  }

  public async updateAddressStatus(fullAddress: string, status: AddressStatus): Promise<boolean> {
    const key = fullAddress.toLowerCase();
    const existing = this.addresses.get(key);
    if (!existing) return false;

    const updated: CubiOAddress = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });
    this.addresses.set(key, updated);

    // Update ownership status if present
    const own = this.ownerships.get(key);
    if (own) {
      this.ownerships.set(
        key,
        Object.freeze({
          ...own,
          status,
          updatedAt: Date.now(),
        })
      );
    }

    return true;
  }

  public async deleteAddress(fullAddress: string): Promise<boolean> {
    const key = fullAddress.toLowerCase();
    const addr = this.addresses.get(key);
    if (!addr) return false;

    this.addressById.delete(addr.addressId);
    this.addresses.delete(key);
    this.ownerships.delete(key);
    this.reservations.delete(key);
    return true;
  }

  public async saveOwnership(ownership: AddressOwnership): Promise<void> {
    const key = ownership.fullAddress.toLowerCase();
    this.ownerships.set(key, Object.freeze({ ...ownership }));
  }

  public async getOwnership(fullAddress: string): Promise<AddressOwnership | undefined> {
    return this.ownerships.get(fullAddress.toLowerCase());
  }

  public async getOwnershipsByCubId(cubId: string): Promise<readonly AddressOwnership[]> {
    const results: AddressOwnership[] = [];
    for (const own of this.ownerships.values()) {
      if (own.cubId === cubId) {
        results.push(own);
      }
    }
    return Object.freeze(results);
  }

  public async deleteOwnership(fullAddress: string): Promise<boolean> {
    return this.ownerships.delete(fullAddress.toLowerCase());
  }

  public async saveReservation(reservation: AddressReservation): Promise<void> {
    const key = reservation.fullAddress.toLowerCase();
    this.reservations.set(key, Object.freeze({ ...reservation }));
    this.reservationByToken.set(reservation.reservationToken, key);
  }

  public async getReservation(fullAddress: string): Promise<AddressReservation | undefined> {
    const key = fullAddress.toLowerCase();
    const res = this.reservations.get(key);
    if (!res) return undefined;

    // Check expiration
    if (res.status === 'ACTIVE' && Date.now() > res.expiresAt) {
      const expired: AddressReservation = Object.freeze({
        ...res,
        status: 'EXPIRED',
      });
      this.reservations.set(key, expired);
      return expired;
    }
    return res;
  }

  public async getReservationByToken(token: string): Promise<AddressReservation | undefined> {
    const key = this.reservationByToken.get(token);
    if (!key) return undefined;
    return this.getReservation(key);
  }

  public async deleteReservation(fullAddress: string): Promise<boolean> {
    const key = fullAddress.toLowerCase();
    const res = this.reservations.get(key);
    if (!res) return false;

    this.reservationByToken.delete(res.reservationToken);
    return this.reservations.delete(key);
  }

  public async cleanExpiredReservations(now: number = Date.now()): Promise<number> {
    let count = 0;
    for (const [key, res] of this.reservations.entries()) {
      if (res.status === 'ACTIVE' && now > res.expiresAt) {
        this.reservations.set(
          key,
          Object.freeze({
            ...res,
            status: 'EXPIRED',
          })
        );
        count++;
      }
    }
    return count;
  }
}
