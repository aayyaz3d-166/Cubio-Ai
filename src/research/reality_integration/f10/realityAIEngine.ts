/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Master Reality AI Engine
 *
 * Orchestrates Natural Language Processing, Spatial Planning, Safety Validation,
 * Non-destructive Previews, and Verified Execution via R9 Adapters.
 *
 * Invariants:
 * - ΔReality = 0 for every command.
 * - [5, 3, 6] Reality coordinate is completely immutable.
 * - AI-constructed geometry is USER_CONSTRUCTED or DERIVED, NEVER OBSERVED.
 */

import { R9GeometryEngine } from '../r9/geometryEngine';
import { WorkspaceGeometry } from '../r9/types';
import {
  RealityAISession,
  SpatialCommandPlan,
  AIConversationMessage,
  AIExplanation,
  F10ExecutionSignature,
} from './types';
import { RealityAIProvider } from './realityAIProvider';
import { MockRealityAIProvider } from './mockRealityAIProvider';
import { F10R9Adapter } from './r9Adapters';
import { F10CommandParser, ParsedCommand } from './commandParser';
import { F10ConversationStateManager } from './conversationState';
import { F10Validator } from './validator';
import { F10PreviewEngine } from './previewEngine';
import { F10ExecutionEngine, PlanExecutionResult } from './executionEngine';
import { F10CausalityAuditor } from './causality';
import { F10HistoryEngine } from './history';
import {
  generateDeterministicCommandId,
  computeF10SessionChecksum,
  deterministicHash,
} from './determinism';

export class RealityAIEngine {
  private readonly sessionId: string;
  private readonly r9Adapter: F10R9Adapter;
  private readonly provider: RealityAIProvider;
  private readonly conversationManager: F10ConversationStateManager;
  private readonly causalityAuditor: F10CausalityAuditor;
  private readonly historyEngine: F10HistoryEngine;

  private activePlan: SpatialCommandPlan | null = null;
  private activePreview: WorkspaceGeometry | null = null;
  private commandSequence = 0;

