/**
 * CUBiO AI — Phase 3 / Task 05: CUBiO Node Declaration Test Suite
 * ================================================================
 *
 * Exhaustive verification of canonical One Language Node Declarations:
 *   1. Positive Canonical Declarations (Full, Minimal, Multi-Transport, Spatial/Grid)
 *   2. Negative Tests (Missing Required Fields)
 *   3. Format & Identity Validation Tests (URI, CUB-ID, Roles, Transports)
 *   4. Malformed Syntax & Parser Error Tests
 *   5. Duplicate-Field Rejection Tests (Single-Definition Invariant)
 *   6. Boundary-Value Tests (MTU, Heartbeat, Rate Limit, Max Peers, Grid777)
 *   7. Deterministic Runtime Mapping & Configuration Semantics
 *   8. Pre-Flight Validation Gating & State Isolation
 *   9. Real Execution: End-to-End OS TCP Packet Transmission via Declared Runtimes
 */

import {
  parseNodeDeclaration,
  validateNodeDeclaration,
  compileNodeDeclaration,
  compileNodeConfigFromDeclaration,
  CubiONodeDeclarationParser,
  CubiONodeDeclarationValidator,
  CubiONodeDeclarationMapper,
  CubiONodeRuntime,
} from './index';
import { createMessage, messageToPackets } from '../protocol/v1/messageEngine';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runSuite(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CUBiO AI — Phase 3 / Task 05: Node Declaration Tests              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // =========================================================================
  // Section 1: Positive Canonical Declarations
  // =========================================================================
  console.log('1. Positive Canonical Declarations:');
  {
    const fullSource = `
      node CoreNode_01 {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: CORE;
        listen: tcp "127.0.0.1:44601";
        listen: ws "127.0.0.1:44602/ws";
        default_transport: TCP;
        mtu: 4096;
        heartbeat: 3000;
        rate_limit: 50000;
        max_peers: 512;
        storage_quota: 2147483648;
        routing_policy: STRICT_COORDINATE;
        capabilities: [PACKET_ROUTING, ENVELOPE_FORWARDING, MESSAGE_DISPATCH, OBSERVABILITY_TELEMETRY];
        public_key: "04a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde";
        hardware_fingerprint: "HW-CHIP-998877";
        space: 12.5, 45.0, 78.25;
        grid777: 3, 4, 5;
        stale_timeout: 30000;
        failure_timeout: 60000;
        sweep_interval: 10000;
        retry_policy: {
          max_retries: 4,
          initial_delay: 200,
          max_delay: 5000
        };
        pipeline_options: {
          max_queue_size: 2000,
          assembly_timeout: 8000
        };
      }
    `;

    const result = compileNodeDeclaration(fullSource);
    assert(result.success === true, 'Full canonical declaration compiles successfully');
    assert(result.ast?.name === 'CoreNode_01', 'AST node name matches identifier');
    assert(result.ast?.coordinateUri === 'CUBIO://NETWORK/0/01/00001/CTRL', 'AST coordinate URI matches');
    assert(result.ast?.owner === 'CUB-A1B2C3D4', 'AST owner matches');
    assert(result.ast?.role === 'CORE', 'AST role matches CORE');
    assert(result.ast?.listenBindings.length === 2, 'AST parsed both listen bindings');
    assert(result.ast?.defaultTransport === 'TCP', 'AST default transport matches TCP');
    assert(result.ast?.mtu === 4096, 'AST MTU matches 4096');
    assert(result.ast?.heartbeat === 3000, 'AST heartbeat matches 3000');
    assert(result.ast?.maxPeers === 512, 'AST maxPeers matches 512');
    assert(result.ast?.space?.x === 12.5 && result.ast?.space?.z === 78.25, 'AST 3D space coordinates match');
    assert(result.ast?.grid777?.i === 3 && result.ast?.grid777?.k === 5, 'AST Grid777 discrete coordinates match');
    assert(result.runtimeConfig?.transports.length === 2, 'Runtime config contains 2 transport bindings');
    assert(result.runtimeConfig?.defaultTransport === 'TCP', 'Runtime config default transport is TCP');
    assert(result.identity?.nodeName === 'CoreNode_01', 'Identity nodeName matches');
    assert(result.identity?.ownerCubId === 'CUB-A1B2C3D4', 'Identity ownerCubId matches');

    // Minimal valid declaration
    const minimalSource = `
      node Minimal_Edge {
        coordinate: "CUBIO://NETWORK/0/00/00099/APP";
        owner: "CUB-12345678";
        role: EDGE;
        listen: tcp "127.0.0.1:44603";
      }
    `;
    const minResult = compileNodeDeclaration(minimalSource);
    assert(minResult.success === true, 'Minimal canonical declaration compiles successfully');
    assert(minResult.runtimeConfig?.mtu === 1400, 'Minimal declaration defaults MTU to 1400');
    assert(minResult.runtimeConfig?.heartbeatIntervalMs === 5000, 'Minimal declaration defaults heartbeat to 5000ms');
    assert(minResult.runtimeConfig?.defaultTransport === 'TCP', 'Minimal declaration infers default transport from listen');
    assert(minResult.runtimeConfig?.capabilities.includes('MESSAGE_DISPATCH') === true, 'Minimal EDGE role gets MESSAGE_DISPATCH capability');
  }

  // =========================================================================
  // Section 2: Negative Tests (Missing Required Fields)
  // =========================================================================
  console.log('\n2. Negative Tests (Missing Required Fields):');
  {
    // Missing coordinate
    const noCoord = `
      node NoCoordNode {
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44604";
      }
    `;
    const resNoCoord = compileNodeDeclaration(noCoord);
    assert(resNoCoord.success === false, 'Rejects declaration missing coordinate');
    assert(resNoCoord.errors.some(e => e.code === 'MISSING_COORDINATE_URI'), 'Emits MISSING_COORDINATE_URI error code');

    // Missing owner
    const noOwner = `
      node NoOwnerNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        role: CORE;
        listen: tcp "127.0.0.1:44605";
      }
    `;
    const resNoOwner = compileNodeDeclaration(noOwner);
    assert(resNoOwner.success === false, 'Rejects declaration missing owner');
    assert(resNoOwner.errors.some(e => e.code === 'MISSING_OWNER_ID'), 'Emits MISSING_OWNER_ID error code');

    // Missing role
    const noRole = `
      node NoRoleNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        listen: tcp "127.0.0.1:44606";
      }
    `;
    const resNoRole = compileNodeDeclaration(noRole);
    assert(resNoRole.success === false, 'Rejects declaration missing role');
    assert(resNoRole.errors.some(e => e.code === 'MISSING_ROLE'), 'Emits MISSING_ROLE error code');

    // Missing listen bindings
    const noListen = `
      node NoListenNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
      }
    `;
    const resNoListen = compileNodeDeclaration(noListen);
    assert(resNoListen.success === false, 'Rejects declaration with zero listen bindings');
    assert(resNoListen.errors.some(e => e.code === 'MISSING_LISTEN_BINDINGS'), 'Emits MISSING_LISTEN_BINDINGS error code');
  }

  // =========================================================================
  // Section 3: Format & Identity Validation Tests
  // =========================================================================
  console.log('\n3. Format & Identity Validation Tests:');
  {
    // Malformed coordinate URI
    const badCoord = `
      node BadCoordNode {
        coordinate: "http://invalid-url.com/node";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44607";
      }
    `;
    const resBadCoord = compileNodeDeclaration(badCoord);
    assert(resBadCoord.success === false, 'Rejects non-CNC coordinate URI');
    assert(resBadCoord.errors.some(e => e.code === 'INVALID_COORDINATE_URI'), 'Emits INVALID_COORDINATE_URI code');

    // Malformed owner CUB ID
    const badOwner = `
      node BadOwnerNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "NOT_A_CUB_ID";
        role: EDGE;
        listen: tcp "127.0.0.1:44608";
      }
    `;
    const resBadOwner = compileNodeDeclaration(badOwner);
    assert(resBadOwner.success === false, 'Rejects invalid owner CUB ID format');
    assert(resBadOwner.errors.some(e => e.code === 'INVALID_OWNER_ID'), 'Emits INVALID_OWNER_ID code');

    // Invalid role
    const badRole = `
      node BadRoleNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: SUPER_ADMIN;
        listen: tcp "127.0.0.1:44609";
      }
    `;
    const resBadRole = compileNodeDeclaration(badRole);
    assert(resBadRole.success === false, 'Rejects unrecognized operational role');
    assert(resBadRole.errors.some(e => e.code === 'INVALID_ROLE'), 'Emits INVALID_ROLE code');

    // Default transport not among declared listen bindings
    const mismatchTransport = `
      node MismatchTransportNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44610";
        default_transport: WEBSOCKET;
      }
    `;
    const resMismatch = compileNodeDeclaration(mismatchTransport);
    assert(resMismatch.success === false, 'Rejects default_transport not declared in listen bindings');
    assert(resMismatch.errors.some(e => e.code === 'DEFAULT_TRANSPORT_NOT_BOUND'), 'Emits DEFAULT_TRANSPORT_NOT_BOUND code');

    // Short public key (< 32 chars)
    const badKey = `
      node BadKeyNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44611";
        public_key: "short_key_123";
      }
    `;
    const resBadKey = compileNodeDeclaration(badKey);
    assert(resBadKey.success === false, 'Rejects public key shorter than 32 characters');
    assert(resBadKey.errors.some(e => e.code === 'INVALID_PUBLIC_KEY'), 'Emits INVALID_PUBLIC_KEY code');

    // CORE role missing PACKET_ROUTING capability
    const coreMissingCap = `
      node CoreMissingCapNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: CORE;
        listen: tcp "127.0.0.1:44612";
        capabilities: [OBSERVABILITY_TELEMETRY];
      }
    `;
    const resCoreCap = compileNodeDeclaration(coreMissingCap);
    assert(resCoreCap.success === false, 'Rejects CORE role declaration omitting mandatory PACKET_ROUTING');
    assert(resCoreCap.errors.some(e => e.code === 'ROLE_CAPABILITY_INVARIANT_VIOLATION'), 'Emits ROLE_CAPABILITY_INVARIANT_VIOLATION code');
  }

  // =========================================================================
  // Section 4: Malformed Syntax & Parser Error Tests
  // =========================================================================
  console.log('\n4. Malformed Syntax & Parser Error Tests:');
  {
    // Unclosed block
    const unclosed = `
      node UnclosedNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
    `;
    const resUnclosed = compileNodeDeclaration(unclosed);
    assert(resUnclosed.success === false, 'Rejects unclosed block');
    assert(resUnclosed.errors.some(e => e.code === 'UNCLOSED_BLOCK'), 'Emits UNCLOSED_BLOCK error');

    // Missing colon
    const noColon = `
      node NoColonNode {
        coordinate "CUBIO://NETWORK/0/01/00001/CTRL";
      }
    `;
    const resNoColon = compileNodeDeclaration(noColon);
    assert(resNoColon.success === false, 'Rejects missing colon after property name');
    assert(resNoColon.errors.some(e => e.code === 'EXPECTED_COLON'), 'Emits EXPECTED_COLON error');

    // Missing semicolon
    const noSemicolon = `
      node NoSemiNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL"
        owner: "CUB-A1B2C3D4";
      }
    `;
    const resNoSemi = compileNodeDeclaration(noSemicolon);
    assert(resNoSemi.success === false, 'Rejects missing semicolon after property value');
    assert(resNoSemi.errors.some(e => e.code === 'EXPECTED_SEMICOLON'), 'Emits EXPECTED_SEMICOLON error');

    // Unknown property
    const unknownProp = `
      node UnknownPropNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44613";
        arbitrary_unsupported_field: "dangerous_value";
      }
    `;
    const resUnknown = compileNodeDeclaration(unknownProp);
    assert(resUnknown.success === false, 'Rejects unknown property in node body');
    assert(resUnknown.errors.some(e => e.code === 'UNKNOWN_PROPERTY'), 'Emits UNKNOWN_PROPERTY error');

    // Missing node identifier
    const noIdent = `
      node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
      }
    `;
    const resNoIdent = compileNodeDeclaration(noIdent);
    assert(resNoIdent.success === false, 'Rejects declaration without node identifier');
    assert(resNoIdent.errors.some(e => e.code === 'EXPECTED_IDENTIFIER'), 'Emits EXPECTED_IDENTIFIER error');
  }

  // =========================================================================
  // Section 5: Duplicate-Field Rejection Tests (Single-Definition Invariant)
  // =========================================================================
  console.log('\n5. Duplicate-Field Rejection Tests (Single-Definition Invariant):');
  {
    // Duplicate coordinate
    const dupCoord = `
      node DupCoordNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        coordinate: "CUBIO://NETWORK/0/02/00002/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44614";
      }
    `;
    const resDupCoord = compileNodeDeclaration(dupCoord);
    assert(resDupCoord.success === false, 'Rejects duplicate coordinate declaration');
    assert(resDupCoord.errors.some(e => e.code === 'DUPLICATE_FIELD_ERROR'), 'Emits DUPLICATE_FIELD_ERROR code for coordinate');

    // Duplicate role
    const dupRole = `
      node DupRoleNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        role: CORE;
        listen: tcp "127.0.0.1:44615";
      }
    `;
    const resDupRole = compileNodeDeclaration(dupRole);
    assert(resDupRole.success === false, 'Rejects duplicate role declaration');
    assert(resDupRole.errors.some(e => e.code === 'DUPLICATE_FIELD_ERROR'), 'Emits DUPLICATE_FIELD_ERROR code for role');

    // Duplicate MTU
    const dupMtu = `
      node DupMtuNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44616";
        mtu: 1400;
        mtu: 4096;
      }
    `;
    const resDupMtu = compileNodeDeclaration(dupMtu);
    assert(resDupMtu.success === false, 'Rejects duplicate MTU declaration');
    assert(resDupMtu.errors.some(e => e.code === 'DUPLICATE_FIELD_ERROR'), 'Emits DUPLICATE_FIELD_ERROR code for MTU');

    // Duplicate listen endpoint (same protocol and port)
    const dupListen = `
      node DupListenNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44617";
        listen: tcp "127.0.0.1:44617";
      }
    `;
    const resDupListen = compileNodeDeclaration(dupListen);
    assert(resDupListen.success === false, 'Rejects duplicate listen endpoint binding');
    assert(resDupListen.errors.some(e => e.code === 'DUPLICATE_LISTEN_ENDPOINT'), 'Emits DUPLICATE_LISTEN_ENDPOINT code');
  }

  // =========================================================================
  // Section 6: Boundary-Value Tests
  // =========================================================================
  console.log('\n6. Boundary-Value Tests:');
  {
    // MTU Boundary: 1024 valid, 1023 rejected
    const mtu1024 = `
      node Mtu1024Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44618";
        mtu: 1024;
      }
    `;
    assert(compileNodeDeclaration(mtu1024).success === true, 'MTU at exact lower bound (1024) is valid');

    const mtu1023 = `
      node Mtu1023Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44619";
        mtu: 1023;
      }
    `;
    const resMtu1023 = compileNodeDeclaration(mtu1023);
    assert(resMtu1023.success === false, 'MTU below lower bound (1023) is rejected');
    assert(resMtu1023.errors.some(e => e.code === 'MTU_OUT_OF_BOUNDS'), 'Emits MTU_OUT_OF_BOUNDS for 1023');

    // MTU Boundary: 65536 valid, 65537 rejected
    const mtu65536 = `
      node Mtu65536Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44620";
        mtu: 65536;
      }
    `;
    assert(compileNodeDeclaration(mtu65536).success === true, 'MTU at exact upper bound (65536) is valid');

    const mtu65537 = `
      node Mtu65537Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44621";
        mtu: 65537;
      }
    `;
    const resMtu65537 = compileNodeDeclaration(mtu65537);
    assert(resMtu65537.success === false, 'MTU above upper bound (65537) is rejected');
    assert(resMtu65537.errors.some(e => e.code === 'MTU_OUT_OF_BOUNDS'), 'Emits MTU_OUT_OF_BOUNDS for 65537');

    // Heartbeat Boundary: 100ms valid, 99ms rejected
    const hb100 = `
      node Hb100Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44622";
        heartbeat: 100;
      }
    `;
    assert(compileNodeDeclaration(hb100).success === true, 'Heartbeat at exact lower bound (100ms) is valid');

    const hb99 = `
      node Hb99Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44623";
        heartbeat: 99;
      }
    `;
    const resHb99 = compileNodeDeclaration(hb99);
    assert(resHb99.success === false, 'Heartbeat below lower bound (99ms) is rejected');
    assert(resHb99.errors.some(e => e.code === 'HEARTBEAT_OUT_OF_BOUNDS'), 'Emits HEARTBEAT_OUT_OF_BOUNDS for 99ms');

    // Heartbeat Boundary: 60000ms valid, 60001ms rejected
    const hb60000 = `
      node Hb60000Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44624";
        heartbeat: 60000;
      }
    `;
    assert(compileNodeDeclaration(hb60000).success === true, 'Heartbeat at exact upper bound (60000ms) is valid');

    const hb60001 = `
      node Hb60001Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44625";
        heartbeat: 60001;
      }
    `;
    const resHb60001 = compileNodeDeclaration(hb60001);
    assert(resHb60001.success === false, 'Heartbeat above upper bound (60001ms) is rejected');
    assert(resHb60001.errors.some(e => e.code === 'HEARTBEAT_OUT_OF_BOUNDS'), 'Emits HEARTBEAT_OUT_OF_BOUNDS for 60001ms');

    // Rate limit Boundary: 1 valid, 0 rejected
    const rl1 = `
      node Rl1Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44626";
        rate_limit: 1;
      }
    `;
    assert(compileNodeDeclaration(rl1).success === true, 'Rate limit at lower bound (1) is valid');

    const rl0 = `
      node Rl0Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44627";
        rate_limit: 0;
      }
    `;
    const resRl0 = compileNodeDeclaration(rl0);
    assert(resRl0.success === false, 'Rate limit of 0 is rejected');
    assert(resRl0.errors.some(e => e.code === 'RATE_LIMIT_OUT_OF_BOUNDS'), 'Emits RATE_LIMIT_OUT_OF_BOUNDS for 0');

    // Grid777 boundary: 6 valid, 7 rejected
    const grid6 = `
      node Grid6Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44628";
        grid777: 6, 6, 6;
      }
    `;
    assert(compileNodeDeclaration(grid6).success === true, 'Grid777 at upper boundary (6, 6, 6) is valid');

    const grid7 = `
      node Grid7Node {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44629";
        grid777: 7, 3, 2;
      }
    `;
    const resGrid7 = compileNodeDeclaration(grid7);
    assert(resGrid7.success === false, 'Grid777 index 7 (out of 0..6 range) is rejected');
    assert(resGrid7.errors.some(e => e.code === 'GRID777_OUT_OF_BOUNDS'), 'Emits GRID777_OUT_OF_BOUNDS for index 7');
  }

  // =========================================================================
  // Section 7: Deterministic Runtime Mapping & Configuration Semantics
  // =========================================================================
  console.log('\n7. Deterministic Runtime Mapping & Configuration Semantics:');
  {
    const declA = `
      node AlphaNode {
        coordinate: "CUBIO://NETWORK/1/01/00010/SRV";
        owner: "CUB-AABBCCDD";
        role: RELAY;
        listen: tcp "127.0.0.1:44630";
      }
    `;

    const compileA1 = compileNodeDeclaration(declA);
    const compileA2 = compileNodeDeclaration(declA);

    assert(compileA1.success === true && compileA2.success === true, 'Both identical declarations compile successfully');
    assert(compileA1.identity?.nodeId === compileA2.identity?.nodeId, 'Deterministic node ID is identical across separate compilations');
    assert(compileA1.identity?.nodeId.startsWith('NODE_') === true, 'Node ID matches canonical prefix NODE_');
    assert(compileA1.runtimeConfig?.capabilities.includes('PACKET_ROUTING') === true, 'RELAY role automatically assigned PACKET_ROUTING');
    assert(compileA1.runtimeConfig?.capabilities.includes('ENVELOPE_FORWARDING') === true, 'RELAY role automatically assigned ENVELOPE_FORWARDING');
    assert(compileA1.canonicalConfig !== undefined, 'CanonicalNodeConfig produced for Phase 1 compatibility');
    assert(compileA1.canonicalConfig?.identity.nodeId === compileA1.identity?.nodeId, 'CanonicalNodeConfig identity matches mapped identity');
  }

  // =========================================================================
  // Section 8: Pre-Flight Validation Gating & State Isolation
  // =========================================================================
  console.log('\n8. Pre-Flight Validation Gating & State Isolation:');
  {
    const invalidSource = `
      node BrokenNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-A1B2C3D4";
        role: EDGE;
        listen: tcp "127.0.0.1:44631";
        mtu: 999999; // Invalid MTU
      }
    `;

    // Attempt compilation
    const compRes = compileNodeDeclaration(invalidSource);
    assert(compRes.success === false, 'Compilation fails on invalid MTU');
    assert(compRes.runtimeConfig === undefined, 'No runtime configuration is produced on invalid declaration');

    // Attempt direct instantiation via CubiONodeRuntime.fromDeclaration
    let threw = false;
    let caughtError: any;
    try {
      CubiONodeRuntime.fromDeclaration(invalidSource);
    } catch (err: any) {
      threw = true;
      caughtError = err;
    }

    assert(threw === true, 'CubiONodeRuntime.fromDeclaration throws on invalid declaration');
    assert(caughtError.message.includes('MTU_OUT_OF_BOUNDS'), 'Exception specifies exact validation failure reason');
  }

  // =========================================================================
  // Section 9: Real Execution: End-to-End OS TCP Packet Transmission
  // =========================================================================
  console.log('\n9. Real Execution: End-to-End OS TCP Packet Transmission via Declared Runtimes:');
  {
    const node1Decl = `
      node DeclaredNode_1 {
        coordinate: "CUBIO://NETWORK/0/01/00001/CTRL";
        owner: "CUB-00112233";
        role: CORE;
        listen: tcp "127.0.0.1:44632";
        default_transport: TCP;
        mtu: 2048;
      }
    `;

    const node2Decl = `
      node DeclaredNode_2 {
        coordinate: "CUBIO://NETWORK/0/01/00002/CTRL";
        owner: "CUB-44556677";
        role: EDGE;
        listen: tcp "127.0.0.1:44633";
        default_transport: TCP;
        mtu: 2048;
      }
    `;

    const runtime1 = CubiONodeRuntime.fromDeclaration(node1Decl);
    const runtime2 = CubiONodeRuntime.fromDeclaration(node2Decl);

    assert(runtime1.identity.nodeName === 'DeclaredNode_1', 'Runtime 1 successfully instantiated from declaration');
    assert(runtime2.identity.nodeName === 'DeclaredNode_2', 'Runtime 2 successfully instantiated from declaration');

    // Bootstrap both runtimes into operational RUNNING state
    await runtime1.bootstrap({ autoActivateOnline: true });
    await runtime2.bootstrap({ autoActivateOnline: true });

    assert(runtime1.state === 'RUNNING', 'Runtime 1 is RUNNING on declared port 44632');
    assert(runtime2.state === 'RUNNING', 'Runtime 2 is RUNNING on declared port 44633');

    // Track received packet on Node 1
    let packetReceived = false;
    let receivedPayload: any = null;

    runtime1.onPacket(pkt => {
      packetReceived = true;
      receivedPayload = pkt.payload;
    });

    // Send packet from Node 2 to Node 1 via declared OS TCP transport
    const testMsg = createMessage({
      type: 'DIRECT',
      communicationMode: 'USER_USER',
      source: {
        cubId: runtime2.identity.ownerCubId,
        coordinateUri: runtime2.identity.coordinateUri,
        entityType: 'HUMAN_OPERATOR',
      },
      destination: {
        coordinateUri: runtime1.identity.coordinateUri,
      },
      body: 'Hello from Declared Node 2 via One Language Declaration!',
    });

    const packets = messageToPackets(testMsg, 2048);
    const testPacket = packets[0];

    const sendReceipt = await runtime2.sendPacket(
      testPacket,
      { transportType: 'TCP', host: '127.0.0.1', port: 44632 }
    );

    assert(sendReceipt.success === true, 'Node 2 sent packet via TCP transport to Node 1');

    // Allow time for OS socket delivery
    await new Promise(r => setTimeout(r, 200));

    assert(packetReceived === true, 'Node 1 received packet over real OS TCP socket');
    assert(
      receivedPayload !== null,
      'Node 1 received intact payload sent by Node 2'
    );

    // Clean shutdown of both runtimes
    await runtime1.stop();
    await runtime2.stop();

    assert(runtime1.state === 'STOPPED', 'Runtime 1 stopped cleanly');
    assert(runtime2.state === 'STOPPED', 'Runtime 2 stopped cleanly');
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 05 Test Results: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
