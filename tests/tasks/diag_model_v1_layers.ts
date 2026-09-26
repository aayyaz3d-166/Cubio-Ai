import { CubiOModelV1ProductionService } from '../../src/cubio/inference/cubioModelV1ProductionService';
import { NativeVocabularyV2Builder } from '../../src/cubio/model/native_foundation/native_vocabulary_v2';
import { NativeTokenizer } from '../../src/cubio/model/native_foundation/native_tokenizer';
import * as http from 'http';

async function queryApi(prompt: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      requestId: `diag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId: `conv_diag_${Date.now()}`,
      message: prompt,
      options: {
        modelId: 'cubio-model-v1',
        temperature: 0.3,
      }
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer cubio_mvp_demo_key_2026'
      },
      timeout: 30000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(raw);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runDiagnostic() {
  console.log('=== LAYER DIAGNOSTIC START ===\n');

  // 1. Initialize CubiOModelV1ProductionService directly
  const v1Service = CubiOModelV1ProductionService.getInstance();
  const initOk = v1Service.initialize();
  const meta = v1Service.getModelMetadata();

  console.log('--- CHECKPOINT & MODEL METADATA ---');
  console.log(`Init Status: ${initOk}`);
  console.log(`Model ID: ${meta.modelId}`);
  console.log(`Params: ${meta.parameters}`);
  console.log(`Checkpoint Path: ${meta.checkpointPath}`);
  console.log(`Checkpoint SHA256: ${meta.checkpointSha256}`);
  console.log(`Verified State Hash: ${meta.stateHash}`);
  console.log(`Vocab Size: ${meta.vocabSize}\n`);

  const prompts = ["Hello", "What is 2 + 2?"];

  for (const prompt of prompts) {
    console.log(`=======================================================`);
    console.log(`PROMPT: "${prompt}"`);
    console.log(`=======================================================`);

    // LAYER 1: Direct Service Inference & Tokenizer Inspection
    console.log('\n[LAYER 1 & 2: Direct Model Inference & Token IDs]');
    const rawGen = v1Service.generate(prompt, {
      maxTokens: 64,
      temperature: 0.3,
      topK: 20,
      enforceEpistemicLockout: true,
    });

    console.log(`Raw Generated Token Count: ${rawGen.tokenIds.length}`);
    console.log(`Raw Token IDs (first 30): ${JSON.stringify(rawGen.tokenIds.slice(0, 30))}`);
    
    // Inspect token-by-token piece lookup in vocab
    const vocab = NativeVocabularyV2Builder.buildVocabulary();
    const tokenPieces = rawGen.tokenIds.slice(0, 30).map(id => {
      const piece = vocab.idToToken.get(id);
      return { id, piece: JSON.stringify(piece) };
    });
    console.log(`Token Piece Mapping (first 30):`);
    console.log(tokenPieces.map(t => `${t.id}:${t.piece}`).join(', '));

    console.log(`\n[LAYER 2: Decoded Text immediately after Model V1]`);
    console.log(`Direct Decoded Text: "${rawGen.text}"`);
    console.log(`Epistemic Status: ${rawGen.epistemicStatus}`);

    // LAYER 3: /api/v1/chat Response
    console.log('\n[LAYER 3: /api/v1/chat HTTP API Response]');
    try {
      const apiResp = await queryApi(prompt);
      const apiText = apiResp?.response?.text;
      const apiMode = apiResp?.metadata?.mode;
      const apiModelId = apiResp?.metadata?.selectedModelId;
      console.log(`API Response Status: ${apiResp?.status}`);
      console.log(`API Metadata Mode: ${apiMode}`);
      console.log(`API Selected Model ID: ${apiModelId}`);
      console.log(`API Text: "${apiText}"`);

      // LAYER 4: Frontend display logic check
      // Frontend in CubiOIntelligenceApp.tsx does:
      // if (resJson?.response?.text) { content = resJson.response.text; }
      // and passes content directly to ChatMessage.tsx which renders:
      // pre-wrap text with code block parsing
      console.log('\n[LAYER 4: Frontend Display Representation]');
      console.log(`Frontend Received Text: "${apiText}"`);
      console.log(`Matches Direct Model Output? ${apiText === rawGen.text ? 'YES (Identical text passed through)' : 'NO (Differs)'}`);
      if (apiText !== rawGen.text) {
        console.log(`API vs Direct Output Diff:`);
        console.log(`Direct: "${rawGen.text}"`);
        console.log(`API:    "${apiText}"`);
      }
    } catch (e: any) {
      console.log(`API Query Error: ${e.message}`);
    }

    console.log('\n');
  }

  console.log('=== LAYER DIAGNOSTIC END ===');
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error(err);
  process.exit(1);
});