  constructor(
    sessionId: string,
    r9Engine: R9GeometryEngine,
    provider?: RealityAIProvider
  ) {
    this.sessionId = sessionId;
    this.r9Adapter = new F10R9Adapter(r9Engine);
    this.provider = provider || new MockRealityAIProvider();
    this.conversationManager = new F10ConversationStateManager(sessionId);
    this.causalityAuditor = new F10CausalityAuditor();
    this.historyEngine = new F10HistoryEngine();

    // Initial system greeting
    this.conversationManager.addAIMessage(
      'Reality AI spatial assistant active. Type a spatial command (e.g., "Create a sphere", "Move it to the left", "Scale cube 2x").'
    );
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getR9Adapter(): F10R9Adapter {
    return this.r9Adapter;
  }

  public getConversation(): readonly AIConversationMessage[] {
    return this.conversationManager.getMessages();
  }

  public getActivePlan(): SpatialCommandPlan | null {
    return this.activePlan;
  }

  public getActivePreview(): WorkspaceGeometry | null {
    return this.activePreview;
  }

  public getCausalityAuditor(): F10CausalityAuditor {
    return this.causalityAuditor;
  }

  public getHistoryEngine(): F10HistoryEngine {
    return this.historyEngine;
  }

  /**
   * Main entry point for natural language input.
   * Parses utterance, resolves context, builds plan, validates safety, generates preview.
   */
  public async processUtterance(rawText: string): Promise<SpatialCommandPlan> {
    this.commandSequence++;
    const commandId = generateDeterministicCommandId(this.sessionId, this.commandSequence);

    // 1. Add User Message
    this.conversationManager.addUserMessage(rawText);

    // 2. Parse & Resolve Context
    const geometries = this.r9Adapter.getGeometries();
    const activeTargetId = this.conversationManager.getActiveTargetId() || this.r9Adapter.getSelectedGeometryId();
    const lastCreatedId = this.conversationManager.getLastCreatedId();

    const parsed: ParsedCommand = F10CommandParser.parse(
      rawText,
      geometries,
      activeTargetId,
      lastCreatedId,
      commandId
    );

    // 3. Generate Spatial Command Plan
    const realityChecksum = this.r9Adapter.getBindingState().realityStateChecksum;
    const plan = await this.provider.generatePlan(
      parsed,
      commandId,
      this.sessionId,
      realityChecksum,
      geometries
    );

    // 4. Validate Plan
    const validation = F10Validator.validatePlan(plan);

    if (!validation.isValid) {
      this.activePlan = plan;
      this.activePreview = null;

      this.conversationManager.addAIMessage(
        `Unable to prepare spatial plan: ${validation.issues.join('; ')}`,
        plan.planId
      );
      return plan;
    }

    // 5. Generate Preview
    const preview = F10PreviewEngine.generatePreview(plan, geometries);
    this.activePlan = { ...plan, status: 'PREVIEWED' };
    this.activePreview = preview;

    // 6. Generate Explanation
    const targetGeo = parsed.resolvedTarget.targetGeometryId ? geometries[parsed.resolvedTarget.targetGeometryId] : null;
    const explanation = await this.provider.explainOperation(plan, targetGeo);

    // 7. Add AI Response Message
    this.conversationManager.addAIMessage(
      `Prepared spatial plan: ${plan.summary}. Review preview and click Approve or Cancel.`,
      plan.planId,
      explanation
    );

    return this.activePlan;
  }

  /**
   * Approves and executes the active spatial command plan.
   */
  public approveAndCommit(): PlanExecutionResult | null {
    if (!this.activePlan) return null;
    const plan = this.activePlan;

    const realityBefore = this.r9Adapter.getBindingState().realityStateChecksum;
    const wsBefore = this.r9Adapter.getBindingState().workspaceChecksum;

    // Execute Plan via R9
    const result = F10ExecutionEngine.executePlan(plan, this.r9Adapter);

    const realityAfter = this.r9Adapter.getBindingState().realityStateChecksum;
    const wsAfter = this.r9Adapter.getBindingState().workspaceChecksum;

    // Log Causality Event
    this.causalityAuditor.logEvent(
      plan.commandId,
      plan.planId,
      plan.intent,
      plan.sourceText,
      realityBefore,
      realityAfter
    );

    // Record History
    this.historyEngine.appendEntry(
      plan.commandId,
      plan,
      wsBefore,
      wsAfter
    );

    // Update Conversational Active Targets
    if (result.createdGeometryIds.length > 0) {
      this.conversationManager.setLastCreatedId(result.createdGeometryIds[0]);
    } else if (result.modifiedGeometryIds.length > 0) {
      this.conversationManager.setActiveTargetId(result.modifiedGeometryIds[0]);
    }

    // Clear Active Preview
    this.activePlan = null;
    this.activePreview = null;

    // Add Confirmation to Conversation
    this.conversationManager.addAIMessage(
      `Committed spatial plan: ${plan.summary}. (ΔReality = 0)`
    );

    return result;
  }

  /**
   * Cancels the active spatial plan and dismisses preview without modifying the workspace.
   */
  public cancelActivePlan(): void {
    if (!this.activePlan) return;
    const plan = this.activePlan;

    this.activePlan = null;
    this.activePreview = null;

    this.conversationManager.addAIMessage(
      `Cancelled preview for spatial plan: ${plan.summary}.`
    );
  }

  /**
   * Reverts last committed operation via R9 Undo.
   */
  public undo(): boolean {
    const success = this.r9Adapter.undo();
    if (success) {
      this.conversationManager.addAIMessage(`Reverted last workspace operation (Undo). (ΔReality = 0)`);
    }
    return success;
  }

  /**
   * Replays undone operation via R9 Redo.
   */
  public redo(): boolean {
    const success = this.r9Adapter.redo();
    if (success) {
      this.conversationManager.addAIMessage(`Replayed workspace operation (Redo). (ΔReality = 0)`);
    }
    return success;
  }

  /**
   * Returns current snapshot of full F10 Session.
   */
  public getSession(): RealityAISession {
    const binding = this.r9Adapter.getBindingState();
    const sessionChecksum = computeF10SessionChecksum(
      this.sessionId,
      this.historyEngine.getHistory().length,
      binding.realityStateChecksum,
      binding.workspaceChecksum
    );

    return {
      sessionId: this.sessionId,
      realityStateId: 'STATE_REALITY_CANONICAL',
      workspaceId: 'WS_PRODUCTION_STUDIO',
      realityChecksum: binding.realityStateChecksum,
      workspaceChecksum: binding.workspaceChecksum,
      activeTargetGeometryId: this.conversationManager.getActiveTargetId(),
      lastCreatedGeometryId: this.conversationManager.getLastCreatedId(),
      conversation: this.conversationManager.getMessages(),
      history: this.historyEngine.getHistory(),
      activePlan: this.activePlan,
      activePreview: this.activePreview,
      sessionChecksum,
    };
  }

  /**
   * Returns deterministic execution signature for telemetry and verification (σ² = 0).
   */
  public getExecutionSignature(): F10ExecutionSignature {
    const session = this.getSession();
    const lastPlan = this.activePlan;
    const planChecksum = lastPlan ? lastPlan.planChecksum : 'NO_ACTIVE_PLAN';
    const commandChecksum = lastPlan ? `CS_CMD_${deterministicHash(lastPlan.commandId)}` : 'NO_CMD';

    const execPayload = `EXEC:${session.sessionId}:${session.realityChecksum}:${session.workspaceChecksum}:${planChecksum}`;
    const executionHash = `SIG_F10_${deterministicHash(execPayload)}`;

    return {
      realityChecksum: session.realityChecksum,
      workspaceChecksum: session.workspaceChecksum,
      commandChecksum,
      planChecksum,
      conversationCount: session.conversation.length,
      historyCount: session.history.length,
      isCausalityValid: this.causalityAuditor.verifyInvariant(),
      syncStatus: this.r9Adapter.getBindingState().staleState === 'SYNCED' ? 'SYNCED' : 'STALE',
      executionHash,
    };
  }
}
