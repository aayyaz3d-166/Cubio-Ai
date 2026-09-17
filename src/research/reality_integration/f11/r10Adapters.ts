/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: F10 Read-Only Adapter
 *
 * Consumes F10 conversation state, resolved entities, and spatial plans without mutating F10 state.
 * Invariant: ΔReality = 0.
 */

import { RealityAIEngine } from '../f10/realityAIEngine';
import {
  RealityAISession,
  AIConversationMessage,
  SpatialCommandPlan,
} from '../f10/types';

export class F11R10Adapter {
  private readonly f10Engine: RealityAIEngine;

  constructor(f10Engine: RealityAIEngine) {
    this.f10Engine = f10Engine;
  }

  public getSession(): RealityAISession {
    return this.f10Engine.getSession();
  }

  public getConversation(): readonly AIConversationMessage[] {
    return this.f10Engine.getConversation();
  }

  public getActivePlan(): SpatialCommandPlan | null {
    return this.f10Engine.getActivePlan();
  }

  public getActiveTargetId(): string | null {
    return this.f10Engine.getSession().activeTargetGeometryId;
  }

  public getLastCreatedId(): string | null {
    return this.f10Engine.getSession().lastCreatedGeometryId;
  }
}
