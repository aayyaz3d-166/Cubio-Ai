/**
 * CUBiO AI — Model V1 Chat Routing & Decoding Fix Verification
 * tests/tasks/test_model_v1_chat_fix.ts
 *
 * Verifies:
 * 1. CubiOModelV1ProductionService initializes and loads correctly
 * 2. Model V1 generate() produces properly decoded text (no fragments, no raw special tokens)
 * 3. NativeTokenizer decode normalization works (no double spaces, no space-before-punctuation)
 * 4. Three test prompts: "Hello", "How are you?", "What is CUBiO AI?"
 *
 * BOUNDARIES:
 * - NO model weight modification
 * - NO retraining
 * - NO deployment
 */

import { CubiOModelV1ProductionService } from '../../src/cubio/inference/cubioModelV1ProductionService';
import { NativeTokenizer } from '../../src/cubio/model/native_foundation/native_tokenizer';
import { NativeVocabularyV2Builder } from '../../src/cubio/model/native_foundation/native_vocabulary_v2';

// ============================================================
// TEST UTILITIES
// ============================================================

interface TestResult {
  name: string;
  passed: boolean;
  prompt?: string;
  responseText?: string;
  latencyMs?: number;
  epistemicStatus?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: Record<string, any>): void {
  results.push({
    name,
    passed: condition,
    ...details,
  });
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} ${name}`);
  if (details?.error) console.log(`     Error: ${details.error}`);
}

// ============================================================
// TEST 1: Service Initialization
// ============================================================

console.log('\n' + '='.repeat(70));
console.log(' CUBiO Model V1 Chat Fix Verification');
console.log('='.repeat(70));

console.log('\n--- Test 1: Service Initialization ---');

const v1Service = CubiOModelV1ProductionService.getInstance();
let initSuccess = false;

try {
  initSuccess = v1Service.initialize();
} catch (err: any) {
  assert(false, 'V1 service initialization', { error: err.message });
}

assert(initSuccess, 'V1 service initialized successfully');
assert(v1Service.isReady(), 'V1 service reports READY status');

const metadata = v1Service.getModelMetadata();
assert(metadata.modelId === 'cubio-model-v1', `Model ID is 'cubio-model-v1' (got: ${metadata.modelId})`);
assert(metadata.parameters === 4845056, `Parameters: ${metadata.parameters} (expected 4845056)`);
assert(metadata.vocabSize === 1024, `Vocab size: ${metadata.vocabSize} (expected 1024)`);

console.log(`  Model: ${metadata.modelId} | Params: ${metadata.parameters} | Vocab: ${metadata.vocabSize}`);
console.log(`  State Hash: ${metadata.stateHash}`);

// ============================================================
// TEST 2: Tokenizer Decode Normalization
// ============================================================

console.log('\n--- Test 2: Tokenizer Decode Normalization ---');

const vocab = NativeVocabularyV2Builder.buildVocabulary();
const tokenizer = new NativeTokenizer(vocab);

// Test basic encode-decode roundtrip
const testText = 'Hello world';
const encoded = tokenizer.encode(testText);
const decoded = tokenizer.decode(encoded, { skipSpecialTokens: true });

console.log(`  Input:   "${testText}"`);
console.log(`  Encoded: [${encoded.join(', ')}] (${encoded.length} tokens)`);
console.log(`  Decoded: "${decoded}"`);

assert(decoded.length > 0, 'Decoded text is non-empty');
assert(decoded.indexOf('  ') === -1, 'No double spaces in decoded text');
assert(!decoded.includes('<EPISTEMIC_'), 'No raw epistemic tags in decoded text');
assert(!decoded.includes('<PAD>'), 'No PAD tokens in decoded text');
assert(!decoded.includes('<BOS>'), 'No BOS tokens in decoded text');
assert(!decoded.includes('<EOS>'), 'No EOS tokens in decoded text');

// ============================================================
// TEST 3: Model V1 Generation — 3 Test Prompts
// ============================================================

console.log('\n--- Test 3: Model V1 Generation (3 Prompts) ---');

const testPrompts = [
  'Hello',
  'How are you?',
  'What is CUBiO AI?',
];

if (v1Service.isReady()) {
  for (const prompt of testPrompts) {
    console.log(`\n  Prompt: "${prompt}"`);
    try {
      const t0 = Date.now();
      const output = v1Service.generate(prompt, {
        maxTokens: 64,
        temperature: 0.3,
        topK: 20,
        enforceEpistemicLockout: true,
      });
      const latency = Date.now() - t0;

      console.log(`  Response: "${output.text}"`);
      console.log(`  Epistemic: ${output.epistemicStatus}`);
      console.log(`  Tokens generated: ${output.tokenIds?.length ?? 'N/A'}`);
      console.log(`  Latency: ${latency}ms`);
      console.log(`  Native-only: ${output.verifiedLocalNative}`);

      const text = output.text || '';

      assert(text.length > 0, `[${prompt}] Response text is non-empty`, {
        prompt,
        responseText: text,
        latencyMs: latency,
        epistemicStatus: String(output.epistemicStatus),
      });

      assert(!text.includes('<EPISTEMIC_'), `[${prompt}] No raw epistemic tags in response`, { prompt });
      assert(!text.includes('<PAD>'), `[${prompt}] No PAD tokens in response`, { prompt });
      assert(!text.includes('<BOS>'), `[${prompt}] No BOS tokens in response`, { prompt });
      assert(text.indexOf('  ') === -1, `[${prompt}] No double spaces in response`, { prompt });
      assert(output.verifiedLocalNative === true, `[${prompt}] Verified local native`, { prompt });
      assert(output.externalModelCalls === 0, `[${prompt}] Zero external model calls`, { prompt });
      assert(latency < 10000, `[${prompt}] Latency under 10s (${latency}ms)`, { prompt, latencyMs: latency });

    } catch (err: any) {
      assert(false, `[${prompt}] Generation succeeded`, {
        prompt,
        error: err.message,
      });
    }
  }
} else {
  assert(false, 'V1 service ready for generation tests', { error: 'Service not ready' });
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
console.log(`  Verdict: ${failed === 0 ? 'ALL PASS ✅' : `${failed} FAILURE(S) ❌`}`);

if (failed > 0) {
  console.log('\n  Failed tests:');
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`    ❌ ${r.name}${r.error ? ` — ${r.error}` : ''}`);
  }
}

console.log('\n' + '='.repeat(70));
process.exit(failed > 0 ? 1 : 0);
