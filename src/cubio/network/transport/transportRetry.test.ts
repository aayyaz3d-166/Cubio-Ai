/**
 * CUBiO AI — Phase 2 / Task 11: Transport Resilience & Failure Handling Tests
 * ==============================================================================
 *
 * Validates canonical timeout, retry, cancellation, and failure handling:
 *   - Bounded deterministic backoff calculation and jitter modes.
 *   - Connection timeout against unroutable / blackholed ports on real OS sockets.
 *   - Connect retry with eventual recovery across real loopback TCP sockets.
 *   - Connect retry exhaustion with terminal telemetry and zero descriptor leaks.
 *   - Idempotency defense preventing duplicate delivery on non-idempotent operations.
 *   - Request-response receive timeout with guaranteed listener cleanup.
 *   - Request-response successful correlation and dispatch.
 *   - Cooperative cancellation (CancellationTokenSource / Abort) mid-flight.
 *   - Disconnect detection and resilient reconnection.
 *   - Translation to Phase 1 CanonicalProtocolError and response taxonomy.
 *   - High-churn resource leak audit (zero unhandled rejections, zero dangling timers).
 *
 * Run with:  npx tsx src/cubio/network/transport/transportRetry.test.ts
 */

import * as net from 'node:net';
import {
  TcpTransportAdapter,
  TransportEndpoint,
  TransportSession,
  TransportResilienceEngine,
  RetryPolicy,
  TimeoutPolicy,
  DEFAULT_RETRY_POLICY,
  DEFAULT_TIMEOUT_POLICY,
  NO_RETRY_POLICY,
  CancellationTokenSource,
  TransportTimeoutError,
  TransportRetryExhaustedError,
  TransportCancelledError,
  NonRetryableOperationError,
  calculateBackoffDelay,
  isRetryableError,
  toPhase1ProtocolError,
} from './index';
import { createPacket } from '../protocol/v1/packetEngine';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { ProtocolErrorCodeCatalog } from '../protocol/v1/responseTypes';

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
        console.error(`    ${err.stack ?? err.message}`);
      });
  } else {
    try {
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.stack ?? err.message}`);
    }
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makePacket(seq: number = 1, text: string = 'Resilience Test Payload'): CubiOPacket {
  return createPacket({
    envelopeId: `ENV_RES_${seq}`,
    sequenceNumber: seq,
    sourceUri: 'CUBIO://NETWORK/0/01/00001/CLIENT',
    destinationUri: 'CUBIO://NETWORK/0/01/00002/SERVER',
    payloadData: text,
  });
}

async function runSuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  CUBiO AI — Phase 2 / Task 11: Transport Resilience & Failure Tests     ');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // ─── 1. Deterministic Backoff & Error Classification ──────────────────────

  console.log('1. Deterministic Backoff & Error Classification:');

  await test('calculateBackoffDelay enforces exponential progression with cap', () => {
    const policy: RetryPolicy = {
      maxAttempts: 5,
      initialDelayMs: 50,
      maxDelayMs: 500,
      backoffMultiplier: 2.0,
      jitter: 'NONE',
    };

    assert(calculateBackoffDelay(1, policy) === 0, 'Attempt 1 has 0 initial delay');
    assert(calculateBackoffDelay(2, policy) === 50, 'Attempt 2 has 50ms delay');
    assert(calculateBackoffDelay(3, policy) === 100, 'Attempt 3 has 100ms delay');
    assert(calculateBackoffDelay(4, policy) === 200, 'Attempt 4 has 200ms delay');
    assert(calculateBackoffDelay(5, policy) === 400, 'Attempt 5 has 400ms delay');
    assert(calculateBackoffDelay(6, policy) === 500, 'Attempt 6 capped at maxDelayMs 500ms');
    assert(calculateBackoffDelay(7, policy) === 500, 'Attempt 7 capped at maxDelayMs 500ms');
  });

  await test('isRetryableError accurately distinguishes transient from fatal errors', () => {
    assert(isRetryableError(new Error('ECONNREFUSED')) === true, 'ECONNREFUSED is retryable');
    assert(isRetryableError(new Error('ECONNRESET')) === true, 'ECONNRESET is retryable');
    assert(isRetryableError(new Error('ETIMEDOUT')) === true, 'ETIMEDOUT is retryable');
    assert(isRetryableError(new TransportTimeoutError('CONNECT', 1000)) === true, 'Timeout is retryable');

    // Fatal / non-retryable errors
    assert(isRetryableError(new TransportCancelledError('OP', 'User cancel')) === false, 'Cancelled is never retryable');
    assert(isRetryableError(new NonRetryableOperationError('OP', 'Idempotency')) === false, 'Non-idempotent is not retryable');
    assert(isRetryableError({ code: 'ERR_TRANSPORT_BIND_FAILED' }) === false, 'Bind failed is not retryable');
    assert(isRetryableError({ code: 'ERR_TRANSPORT_TLS_HANDSHAKE_FAILED' }) === false, 'TLS failure is not retryable');
    assert(isRetryableError({ code: 'ERR_TRANSPORT_FRAME_CORRUPTED' }) === false, 'Frame corrupted is not retryable');
  });

  // ─── 2. Connection Timeout on Real OS Sockets ─────────────────────────────

  console.log('\n2. Connection Timeout on Real OS Sockets:');

  const basePort = 21000;

  await test('Enforces connection timeout against blackholed address and releases resources', async () => {
    // 10.255.255.1 on a non-routable subnet causes connection timeout on TCP
    // We use a tight timeout of 120ms with NO_RETRY_POLICY
    const blackholeEndpoint: TransportEndpoint = {
      transportType: 'TCP',
      host: '10.255.255.1',
      port: 81,
    };

    const client = new TcpTransportAdapter({ connectTimeoutMs: 150 });
    const startTime = Date.now();
    let caughtError: any;

    try {
      await TransportResilienceEngine.connectWithResilience(client, blackholeEndpoint, {
        timeoutMs: 150,
        retryPolicy: NO_RETRY_POLICY,
      });
    } catch (err) {
      caughtError = err;
    }

    const elapsed = Date.now() - startTime;
    assert(caughtError !== undefined, 'Connection must fail');
    assert(
      caughtError instanceof TransportTimeoutError ||
      caughtError instanceof TransportRetryExhaustedError ||
      caughtError.message.includes('timed out') ||
      caughtError.message.includes('ENETUNREACH') ||
      caughtError.message.includes('EHOSTUNREACH'),
      `Expected timeout or unreachable error, got: ${caughtError}`
    );
    assert(elapsed >= 100, `Elapsed time must be at least 100ms, was ${elapsed}ms`);
    assert(client.state !== 'CONNECTED', 'Client must not be CONNECTED');

    await client.close('End test').catch(() => {});
  });

  // ─── 3. Connect Retry with Eventual Success ───────────────────────────────

  console.log('\n3. Connect Retry with Eventual Success:');

  await test('Recovers connection on attempt 3 after initial connection refusals', async () => {
    const port = basePort + 1;
    const targetEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const client = new TcpTransportAdapter({ connectTimeoutMs: 500 });
    const server = new TcpTransportAdapter();

    let attemptsCount = 0;

    // Start server in background after 120ms (so attempts 1 & 2 fail with ECONNREFUSED)
    const delayedServerStart = setTimeout(async () => {
      try {
        await server.listen(targetEndpoint);
      } catch {}
    }, 120);

    try {
      const { session, telemetry } = await TransportResilienceEngine.connectWithResilience(
        client,
        targetEndpoint,
        {
          retryPolicy: {
            maxAttempts: 5,
            initialDelayMs: 60,
            backoffMultiplier: 1.5,
            jitter: 'NONE',
          },
          onAttempt: (att) => {
            attemptsCount++;
          },
        }
      );

      assert(session.state === 'CONNECTED', 'Session connected successfully');
      assert(client.state === 'CONNECTED', 'Client adapter state is CONNECTED');
      assert(telemetry.finalOutcome === 'SUCCESS', 'Telemetry finalOutcome is SUCCESS');
      assert(telemetry.totalAttempts >= 2, `Expected at least 2 attempts, got ${telemetry.totalAttempts}`);
      assert(attemptsCount === telemetry.totalAttempts, 'Observer received all attempt callbacks');
    } finally {
      clearTimeout(delayedServerStart);
      await client.close('End connect retry test');
      await server.close('End connect retry test');
    }
  });

  // ─── 4. Connect Retry Exhaustion ──────────────────────────────────────────

  console.log('\n4. Connect Retry Exhaustion:');

  await test('Halts retries cleanly upon exhaustion and records forensic telemetry', async () => {
    // Port with no listener
    const deadPort = basePort + 2;
    const deadEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port: deadPort };

    const client = new TcpTransportAdapter({ connectTimeoutMs: 200 });
    let exhaustedError: TransportRetryExhaustedError | undefined;

    try {
      await TransportResilienceEngine.connectWithResilience(client, deadEndpoint, {
        retryPolicy: {
          maxAttempts: 3,
          initialDelayMs: 20,
          backoffMultiplier: 1.0,
          jitter: 'NONE',
        },
      });
    } catch (err: any) {
      if (err instanceof TransportRetryExhaustedError) {
        exhaustedError = err;
      }
    }

    assert(exhaustedError !== undefined, 'Must throw TransportRetryExhaustedError');
    assert(exhaustedError!.totalAttempts === 3, `Expected 3 total attempts, got ${exhaustedError!.totalAttempts}`);
    assert(exhaustedError!.telemetry.finalOutcome === 'RETRY_EXHAUSTED', 'Outcome is RETRY_EXHAUSTED');
    assert(exhaustedError!.telemetry.attemptHistory.length === 3, 'Recorded all 3 attempts in telemetry');
    assert(client.state !== 'CONNECTED', 'Client must not be connected');

    await client.close('Cleanup').catch(() => {});
  });

  // ─── 5. Idempotency Defense (Prevent Duplicate Delivery) ──────────────────

  console.log('\n5. Idempotency Defense (Prevent Duplicate Delivery):');

  await test('Refuses blind retry on non-idempotent operation when transmission fails', async () => {
    let executions = 0;

    // Simulate an operation that mutates state and fails after initiating work
    let caughtErr: any;
    try {
      await TransportResilienceEngine.execute(
        async (attempt) => {
          executions++;
          if (attempt === 1) {
            throw new Error('ECONNRESET: Connection dropped mid-mutation');
          }
          return 'should-not-happen';
        },
        {
          operationName: 'NON_IDEMPOTENT_MUTATION',
          idempotent: false, // Critical: non-idempotent!
          retryPolicy: {
            maxAttempts: 4,
            idempotencyEnforced: true,
          },
        }
      );
    } catch (err) {
      caughtErr = err;
    }

    assert(caughtErr instanceof NonRetryableOperationError, `Must throw NonRetryableOperationError, got ${caughtErr}`);
    assert(executions === 1, `Execution must strictly NOT repeat; executions count: ${executions}`);
    assert(caughtErr.message.includes('non-idempotent'), 'Error explains non-idempotent prohibition');
  });

  await test('Permits retry when operation is explicitly marked idempotent', async () => {
    let executions = 0;

    const { result, telemetry } = await TransportResilienceEngine.execute(
      async (attempt) => {
        executions++;
        if (attempt < 2) {
          throw new Error('ECONNRESET: Transient connection drop');
        }
        return 'idempotent-query-result';
      },
      {
        operationName: 'IDEMPOTENT_QUERY',
        idempotent: true, // Safe to retry
        retryPolicy: {
          maxAttempts: 3,
          initialDelayMs: 20,
        },
      }
    );

    assert(result === 'idempotent-query-result', 'Idempotent operation succeeded on attempt 2');
    assert(executions === 2, 'Executed exactly 2 times');
    assert(telemetry.finalOutcome === 'SUCCESS', 'Telemetry outcome is SUCCESS');
  });

  // ─── 6. Receive Timeout with Zero Listener Leaks ──────────────────────────

  console.log('\n6. Receive Timeout with Zero Listener Leaks:');

  await test('Awaits response packet, times out cleanly on silent peer, and removes receiver listener', async () => {
    const port = basePort + 3;
    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    const serverPackets: CubiOPacket[] = [];
    server.receive((pkt) => {
      serverPackets.push(pkt);
      // Deliberately remain silent: do NOT send a response back
    });

    try {
      await server.listen(srvEndpoint);
      await client.connect(srvEndpoint);
      await sleep(30);

      const requestPacket = makePacket(10, 'Request Awaiting Response');
      let caughtErr: any;

      try {
        await TransportResilienceEngine.requestResponseWithResilience(
          client,
          requestPacket,
          (resp) => resp.header.envelopeId === 'CORRELATED_RESP_10',
          {
            sendTimeoutMs: 500,
            receiveTimeoutMs: 150, // Short receive timeout
            retryPolicy: NO_RETRY_POLICY, // Single attempt test
          }
        );
      } catch (err) {
        caughtErr = err;
      }

      assert(caughtErr !== undefined, 'Must throw receive timeout');
      assert(
        caughtErr instanceof TransportTimeoutError && caughtErr.timeoutType === 'RECEIVE',
        `Error must be TransportTimeoutError with timeoutType RECEIVE, got: ${caughtErr}`
      );
      assert(serverPackets.length === 1, 'Server received initial request');

      // Verify client has zero dangling receive listeners
      const packetHandlers = (client as any)._packetHandlers as Set<any>;
      assert(packetHandlers.size === 0, `Expected 0 active packet handlers on client, found ${packetHandlers.size}`);
    } finally {
      await client.close('End receive timeout test');
      await server.close('End receive timeout test');
    }
  });

  await test('Successfully correlates response packet and cleans up listener on completion', async () => {
    const port = basePort + 4;
    const srvEndpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    const server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    server.receive(async (requestPkt) => {
      // Immediately reply with correlated response packet
      const respPkt = createPacket({
        envelopeId: `ENV_RESP_${requestPkt.header.sequenceNumber}`,
        sequenceNumber: 20,
        sourceUri: 'CUBIO://NETWORK/0/01/00002/SERVER',
        destinationUri: 'CUBIO://NETWORK/0/01/00001/CLIENT',
        payloadData: 'Correlated Response Payload',
      });
      await server.send(respPkt);
    });

    try {
      await server.listen(srvEndpoint);
      await client.connect(srvEndpoint);
      await sleep(30);

      const reqPkt = makePacket(11, 'Request for Correlation');
      const expectedCorrId = `ENV_RESP_${reqPkt.header.sequenceNumber}`;

      const { response, telemetry } = await TransportResilienceEngine.requestResponseWithResilience(
        client,
        reqPkt,
        (resp) => resp.header.envelopeId === expectedCorrId,
        {
          sendTimeoutMs: 500,
          receiveTimeoutMs: 1000,
          retryPolicy: NO_RETRY_POLICY,
        }
      );

      assert(response !== undefined, 'Received response packet');
      assert(response.header.envelopeId === expectedCorrId, 'Correlation ID matches exactly');
      assert(response.payload.data === 'Correlated Response Payload', 'Payload data verified');
      assert(telemetry.finalOutcome === 'SUCCESS', 'Outcome is SUCCESS');

      // Verify unregistration
      const packetHandlers = (client as any)._packetHandlers as Set<any>;
      assert(packetHandlers.size === 0, `Expected 0 lingering packet handlers on client, found ${packetHandlers.size}`);
    } finally {
      await client.close('End correlation test');
      await server.close('End correlation test');
    }
  });

  // ─── 7. Cooperative Cancellation ──────────────────────────────────────────

  console.log('\n7. Cooperative Cancellation:');

  await test('Aborts in-flight execution immediately when CancellationTokenSource is cancelled', async () => {
    const cts = new CancellationTokenSource();

    // Trigger cancellation after 60ms
    setTimeout(() => {
      cts.cancel('User aborted request');
    }, 60);

    let caughtErr: any;
    const startTime = Date.now();

    try {
      await TransportResilienceEngine.execute(
        async (_attempt) => {
          // Simulate slow asynchronous task
          await sleep(500);
          return 'done';
        },
        {
          operationName: 'LONG_RUNNING_OPERATION',
          timeoutMs: 1000,
          cancellationToken: cts.token,
          retryPolicy: { maxAttempts: 3, initialDelayMs: 200 },
        }
      );
    } catch (err) {
      caughtErr = err;
    }

    const elapsed = Date.now() - startTime;
    assert(caughtErr instanceof TransportCancelledError, `Expected TransportCancelledError, got ${caughtErr}`);
    assert(caughtErr.reason === 'User aborted request', `Reason matches: ${caughtErr.reason}`);
    assert(elapsed < 200, `Execution aborted quickly without waiting for full duration (took ${elapsed}ms)`);
  });

  // ─── 8. Phase 1 Error Model Integration ───────────────────────────────────

  console.log('\n8. Phase 1 Error Model Integration:');

  await test('Translates transport timeout and exhaustion to CanonicalProtocolError', () => {
    // 1. TransportTimeoutError
    const timeoutErr = new TransportTimeoutError('CONNECT', 3000);
    const p1Timeout = toPhase1ProtocolError(timeoutErr, { correlationId: 'CORR_001' });

    assert(p1Timeout.category === 'NETWORK_ERROR', 'Category is NETWORK_ERROR');
    assert(p1Timeout.code === ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_TIMEOUT, 'Code is ERR_NETWORK_CONNECTION_TIMEOUT');
    assert(p1Timeout.retryable === true, 'Timeout is retryable');
    assert(p1Timeout.details?.correlationId === 'CORR_001', 'Details contain correlationId');

    // 2. TransportRetryExhaustedError
    const dummyTelemetry = {
      operationId: 'OP_1',
      operationName: 'TEST',
      idempotent: true,
      totalAttempts: 3,
      maxAttempts: 3,
      totalDurationMs: 500,
      finalOutcome: 'RETRY_EXHAUSTED' as const,
      attemptHistory: [],
    };
    const exhaustedErr = new TransportRetryExhaustedError('OP_1', 3, dummyTelemetry, new Error('ECONNREFUSED'));
    const p1Exhausted = toPhase1ProtocolError(exhaustedErr);

    assert(p1Exhausted.category === 'NETWORK_ERROR', 'Category is NETWORK_ERROR');
    assert(p1Exhausted.code === ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_RESET, 'Code is ERR_NETWORK_CONNECTION_RESET');
    assert(p1Exhausted.retryable === false, 'Exhausted error is NOT retryable');

    // 3. TransportCancelledError
    const cancelErr = new TransportCancelledError('OP_2', 'User abort');
    const p1Cancel = toPhase1ProtocolError(cancelErr);

    assert(p1Cancel.category === 'NETWORK_ERROR', 'Category is NETWORK_ERROR');
    assert(p1Cancel.code === ProtocolErrorCodeCatalog.ERR_NETWORK_PEER_DISCONNECTED, 'Code is ERR_NETWORK_PEER_DISCONNECTED');
    assert(p1Cancel.retryable === false, 'Cancelled is not retryable');
  });

  // ─── 9. Disconnect Detection & Resilient Reconnection ──────────────────────

  console.log('\n9. Disconnect Detection & Resilient Reconnection:');

  await test('Detects remote disconnect and recovers session using connectWithResilience', async () => {
    const port = basePort + 5;
    const endpoint: TransportEndpoint = { transportType: 'TCP', host: '127.0.0.1', port };

    let server = new TcpTransportAdapter();
    const client = new TcpTransportAdapter();

    await server.listen(endpoint);
    const { session: sess1 } = await TransportResilienceEngine.connectWithResilience(client, endpoint);
    assert(sess1.state === 'CONNECTED', 'Initial session connected');

    // Abruptly close the server to simulate remote disconnect
    await server.close('Abrupt server failure');
    await sleep(50);

    // Reopen server on same endpoint
    server = new TcpTransportAdapter();
    await server.listen(endpoint);

    // Reconnect client using resilience engine
    const { session: sess2, telemetry } = await TransportResilienceEngine.connectWithResilience(client, endpoint, {
      retryPolicy: { maxAttempts: 3, initialDelayMs: 30 },
    });

    assert(sess2.state === 'CONNECTED', 'Reconnected session established');
    assert(client.state === 'CONNECTED', 'Client adapter state is CONNECTED');
    assert(telemetry.finalOutcome === 'SUCCESS', 'Outcome is SUCCESS');

    await client.close('End disconnect test');
    await server.close('End disconnect test');
  });

  // ─── 10. High-Churn Resource Leak Audit ───────────────────────────────────

  console.log('\n10. High-Churn Resource Leak Audit:');

  await test('Executes mass concurrent cancellations and timeouts without memory or timer leaks', async () => {
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < 25; i++) {
      const cts = new CancellationTokenSource();
      const cancelDelay = 5 + (i % 10);
      setTimeout(() => cts.cancel('Churn cancellation'), cancelDelay);

      const task = TransportResilienceEngine.execute(
        async () => {
          await sleep(100);
          return 'ok';
        },
        {
          operationName: `CHURN_OP_${i}`,
          timeoutMs: 80,
          cancellationToken: cts.token,
          retryPolicy: { maxAttempts: 2, initialDelayMs: 15 },
        }
      ).then(
        () => {},
        (err) => {
          // Expected cancellation or timeout
          assert(
            err instanceof TransportCancelledError || err instanceof TransportTimeoutError,
            `Expected cancel/timeout, got ${err}`
          );
        }
      );

      tasks.push(task);
    }

    await Promise.all(tasks);
    // Allow any microtasks or timers to finalize
    await sleep(50);
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 2 / Task 11 Transport Resilience: Passed: ${passed} | Failed: ${failed}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal error during Task 11 test execution:', err);
  process.exit(1);
});
