/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Cancellation Controller & CancellationToken
 *
 * Implements emergency kill-switch and graceful pipeline cancellation tokens.
 */

import { ICancellationToken } from './types';

export class CancellationTokenSource {
  private _isCancelled = false;
  private _reason?: string;

  public get token(): ICancellationToken {
    return {
      isCancelled: this._isCancelled,
      cancellationReason: this._reason,
      abort: (reason?: string) => this.cancel(reason),
    };
  }

  public cancel(reason: string = 'Operation cancelled by operator.'): void {
    this._isCancelled = true;
    this._reason = reason;
  }
}
