/**
 * CUBiO AI — Canonical Base Transport Adapter
 * ===========================================
 *
 * Implements the core transport abstraction layer. Encapsulates common lifecycle
 * state machines, Phase 1 packet validation, metrics accounting, and event dispatching.
 *
 * Subclasses (UDP, TCP, WebSocket, IPC, Memory) implement the physical/logical socket hooks:
 *   - _doListen(endpoint)
 *   - _doConnect(remoteEndpoint)
 *   - _doSend(packet, options)
 *   - _doClose(reason)
 */

import {
  ITransportAdapter,
  TransportType,
  TransportCapabilities,
  TransportEndpoint,
  TransportLifecycleState,
  TransportMetrics,
  TransportSession,
  TransportSendOptions,
  TransportDeliveryReceipt,
  InboundPacketHandler,
  TransportErrorHandler,
  TransportStateChangeHandler,
  CanonicalTransportError,
  TransportErrorCode,
} from './types';
import {
  assertTransportTransition,
  validateTransportEndpoint,
  createTransportError,
} from './transportSpecification';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';

export abstract class BaseTransportAdapter implements ITransportAdapter {
  public abstract readonly transportType: TransportType;
  public abstract readonly capabilities: TransportCapabilities;

  protected _localEndpoint: TransportEndpoint | undefined;
  protected _state: TransportLifecycleState = 'UNINITIALIZED';

  protected _bytesSent: number = 0;
  protected _bytesReceived: number = 0;
  protected _packetsSent: number = 0;
  protected _packetsReceived: number = 0;
  protected _packetsDropped: number = 0;
  protected _errorsCount: number = 0;

  protected readonly _packetHandlers: Set<InboundPacketHandler> = new Set();
  protected readonly _errorHandlers: Set<TransportErrorHandler> = new Set();
  protected readonly _stateChangeHandlers: Set<TransportStateChangeHandler> = new Set();

  public get localEndpoint(): TransportEndpoint | undefined {
    return this._localEndpoint ? Object.freeze({ ...this._localEndpoint }) : undefined;
  }

  public get state(): TransportLifecycleState {
    return this._state;
  }

  public get metrics(): TransportMetrics {
    return Object.freeze({
      bytesSent: this._bytesSent,
      bytesReceived: this._bytesReceived,
      packetsSent: this._packetsSent,
      packetsReceived: this._packetsReceived,
      packetsDropped: this._packetsDropped,
      errorsCount: this._errorsCount,
    });
  }

  // ─── Lifecycle & Transition Enforcement ───────────────────────────────────

  protected transitionState(nextState: TransportLifecycleState, reason: string): void {
    const prevState = this._state;
    if (prevState === nextState) return;

    assertTransportTransition(prevState, nextState, reason);
    this._state = nextState;

    for (const handler of this._stateChangeHandlers) {
      try {
        handler(prevState, nextState, reason);
      } catch {
        // Suppress listener errors to maintain state consistency
      }
    }
  }

  protected emitError(
    code: TransportErrorCode,
    message: string,
    options?: { fatal?: boolean; cause?: string }
  ): CanonicalTransportError {
    this._errorsCount++;
    const err = createTransportError(code, message, this.transportType, {
      endpoint: this._localEndpoint,
      fatal: options?.fatal ?? false,
      cause: options?.cause,
    });

    for (const handler of this._errorHandlers) {
      try {
        handler(err);
      } catch {
        // Suppress listener errors
      }
    }

    if (err.fatal && this._state !== 'FAULTED') {
      try {
        this.transitionState('FAULTED', `Fatal transport error: ${code}`);
      } catch {
        // Ignore secondary transition error
      }
    }

    return err;
  }

  // ─── Event Registration ───────────────────────────────────────────────────

  public receive(handler: InboundPacketHandler): () => void {
    this._packetHandlers.add(handler);
    return () => {
      this._packetHandlers.delete(handler);
    };
  }

  public removeReceive(handler: InboundPacketHandler): void {
    this._packetHandlers.delete(handler);
  }

  public onError(handler: TransportErrorHandler): () => void {
    this._errorHandlers.add(handler);
    return () => {
      this._errorHandlers.delete(handler);
    };
  }

  public removeError(handler: TransportErrorHandler): void {
    this._errorHandlers.delete(handler);
  }

  public onStateChange(handler: TransportStateChangeHandler): () => void {
    this._stateChangeHandlers.add(handler);
    return () => {
      this._stateChangeHandlers.delete(handler);
    };
  }

  public removeStateChange(handler: TransportStateChangeHandler): void {
    this._stateChangeHandlers.delete(handler);
  }

  // ─── Server Listener Binding ──────────────────────────────────────────────

