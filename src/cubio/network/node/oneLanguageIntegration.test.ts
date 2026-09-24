/**
 * CUBiO AI — Phase 3 / Task 04: One Language Runtime Integration Tests
 * ====================================================================
 *
 * Comprehensive integration test suite verifying the interaction between the
 * sovereign CUBiO One Language compiler/VM foundation and the persistent Node Runtime.
 *
 * Test Domains:
 *  1. Computational Lexer -> AST -> VM Node State & Telemetry Inspection
 *  2. Computational Node Control: Dynamic Service Registration & Query
 *  3. Computational Node Control: Outbound Message Dispatch
 *  4. Declarative Program: Spatial Node Lattice & Topology Configuration
 *  5. Fail-Closed Security: Lexical & Syntactic Malformed Input Containment
 *  6. Fail-Closed Safety: VM Instruction Quota & Infinite Loop Protection
 *  7. Fail-Closed Safety: Runtime Arithmetic & Recursion Limits (Zero-Eval)
 *  8. Actuation Lockout & Sandbox Security Boundary Enforcement
 *  9. End-to-End Multi-Node Real OS TCP Network Coordination via One Language
 */

import { CubiONodeRuntime } from './nodeRuntime';
import { createDefaultNodeRuntimeConfig } from './nodeRuntimeConfig';
import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { GrammarKind } from 'file:///F:/ONE%20language/src/one/router/GrammarRouter.ts';
import { INodeService } from '../protocol/v1/nodeTypes';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runAllTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 3 / Task 04: One Language Integration Tests      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // Common Node Identity
  const ownerA = 'CUB-00000001';
  const coordA = 'CUBIO://NETWORK/0/01/00001/CORE';
  const identityA = createNodeIdentity({
    nodeId: 'NODE-ONE-LANG-01',
    nodeName: 'OneLanguageCoreNode',
    ownerCubId: ownerA,
    role: 'CORE',
    coordinateUri: coordA,
  });

  const configA = createDefaultNodeRuntimeConfig(identityA, [
    {
      transportType: 'MEMORY',
      endpoint: { transportType: 'MEMORY', host: 'in-proc', port: 0, coordinateUri: coordA },
    },
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Computational Lexer -> AST -> VM Node State & Telemetry Inspection
  // ───────────────────────────────────────────────────────────────────────────
  console.log('1. Computational Lexer -> AST -> VM Node State & Telemetry Inspection:');

  const runtime1 = new CubiONodeRuntime(configA);
  await runtime1.start();
  assert(runtime1.state === 'RUNNING', 'Node runtime is RUNNING');

  const inspectionSource = `
    let id = node_get_id();
    let st = node_get_state();
    let cd = node_get_coordinate();
    let rl = node_get_role();
    let hl = node_get_health();
    let hs = node_get_health_status();
    let up = node_get_uptime();
    print(id);
    print(st);
    print(cd);
    print(rl);
    print(hl);
    print(hs);
  `;

  const inspectRes = await runtime1.executeOneLanguage(inspectionSource);
  assert(inspectRes.success === true, 'Inspection program compiled and executed successfully');
  assert(inspectRes.grammarKind === GrammarKind.COMPUTATIONAL, 'Grammar correctly routed as COMPUTATIONAL');
  assert(inspectRes.output.length === 6, `Captured 6 printed outputs (got: ${inspectRes.output.length})`);
  assert(inspectRes.output[0] === identityA.nodeId, `Captured correct node ID: ${inspectRes.output[0]}`);
  assert(inspectRes.output[1] === 'RUNNING', `Captured correct runtime state: ${inspectRes.output[1]}`);
  assert(inspectRes.output[2] === coordA, `Captured correct coordinate URI: ${inspectRes.output[2]}`);
  assert(inspectRes.output[3] === 'CORE', `Captured correct role: ${inspectRes.output[3]}`);
  assert(inspectRes.output[4] === '100', `Captured correct health score: ${inspectRes.output[4]}`);
  assert(inspectRes.output[5] === 'HEALTHY', `Captured correct health status: ${inspectRes.output[5]}`);
  assert(inspectRes.nodeActions.length >= 6, `Recorded node actions in audit log (got: ${inspectRes.nodeActions.length})`);
  assert(inspectRes.metrics.instructionsExecuted > 0, `Recorded VM instructions executed: ${inspectRes.metrics.instructionsExecuted}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Computational Node Control: Dynamic Service Registration & Query
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n2. Computational Node Control: Dynamic Service Registration & Query:');

  const serviceRegistrationSource = `
    let sId = "SERVICE_ONE_CALC";
    let sType = "CALCULATOR";
    let ok = node_register_service(sId, sType);
    let found = node_query_service(sId);
    let notFound = node_query_service("NON_EXISTENT_SERVICE");
    print(ok);
    print(found);
    print(notFound);
  `;

  const serviceRes = await runtime1.executeOneLanguage(serviceRegistrationSource);
  assert(serviceRes.success === true, 'Service registration script succeeded');
  assert(serviceRes.output[0] === 'true', 'node_register_service returned true');
  assert(serviceRes.output[1] === 'true', 'node_query_service returned true for registered service');
  assert(serviceRes.output[2] === 'false', 'node_query_service returned false for unknown service');

  // Verify directly on the runtime
  const registered = runtime1.getService('SERVICE_ONE_CALC');
  assert(registered !== undefined, 'Service exists in Node Runtime service registry');
  assert(registered?.serviceType === 'CALCULATOR', 'Service registered with correct type CALCULATOR');

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Computational Node Control: Outbound Message Dispatch
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n3. Computational Node Control: Outbound Message Dispatch:');

  const initialSent = runtime1.telemetry.packetsSent;

  const messageDispatchSource = `
    let target = "CUBIO://NETWORK/0/01/00002/EDGE";
    let msgType = "DIRECT";
    let payload = '{"greeting":"Hello from One Language VM"}';
    let dispatched = node_send_message(target, msgType, payload);
    print(dispatched);
  `;

  const dispatchRes = await runtime1.executeOneLanguage(messageDispatchSource);
  assert(dispatchRes.success === true, 'Message dispatch script succeeded');
  assert(dispatchRes.output[0] === 'true', 'node_send_message returned true');

  // Check audit action
  const sendAction = dispatchRes.nodeActions.find((a) => a.type === 'SEND_MESSAGE');
  assert(sendAction !== undefined, 'SEND_MESSAGE recorded in action history');
  assert(sendAction?.success === true, 'SEND_MESSAGE action recorded as successful');

  await runtime1.stop(false);
  assert(runtime1.state === 'STOPPED', 'Node runtime 1 cleanly stopped');

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Declarative Program: Spatial Node Lattice & Topology Configuration
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n4. Declarative Program: Spatial Node Lattice & Topology Configuration:');

  const runtimeDec = new CubiONodeRuntime(configA);
  await runtimeDec.start();

  const declarativeSource = `
    rss_max = 512;
    node OriginNode {
      @Space(0.000, 0.000, 0.000);
      align => (0.000, 0.000, 0.000);
      checkpoint origin;
    }
    node SpatialCell_001 {
      @Space(0.125, 0.250, 0.375);
      align => (0.500, 0.500, 0.500);
      checkpoint cp_001;
    }
    funnel Stream_Origin_To_Cell1 {
      stream OriginNode -> SpatialCell_001 : 16;
    }
  `;

  const decResult = await runtimeDec.executeOneLanguage(declarativeSource);
  assert(decResult.success === true, 'Declarative script parsed and evaluated successfully');
  assert(decResult.grammarKind === GrammarKind.DECLARATIVE, 'Grammar correctly routed as DECLARATIVE');
  assert(decResult.declarativeSummary !== undefined, 'Declarative summary produced');
  assert(decResult.declarativeSummary?.rssMaxLimitMB === 512, 'rss_max captured as 512 MB');
  assert(decResult.declarativeSummary?.spatialNodesCount === 2, `Captured 2 spatial nodes (got: ${decResult.declarativeSummary?.spatialNodesCount})`);
  assert(decResult.declarativeSummary?.funnelsCount === 1, `Captured 1 funnel stream (got: ${decResult.declarativeSummary?.funnelsCount})`);

  const topoAction = decResult.nodeActions.find((a) => a.type === 'APPLY_DECLARATIVE_TOPOLOGY');
  assert(topoAction !== undefined, 'APPLY_DECLARATIVE_TOPOLOGY recorded in audit history');

  await runtimeDec.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Fail-Closed Security: Lexical & Syntactic Malformed Input Containment
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n5. Fail-Closed Security: Lexical & Syntactic Malformed Input Containment:');

  const runtimeSafe = new CubiONodeRuntime(configA);
  await runtimeSafe.start();

  // Test 5A: Syntax error (unterminated or invalid grammar)
  const malformedSyntax = `let x = ;;; invalid syntax {{{`;
  const syntaxErrRes = await runtimeSafe.executeOneLanguage(malformedSyntax);
  assert(syntaxErrRes.success === false, 'Malformed syntax fails closed (success: false)');
  assert(syntaxErrRes.error !== undefined, 'Error object populated on syntactic failure');
  assert(syntaxErrRes.error?.stage === 'SYNTACTIC' || syntaxErrRes.error?.stage === 'SEMANTIC', 'Error stage is SYNTACTIC or SEMANTIC');
  assert(runtimeSafe.state === 'RUNNING', 'Node runtime remains RUNNING despite syntax error');

  // Test 5B: Semantic / Type error (calling undefined identifier)
  const undefinedVarScript = `let a = 10; let b = a + undefined_var;`;
  const semErrRes = await runtimeSafe.executeOneLanguage(undefinedVarScript);
  assert(semErrRes.success === false, 'Undefined variable fails closed (success: false)');
  assert(semErrRes.error !== undefined, 'Semantic error recorded');
  assert(runtimeSafe.state === 'RUNNING', 'Node runtime remains RUNNING despite semantic error');

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Fail-Closed Safety: VM Instruction Quota & Infinite Loop Protection
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n6. Fail-Closed Safety: VM Instruction Quota & Infinite Loop Protection:');

  // Infinite loop program
  const infiniteLoopScript = `
    let counter = 0;
    while (true) {
      counter = counter + 1;
    }
  `;

  // Default UnifiedVM instruction limit is 1,000,000; test DoS protection
  const loopRes = await runtimeSafe.executeOneLanguage(infiniteLoopScript, { timeoutMs: 3000 });
  assert(loopRes.success === false, 'Infinite loop terminated and failed closed');
  assert(loopRes.error?.code === 'E5007' || loopRes.error?.message.includes('instructions exceeded'), 'E5007 max instructions exceeded caught');
  assert(runtimeSafe.state === 'RUNNING', 'Node runtime remains healthy and RUNNING after loop termination');

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Fail-Closed Safety: Runtime Arithmetic & Recursion Limits
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n7. Fail-Closed Safety: Runtime Arithmetic & Recursion Limits:');

  // 7A: Division by zero
  const divZeroScript = `
    let num = 100;
    let zero = 0;
    let res = num / zero;
  `;
  const divRes = await runtimeSafe.executeOneLanguage(divZeroScript);
  assert(divRes.success === false, 'Division by zero fails closed');
  assert(divRes.error?.code === 'E5001' || divRes.error?.message.includes('Division by zero'), 'Caught E5001 Division by zero error');
  assert(runtimeSafe.state === 'RUNNING', 'Node runtime remains RUNNING after division by zero');

  // 7B: Deep recursion / stack overflow (MAX_CALL_DEPTH: 512)
  const stackOverflowScript = `
    function recurse(n) {
      return recurse(n + 1);
    }
    recurse(1);
  `;
  const stackRes = await runtimeSafe.executeOneLanguage(stackOverflowScript);
  assert(stackRes.success === false, 'Unbounded recursion fails closed');
  assert(stackRes.error?.code === 'E5006' || stackRes.error?.message.includes('Maximum call depth exceeded'), 'Caught E5006 Maximum call depth exceeded error');
  assert(runtimeSafe.state === 'RUNNING', 'Node runtime remains RUNNING after stack overflow attempt');

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Actuation Lockout & Sandbox Security Boundary Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n8. Actuation Lockout & Sandbox Security Boundary Enforcement:');

  // 8A: Sandbox disallowing network send
  const disallowedSendScript = `
    node_send_message("CUBIO://NETWORK/0/01/00002/CORE", "DIRECT", "{}");
  `;
  const disallowRes = await runtimeSafe.executeOneLanguage(disallowedSendScript, {
    sandboxAllowNetworkSend: false,
  });
  assert(disallowRes.success === false, 'Network send rejected when sandboxAllowNetworkSend: false');
  assert(disallowRes.error?.message.includes('ERR_SANDBOX_VIOLATION'), 'Sandbox violation error reported');

  // 8B: Sandbox disallowing service registration
  const disallowedRegScript = `
    node_register_service("BLOCKED_SRV", "TEST");
  `;
  const disallowRegRes = await runtimeSafe.executeOneLanguage(disallowedRegScript, {
    sandboxAllowServiceRegistration: false,
  });
  assert(disallowRegRes.success === false, 'Service registration rejected when sandboxAllowServiceRegistration: false');
  assert(disallowRegRes.error?.message.includes('ERR_SANDBOX_VIOLATION'), 'Sandbox violation error reported');

  // 8C: Declarative Actuation Lock enforcement
  const lockDeclarationScript = `
    @actuation_lock(true);
    node SafeOrigin {
      @Space(0.0, 0.0, 0.0);
      checkpoint lock_check;
    }
  `;
  const lockRes = await runtimeSafe.executeOneLanguage(lockDeclarationScript);
  assert(lockRes.success === true, 'Actuation lock declarative script evaluated');
  assert(runtimeSafe.oneLanguageBridge.isActuationLocked === true, 'Bridge is now under permanent actuation lock');

  // Attempt mutation while locked
  const lockedActionRes = await runtimeSafe.executeOneLanguage(disallowedSendScript);
  assert(lockedActionRes.success === false, 'Network send rejected under permanent actuation lock');
  assert(lockedActionRes.error?.message.includes('ERR_ACTUATION_LOCKED'), 'Actuation locked error reported');

  await runtimeSafe.stop(false);

  // ───────────────────────────────────────────────────────────────────────────
  // 9. End-to-End Multi-Node Real OS TCP Network Coordination via One Language
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n9. End-to-End Multi-Node Real OS TCP Network Coordination via One Language:');

  const TCP_PORT_M1 = 44410;
  const TCP_PORT_M2 = 44411;

  const nodeM1Identity = createNodeIdentity({
    nodeId: 'NODE-ONE-M1',
    nodeName: 'OneLangSender',
    ownerCubId: 'CUB-00000008',
    role: 'CORE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00008/CORE',
  });

  const nodeM2Identity = createNodeIdentity({
    nodeId: 'NODE-ONE-M2',
    nodeName: 'OneLangReceiver',
    ownerCubId: 'CUB-00000009',
    role: 'CORE',
    coordinateUri: 'CUBIO://NETWORK/0/01/00009/CORE',
  });

  const configM1 = createDefaultNodeRuntimeConfig(nodeM1Identity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: TCP_PORT_M1 },
    },
  ]);

  const configM2 = createDefaultNodeRuntimeConfig(nodeM2Identity, [
    {
      transportType: 'TCP',
      endpoint: { transportType: 'TCP', host: '127.0.0.1', port: TCP_PORT_M2 },
    },
  ]);

  const nodeM1 = new CubiONodeRuntime(configM1);
  const nodeM2 = new CubiONodeRuntime(configM2);

  await nodeM1.start();
  await nodeM2.start();

  assert(nodeM1.state === 'RUNNING', 'Node M1 (sender) is RUNNING on TCP port 44410');
  assert(nodeM2.state === 'RUNNING', 'Node M2 (receiver) is RUNNING on TCP port 44411');

  // Connect M1 to M2
  await nodeM1.connect({
    transportType: 'TCP',
    host: '127.0.0.1',
    port: TCP_PORT_M2,
    coordinateUri: nodeM2Identity.coordinateUri,
  });

  // Track inbound message delivery on Node M2
  let receivedMessageOnM2: any = null;
  const m2Service: INodeService = {
    serviceId: 'SERVICE_ONE_RECEIVER',
    serviceType: 'ONE_EXEC',
    coordinateUri: nodeM2Identity.coordinateUri,
    handleMessage: (msg) => {
      receivedMessageOnM2 = msg.payload?.body ?? msg.payload;
    },
  };
  nodeM2.registerService(m2Service);

  // Node M1 executes a One Language script that sends an activation command to Node M2
  const multiNodeScript = `
    let target = "${nodeM2Identity.coordinateUri}";
    let commandPayload = '{"action":"ACTIVATE_LATTICE","channel":777,"quantum":true}';
    let sent = node_send_message(target, "DIRECT", commandPayload);
    print(sent);
  `;

  const m1ExecRes = await nodeM1.executeOneLanguage(multiNodeScript);
  assert(m1ExecRes.success === true, 'Node M1 executed One Language coordination script');
  assert(m1ExecRes.output[0] === 'true', 'One Language script reported message sent successfully');

  // Wait for TCP packet propagation across localhost sockets
  for (let i = 0; i < 20 && !receivedMessageOnM2; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }

  assert(receivedMessageOnM2 !== null, 'Node M2 received message transmitted over real OS TCP socket');
  assert(receivedMessageOnM2?.action === 'ACTIVATE_LATTICE', 'Node M2 received correct command action: ACTIVATE_LATTICE');
  assert(receivedMessageOnM2?.channel === 777, 'Node M2 received correct channel parameter: 777');
  assert(receivedMessageOnM2?.quantum === true, 'Node M2 received correct quantum flag: true');

  await nodeM1.stop(false);
  await nodeM2.stop(false);

  assert(nodeM1.state === 'STOPPED', 'Node M1 cleanly shut down');
  assert(nodeM2.state === 'STOPPED', 'Node M2 cleanly shut down');

  // ───────────────────────────────────────────────────────────────────────────
  // Summary
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 04 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.error('Failed test assertions:');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
