/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: Repository Interfaces
 *
 * Decouples address state management from in-memory test stores and future production databases.
 */

import {
  CubiOAddress,
  AddressOwnership,
  AddressReservation,
  AddressStatus,
} from '../types';

export interface IAddressRepository {
  saveAddress(address: CubiOAddress): Promise<void>;
  getAddress(fullAddress: string): Promise<CubiOAddress | undefined>;
  getAddressById(addressId: string): Promise<CubiOAddress | undefined>;
  getAddressesByCubId(cubId: string): Promise<readonly CubiOAddress[]>;
  updateAddressStatus(fullAddress: string, status: AddressStatus): Promise<boolean>;
  deleteAddress(fullAddress: string): Promise<boolean>;

  saveOwnership(ownership: AddressOwnership): Promise<void>;
  getOwnership(fullAddress: string): Promise<AddressOwnership | undefined>;
  getOwnershipsByCubId(cubId: string): Promise<readonly AddressOwnership[]>;
  deleteOwnership(fullAddress: string): Promise<boolean>;

  saveReservation(reservation: AddressReservation): Promise<void>;
  getReservation(fullAddress: string): Promise<AddressReservation | undefined>;
  getReservationByToken(token: string): Promise<AddressReservation | undefined>;
  deleteReservation(fullAddress: string): Promise<boolean>;
  cleanExpiredReservations(now?: number): Promise<number>;
}
