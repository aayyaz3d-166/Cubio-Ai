/**
 * 3D Memory Studio — Funnel 70
 * Studio Action Engine
 *
 * Central orchestration engine combining validation, queuing, natural-language parsing,
 * execution dispatch, history recording, and subscriber notification.
 */

import {
  StudioAction,
  StudioActionResult,
  ActionEngineSnapshot,
} from '../types';
import { ActionValidator } from '../actions/actionValidator';
import { ActionParser, ActionParseResult } from '../actions/actionParser';
import { StudioActionQueue } from '../actions/actionQueue';
import { StudioActionHistory } from '../actions/actionHistory';
import { ActionRegistry } from '../actions/actionRegistry';
import { ActionExecutor, ActionExecutorAdapters } from '../actions/actionExecutor';
import { createRejectedResult } from '../actions/actionResult';
import { SAFE_ACTIONS } from '../actions/actionTypes';

export type ActionEngineListener = (snapshot: ActionEngineSnapshot) => void;

export class StudioActionEngine {
  public readonly validator: ActionValidator;
  public readonly parser: ActionParser;
  public readonly queue: StudioActionQueue;
  public readonly history: StudioActionHistory;
  public readonly registry: ActionRegistry;
  public readonly executor: ActionExecutor;

  private isExecuting = false;
  private autoExecuteSafeActions = true;
  private readonly listeners: Set<ActionEngineListener> = new Set();

  constructor(options?: {
    validator?: ActionValidator;
    parser?: ActionParser;
    queue?: StudioActionQueue;
    history?: StudioActionHistory;
    registry?: ActionRegistry;
    executor?: ActionExecutor;
    adapters?: ActionExecutorAdapters;
    autoExecuteSafeActions?: boolean;
  }) {
    this.validator = options?.validator ?? new ActionValidator();
    this.parser = options?.parser ?? new ActionParser();
    this.queue = options?.queue ?? new StudioActionQueue();
    this.history = options?.history ?? new StudioActionHistory();
    this.registry = options?.registry ?? new ActionRegistry();
    this.executor = options?.executor ?? new ActionExecutor(options?.adapters);
    this.autoExecuteSafeActions = options?.autoExecuteSafeActions ?? true;
  }

  public getSnapshot(): ActionEngineSnapshot {
    return {
      pendingActions: this.queue.getPending(),
      currentAction: this.queue.getCurrent(),
      lastResult: this.history.getLastResult(),
      history: this.history.getHistory(),
      isExecuting: this.isExecuting,
      autoExecuteSafeActions: this.autoExecuteSafeActions,
    };
  }

  public subscribe(listener: ActionEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public async submitAction(action: StudioAction): Promise<StudioActionResult> {
    // 1. Validation
    const val = this.validator.validateAction(action);
    if (!val.isValid) {
      action.status = 'REJECTED';
      action.rejectionReason = val.reason;
      const res = createRejectedResult(action.id, val.reason || 'Action validation rejected');
      this.history.record(action, res);
      this.notify();
      return res;
    }

    action.status = 'VALIDATED';

    // 2. Enqueue
    const enq = this.queue.enqueue(action);
    if (!enq.accepted) {
      action.status = 'REJECTED';
      action.rejectionReason = enq.reason;
      const res = createRejectedResult(action.id, enq.reason || 'Queue enqueue failed');
      this.history.record(action, res);
      this.notify();
      return res;
    }

    this.notify();

    // 3. Auto-execute if enabled
    if (this.autoExecuteSafeActions) {
      return this.processQueue();
    }

    return {
      actionId: action.id,
      status: 'PENDING',
      message: 'Action queued for confirmation.',
      timestamp: Date.now(),
    };
  }

  public async submitNaturalLanguage(
    command: string,
    context?: {
      selectedStateId?: string | null;
      selectedClusterId?: string | null;
      selectedRelationshipId?: string | null;
    }
  ): Promise<{ parseResult: ActionParseResult; actionResult?: StudioActionResult }> {
    const parseResult = this.parser.parseCommand(command, {
      selectedStateId: context?.selectedStateId ?? this.executor.selection.getSelectedStateId(),
      selectedClusterId: context?.selectedClusterId ?? this.executor.selection.getSelectedClusterId(),
      selectedRelationshipId: context?.selectedRelationshipId ?? this.executor.selection.getSelectedRelationshipId(),
      source: 'AI',
    });

    if (!parseResult.success || !parseResult.action) {
      return { parseResult };
    }

    const actionResult = await this.submitAction(parseResult.action);
    return { parseResult, actionResult };
  }

  public async processQueue(): Promise<StudioActionResult> {
    if (this.isExecuting) {
      return {
        actionId: 'IN_PROGRESS',
        status: 'EXECUTING',
        message: 'Engine is already executing an action.',
        timestamp: Date.now(),
      };
    }

    const action = this.queue.dequeue();
    if (!action) {
      return {
        actionId: 'EMPTY',
        status: 'COMPLETED',
        message: 'Queue is empty.',
        timestamp: Date.now(),
      };
    }

    this.isExecuting = true;
    this.queue.setCurrent(action);
    action.status = 'EXECUTING';
    this.notify();

    try {
      const result = await this.executor.execute(action);
      action.status = result.status;
      this.history.record(action, result);
      return result;
    } finally {
      this.isExecuting = false;
      this.queue.setCurrent(null);
      this.notify();
    }
  }

  public cancelAction(actionId: string): boolean {
    const ok = this.queue.cancel(actionId);
    if (ok) this.notify();
    return ok;
  }

  public clearQueue(): void {
    this.queue.clear();
    this.notify();
  }

  public clearHistory(): void {
    this.history.clearHistory();
    this.notify();
  }

  public setAutoExecuteSafeActions(enabled: boolean): void {
    this.autoExecuteSafeActions = enabled;
    this.notify();
  }
}
