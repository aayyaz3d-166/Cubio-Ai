/**
 * CUBiO AI — Intelligence AI MVP Connection Verification Test
 * tests/tasks/test_intelligence_ai_mvp_connection.ts
 *
 * Verifies the complete chain:
 *   Intelligence AI UI → /api/v1/chat → chatEngine → CubiOModelV1ProductionService
 *   → Model V1 inference → tokenizer/decode → properly decoded response
 *
 * Tests:
 * 1-5: Single-turn prompts with modelId='cubio-model-v1'
 * 6:   3-turn conversation for context continuity
 *
 * BOUNDARIES: NO model modification, NO retraining, NO deployment.
 */

import * as http from 'http';
import * as path from 'path';

// ============================================================
// CONFIG
// ============================================================

const SERVER_STARTUP_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = 30000;
const API_KEY = 'cubio_mvp_demo_key_2026';
const MODEL_ID = 'cubio-model-v1';

// ============================================================
// HELPERS
// ============================================================

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  prompt?: string;
  responseText?: string;
  modelId?: string;
  mode?: string;
  latencyMs?: number;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, id: string, name: string, details?: Partial<TestResult>): void {
  results.push({ id, name, passed: condition, ...details });
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} [${id}] ${name}`);
  if (details?.error) console.log(`     Error: ${details.error}`);
}

function httpPost(
  port: number,
  path: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const t0 = Date.now();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          const latencyMs = Date.now() - t0;
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(raw), latencyMs });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw, latencyMs });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(payload);
    req.end();
  });
}

function httpGet(port: number, path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method: 'GET', timeout: 5000 },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function waitForServer(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await httpGet(port, '/healthz');
      if (res.status === 200) return true;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function sendChat(
  port: number,
  message: string,
  conversationId: string,
  requestId?: string
): Promise<{ status: number; data: any; latencyMs: number }> {
  const reqId = requestId || `req_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return httpPost(port, '/api/v1/chat', {
    requestId: reqId,
    conversationId,
    message,
    options: {
      modelId: MODEL_ID,
      temperature: 0.3,
    },
  }, {
    'Authorization': `Bearer ${API_KEY}`,
  });
}

// ============================================================
// RESPONSE VALIDATORS
// ============================================================

function validateResponse(
  testId: string,
  prompt: string,
  res: { status: number; data: any; latencyMs: number }
): void {
  assert(res.status === 200, `${testId}-HTTP`, `HTTP 200 for "${prompt}"`, {
    prompt, error: res.status !== 200 ? `Got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}` : undefined,
  });

  const responseText: string = res.data?.response?.text || res.data?.text || '';
  const mode: string = res.data?.metadata?.mode || '';
  const selectedModelId: string = res.data?.metadata?.selectedModelId || '';

  assert(responseText.length > 0, `${testId}-TEXT`, `Non-empty response for "${prompt}"`, {
    prompt, responseText: responseText.slice(0, 120),
  });

  assert(
    selectedModelId === MODEL_ID,
    `${testId}-MODEL`,
    `selectedModelId is '${MODEL_ID}' (got: '${selectedModelId}')`,
    { prompt, modelId: selectedModelId }
  );

  assert(
    mode === 'CUBIO_MODEL_V1_RESEARCH_RELEASE',
    `${testId}-MODE`,
    `mode is CUBIO_MODEL_V1_RESEARCH_RELEASE (got: '${mode}')`,
    { prompt, mode }
  );

  assert(!responseText.includes('<PAD>'), `${testId}-PAD`, `No <PAD> tokens`, { prompt });
  assert(!responseText.includes('<BOS>'), `${testId}-BOS`, `No <BOS> tokens`, { prompt });
  assert(!responseText.includes('<EOS>'), `${testId}-EOS`, `No <EOS> tokens`, { prompt });
  assert(!responseText.includes('<EPISTEMIC_'), `${testId}-EPIS`, `No raw epistemic tags`, { prompt });
  assert(responseText.indexOf('  ') === -1, `${testId}-SPC`, `No double spaces`, { prompt });
  assert(res.latencyMs < 30000, `${testId}-LAT`, `Latency under 30s (${res.latencyMs}ms)`, {
    prompt, latencyMs: res.latencyMs,
  });

  console.log(`    Response: "${responseText.slice(0, 100)}${responseText.length > 100 ? '...' : ''}"`);
  console.log(`    Mode: ${mode} | Model: ${selectedModelId} | Latency: ${res.latencyMs}ms`);
}

