/**
 * CUBiO AI — Phase 2 Machine-to-Machine (M2M) Transport Worker
 * ==============================================================
 *
 * Standalone worker application for executing genuine machine-to-machine
 * or independent process-environment transport experiments over real physical
 * network interfaces (Ethernet / Wi-Fi non-loopback IPv4 addresses).
 *
 * MODES:
 *   --mode server --host <physical-ip> --port <port>
 *   --mode client --host <physical-ip> --port <port> [--payload <text>]
 *
 * INVARIANTS:
 *   - Strictly rejects 127.0.0.1 and localhost (forces real physical NIC).
 *   - Transmits certified Phase 1 Protocol Envelopes & CubiOPackets.
 *   - Reconstructs envelopes with 100% bit-level fidelity and CRC verification.
 *   - Emits structured forensic JSON telemetry for auditing.
 */

import * as os from 'node:os';
import { TcpTransportAdapter } from './tcpTransportAdapter';
import { UdpTransportAdapter } from './udpTransportAdapter';
import { CubiOTransportPipeline } from './transportPipeline';
import { TransportEndpoint } from './types';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { ProtocolPayload, ProtocolPrincipal, ProtocolAddress } from '../protocol/v1/types';
import { serializeCanonical } from '../protocol/v1/canonicalSerializer';

export interface M2MEnvironmentInfo {
  readonly hostname: string;
  readonly platform: string;
  readonly arch: string;
  readonly pid: number;
  readonly physicalIp: string;
  readonly nodeVersion: string;
  readonly timestamp: number;
}

export interface M2MExecutionTelemetry {
  readonly mode: 'SERVER' | 'CLIENT';
  readonly environment: M2MEnvironmentInfo;
  readonly transport: 'TCP' | 'UDP';
  readonly endpoint: TransportEndpoint;
  readonly envelopeIdSent?: string;
  readonly envelopeIdReceived?: string;
  readonly bytesTransmitted: number;
  readonly packetsProcessed: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly error?: string;
}

function getPhysicalIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal && net.address !== '127.0.0.1') {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

function getEnvironmentInfo(physicalIp: string): M2MEnvironmentInfo {
  return Object.freeze({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    pid: process.pid,
    physicalIp,
    nodeVersion: process.version,
    timestamp: Date.now(),
  });
}

function makePayload<T>(body: T, metadata?: Record<string, string>): ProtocolPayload<T> {
  const serialized = JSON.stringify(body);
  return {
    category: 'DIRECT_MESSAGE',
    priority: 'NORMAL',
    contentType: 'application/json',
    body,
    bodyBytes: Buffer.byteLength(serialized, 'utf8'),
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
  };
}

async function runM2MServer(host: string, port: number, transportType: 'TCP' | 'UDP' = 'TCP'): Promise<void> {
  const envInfo = getEnvironmentInfo(host);
  const startTime = Date.now();

  const serverAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'M2M_SERVER' },
    uri: 'CUBIO://NETWORK/0/01/00002/M2M_SERVER',
  };

  const serverPrincipal: ProtocolPrincipal = {
    cubId: 'CUB-00000002',
    entityType: 'NODE',
    signature: '0xSIG_M2M_SRV_' + process.pid,
  };

  const adapter = transportType === 'TCP' ? new TcpTransportAdapter() : new UdpTransportAdapter();
  const pipeline = new CubiOTransportPipeline(adapter);
  const endpoint: TransportEndpoint = { transportType, host, port };

  console.log(JSON.stringify({
    event: 'M2M_SERVER_STARTING',
    environment: envInfo,
    endpoint,
  }));

  let receivedEnvelopeId: string | undefined;
  let clientResponded = false;

  pipeline.onEnvelope(async (incoming) => {
    receivedEnvelopeId = incoming.envelopeId;
    console.log(JSON.stringify({
      event: 'M2M_SERVER_ENVELOPE_RECEIVED',
      envelopeId: incoming.envelopeId,
      kind: incoming.kind,
      source: incoming.source.uri,
      payloadSize: incoming.payload.bodyBytes,
      timestamp: Date.now(),
    }));

    // Send reciprocal RESPONSE envelope
    const responseEnv = createEnvelope({
      kind: 'RESPONSE',
      source: serverAddress,
      destination: incoming.source,
      sender: serverPrincipal,
      payload: makePayload({
        echoEnvelopeId: incoming.envelopeId,
        serverHost: os.hostname(),
        serverPid: process.pid,
        status: 'M2M_VERIFIED_OK',
        serverTimestamp: Date.now(),
      }),
      correlationId: incoming.envelopeId,
    });

    try {
      await pipeline.sendEnvelope(responseEnv);
      clientResponded = true;
      console.log(JSON.stringify({
        event: 'M2M_SERVER_RESPONSE_SENT',
        responseEnvelopeId: responseEnv.envelopeId,
        correlationId: incoming.envelopeId,
        timestamp: Date.now(),
      }));
    } catch (err: any) {
      console.error(JSON.stringify({
        event: 'M2M_SERVER_RESPONSE_ERROR',
        error: err.message,
      }));
    }
  });

  await adapter.listen(endpoint);
  console.log(JSON.stringify({
    event: 'M2M_SERVER_BOUND',
    endpoint,
    status: 'LISTENING',
  }));

  // Keep server alive until connection fulfilled or timeout
  const timeoutMs = 20000;
  const pollStart = Date.now();
  while (!clientResponded && Date.now() - pollStart < timeoutMs) {
    await new Promise((r) => setTimeout(r, 50));
  }

  // Graceful shutdown
  pipeline.dispose();
  await adapter.close('M2M experiment completed');

  const telemetry: M2MExecutionTelemetry = {
    mode: 'SERVER',
    environment: envInfo,
    transport: transportType,
    endpoint,
    envelopeIdReceived: receivedEnvelopeId,
    bytesTransmitted: adapter.metrics.bytesSent + adapter.metrics.bytesReceived,
    packetsProcessed: adapter.metrics.packetsSent + adapter.metrics.packetsReceived,
    durationMs: Date.now() - startTime,
    success: clientResponded,
  };

  console.log(JSON.stringify({
    event: 'M2M_SERVER_SUMMARY',
    telemetry,
  }));

  // Clean exit
  process.exit(0);
}

