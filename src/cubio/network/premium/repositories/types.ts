/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: Premium Address Repository Interfaces
 */

import {
  PremiumAddressRecord,
  PremiumAddressReservation,
  PremiumAddressTransferRecord,
} from '../types';

export interface IPremiumAddressRepository {
  // Address records
  saveAddress(record: PremiumAddressRecord): Promise<void>;
  getAddress(username: string): Promise<PremiumAddressRecord | undefined>;
  getAddressesByOwner(ownerCubId: string): Promise<readonly PremiumAddressRecord[]>;
  deleteAddress(username: string): Promise<boolean>;

  // Reservations
  saveReservation(reservation: PremiumAddressReservation): Promise<void>;
  getReservation(username: string): Promise<PremiumAddressReservation | undefined>;
  getReservationByToken(token: string): Promise<PremiumAddressReservation | undefined>;
  getActiveReservationsByOwner(ownerCubId: string): Promise<readonly PremiumAddressReservation[]>;
  deleteReservation(username: string): Promise<boolean>;

  // Transfers
  recordTransfer(transfer: PremiumAddressTransferRecord): Promise<void>;
  getTransferHistory(username: string): Promise<readonly PremiumAddressTransferRecord[]>;
}