// ============================================================
// MAIN TEST
// ============================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(' Intelligence AI → Model V1 Connection Verification');
  console.log('='.repeat(70));

  // Determine server port
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Check if server is already running
  console.log(`\n--- Checking server at 127.0.0.1:${PORT} ---`);
  let serverReady = false;
  try {
    const health = await httpGet(PORT, '/healthz');
    serverReady = health.status === 200;
  } catch { /* not running */ }

  if (!serverReady) {
    console.log('  Server not running. Starting server...');
    // Start server as child process
    const { spawn } = await import('child_process');
    const serverCwd = path.resolve(process.cwd());
    const serverProc = spawn('npx', ['tsx', 'server.ts'], {
      cwd: serverCwd,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    serverProc.stdout?.on('data', (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.log(`  [SERVER] ${line}`);
    });
    serverProc.stderr?.on('data', (d: Buffer) => {
      const line = d.toString().trim();
      if (line && !line.includes('ExperimentalWarning')) console.log(`  [SERVER ERR] ${line}`);
    });

    serverReady = await waitForServer(PORT, SERVER_STARTUP_TIMEOUT_MS);
    if (!serverReady) {
      console.error('  ❌ Server failed to start within timeout');
      serverProc.kill();
      process.exit(1);
    }
    console.log('  ✅ Server started and healthy');

    // Ensure cleanup on exit
    process.on('exit', () => serverProc.kill());
    process.on('SIGINT', () => { serverProc.kill(); process.exit(1); });
  } else {
    console.log('  ✅ Server already running');
  }

  // ============================================================
  // TEST 1-5: Single-turn prompts
  // ============================================================

  const prompts = [
    { id: 'T1', text: 'Hello' },
    { id: 'T2', text: 'How are you?' },
    { id: 'T3', text: 'What is 2 + 2?' },
    { id: 'T4', text: 'What is CUBiO AI?' },
    { id: 'T5', text: 'What is a TypeScript interface?' },
  ];

  for (const p of prompts) {
    const convId = `test_conv_${p.id}_${Date.now()}`;
    console.log(`\n--- Test ${p.id}: "${p.text}" ---`);
    try {
      const res = await sendChat(PORT, p.text, convId);
      validateResponse(p.id, p.text, res);
    } catch (err: any) {
      assert(false, `${p.id}-EXEC`, `Execution for "${p.text}"`, { prompt: p.text, error: err.message });
    }
  }

  // ============================================================
  // TEST 6: 3-turn conversation context continuity
  // ============================================================

  console.log('\n--- Test T6: 3-Turn Context Continuity ---');
  const multiConvId = `test_conv_multi_${Date.now()}`;
  const turns = [
    { text: 'My name is Ayyaz.', id: 'T6a' },
    { text: 'What did I just tell you?', id: 'T6b' },
    { text: 'Thank you.', id: 'T6c' },
  ];

  let prevSequence = -1;
  for (const turn of turns) {
    console.log(`  Turn ${turn.id}: "${turn.text}"`);
    try {
      const res = await sendChat(PORT, turn.text, multiConvId);
      assert(res.status === 200, `${turn.id}-HTTP`, `HTTP 200`, { prompt: turn.text });

      const seq = res.data?.sequence ?? -1;
      const responseText: string = res.data?.response?.text || '';
      const selectedModelId: string = res.data?.metadata?.selectedModelId || '';

      assert(responseText.length > 0, `${turn.id}-TEXT`, `Non-empty response`, { prompt: turn.text });
      assert(selectedModelId === MODEL_ID, `${turn.id}-MODEL`, `Correct modelId`, { prompt: turn.text });

      if (prevSequence >= 0) {
        assert(seq > prevSequence, `${turn.id}-SEQ`, `Monotonic sequence (${prevSequence} → ${seq})`, { prompt: turn.text });
      }
      prevSequence = seq;

      console.log(`    Response: "${responseText.slice(0, 80)}..." | Seq: ${seq} | Model: ${selectedModelId}`);
    } catch (err: any) {
      assert(false, `${turn.id}-EXEC`, `Turn execution`, { prompt: turn.text, error: err.message });
    }
  }

  // ============================================================
  // TEST 7: Cross-session isolation
  // ============================================================

  console.log('\n--- Test T7: Cross-Session Isolation ---');
  const isoConvA = `test_iso_A_${Date.now()}`;
  const isoConvB = `test_iso_B_${Date.now()}`;

  try {
    // Send a secret to session A
    await sendChat(PORT, 'The secret code is ALPHA-369.', isoConvA);
    // Ask session B about it
    const resB = await sendChat(PORT, 'What is the secret code?', isoConvB);
    const textB: string = resB.data?.response?.text || '';
    assert(!textB.includes('ALPHA-369'), 'T7-ISO', 'Session B does not leak session A secret', {
      responseText: textB.slice(0, 100),
    });
    console.log(`    Session B response: "${textB.slice(0, 80)}..."`);
  } catch (err: any) {
    assert(false, 'T7-EXEC', 'Cross-session test execution', { error: err.message });
  }

  // ============================================================
  // TEST 8: No auth → 401
  // ============================================================

  console.log('\n--- Test T8: Unauthenticated Request → 401 ---');
  try {
    const noAuthRes = await httpPost(PORT, '/api/v1/chat', {
      requestId: `req_noauth_${Date.now()}`,
      conversationId: 'test_noauth',
      message: 'Hello',
      options: { modelId: MODEL_ID },
    });
    assert(noAuthRes.status === 401, 'T8-AUTH', `Unauthenticated request returns 401 (got: ${noAuthRes.status})`);
  } catch (err: any) {
    assert(false, 'T8-EXEC', 'Auth test execution', { error: err.message });
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  console.log('\n' + '='.repeat(70));
  console.log(' RESULTS SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n  Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  // Check critical chain verification
  const v1ModeResults = results.filter((r) => r.id.endsWith('-MODE'));
  const allV1Routed = v1ModeResults.every((r) => r.passed);

  console.log(`\n  Model V1 Routing Chain: ${allV1Routed ? 'VERIFIED ✅' : 'BROKEN ❌'}`);

  if (failed > 0) {
    console.log('\n  Failed tests:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    ❌ [${r.id}] ${r.name}${r.error ? ` — ${r.error}` : ''}`);
    }
  }

  const verdict = failed === 0 && allV1Routed ? 'PASS' : 'NO-GO';
  console.log(`\n  ============================================`);
  console.log(`  FINAL VERDICT: ${verdict}`);
  console.log(`  ============================================`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
