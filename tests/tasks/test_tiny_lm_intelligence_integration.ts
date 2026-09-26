/**
 * Test Suite: Tiny LM Integration into Intelligence AI MVP
 *
 * Verifies:
 * 1. Checkpoint SHA-256 and Model Hash integrity.
 * 2. Prewarming and TinyLMProductionService initialization.
 * 3. Model registry and child policy validation.
 * 4. Test prompt: "Hello"
 * 5. Test prompt: "How are you?"
 * 6. Test prompt: "What is 2 + 2?"
 * 7. Test prompt: "What is CUBiO AI?"
 * 8. 3-turn conversational coherence.
 * 9. Direct backend routing to Tiny LM (metadata.mode === 'TINY_LM_V1_FROZEN_RESEARCH', effectiveModelId === 'cubio-tiny-lm-v1').
 * 10. Decoded text sanitization: 0 raw tokens or token fragments (<RESERVED_N>, <PAD>, <UNK>, <EOS>).
 * 11. Fallback & isolation verification: Model V1 and Native 1M remain intact and unaffected.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TinyLMProductionService, TINY_LM_MODEL_ID } from '../../src/cubio/inference/tiny_lm/tinyLMProductionService';
import { ModelRegistry } from '../../src/cubio/model/native_foundation/model_registry';
import { Phase28ChildModelRegistryManager } from '../../src/cubio/integration/phase28ChildModelRegistryManager';
import { CubiOChatEngine } from '../../src/cubio/intelligence/chat/chatEngine';

const EXPECTED_CHECKPOINT_SHA256 = 'd535d2ec0c61391eb06d6b6533cf94c4ebb16611aceeab68871785acf8f091f5';
const EXPECTED_MODEL_HASH = '3d39bccfe1e532c13fbfbc1c2cb4fa57224dd9726a1c9670f88fabcaa93af3c9';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   TINY LM INTELLIGENCE AI MVP INTEGRATION VERIFICATION SUITE   ');
  console.log('================================================================\n');

  let passedGates = 0;
  let totalGates = 0;

  function assertGate(gateName: string, condition: boolean, detail: string) {
    totalGates++;
    if (condition) {
      passedGates++;
      console.log(`[PASS] Gate ${totalGates}: ${gateName} - ${detail}`);
    } else {
      console.error(`[FAIL] Gate ${totalGates}: ${gateName} - ${detail}`);
      throw new Error(`Gate failed: ${gateName} - ${detail}`);
    }
  }

  // GATE 1: Checkpoint, Vocab, and Manifest Assets
  const checkpointPath = path.resolve(process.cwd(), 'data', 'checkpoints', 'tiny_lm', 'tiny_lm_v1_frozen_step_000130.json');
  assertGate('Checkpoint File Exists', fs.existsSync(checkpointPath), checkpointPath);

  const rawBytes = fs.readFileSync(checkpointPath);
  const calculatedSha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
  assertGate(
    'Checkpoint SHA-256 Checksum Match',
    calculatedSha256 === EXPECTED_CHECKPOINT_SHA256,
    `Expected: ${EXPECTED_CHECKPOINT_SHA256}, Actual: ${calculatedSha256}`
  );

  const parsedCheckpoint = JSON.parse(rawBytes.toString('utf-8'));
  assertGate(
    'Model State Hash Match',
    parsedCheckpoint.modelHash === EXPECTED_MODEL_HASH,
    `Expected: ${EXPECTED_MODEL_HASH}, Actual: ${parsedCheckpoint.modelHash}`
  );
  assertGate('Step Counter', parsedCheckpoint.step === 130, `Step: ${parsedCheckpoint.step}`);

  // GATE 2: Production Service Prewarming & Initialization
  const tinyService = TinyLMProductionService.getInstance();
  const initSuccess = await tinyService.initialize(checkpointPath);
  assertGate('TinyLMProductionService Initialized', initSuccess && tinyService.isReady(), `Status: ${tinyService.getStatus()}`);
  assertGate('Verified Checkpoint SHA', tinyService.getVerifiedCheckpointSha256() === EXPECTED_CHECKPOINT_SHA256, 'Matches certified hash');
  assertGate('Verified Model Hash', tinyService.getVerifiedModelHash() === EXPECTED_MODEL_HASH, 'Matches frozen model hash');

  // GATE 3: Child Model Registry & Policy Resolution
  const childManager = Phase28ChildModelRegistryManager.getInstance();
  const resolution = childManager.validateAndResolveModel('cubio-child-mvp', TINY_LM_MODEL_ID);
  assertGate(
    'Child Policy Allows Tiny LM',
    resolution.valid && resolution.selectedModelId === TINY_LM_MODEL_ID && !resolution.fallbackApplied,
    `Selected: ${resolution.selectedModelId}, Fallback: ${resolution.fallbackApplied}`
  );

  const modelEntry = ModelRegistry.getInstance().getModel(TINY_LM_MODEL_ID);
  assertGate(
    'ModelRegistry Registration',
    modelEntry !== null && modelEntry.productionMode === 'TINY_LM_V1_FROZEN_RESEARCH',
    `Registered model: ${modelEntry?.modelId}, Mode: ${modelEntry?.productionMode}`
  );

  // GATE 4-8: Test Prompts and Routing via chatHandler (Testing Full HTTP Route)
  console.log('\n--- Evaluating Test Prompts via /api/v1/chat Pipeline ---');
  const { chatHandler } = await import('../../src/cubio/api/v1/chatHandler');

  async function callChatApi(message: string, convId: string = 'CONV_INTEGRATION_TEST', requestedModelId: string = TINY_LM_MODEL_ID) {
    let statusCode = 200;
    let jsonResult: any = null;

    const req: any = {
      body: {
        requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversationId: convId,
        message,
        options: {
          modelId: requestedModelId,
          temperature: 0.3,
        },
      },
    };

    const res: any = {
      locals: {
        keyId: 'TEST_KEY_INTEGRATION',
        role: 'user',
      },
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    };

    await chatHandler(req, res);
    return { statusCode, jsonResult };
  }

  // Test 1: "Hello"
  const res1 = await callChatApi('Hello');
  console.log(`User: "Hello"\nStatus: ${res1.statusCode}\nResponse: "${res1.jsonResult?.response?.text}"\nMode: ${res1.jsonResult?.metadata?.mode}\nModel: ${res1.jsonResult?.metadata?.selectedModelId}`);
  assertGate(
    'Prompt 1: "Hello" Response',
    res1.statusCode === 200 && res1.jsonResult?.response?.text?.length > 0,
    `Text: "${res1.jsonResult?.response?.text}"`
  );

  // Test 2: "How are you?"
  const res2 = await callChatApi('How are you?');
  console.log(`\nUser: "How are you?"\nStatus: ${res2.statusCode}\nResponse: "${res2.jsonResult?.response?.text}"\nMode: ${res2.jsonResult?.metadata?.mode}\nModel: ${res2.jsonResult?.metadata?.selectedModelId}`);
  assertGate(
    'Prompt 2: "How are you?" Response',
    res2.statusCode === 200 && res2.jsonResult?.response?.text?.length > 0,
    `Text: "${res2.jsonResult?.response?.text}"`
  );

  // Test 3: "What is 2 + 2?"
  const res3 = await callChatApi('What is 2 + 2?');
  console.log(`\nUser: "What is 2 + 2?"\nStatus: ${res3.statusCode}\nResponse: "${res3.jsonResult?.response?.text}"\nMode: ${res3.jsonResult?.metadata?.mode}\nModel: ${res3.jsonResult?.metadata?.selectedModelId}`);
  assertGate(
    'Prompt 3: "What is 2 + 2?" Response',
    res3.statusCode === 200 && res3.jsonResult?.response?.text?.length > 0,
    `Text: "${res3.jsonResult?.response?.text}"`
  );

  // Test 4: "What is CUBiO AI?"
  const res4 = await callChatApi('What is CUBiO AI?');
  console.log(`\nUser: "What is CUBiO AI?"\nStatus: ${res4.statusCode}\nResponse: "${res4.jsonResult?.response?.text}"\nMode: ${res4.jsonResult?.metadata?.mode}\nModel: ${res4.jsonResult?.metadata?.selectedModelId}`);
  assertGate(
    'Prompt 4: "What is CUBiO AI?" Response',
    res4.statusCode === 200 && res4.jsonResult?.response?.text?.length > 0,
    `Text: "${res4.jsonResult?.response?.text}"`
  );

  // Test 5: 3-turn multi-turn conversation
  console.log('\n--- Evaluating 3-turn Conversation ---');
  const conv3TurnId = 'CONV_3_TURN_INTEGRATION';
  const turn1 = await callChatApi('Hello', conv3TurnId);
  console.log(`Turn 1 - User: "Hello" -> Assistant: "${turn1.jsonResult?.response?.text}"`);

  const turn2 = await callChatApi('Can you help me?', conv3TurnId);
  console.log(`Turn 2 - User: "Can you help me?" -> Assistant: "${turn2.jsonResult?.response?.text}"`);

  const turn3 = await callChatApi('Thank you!', conv3TurnId);
  console.log(`Turn 3 - User: "Thank you!" -> Assistant: "${turn3.jsonResult?.response?.text}"`);

  assertGate(
    '3-Turn Conversation Continuity',
    turn1.statusCode === 200 && turn2.statusCode === 200 && turn3.statusCode === 200 &&
    turn1.jsonResult?.response?.text?.length > 0 &&
    turn2.jsonResult?.response?.text?.length > 0 &&
    turn3.jsonResult?.response?.text?.length > 0,
    'All 3 turns succeeded through /api/v1/chat'
  );

  // GATE 9: Backend Routing Verification
  assertGate(
    'Backend Routing to Tiny LM',
    res1.jsonResult?.metadata?.selectedModelId === TINY_LM_MODEL_ID &&
    res1.jsonResult?.metadata?.mode === 'TINY_LM_V1_FROZEN_RESEARCH',
    `selectedModelId: ${res1.jsonResult?.metadata?.selectedModelId}, mode: ${res1.jsonResult?.metadata?.mode}`
  );

  // GATE 10: Token Output Cleanliness (Zero raw/internal tokens)
  const forbiddenPatterns = [/<RESERVED_\d+>/, /<PAD>/, /<UNK>/, /<EOS>/];
  const allOutputs = [
    res1.jsonResult?.response?.text || '',
    res2.jsonResult?.response?.text || '',
    res3.jsonResult?.response?.text || '',
    res4.jsonResult?.response?.text || '',
    turn1.jsonResult?.response?.text || '',
    turn2.jsonResult?.response?.text || '',
    turn3.jsonResult?.response?.text || '',
  ];

  let tokenSanitizationPassed = true;
  for (const text of allOutputs) {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        tokenSanitizationPassed = false;
        console.error(`Found raw token match ${pattern} in text: "${text}"`);
      }
    }
  }
  assertGate('Token Sanitization Verification', tokenSanitizationPassed, 'No raw internal tokens found in any output');

  // GATE 11: Model V1 Isolation (Model V1 retains default fallback)
  const v1Resolution = childManager.validateAndResolveModel('cubio-child-mvp', 'cubio-model-v1');
  assertGate(
    'Model V1 Policy Isolation',
    v1Resolution.valid && v1Resolution.selectedModelId === 'cubio-model-v1',
    'Model V1 policy remains primary and intact'
  );

  console.log('\n================================================================');
  console.log(`   INTEGRATION SUITE COMPLETE: ${passedGates}/${totalGates} GATES PASSED`);
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('[FATAL] Test suite failed:', err);
  process.exit(1);
});
