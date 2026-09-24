/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-01: Entity Binding & Relationship Manager
 *
 * Enforces strict type boundaries between Users, Devices, Agents, and Services:
 * - A User may own multiple Devices (1:N)
 * - A User may operate multiple AI Agents (1:N)
 * - A Device does NOT automatically become a User.
 * - An AI Agent does NOT automatically become a User.
 * - A Service maintains sovereign service identity.
 */

import { CubiOProvenanceManager } from './provenance';
import {
  CubiOIdentity,
  CubiOEntityType,
  EntityBinding,
  EntityBindingRelation,
} from './types';

export class CubiOBindingManager {
  /**
   * Validates if a proposed binding relationship between two entities is semantically legal.
   */
  public static validateBinding(
    parent: CubiOIdentity,
    target: CubiOIdentity,
    relation: EntityBindingRelation
  ): { isValid: boolean; error?: string } {
    if (parent.cubId === target.cubId) {
      return { isValid: false, error: 'Entity cannot bind to itself.' };
    }

    switch (relation) {
      case 'OWNS_DEVICE':
        if (parent.type !== 'USER') {
          return { isValid: false, error: `Only a USER can own a device. Parent is '${parent.type}'.` };
        }
        if (target.type !== 'DEVICE') {
          return { isValid: false, error: `Target of OWNS_DEVICE must be a DEVICE. Target is '${target.type}'.` };
        }
        break;

      case 'OPERATES_AGENT':
        if (parent.type !== 'USER') {
          return { isValid: false, error: `Only a USER can operate an AI agent. Parent is '${parent.type}'.` };
        }
        if (target.type !== 'AGENT') {
          return { isValid: false, error: `Target of OPERATES_AGENT must be an AGENT. Target is '${target.type}'.` };
        }
        break;

      case 'HOSTS_SERVICE':
        if (parent.type !== 'DEVICE' && parent.type !== 'USER' && parent.type !== 'AGENT') {
          return { isValid: false, error: `Parent of HOSTS_SERVICE must be DEVICE, USER, or AGENT. Parent is '${parent.type}'.` };
        }
        if (target.type !== 'SERVICE') {
          return { isValid: false, error: `Target of HOSTS_SERVICE must be a SERVICE. Target is '${target.type}'.` };
        }
        break;

      case 'DELEGATES_TO':
        if (parent.type !== 'USER') {
          return { isValid: false, error: `Only a USER can delegate authority. Parent is '${parent.type}'.` };
        }
        if (target.type !== 'AGENT' && target.type !== 'USER') {
          return { isValid: false, error: `Target of DELEGATES_TO must be an AGENT or USER. Target is '${target.type}'.` };
        }
        break;

      case 'MEMBER_OF':
        // General group/service membership
        break;

      default:
        return { isValid: false, error: `Unknown relation '${relation}'.` };
    }

    return { isValid: true };
  }

  /**
   * Adds a bound entity to an identity, returning a new immutable identity with updated provenance.
   */
  public static addBinding(
    identity: CubiOIdentity,
    targetCubId: string,
    targetType: CubiOEntityType,
    relation: EntityBindingRelation,
    options: { boundAt?: number; metadata?: Record<string, any> } = {}
  ): Readonly<CubiOIdentity> {
    const boundAt = options.boundAt || Date.now();

    // Check if binding already exists
    const existingIdx = identity.bindings.findIndex((b) => b.targetCubId === targetCubId);
    if (existingIdx >= 0) {
      throw new Error(`Entity '${targetCubId}' is already bound to '${identity.cubId}'.`);
    }

    const newBinding: EntityBinding = Object.freeze({
      targetCubId,
      targetType,
      relation,
      boundAt,
      metadata: Object.freeze({ ...(options.metadata || {}) }),
    });

    const updatedProvenance = CubiOProvenanceManager.appendAuditEvent(
      identity.provenance,
      'BOUND',
      `Bound target '${targetCubId}' (${targetType}) with relation '${relation}'.`,
      'SYSTEM',
      boundAt
    );

    return Object.freeze({
      ...identity,
      bindings: Object.freeze([...identity.bindings, newBinding]),
      provenance: updatedProvenance,
    });
  }

  /**
   * Removes a bound entity from an identity.
   */
  public static removeBinding(
    identity: CubiOIdentity,
    targetCubId: string,
    unboundAt = Date.now()
  ): Readonly<CubiOIdentity> {
    const existing = identity.bindings.find((b) => b.targetCubId === targetCubId);
    if (!existing) {
      throw new Error(`Target '${targetCubId}' is not bound to '${identity.cubId}'.`);
    }

    const updatedBindings = identity.bindings.filter((b) => b.targetCubId !== targetCubId);
    const updatedProvenance = CubiOProvenanceManager.appendAuditEvent(
      identity.provenance,
      'UNBOUND',
      `Unbound target '${targetCubId}' (${existing.targetType}).`,
      'SYSTEM',
      unboundAt
    );

    return Object.freeze({
      ...identity,
      bindings: Object.freeze(updatedBindings),
      provenance: updatedProvenance,
    });
  }

  /**
   * Checks if an identity has a specific target bound.
   */
  public static hasBinding(identity: CubiOIdentity, targetCubId: string): boolean {
    return identity.bindings.some((b) => b.targetCubId === targetCubId);
  }
}
