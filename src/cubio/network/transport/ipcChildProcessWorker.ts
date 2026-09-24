/**
 * CUBiO AI — Phase 2 / Task 06: IPC Child Process Worker
 * ========================================================
 *
 * Dedicated child process worker spawned to verify real cross-process
 * OS named pipe IPC communication across separate operating system processes.
 *
 * Receives pipe path as process.argv[2], connects to parent process over IPC,
 * validates received Phase 1 packet, replies with a response packet, and exits cleanly.
 */

import { IpcPipeTransportAdapter } from './ipcPipeTransportAdapter';
import { createPacket } from '../protocol/v1/packetEngine';
import { CubiOPacket } from '../protocol/v1/packetTypes';

async function runWorker() {
  const pipePath = process.argv[2];
  if (!pipePath) {
    console.error('Child Process Worker: Missing pipePath argument');
    process.exit(1);
  }

  const client = new IpcPipeTransportAdapter();

  try {
    const session = await client.connect({
      transportType: 'IPC_PIPE',
      host: 'localhost',
      port: 0,
      path: pipePath,
    });

    client.receive(async (pkt: CubiOPacket) => {
      try {
        // Formulate validated child process response packet
        const replyPacket = createPacket({
          envelopeId: `ENV_CHILD_PID_${process.pid}`,
          sequenceNumber: pkt.header.sequenceNumber + 100,
          sourceUri: 'CUBIO://NETWORK/0/01/00003/CHILD_PROCESS',
          destinationUri: pkt.header.sourceUri,
          payloadData: `Child Process (PID: ${process.pid}) Echo Response for [${pkt.payload.data}]`,
        });

        await client.send(replyPacket);

        // Allow write buffer to flush
        setTimeout(async () => {
          await client.close('Worker complete');
          process.exit(0);
        }, 30);
      } catch (err: any) {
        console.error('Child Process Worker: Error processing packet:', err);
        process.exit(2);
      }
    });
  } catch (err: any) {
    console.error('Child Process Worker: Connection failed:', err);
    process.exit(3);
  }
}

runWorker();
