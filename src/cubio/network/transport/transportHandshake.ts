/**
 * CUBiO AI — Real Transport Handshake & Version Negotiation Coordinator
 * =======================================================================
 *
 * Coordinates transport-level handshakes and protocol-version negotiation
 * over real operating system transports (TCP, WebSocket, IPC, UDP).
 *
 * Direct Phase 1 Integration:
 *   - Delegates negotiation logic to certified ProtocolVersionManager.
 *   - Encapsulates handshake exchange in canonical ProtocolEnvelope ('VERSION_NEGOTIATE').
 *   - Encodes / decodes frames using certified packetization and RFC 8785 canonical JSON.
 *
 * Security & Reliability Defenses:
 *   - Single-use nonce tracking and replay attack rejection.
 *   - Clock skew boundary validation.
 *   - Fail-closed handling for malformed, corrupted, or unsupported handshakes.
 *   - Deterministic timeout budget with socket release.
 */

import {
  TransportHandshakeOffer,
  TransportHandshakeResult,
  HandshakeOptions,
  HandshakeRejectedError,
  HandshakeTimeoutError,
  HandshakeMalformedError,
} from './transportHandshakeTypes';
import {
  ITransportAdapter,
  TransportCapabilities,
  TransportEndpoint,
  TransportSendOptions,
} from './types';
import { ProtocolPrincipal, ProtocolAddress } from '../protocol/v1/types';
import {
  CanonicalProtocolVersion,
  CURRENT_PROTOCOL_VERSION,
  CURRENT_PROTOCOL_VERSION_STRING,
} from '../protocol/v1/versionTypes';
import { ProtocolVersionManager } from '../protocol/v1/versionManager';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { packetizeEnvelope, reassembleEnvelope } from '../protocol/v1/packetEngine';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { deterministicHash } from '../../state/determinism';

const DEFAULT_HANDSHAKE_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_CLOCK_SKEW_MS = 30_000;
const DEFAULT_NONCE_CACHE_TTL_MS = 60_000;

export interface HandshakeCoordinatorConfig {
  readonly principal: ProtocolPrincipal;
  readonly address: ProtocolAddress;
  readonly endpoint?: TransportEndpoint;
  readonly capabilities: TransportCapabilities;
  readonly versionManager?: ProtocolVersionManager;
  readonly options?: HandshakeOptions;
}

export class TransportHandshakeCoordinator {
  public readonly principal: ProtocolPrincipal;
  public readonly address: ProtocolAddress;
  public readonly endpoint?: TransportEndpoint;
  public readonly capabilities: TransportCapabilities;
  public readonly versionManager: ProtocolVersionManager;

  private readonly _handshakeTimeoutMs: number;
  private readonly _maxClockSkewMs: number;
  private readonly _nonceCacheTtlMs: number;

  /** Nonce replay protection cache: maps nonce -> expiration timestamp */
  private readonly _seenNonces: Map<string, number> = new Map();

  constructor(config: HandshakeCoordinatorConfig) {
    this.principal = Object.freeze({ ...config.principal });
    this.address = Object.freeze({ ...config.address });
    this.endpoint = config.endpoint ? Object.freeze({ ...config.endpoint }) : undefined;
    this.capabilities = Object.freeze({ ...config.capabilities });
    this.versionManager = config.versionManager ?? new ProtocolVersionManager({
      nodeId: config.principal.cubId,
    });

    this._handshakeTimeoutMs = config.options?.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;
    this._maxClockSkewMs = config.options?.maxClockSkewMs ?? DEFAULT_MAX_CLOCK_SKEW_MS;
    this._nonceCacheTtlMs = config.options?.nonceCacheTtlMs ?? DEFAULT_NONCE_CACHE_TTL_MS;
  }

  // ─── Client (Initiator) Operations ────────────────────────────────────────