async function runM2MClient(
  targetHost: string,
  targetPort: number,
  transportType: 'TCP' | 'UDP' = 'TCP',
  payloadText: string = 'Phase 1 Certified M2M Packet Delivery'
): Promise<void> {
  const localIps = getPhysicalIPv4Addresses();
  const localPhysicalIp = localIps[0] || targetHost;
  const envInfo = getEnvironmentInfo(localPhysicalIp);
  const startTime = Date.now();

  const clientAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'M2M_CLIENT' },
    uri: 'CUBIO://NETWORK/0/01/00001/M2M_CLIENT',
  };

  const serverAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 2, service: 'M2M_SERVER' },
    uri: 'CUBIO://NETWORK/0/01/00002/M2M_SERVER',
  };

  const clientPrincipal: ProtocolPrincipal = {
    cubId: 'CUB-00000001',
    entityType: 'AGENT',
    signature: '0xSIG_M2M_CLI_' + process.pid,
  };

  const adapter = transportType === 'TCP' ? new TcpTransportAdapter() : new UdpTransportAdapter();
  const pipeline = new CubiOTransportPipeline(adapter);
  const targetEndpoint: TransportEndpoint = { transportType, host: targetHost, port: targetPort };

  console.log(JSON.stringify({
    event: 'M2M_CLIENT_STARTING',
    environment: envInfo,
    targetEndpoint,
  }));

  try {
    await adapter.connect(targetEndpoint);

    const requestEnv = createEnvelope({
      kind: 'REQUEST',
      source: clientAddress,
      destination: serverAddress,
      sender: clientPrincipal,
      payload: makePayload({
        message: payloadText,
        clientHost: os.hostname(),
        clientPid: process.pid,
        clientTimestamp: Date.now(),
      }),
      nonce: `m2m_nonce_${Date.now()}_${process.pid}`,
    });

    console.log(JSON.stringify({
      event: 'M2M_CLIENT_SENDING_REQUEST',
      envelopeId: requestEnv.envelopeId,
      timestamp: Date.now(),
    }));

    const responseEnv = await pipeline.requestEnvelope(
      requestEnv,
      (incoming) => incoming.correlationId === requestEnv.envelopeId,
      { timeoutMs: 10000 }
    );

    console.log(JSON.stringify({
      event: 'M2M_CLIENT_RECEIVED_RESPONSE',
      correlationId: responseEnv.correlationId,
      serverHost: (responseEnv.payload.body as any)?.serverHost,
      serverPid: (responseEnv.payload.body as any)?.serverPid,
      status: (responseEnv.payload.body as any)?.status,
      timestamp: Date.now(),
    }));

    const telemetry: M2MExecutionTelemetry = {
      mode: 'CLIENT',
      environment: envInfo,
      transport: transportType,
      endpoint: targetEndpoint,
      envelopeIdSent: requestEnv.envelopeId,
      envelopeIdReceived: responseEnv.envelopeId,
      bytesTransmitted: adapter.metrics.bytesSent + adapter.metrics.bytesReceived,
      packetsProcessed: adapter.metrics.packetsSent + adapter.metrics.packetsReceived,
      durationMs: Date.now() - startTime,
      success: true,
    };

    console.log(JSON.stringify({
      event: 'M2M_CLIENT_SUMMARY',
      telemetry,
    }));
  } catch (err: any) {
    console.error(JSON.stringify({
      event: 'M2M_CLIENT_FAILURE',
      error: err.message,
      durationMs: Date.now() - startTime,
    }));
    process.exit(1);
  } finally {
    pipeline.dispose();
    await adapter.close('M2M client finished');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const modeIndex = args.indexOf('--mode');
  const hostIndex = args.indexOf('--host');
  const portIndex = args.indexOf('--port');
  const transIndex = args.indexOf('--transport');

  const mode = modeIndex !== -1 ? args[modeIndex + 1]?.toUpperCase() : undefined;
  const host = hostIndex !== -1 ? args[hostIndex + 1] : undefined;
  const portStr = portIndex !== -1 ? args[portIndex + 1] : undefined;
  const transport = (transIndex !== -1 ? args[transIndex + 1]?.toUpperCase() : 'TCP') as 'TCP' | 'UDP';

  if (!mode || (mode !== 'SERVER' && mode !== 'CLIENT')) {
    console.error('Usage: tsx m2mWorker.ts --mode <server|client> --host <physical-ip> --port <port>');
    process.exit(1);
  }

  if (!host || host === '127.0.0.1' || host === 'localhost') {
    console.error(`[M2M REJECTION]: Host must be a real physical network interface IPv4, got '${host}'. Localhost is forbidden.`);
    process.exit(1);
  }

  const port = parseInt(portStr || '12600', 10);

  if (mode === 'SERVER') {
    await runM2MServer(host, port, transport);
  } else {
    await runM2MClient(host, port, transport);
  }
}

if (process.argv[1]?.includes('m2mWorker.ts')) {
  main().catch((err) => {
    console.error('Fatal M2M worker error:', err);
    process.exit(1);
  });
}
