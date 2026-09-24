/**
 * CUBiO AI — Phase 2 Multi-Process Transport Worker
 * ==================================================
 *
 * Standalone worker process executed in a distinct OS process (with its own PID).
 * Establishes real transport connections (TCP or Windows Named Pipe) back to the parent
 * process, conducts CUBiO protocol transmission, validates checksums, and confirms cross-process integrity.
 */

import { TcpTransportAdapter } from './tcpTransportAdapter';
import { IpcPipeTransportAdapter } from './ipcPipeTransportAdapter';
import { CubiOTransportPipeline } from './transportPipeline';
import { TransportEndpoint } from './types';
import { createEnvelope } from '../protocol/v1/protocolEngine';
import { ProtocolPayload, ProtocolPrincipal, ProtocolAddress } from '../protocol/v1/types';

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

async function runWorker() {
  const args = process.argv.slice(2);
  const transportType = args[0] || 'TCP';
  const targetHostOrPipe = args[1] || '127.0.0.1';
  const targetPort = parseInt(args[2] || '0', 10);

  const workerPrincipal: ProtocolPrincipal = {
    cubId: 'CUB-00000009',
    entityType: 'AGENT',
    signature: '0xSIG_WORKER_' + process.pid,
  };

  const workerAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 9, node: 9, service: 'WORKER' },
    uri: 'CUBIO://NETWORK/0/09/00009/WORKER',
  };

  const parentAddress: ProtocolAddress = {
    coordinate: { network: 'CUBIO' as const, dimension: 0, zone: 1, node: 1, service: 'PARENT' },
    uri: 'CUBIO://NETWORK/0/01/00001/PARENT',
  };

  if (transportType === 'TCP') {
    const adapter = new TcpTransportAdapter();
    const pipeline = new CubiOTransportPipeline(adapter);
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: targetHostOrPipe, port: targetPort };

    try {
      await adapter.connect(endpoint);

      // Listen for parent confirmation
      let parentConfirmed = false;
      pipeline.onEnvelope((env) => {
        if ((env.payload.body as any)?.msg === 'PARENT_ACK') {
          parentConfirmed = true;
        }
      });

      // Send outbound envelope from child process to parent process
      const childEnv = createEnvelope({
        kind: 'REQUEST',
        source: workerAddress,
        destination: parentAddress,
        sender: workerPrincipal,
        payload: makePayload({
          workerPid: process.pid,
          workerMsg: 'GREETINGS_FROM_CHILD_PROCESS',
          timestamp: Date.now(),
        }),
        nonce: `nonce_worker_${process.pid}_${Date.now()}`,
      });

      await pipeline.sendEnvelope(childEnv, { mtu: 300 });

      // Wait for parent ACK
      const start = Date.now();
      while (!parentConfirmed && Date.now() - start < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      if (!parentConfirmed) {
        throw new Error('Worker timed out waiting for PARENT_ACK');
      }

      console.log(`WORKER_SUCCESS:PID=${process.pid}:TRANSPORT=TCP`);
      process.exitCode = 0;
    } finally {
      pipeline.dispose();
      await adapter.close('Worker completed');
    }
  } else if (transportType === 'IPC') {
    const adapter = new IpcPipeTransportAdapter();
    const pipeline = new CubiOTransportPipeline(adapter);
    const endpoint: TransportEndpoint = {
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: targetHostOrPipe,
    };

    try {
      await adapter.connect(endpoint);

      let parentConfirmed = false;
      pipeline.onEnvelope((env) => {
        if ((env.payload.body as any)?.msg === 'PARENT_IPC_ACK') {
          parentConfirmed = true;
        }
      });

      const childEnv = createEnvelope({
        kind: 'REQUEST',
        source: workerAddress,
        destination: parentAddress,
        sender: workerPrincipal,
        payload: makePayload({
          workerPid: process.pid,
          workerMsg: 'IPC_DATA_FROM_CHILD_PROCESS',
          largeData: 'M'.repeat(800), // multi-fragment over IPC pipe
        }),
        nonce: `nonce_ipc_worker_${process.pid}_${Date.now()}`,
      });

      await pipeline.sendEnvelope(childEnv, { mtu: 250 });

      const start = Date.now();
      while (!parentConfirmed && Date.now() - start < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      if (!parentConfirmed) {
        throw new Error('Worker timed out waiting for PARENT_IPC_ACK');
      }

      console.log(`WORKER_SUCCESS:PID=${process.pid}:TRANSPORT=IPC`);
      process.exitCode = 0;
    } finally {
      pipeline.dispose();
      await adapter.close('Worker IPC completed');
    }
  } else {
    throw new Error(`Unsupported worker transport: ${transportType}`);
  }
}

runWorker().catch((err) => {
  console.error(`WORKER_ERROR:PID=${process.pid}:`, err);
  process.exit(1);
});
