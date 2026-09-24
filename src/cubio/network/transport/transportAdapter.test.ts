/**
 * CUBiO AI — Phase 2 / Task 02: Canonical Transport Abstraction Layer Tests
 * =========================================================================
 *
 * Validates the canonical transport abstraction layer, base adapter logic,
 * lifecycle state machines, Phase 1 packet validation enforcement,
 * metrics accounting, and deterministic bidirectional in-memory packet exchange.
 *
 * Run with:  npx tsx src/cubio/network/transport/transportAdapter.test.ts
 */

import {
  ITransportAdapter,
  TransportEndpoint,
  TransportSession,
  CanonicalTransportError,
  TransportLifecycleState,
} from './types';
import { MemoryTransportAdapter } from './memoryTransportAdapter';
import { createPacket, validatePacket } from '../protocol/v1/packetEngine';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { packetizeEnvelope, reassembleEnvelope } from '../protocol/v1/packetEngine';
import { envelopeToMessage, createMessage } from '../protocol/v1/messageEngine';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  const result = fn();
  if (result instanceof Promise) {
    return result
      .then(() => {
        passed++;
        console.log(`  ✓ ${name}`);
      })
      .catch((err: any) => {
        failed++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
      });
  } else {
    try {
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
    }
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 02: Transport Abstraction Layer Tests        ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  MemoryTransportAdapter.clearVirtualBus();

  // ─── 1. Capabilities & Contract Conformance ─────────────────────────────────

  console.log('1. Capabilities & Interface Contract Conformance:');

  await test('MemoryTransportAdapter exposes complete canonical capabilities', () => {
    const adapter = new MemoryTransportAdapter();
    assert(adapter.transportType === 'MEMORY', 'Transport type is MEMORY');
    assert(adapter.capabilities.connectionOriented === true, 'Connection-oriented');
    assert(adapter.capabilities.reliable === true, 'Reliable');
    assert(adapter.capabilities.ordered === true, 'Ordered');
    assert(adapter.capabilities.messageOriented === true, 'Message-oriented');
    assert(adapter.capabilities.maxPayloadBytes === 65536, 'Max payload 64 KB');
    assert(adapter.capabilities.defaultMtu === 1400, 'Default MTU 1400');
    assert(adapter.state === 'UNINITIALIZED', 'Initial state UNINITIALIZED');
  });

  // ─── 2. Lifecycle State Machine Enforcement ─────────────────────────────────

  console.log('2. Lifecycle State Machine Enforcement:');

  await test('Server listener binds, transitions state, and reports state changes', async () => {
    const server = new MemoryTransportAdapter();
    const transitions: string[] = [];

    server.onStateChange((prev, next, reason) => {
      transitions.push(`${prev}->${next}`);
    });

    const ep: TransportEndpoint = {
      transportType: 'MEMORY',
      host: 'localhost',
      port: 3690,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/SERVER',
    };

    await server.listen(ep);

    assert(server.state === 'CONNECTED', 'Server state is CONNECTED');
    assert(server.localEndpoint?.port === 3690, 'Local endpoint port bound');
    assert(transitions.includes('UNINITIALIZED->INITIALIZING'), 'Transitioned through INITIALIZING');
    assert(transitions.includes('INITIALIZING->CONNECTED'), 'Transitioned to CONNECTED');

    await server.close('Test complete');
    assert(server.state === 'DISCONNECTED', 'Server state is DISCONNECTED');
  });

  // ─── 3. Outbound Validation & Phase 1 Protocol Gatekeeping ──────────────────

  console.log('3. Outbound Validation & Phase 1 Protocol Gatekeeping:');

  await test('Send rejects transmission when transport is not in CONNECTED state', async () => {
    const uninitialized = new MemoryTransportAdapter();
    const validPacket = createPacket({
      envelopeId: 'ENV_0xTEST',
      sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
      destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
      payloadData: 'data',
    });

    let threw = false;
    try {
      await uninitialized.send(validPacket);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Cannot send packet while transport is in state'), 'Expected state error');
    }
    assert(threw, 'Must throw when sending on uninitialized transport');
    assert(uninitialized.metrics.packetsDropped === 0, 'No packet dropped recorded before validation');
  });

  await test('Send rejects malformed or tampered Phase 1 packets fail-closed', async () => {
    const server = new MemoryTransportAdapter();
    const client = new MemoryTransportAdapter();

    const serverEp: TransportEndpoint = { transportType: 'MEMORY', host: 'localhost', port: 4001 };
    await server.listen(serverEp);
    await client.connect(serverEp);

    const validPacket = createPacket({
      envelopeId: 'ENV_0xGOOD',
      sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
      destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
      payloadData: 'clean',
    });

    // Tamper with checksum
    const tamperedPacket = { ...validPacket, checksum: '0xCHK_CORRUPTED' };

    let threw = false;
    try {
      await client.send(tamperedPacket);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Packet validation failed'), 'Reports packet validation error');
    }
    assert(threw, 'Must fail-closed on tampered packet');
    assert(client.metrics.packetsDropped === 1, 'Increments packetsDropped metric');

    await client.close();
    await server.close();
  });

  // ─── 4. Deterministic Bidirectional Packet Exchange ─────────────────────────

  console.log('4. Deterministic Bidirectional Packet Exchange:');

  await test('Client and Server exchange Phase 1 packets with 100% data fidelity', async () => {
    const server = new MemoryTransportAdapter();
    const client = new MemoryTransportAdapter();

    const serverEp: TransportEndpoint = {
      transportType: 'MEMORY',
      host: 'localhost',
      port: 5001,
      coordinateUri: 'CUBIO://NETWORK/0/01/00001/CORE',
    };

    await server.listen(serverEp);

    let serverReceivedPacket: any = null;
    let clientReceivedPacket: any = null;

    server.receive((packet, session) => {
      serverReceivedPacket = packet;
      // Server echoes a response back to client
      const responsePacket = createPacket({
        envelopeId: packet.header.envelopeId,
        sourceUri: serverEp.coordinateUri!,
        destinationUri: packet.header.sourceUri,
        payloadData: JSON.stringify({ status: 'ACK_OK', originalSeq: packet.header.sequenceNumber }),
      });
      server.send(responsePacket);
    });

    client.receive((packet, session) => {
      clientReceivedPacket = packet;
    });

    await client.connect(serverEp);

    // Client sends an application message wrapped in Phase 1 packet
    const originalMessage = createMessage({
      type: 'RPC_REQUEST',
      communicationMode: 'USER_AGENT',
      source: {
        cubId: 'CUB-00000001',
        coordinateUri: 'CUBIO://NETWORK/0/01/00002/AGENT',
        entityType: 'AGENT',
      },
      destination: {
        coordinateUri: serverEp.coordinateUri!,
      },
      body: { query: 'GET_SPATIAL_INDEX', radius: 50 },
    });

    const envelope = createEnvelope({
      kind: 'REQUEST',
      source: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'AGENT' }, uri: 'CUBIO://NETWORK/0/01/00002/AGENT' },
      destination: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'CORE' }, uri: serverEp.coordinateUri! },
      sender: { cubId: 'CUB-00000001', entityType: 'AGENT', signature: originalMessage.signature },
      payload: { category: 'RPC_REQUEST', priority: 'NORMAL', contentType: 'application/json', body: originalMessage.payload.body, bodyBytes: 40 },
    });

    const packets = packetizeEnvelope(envelope, 1400);
    assert(packets.length === 1, 'Fits in single packet');

    const receipt = await client.send(packets[0]);
    assert(receipt.success === true, 'Receipt reports success');
    assert(receipt.packetId === packets[0].header.packetId, 'Receipt packetId matches');

    // Verify server received packet
    assert(serverReceivedPacket !== null, 'Server received packet');
    assert(serverReceivedPacket.header.packetId === packets[0].header.packetId, 'Server packet ID matches');
    assert(validatePacket(serverReceivedPacket).valid === true, 'Server packet is valid Phase 1 packet');

    // Verify client received server echo
    assert(clientReceivedPacket !== null, 'Client received response');
    const parsedPayload = JSON.parse(clientReceivedPacket.payload.data);
    assert(parsedPayload.status === 'ACK_OK', 'Client parsed response intact');

    // Metrics validation
    assert(client.metrics.packetsSent === 1, 'Client sent 1 packet');
    assert(client.metrics.packetsReceived === 1, 'Client received 1 packet');
    assert(server.metrics.packetsReceived === 1, 'Server received 1 packet');
    assert(server.metrics.packetsSent === 1, 'Server sent 1 packet');

    await client.close();
    await server.close();
  });

  // ─── 5. Error Handling & Address Collisions ─────────────────────────────────

  console.log('5. Error Handling & Address Collisions:');

  await test('Binding duplicate address throws ERR_TRANSPORT_BIND_FAILED', async () => {
    const adapter1 = new MemoryTransportAdapter();
    const adapter2 = new MemoryTransportAdapter();

    const ep: TransportEndpoint = { transportType: 'MEMORY', host: 'localhost', port: 6001 };
    await adapter1.listen(ep);

    let threw = false;
    try {
      await adapter2.listen(ep);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('already in use'), 'Reports address already in use');
    }
    assert(threw, 'Duplicate listen must throw');
    assert(adapter2.state === 'FAULTED', 'Adapter2 transitioned to FAULTED');

    await adapter1.close();
  });

  await test('Connecting to non-listening virtual endpoint throws error', async () => {
    const client = new MemoryTransportAdapter();
    const deadEp: TransportEndpoint = { transportType: 'MEMORY', host: 'localhost', port: 9999 };

    let threw = false;
    try {
      await client.connect(deadEp);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('not listening'), 'Reports remote endpoint not listening');
    }
    assert(threw, 'Connect to dead endpoint must throw');
    assert(client.state === 'DISCONNECTED', 'Client returns to DISCONNECTED');
  });

  await test('Endpoint transportType mismatch throws ERR_TRANSPORT_UNSUPPORTED_ADAPTER', async () => {
    const adapter = new MemoryTransportAdapter();
    const udpEp: TransportEndpoint = { transportType: 'UDP', host: '127.0.0.1', port: 3690 };

    let threw = false;
    try {
      await adapter.listen(udpEp);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('mismatch with adapter'), 'Reports adapter mismatch');
    }
    assert(threw, 'Listen with mismatched transport type must throw');
  });

  await test('Outbound MTU enforcement throws ERR_TRANSPORT_MTU_EXCEEDED when packet exceeds cap', async () => {
    class ConstrainedMemoryAdapter extends MemoryTransportAdapter {
      public override readonly capabilities = Object.freeze({
        connectionOriented: true,
        reliable: true,
        ordered: true,
        messageOriented: true,
        supportsBroadcast: false,
        supportsTls: false,
        maxPayloadBytes: 512,
        defaultMtu: 512,
      });
    }

    const server = new ConstrainedMemoryAdapter();
    const client = new ConstrainedMemoryAdapter();
    const ep: TransportEndpoint = { transportType: 'MEMORY', host: 'localhost', port: 7001 };

    await server.listen(ep);
    await client.connect(ep);

    // Create a packet with 800-byte payload (> 512 cap)
    const largePacket = createPacket({
      envelopeId: 'ENV_0xOVERSIZED',
      sourceUri: 'CUBIO://NETWORK/0/01/00001/APP',
      destinationUri: 'CUBIO://NETWORK/0/01/00002/APP',
      payloadData: 'X'.repeat(800),
    });

    let threw = false;
    try {
      await client.send(largePacket);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('exceeds transport maxPayloadBytes'), 'Reports MTU exceeded');
    }
    assert(threw, 'Oversized packet must throw');
    assert(client.metrics.packetsDropped === 1, 'Increments dropped metric');

    await client.close();
    await server.close();
  });

  await test('Multi-fragment packet stream transmits over transport and reassembles bit-for-bit', async () => {
    const server = new MemoryTransportAdapter();
    const client = new MemoryTransportAdapter();
    const ep: TransportEndpoint = { transportType: 'MEMORY', host: 'localhost', port: 8001 };

    await server.listen(ep);
    await client.connect(ep);

    const receivedPackets: any[] = [];
    server.receive((pkt) => {
      receivedPackets.push(pkt);
    });

    // Create a large 10 KB envelope fragmented across packets
    const bigData = 'PACKET_STREAM_TEST_'.repeat(500); // 9,500 bytes
    const env = createEnvelope({
      kind: 'EVENT',
      source: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 1, service: 'SRC' }, uri: 'CUBIO://NETWORK/0/01/00001/SRC' },
      destination: { coordinate: { network: 'CUBIO', dimension: 0, zone: 1, node: 2, service: 'DST' }, uri: 'CUBIO://NETWORK/0/01/00002/DST' },
      sender: { cubId: 'CUB-00000001', entityType: 'SERVICE', signature: '0xSIG' },
      payload: { category: 'STATE_DELTA', priority: 'NORMAL', contentType: 'text/plain', body: bigData, bodyBytes: bigData.length },
    });

    const fragments = packetizeEnvelope(env, 1400); // multiple packets
    assert(fragments.length > 5, 'Requires > 5 packets');

    for (const frag of fragments) {
      const receipt = await client.send(frag);
      assert(receipt.success === true, 'Fragment sent successfully');
    }

    assert(receivedPackets.length === fragments.length, 'All fragments received');

    // Reassemble envelope
    const reassembledEnv = reassembleEnvelope(receivedPackets);
    assert(reassembledEnv.envelopeId === env.envelopeId, 'Reassembled envelopeId matches');
    assert(reassembledEnv.payload.body === bigData, 'Reassembled payload bit-for-bit identical');

    await client.close();
    await server.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 02 Transport Abstraction Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