  /**
   * Constructs an outbound TransportHandshakeOffer wrapped in a canonical CubiOPacket.
   */
  public createOfferPacket(
    responderAddress: ProtocolAddress,
    options?: {
      offeredVersions?: readonly CanonicalProtocolVersion[];
      requestedCapabilities?: readonly string[];
      preferredVersion?: CanonicalProtocolVersion;
      customNonce?: string;
      customTimestamp?: number;
    }
  ): { offer: TransportHandshakeOffer; packet: CubiOPacket } {
    const timestamp = options?.customTimestamp ?? Date.now();
    const nonce = options?.customNonce ?? `NONCE_${deterministicHash(`${this.principal.cubId}:${timestamp}:${Math.random()}`).slice(2, 18)}`;
    const handshakeId = `HS_OFFER_${deterministicHash(`${nonce}:${timestamp}`).slice(2, 18)}`;

    const offered = options?.offeredVersions ?? [CURRENT_PROTOCOL_VERSION];
    const preferred = options?.preferredVersion ?? offered[0];

    const offer: TransportHandshakeOffer = Object.freeze({
      handshakeId,
      timestamp,
      nonce,
      initiatorPrincipal: this.principal,
      initiatorEndpoint: this.endpoint,
      offeredVersions: Object.freeze([...offered]),
      preferredVersion: preferred,
      clientImplementation: this.versionManager.implementationId,
      requestedCapabilities: Object.freeze([...(options?.requestedCapabilities ?? ['BASE_FRAMING', 'CNC_ADDRESSING'])]),
      transportCapabilities: this.capabilities,
    });

    const envelope = createEnvelope<TransportHandshakeOffer>({
      kind: 'VERSION_NEGOTIATE',
      source: this.address,
      destination: responderAddress,
      sender: this.principal,
      payload: {
        category: 'VERSION_HANDSHAKE',
        priority: 'URGENT',
        contentType: 'application/json',
        body: offer,
        bodyBytes: Buffer.byteLength(JSON.stringify(offer), 'utf8'),
      },
      nonce,
    });

    const packets = packetizeEnvelope(envelope, this.capabilities.maxPayloadBytes);
    return { offer, packet: packets[0] };
  }

  /**
   * Performs an end-to-end client handshake over an open transport adapter.
   * Sends offer packet, awaits response within timeout, validates result, and returns negotiated parameters.
   */
  public async performClientHandshake(
    adapter: ITransportAdapter,
    responderAddress: ProtocolAddress,
    options?: {
      offeredVersions?: readonly CanonicalProtocolVersion[];
      requestedCapabilities?: readonly string[];
      timeoutMs?: number;
      destinationEndpoint?: TransportEndpoint;
    }
  ): Promise<TransportHandshakeResult> {
    const timeoutBudget = options?.timeoutMs ?? this._handshakeTimeoutMs;
    const { offer, packet } = this.createOfferPacket(responderAddress, {
      offeredVersions: options?.offeredVersions,
      requestedCapabilities: options?.requestedCapabilities,
    });

    return new Promise<TransportHandshakeResult>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;
      let settled = false;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        settled = true;
      };

      timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new HandshakeTimeoutError(timeoutBudget, `Initiator: ${this.principal.cubId}`));
      }, timeoutBudget);

      // Listen for incoming response packet on transport
      adapter.receive((inboundPacket) => {
        if (settled) return;

        try {
          const envelope = reassembleEnvelope([inboundPacket]);
          if (envelope.kind !== 'VERSION_NEGOTIATE') {
            return; // Not a handshake packet, ignore
          }

          const result = envelope.payload.body as TransportHandshakeResult;
          if (!result || result.correlationId !== offer.handshakeId) {
            return; // Not matching our handshake correlation ID
          }

          cleanup();

          if (result.status === 'REJECTED') {
            reject(
              new HandshakeRejectedError(
                result.rejectionCode ?? 'ERR_NO_COMPATIBLE_VERSION',
                result.rejectionReason ?? 'Peer rejected handshake offer'
              )
            );
          } else {
            resolve(result);
          }
        } catch {
          // Packet may not be an envelope or belongs to another flow
        }
      });

      // Send the offer packet
      const sendOpts: TransportSendOptions = {
        urgent: true,
        destinationEndpoint: options?.destinationEndpoint,
      };

      adapter.send(packet, sendOpts).catch((sendErr) => {
        if (settled) return;
        cleanup();
        reject(sendErr);
      });
    });
  }

  // ─── Server (Responder) Operations ────────────────────────────────────────

  /**
   * Processes an inbound handshake offer packet and generates a deterministic response packet.
   * Handles validation, replay prevention, clock skew checks, and version negotiation.
   */
  public processHandshakeOffer(
    offerPacket: CubiOPacket,
    initiatorAddress?: ProtocolAddress
  ): { result: TransportHandshakeResult; responsePacket: CubiOPacket } {
    this._pruneExpiredNonces();

    let offer: TransportHandshakeOffer;
    let envelopeSource: ProtocolAddress;

    // 1. Structural extraction and validation
    try {
      const envelope = reassembleEnvelope([offerPacket]);
      if (envelope.kind !== 'VERSION_NEGOTIATE') {
        throw new Error(`Expected envelope kind 'VERSION_NEGOTIATE', got '${envelope.kind}'`);
      }
      envelopeSource = initiatorAddress ?? envelope.source;
      offer = envelope.payload.body as TransportHandshakeOffer;
      this._validateOfferStructure(offer);
    } catch (err: any) {
      // Malformed input fails closed
      const rejectedResult = this._createRejectedResult(
        'HS_MALFORMED',
        'ERR_MALFORMED_HANDSHAKE',
        `Malformed handshake payload: ${err.message}`
      );
      const fallbackDest = initiatorAddress ?? {
        coordinate: { network: 'CUBIO', dimension: 0, zone: 0, node: 0, service: 'ERR' },
        uri: 'CUBIO://NETWORK/0/00/00000/ERR',
      };
      return {
        result: rejectedResult,
        responsePacket: this._packageResultPacket(rejectedResult, fallbackDest),
      };
    }

    const now = Date.now();

    // 2. Clock skew validation
    const clockDelta = Math.abs(now - offer.timestamp);
    if (clockDelta > this._maxClockSkewMs) {
      const skewResult = this._createRejectedResult(
        offer.handshakeId,
        'ERR_HANDSHAKE_REPLAYED',
        `Handshake timestamp skewed by ${clockDelta}ms (max allowed: ${this._maxClockSkewMs}ms)`
      );
      return {
        result: skewResult,
        responsePacket: this._packageResultPacket(skewResult, envelopeSource),
      };
    }

    // 3. Replay attack defense
    if (this._seenNonces.has(offer.nonce)) {
      const replayResult = this._createRejectedResult(
        offer.handshakeId,
        'ERR_HANDSHAKE_REPLAYED',
        `Handshake nonce '${offer.nonce}' was already used. Replay rejected.`
      );
      return {
        result: replayResult,
        responsePacket: this._packageResultPacket(replayResult, envelopeSource),
      };
    }

    // Cache valid nonce
    this._seenNonces.set(offer.nonce, now + this._nonceCacheTtlMs);

    // 4. Delegate version and capability negotiation to certified Phase 1 VersionManager
    const vResult = this.versionManager.negotiate({
      initiatorNodeId: offer.initiatorPrincipal.cubId,
      offeredVersions: offer.offeredVersions,
      requestedCapabilities: offer.requestedCapabilities,
      clientImplementation: offer.clientImplementation,
      nonce: offer.nonce,
    });

    if (vResult.status === 'REJECTED') {
      const rejectedResult = this._createRejectedResult(
        offer.handshakeId,
        vResult.rejectionCode ?? 'ERR_NO_COMPATIBLE_VERSION',
        vResult.rejectionReason ?? 'No mutually compatible protocol version'
      );
      return {
        result: rejectedResult,
        responsePacket: this._packageResultPacket(rejectedResult, envelopeSource),
      };
    }

    // 5. Compute negotiated transport limits
    const negotiatedMaxPayload = Math.min(
      offer.transportCapabilities.maxPayloadBytes,
      this.capabilities.maxPayloadBytes
    );

    const acceptedResult: TransportHandshakeResult = Object.freeze({
      handshakeId: `HS_RESP_${deterministicHash(`${offer.nonce}:${now}`).slice(2, 18)}`,
      correlationId: offer.handshakeId,
      timestamp: now,
      nonce: `NONCE_${deterministicHash(`${this.principal.cubId}:${now}`).slice(2, 18)}`,
      status: 'ACCEPTED',
      responderPrincipal: this.principal,
      responderEndpoint: this.endpoint,
      selectedVersion: vResult.selectedVersion,
      versionString: vResult.versionString,
      agreedCapabilities: vResult.agreedCapabilities,
      negotiatedMaxPayloadBytes: negotiatedMaxPayload,
      serverImplementation: this.versionManager.implementationId,
    });

    return {
      result: acceptedResult,
      responsePacket: this._packageResultPacket(acceptedResult, envelopeSource),
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private _validateOfferStructure(offer: any): void {
    if (!offer || typeof offer !== 'object') {
      throw new HandshakeMalformedError('Offer payload is empty or non-object');
    }
    if (typeof offer.handshakeId !== 'string' || offer.handshakeId.length === 0) {
      throw new HandshakeMalformedError('Missing or invalid handshakeId');
    }
    if (typeof offer.nonce !== 'string' || offer.nonce.length === 0) {
      throw new HandshakeMalformedError('Missing or invalid nonce');
    }
    if (typeof offer.timestamp !== 'number' || offer.timestamp <= 0) {
      throw new HandshakeMalformedError('Missing or invalid timestamp');
    }
    if (!offer.initiatorPrincipal || typeof offer.initiatorPrincipal.cubId !== 'string') {
      throw new HandshakeMalformedError('Missing or invalid initiatorPrincipal');
    }
    if (!Array.isArray(offer.offeredVersions) || offer.offeredVersions.length === 0) {
      throw new HandshakeMalformedError('offeredVersions must be a non-empty array');
    }
    if (!offer.transportCapabilities || typeof offer.transportCapabilities.maxPayloadBytes !== 'number') {
      throw new HandshakeMalformedError('Missing or invalid transportCapabilities');
    }
  }

  private _createRejectedResult(
    correlationId: string,
    rejectionCode: any,
    rejectionReason: string
  ): TransportHandshakeResult {
    const now = Date.now();
    return Object.freeze({
      handshakeId: `HS_REJ_${deterministicHash(`${correlationId}:${now}`).slice(2, 18)}`,
      correlationId,
      timestamp: now,
      nonce: `NONCE_${deterministicHash(`${this.principal.cubId}:${now}`).slice(2, 18)}`,
      status: 'REJECTED',
      responderPrincipal: this.principal,
      responderEndpoint: this.endpoint,
      serverImplementation: this.versionManager.implementationId,
      rejectionCode,
      rejectionReason,
    });
  }

  private _packageResultPacket(
    result: TransportHandshakeResult,
    destination: ProtocolAddress
  ): CubiOPacket {
    const envelope = createEnvelope<TransportHandshakeResult>({
      kind: 'VERSION_NEGOTIATE',
      correlationId: result.correlationId,
      source: this.address,
      destination,
      sender: this.principal,
      payload: {
        category: 'VERSION_HANDSHAKE',
        priority: 'URGENT',
        contentType: 'application/json',
        body: result,
        bodyBytes: Buffer.byteLength(JSON.stringify(result), 'utf8'),
      },
      nonce: result.nonce,
    });

    const packets = packetizeEnvelope(envelope, this.capabilities.maxPayloadBytes);
    return packets[0];
  }

  private _pruneExpiredNonces(): void {
    const now = Date.now();
    for (const [nonce, expiresAt] of this._seenNonces.entries()) {
      if (now >= expiresAt) {
        this._seenNonces.delete(nonce);
      }
    }
  }
}