  public async listen(endpoint: TransportEndpoint): Promise<void> {
    const valResult = validateTransportEndpoint(endpoint);
    if (!valResult.isValid) {
      const err = this.emitError('ERR_TRANSPORT_BIND_FAILED', `Invalid endpoint: ${valResult.error}`);
      throw new Error(err.message);
    }

    if (endpoint.transportType !== this.transportType) {
      const err = this.emitError(
        'ERR_TRANSPORT_UNSUPPORTED_ADAPTER',
        `Endpoint transportType '${endpoint.transportType}' mismatch with adapter '${this.transportType}'`
      );
      throw new Error(err.message);
    }

    this.transitionState('INITIALIZING', 'Binding server listener');

    try {
      await this._doListen(endpoint);
      if (!this._localEndpoint) {
        this._localEndpoint = Object.freeze({ ...endpoint });
      }
      this.transitionState('CONNECTED', 'Server listener bound and ready');
    } catch (err: any) {
      this.emitError('ERR_TRANSPORT_BIND_FAILED', `Failed to bind listener: ${err.message}`, { fatal: true });
      throw err;
    }
  }

  // ─── Outbound Peer Connection ─────────────────────────────────────────────

  public async connect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    const valResult = validateTransportEndpoint(remoteEndpoint);
    if (!valResult.isValid) {
      const err = this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `Invalid remote endpoint: ${valResult.error}`);
      throw new Error(err.message);
    }

    if (remoteEndpoint.transportType !== this.transportType) {
      const err = this.emitError(
        'ERR_TRANSPORT_UNSUPPORTED_ADAPTER',
        `Remote endpoint transportType '${remoteEndpoint.transportType}' mismatch with adapter '${this.transportType}'`
      );
      throw new Error(err.message);
    }

    // Must be in UNINITIALIZED or INITIALIZING state to connect
    if (this._state === 'UNINITIALIZED') {
      this.transitionState('INITIALIZING', 'Preparing outbound connection');
    }
    this.transitionState('CONNECTING', `Connecting to ${remoteEndpoint.host}:${remoteEndpoint.port}`);

    try {
      const session = await this._doConnect(remoteEndpoint);
      this.transitionState('CONNECTED', `Connected to ${remoteEndpoint.host}:${remoteEndpoint.port}`);
      return session;
    } catch (err: any) {
      this.emitError('ERR_TRANSPORT_CONNECT_TIMEOUT', `Failed to connect: ${err.message}`, { fatal: false });
      this.transitionState('DISCONNECTED', 'Connection attempt failed');
      throw err;
    }
  }

  // ─── Outbound Packet Transmission ─────────────────────────────────────────

  public async send(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt> {
    if (this._state !== 'CONNECTED' && this._state !== 'DEGRADED') {
      const err = this.emitError(
        'ERR_TRANSPORT_DISCONNECTED',
        `Cannot send packet while transport is in state '${this._state}'. Expected 'CONNECTED' or 'DEGRADED'.`
      );
      throw new Error(err.message);
    }

    // 1. Strict Phase 1 packet validation
    const valResult = CubiOProtocolValidator.validatePacket(packet);
    if (!valResult.isValid) {
      this._packetsDropped++;
      const reason = valResult.errors.map(e => e.message).join('; ');
      const err = this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `Packet validation failed: ${reason}`);
      throw new Error(err.message);
    }

    // 2. MTU check against adapter capabilities
    if (packet.payload.byteLength > this.capabilities.maxPayloadBytes) {
      this._packetsDropped++;
      const err = this.emitError(
        'ERR_TRANSPORT_MTU_EXCEEDED',
        `Packet payload (${packet.payload.byteLength} bytes) exceeds transport maxPayloadBytes (${this.capabilities.maxPayloadBytes} bytes)`
      );
      throw new Error(err.message);
    }

    try {
      const receipt = await this._doSend(packet, options);
      if (receipt.success) {
        this._packetsSent++;
        this._bytesSent += receipt.bytesTransmitted;
      } else {
        this._packetsDropped++;
      }
      return receipt;
    } catch (err: any) {
      this._packetsDropped++;
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `Send failed: ${err.message}`);
      throw err;
    }
  }

  // ─── Inbound Packet Ingestion (Called by driver implementation) ───────────

  protected handleInboundPacket(packet: CubiOPacket, session: TransportSession): void {
    // 1. Strict Phase 1 packet validation
    const valResult = CubiOProtocolValidator.validatePacket(packet);
    if (!valResult.isValid) {
      this._packetsDropped++;
      this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', 'Inbound packet failed Phase 1 validation');
      return;
    }

    this._packetsReceived++;
    this._bytesReceived += packet.payload.byteLength;

    // Dispatch to all registered packet handlers
    for (const handler of this._packetHandlers) {
      try {
        handler(packet, session);
      } catch (err: any) {
        this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `Error in inbound packet handler: ${err.message}`);
      }
    }
  }

  // ─── Teardown ─────────────────────────────────────────────────────────────

  public async close(reason: string = 'Normal closure'): Promise<void> {
    if (this._state === 'DISCONNECTED' || this._state === 'UNINITIALIZED') {
      return;
    }

    if (this._state !== 'FAULTED') {
      this.transitionState('DISCONNECTING', reason);
    }

    try {
      await this._doClose(reason);
    } finally {
      this.transitionState('DISCONNECTED', reason);
    }
  }

  // ─── Subclass Driver Hooks ────────────────────────────────────────────────

  protected abstract _doListen(endpoint: TransportEndpoint): Promise<void>;
  protected abstract _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession>;
  protected abstract _doSend(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt>;
  protected abstract _doClose(reason: string): Promise<void>;
}
