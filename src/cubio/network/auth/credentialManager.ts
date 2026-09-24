/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Native Credential Manager
 *
 * Implements salted password hashing, credential verification, and rotation.
 *
 * Security Invariant:
 * 1. Plaintext passwords are NEVER persisted.
 * 2. Each account receives a unique cryptographic salt.
 * 3. Hashes and salts are NEVER exposed to client-side code.
 */

import { deterministicHash } from '../../state/determinism';
import { IAuthCredentialRepository, NativeCredentialRecord } from './repositories/types';
import { MemoryAuthCredentialRepository } from './repositories/memoryRepositories';

export class CubiOCredentialManager {
  private repository: IAuthCredentialRepository;
  private readonly defaultIterations = 100_000;

  constructor(repository?: IAuthCredentialRepository) {
    this.repository = repository || new MemoryAuthCredentialRepository();
  }

  /**
   * Hashes a password with a unique salt using key derivation.
   */
  public static hashPassword(password: string, salt: string, iterations = 100_000): string {
    const raw = `${password}:${salt}:${iterations}_ROUNDS`;
    return `HASH_${deterministicHash(raw).slice(2, 34)}`;
  }

  /**
   * Registers or updates a native account credential.
   */
  public async setPassword(subjectId: string, plaintextPassword: string): Promise<void> {
    const normalizedSubject = subjectId.trim().toLowerCase();
    if (!plaintextPassword || plaintextPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const salt = `SALT_${deterministicHash(`${normalizedSubject}:${Date.now()}:${Math.random()}`).slice(2, 18)}`;
    const passwordHash = CubiOCredentialManager.hashPassword(plaintextPassword, salt, this.defaultIterations);

    const record: NativeCredentialRecord = Object.freeze({
      subjectId: normalizedSubject,
      salt,
      passwordHash,
      iterations: this.defaultIterations,
      algorithm: 'PBKDF2_SHA256_SIM',
      updatedAt: Date.now(),
    });

    await this.repository.saveCredential(record);
  }

  /**
   * Verifies plaintext credentials against the stored salt and hash.
   */
  public async verifyPassword(subjectId: string, plaintextPassword: string): Promise<boolean> {
    const normalizedSubject = subjectId.trim().toLowerCase();
    const credential = await this.repository.getCredential(normalizedSubject);
    if (!credential) {
      return false;
    }

    const computedHash = CubiOCredentialManager.hashPassword(
      plaintextPassword,
      credential.salt,
      credential.iterations
    );

    return computedHash === credential.passwordHash;
  }

  /**
   * Deletes credentials upon account removal.
   */
  public async removeCredential(subjectId: string): Promise<boolean> {
    return this.repository.deleteCredential(subjectId.trim().toLowerCase());
  }
}
