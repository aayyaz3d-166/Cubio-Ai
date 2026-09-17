/**
 * CUBiO AI Web MVP — Standalone Distribution Verification Test
 * PMA Task 312: Independent verification of the standalone clone in Desktop\CUBiO-AI-MVP
 * Runs on isolated PORT = 3395
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import { IS_ACTUATION_BLOCKED as CORE_ACTUATION_BLOCKED } from './src/cubio/intelligence/core/coreEngineContract.js';
import { IS_ACTUATION_BLOCKED as FUNNEL02_ACTUATION_BLOCKED } from './src/funnel02/constants.js';
import { IS_ACTUATION_BLOCKED as CHAT_ACTUATION_BLOCKED } from './src/cubio/intelligence/chat/chatEngineContract.js';
import { ApiKeyValidator } from './src/cubio/api/security/apiKeyValidator.js';

const TEST_PORT = 3395;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const DEMO_USER_TOKEN = 'cubio_mvp_demo_key_2026';

const EXPECTED_HASHES = {
  db: 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6',
  dbSize: 77824,
  checkpoint: '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8',
  checkpointSize: 6038463,
  address369: '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612'
};

function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function httpRequest(method: string, urlPath: string, body?: any, token?: string): Promise<{ status: number; headers: any; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (payload) {
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = http.request(
      `${BASE_URL}${urlPath}`,
      {
        method,
        headers,
        timeout: 20000
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data: any = raw;
          try {
            data = JSON.parse(raw);
          } catch (e) {}
          resolve({ status: res.statusCode || 200, headers: res.headers, data, raw });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${urlPath}`));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('='.repeat(72));
  console.log(' CUBiO AI Web MVP — Standalone Clone Verification Test');
  console.log(` Target Root: ${process.cwd()}`);
  console.log(` Test Port: ${TEST_PORT}`);
  console.log('='.repeat(72) + '\n');

  let passedGates = 0;
  const totalGates = 10;
  let serverProcess: ChildProcess | null = null;

  try {
    // GATE 1: Asset Existence and Canonical SHA-256 Hashes
    console.log('[GATE 1] Auditing Canonical Assets and Hashes...');
    const dbPath = path.resolve('data/cubio_studio.db');
    const ckptPath = path.resolve('data/checkpoints/phase16_production_final_sealed_1m.3dmemory');
    if (!fs.existsSync(dbPath)) throw new Error(`Missing VDB file: ${dbPath}`);
    if (!fs.existsSync(ckptPath)) throw new Error(`Missing Checkpoint file: ${ckptPath}`);

    const dbStat = fs.statSync(dbPath);
    const ckptStat = fs.statSync(ckptPath);
    const dbHash = getFileHash(dbPath);
    const ckptHash = getFileHash(ckptPath);

    if (dbStat.size !== EXPECTED_HASHES.dbSize || dbHash !== EXPECTED_HASHES.db) {
      throw new Error(`DB mismatch! Expected ${EXPECTED_HASHES.db} (${EXPECTED_HASHES.dbSize}B), got ${dbHash} (${dbStat.size}B)`);
    }
    if (ckptStat.size !== EXPECTED_HASHES.checkpointSize || ckptHash !== EXPECTED_HASHES.checkpoint) {
      throw new Error(`Checkpoint mismatch! Expected ${EXPECTED_HASHES.checkpoint} (${EXPECTED_HASHES.checkpointSize}B), got ${ckptHash} (${ckptStat.size}B)`);
    }
    console.log(`  -> data/cubio_studio.db: ${dbStat.size} bytes, SHA-256 MATCH: ${dbHash}`);
    console.log(`  -> checkpoint: ${ckptStat.size} bytes, SHA-256 MATCH: ${ckptHash}`);
    console.log('  [PASS] Gate 1: Canonical Data Assets Verified\n');
    passedGates++;

    // GATE 2: Address369 Validator Integrity
    console.log('[GATE 2] Auditing Address369 Sovereign Validator...');
    const addrPath = path.resolve('src/core/address369.ts');
    if (!fs.existsSync(addrPath)) throw new Error(`Missing address369: ${addrPath}`);
    const addrHash = getFileHash(addrPath);
    if (addrHash !== EXPECTED_HASHES.address369) {
      throw new Error(`Address369 Hash mismatch! Expected ${EXPECTED_HASHES.address369}, got ${addrHash}`);
    }
    console.log(`  -> src/core/address369.ts: SHA-256 MATCH: ${addrHash}`);
    console.log('  [PASS] Gate 2: Address369 Integrity Verified\n');
    passedGates++;

    // GATE 3: Actuation Lockout Invariant Audit
    console.log('[GATE 3] Auditing Actuation Lockout & Security Boundary...');
    if (CORE_ACTUATION_BLOCKED !== true) throw new Error('CORE_ACTUATION_BLOCKED !== true');
    if (FUNNEL02_ACTUATION_BLOCKED !== true) throw new Error('FUNNEL02_ACTUATION_BLOCKED !== true');
    if (CHAT_ACTUATION_BLOCKED !== true) throw new Error('CHAT_ACTUATION_BLOCKED !== true');

    const validator = new ApiKeyValidator();
    const validCred = validator.validate(DEMO_USER_TOKEN);
    const bogusCred = validator.validate('unauthorized-key-xyz');
    if (!validCred || validCred.role !== 'user') throw new Error('Demo token validation failed');
    if (bogusCred !== null) throw new Error('Unauthorized key was not rejected');

    console.log('  -> CORE_ACTUATION_BLOCKED = true (VERIFIED)');
    console.log('  -> FUNNEL02_ACTUATION_BLOCKED = true (VERIFIED)');
    console.log('  -> CHAT_ACTUATION_BLOCKED = true (VERIFIED)');
    console.log('  -> API Key Validator: Fails Closed (VERIFIED)');
    console.log('  [PASS] Gate 3: Actuation Lockout & Security Boundary Enforced\n');
    passedGates++;

    // GATE 4: Zero Scratch / Non-Local Dependencies Audit
    console.log('[GATE 4] Auditing Clean Codebase & Manifest Closure...');
    const manifestPath = path.resolve('MANIFEST_INCLUDED.json');
    if (!fs.existsSync(manifestPath)) throw new Error('Missing MANIFEST_INCLUDED.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`  -> Audited ${manifest.length} registered production files`);

    // Scan for any literal 'scratch/' imports in all source files
    let scratchImportCount = 0;
    for (const item of manifest) {
      const relFile = typeof item === 'string' ? item : item.destinationPath;
      const fullPath = path.resolve(relFile);
      if (fs.existsSync(fullPath)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        if (text.includes("from './scratch") || text.includes('from "../scratch') || text.includes('scratch/cubio_native_model')) {
          scratchImportCount++;
          console.error(`  VIOLATION in ${relFile}: contains scratch import`);
        }
      }
    }
    if (scratchImportCount > 0) throw new Error(`Found ${scratchImportCount} scratch imports`);
    console.log('  -> Scratch import audit: 0 scratch dependencies found across all files');
    console.log('  [PASS] Gate 4: Clean Dependency Closure Verified\n');
    passedGates++;

    // GATE 5: Boot Standalone Server on Port 3395
    console.log('[GATE 5] Booting Standalone Backend Server (Process Mode)...');
    const env = { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'production' };

    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      cwd: process.cwd(),
      env,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let bootLog = '';
    serverProcess.stdout?.on('data', (d) => {
      const s = d.toString();
      bootLog += s;
      process.stdout.write(s);
    });
    serverProcess.stderr?.on('data', (d) => {
      const s = d.toString();
      bootLog += s;
      process.stderr.write(s);
    });

    let healthy = false;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        const res = await httpRequest('GET', '/health');
        if (res.status === 200 && (res.data.status === 'ok' || res.data.status === 'healthy')) {
          healthy = true;
          break;
        }
      } catch (e) {}
    }

    if (!healthy) {
      throw new Error(`Server failed to start on port ${TEST_PORT} within 20s. Boot logs:\n${bootLog}`);
    }
    console.log(`  -> Server successfully listening on http://127.0.0.1:${TEST_PORT}`);
    console.log('  [PASS] Gate 5: Standalone Server Boot Verified\n');
    passedGates++;

    // GATE 6: Health & Readiness Endpoints
    console.log('[GATE 6] Testing /health, /healthz, /api/v1/health, and /api/v1/readiness...');
    const h1 = await httpRequest('GET', '/health');
    console.log('  -> GET /health:', JSON.stringify(h1.data));
    if (h1.data.status !== 'ok' || h1.data.modelReady !== true) throw new Error('GET /health failed');

    const hz = await httpRequest('GET', '/healthz');
    console.log('  -> GET /healthz: HTTP', hz.status);
    if (hz.status !== 200) throw new Error('GET /healthz failed');

    const v1h = await httpRequest('GET', '/api/v1/health');
    console.log('  -> GET /api/v1/health:', JSON.stringify(v1h.data));
    if (v1h.status !== 200 || v1h.data.status !== 'ok') throw new Error('GET /api/v1/health failed');

    const v1r = await httpRequest('GET', '/api/v1/readiness');
    console.log('  -> GET /api/v1/readiness:', JSON.stringify(v1r.data));
    if (v1r.status !== 200 || v1r.data.status !== 'ready') throw new Error('GET /api/v1/readiness failed');
    if (v1r.data.checks?.actuation_locked !== 'PASS') throw new Error('readiness actuation_locked != PASS');
    console.log('  [PASS] Gate 6: Health & Readiness Endpoints Verified\n');
    passedGates++;

    // GATE 7: Models Endpoint
    console.log('[GATE 7] Testing GET /api/v1/models...');
    const mRes = await httpRequest('GET', '/api/v1/models');
    console.log('  -> Models count:', mRes.data.count ?? (mRes.data.models ? mRes.data.models.length : 0));
    console.log('  -> Root model:', mRes.data.model);
    console.log('  -> Production mode:', mRes.data.productionMode);

    if (mRes.status !== 200) throw new Error(`GET /api/v1/models returned HTTP ${mRes.status}`);
    if (!Array.isArray(mRes.data.models) || mRes.data.models.length === 0) {
      throw new Error('Expected non-empty models array in /api/v1/models response');
    }
    const model1M = mRes.data.models.find((m: any) => m.id === 'cubio-native-1m-production' || m.modelId === 'cubio-native-1m-production');
    if (!model1M) throw new Error('cubio-native-1m-production model not found in /api/v1/models');
    if (model1M.parameters !== 971520) throw new Error(`Expected 971520 parameters, found ${model1M.parameters}`);
    if (model1M.layerCount !== 6) throw new Error(`Expected 6 layers, found ${model1M.layerCount}`);
    if (model1M.hiddenDimension !== 128) throw new Error(`Expected hiddenDimension 128, found ${model1M.hiddenDimension}`);
    if (model1M.isActuationBlocked !== true) throw new Error('isActuationBlocked !== true in model metadata');

    console.log(`  -> Verified model: ${model1M.name} (${model1M.parameters} params, ${model1M.layerCount} layers, d=${model1M.hiddenDimension})`);
    console.log('  [PASS] Gate 7: Models Endpoint Contract Verified\n');
    passedGates++;

    // GATE 8: Vector DB Query Endpoint
    console.log('[GATE 8] Testing POST /api/v1/query (VDB semantic retrieval)...');
    const qRes = await httpRequest('POST', '/api/v1/query', {
      query: 'sovereign address architecture',
      topK: 3
    }, DEMO_USER_TOKEN);
    console.log('  -> Query HTTP status:', qRes.status);
    console.log('  -> Results count:', qRes.data.results ? qRes.data.results.length : 0);
    if (qRes.status !== 200) throw new Error(`Query failed with HTTP ${qRes.status}`);
    console.log('  [PASS] Gate 8: VDB Query Endpoint Verified\n');
    passedGates++;

    // GATE 9: Native 1M Conversational Inference Endpoint
    console.log('[GATE 9] Testing POST /api/v1/chat (Real Native 1M inference)...');
    const chatStart = Date.now();
    const chatRes = await httpRequest('POST', '/api/v1/chat', {
      requestId: 'req_standalone_312_verify',
      conversationId: 'conv_standalone_312',
      sessionId: 'session_standalone_312',
      message: 'Explain Address 369 spatial architecture in CUBiO AI.'
    }, DEMO_USER_TOKEN);
    const chatDuration = Date.now() - chatStart;
    console.log(`  -> Chat HTTP status: ${chatRes.status} (elapsed: ${chatDuration}ms)`);
    console.log('  -> Chat response excerpt:', JSON.stringify(chatRes.data).slice(0, 160) + '...');
    if (chatRes.status !== 200) throw new Error(`Chat failed with status ${chatRes.status}`);
    if (!chatRes.data.response?.text && !chatRes.data.message && !chatRes.data.content) {
      throw new Error('Chat response missing content text');
    }
    console.log('  [PASS] Gate 9: Native 1M Chat Inference Verified\n');
    passedGates++;

    // GATE 10: Production Frontend SPA Serving
    console.log('[GATE 10] Testing Root / Production SPA Serving...');
    const rootRes = await httpRequest('GET', '/');
    console.log('  -> Root HTTP Status:', rootRes.status);
    const html = rootRes.raw.toLowerCase();
    if (rootRes.status !== 200 || !html.includes('<!doctype html>')) {
      throw new Error(`Root endpoint failed to serve production HTML (status: ${rootRes.status})`);
    }
    console.log('  -> Served compiled Vite HTML bundle (Length: ' + rootRes.raw.length + ' bytes)');
    console.log('  [PASS] Gate 10: Root Web Studio Serving Verified\n');
    passedGates++;

    console.log('='.repeat(72));
    console.log(` ALL ${passedGates}/${totalGates} GATES PASSED SUCCESSFULLY!`);
    console.log(' STANDALONE CUBIO AI WEB MVP IS 100% OPERATIONAL & VERIFIED.');
    console.log('='.repeat(72));
  } catch (err: any) {
    console.error('\n[FAILURE]:', err.message);
    process.exitCode = 1;
  } finally {
    if (serverProcess && serverProcess.pid) {
      console.log('\nTerminating test server...');
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
        } else {
          serverProcess.kill('SIGTERM');
          serverProcess.kill('SIGKILL');
        }
      } catch (kErr) {}
      await sleep(1000);
    }
  }
}

runTests();
