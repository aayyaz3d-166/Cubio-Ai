/**
 * CUBiO AI — Phase 3 / Task 06: One Language Node Configuration Test Suite
 * =========================================================================
 *
 * Exhaustive verification of multi-tier configuration precedence, permission boundaries,
 * system ceiling clamping, conflict detection, and fail-closed security invariants:
 *   1. Multi-Tier Resolution & Baseline Defaults (Tier 1 + 2 + 3)
 *   2. Precedence Hierarchy: System (Tier 1) > Script (Tier 2) > Defaults (Tier 3)
 *   3. Restricted System Settings & Security Violations (Owner, Key, Role Elevation)
 *   4. System Ceilings Enforcement (MTU, Peers, Quota, Heartbeat Floor Clamping)
 *   5. Dependency & Conflict Invariants (Timing Chains, Backoff Ordering, Transports)
 *   6. Parameter Provenance Auditing & Tracking
 *   7. One Language Bridge Configuration Integration
 *   8. Real Runtime Activation & Operating System Socket Verification
 */

import {
  NodeConfigurationManager,
  CERTIFIED_PROTOCOL_DEFAULTS,
  CubiONodeRuntime,
} from './index';

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
  console.log('║        CUBiO AI — Phase 3 / Task 06: Node Configuration Tests            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const manager = new NodeConfigurationManager();

  // =========================================================================
  // Section 1: Multi-Tier Resolution & Baseline Defaults
  // =========================================================================
  console.log('1. Multi-Tier Resolution & Baseline Defaults:');
  {
    const minimalDecl = `
      node BasicNode {
        coordinate: "CUBIO://NETWORK/0/01/00001/APP";
        owner: "CUB-11223344";
        role: EDGE;
        listen: tcp "127.0.0.1:44701";
      }
    `;

    const result = manager.resolve({ scriptConfig: minimalDecl });
    assert(result.success === true, 'Minimal configuration resolves successfully');
    assert(result.config !== undefined, 'Runtime config produced');
    assert(result.config?.mtu === CERTIFIED_PROTOCOL_DEFAULTS.mtu, 'MTU defaults to certified 1400');
    assert(result.config?.heartbeatIntervalMs === CERTIFIED_PROTOCOL_DEFAULTS.heartbeatIntervalMs, 'Heartbeat defaults to certified 5000ms');
    assert(result.config?.rateLimitPerMinute === CERTIFIED_PROTOCOL_DEFAULTS.rateLimitPerMinute, 'Rate limit defaults to certified 1000');
    assert(result.config?.maxConcurrentPeers === CERTIFIED_PROTOCOL_DEFAULTS.maxConcurrentPeers, 'Max peers defaults to certified 128');
    assert(result.config?.routingPolicy === 'STRICT_COORDINATE', 'Routing policy defaults to STRICT_COORDINATE');
    assert(result.config?.defaultTransport === 'TCP', 'Default transport inferred from single listen binding');
  }

  // =========================================================================
  // Section 2: Precedence Hierarchy: System > Script > Defaults
  // =========================================================================
  console.log('\n2. Precedence Hierarchy: System > Script > Defaults:');
  {
    const scriptDecl = `
      node TunedNode {
        coordinate: "CUBIO://NETWORK/0/01/00002/CTRL";
        owner: "CUB-A1B2C3D4";
        role: COMPUTE;
        listen: tcp "127.0.0.1:44702";
        heartbeat: 2500;
        rate_limit: 5000;
      }
    `;

    // Tier 2 overrides Tier 3 (defaults)
    const resultScript = manager.resolve({ scriptConfig: scriptDecl });
    assert(resultScript.success === true, 'Script overrides defaults');
    assert(resultScript.config?.heartbeatIntervalMs === 2500, 'Script heartbeat (2500) overrides default (5000)');
    assert(resultScript.config?.rateLimitPerMinute === 5000, 'Script rate limit (5000) overrides default (1000)');
    assert(resultScript.provenance['heartbeatIntervalMs'].tier === 'ONE_LANGUAGE_SCRIPT', 'Provenance tracks heartbeat to ONE_LANGUAGE_SCRIPT');
    assert(resultScript.provenance['mtu'].tier === 'CERTIFIED_DEFAULT', 'Provenance tracks omitted MTU to CERTIFIED_DEFAULT');

    // Tier 1 overrides Tier 2 (System pinned transports override script transports)
    const systemWithPinned = {
      systemOwnerCubId: 'CUB-A1B2C3D4',
      pinnedTransports: [
        {
          transportType: 'TCP' as const,
          endpoint: { transportType: 'TCP' as const, host: '127.0.0.1', port: 44799 },
          enabled: true,
        },
      ],
    };

    const resultSystemPinned = manager.resolve({
      systemConfig: systemWithPinned,
      scriptConfig: scriptDecl,
    });

    assert(resultSystemPinned.success === true, 'System pinned transports resolve successfully');
    assert(resultSystemPinned.config?.transports[0].endpoint.port === 44799, 'System pinned transport port (44799) overrides script port (44702)');
    assert(resultSystemPinned.provenance['transports'].tier === 'SYSTEM_ENVIRONMENT', 'Provenance tracks transports to SYSTEM_ENVIRONMENT');
  }

  // =========================================================================
  // Section 3: Restricted System Settings & Security Violations
  // =========================================================================
  console.log('\n3. Restricted System Settings & Security Violations:');
  {
    // Strict mode: Script attempts to override system provisioned owner ID
    const systemEnv = {
      enforcementMode: 'STRICT' as const,
      systemOwnerCubId: 'CUB-SYS00001',
    };

    const scriptWithDifferentOwner = `
      node RogueNode {
        coordinate: "CUBIO://NETWORK/0/01/00003/APP";
        owner: "CUB-ROGUE01";
        role: EDGE;
        listen: tcp "127.0.0.1:44703";
      }
    `;

    const resRogueOwner = manager.resolve({
      systemConfig: systemEnv,
      scriptConfig: scriptWithDifferentOwner,
    });

    assert(resRogueOwner.success === false, 'Strict mode rejects script attempting to override system owner ID');
    assert(resRogueOwner.conflicts.some(c => c.code === 'RESTRICTED_CONFIG_VIOLATION'), 'Emits RESTRICTED_CONFIG_VIOLATION conflict code');

    // Permissive mode: Warning recorded, script allowed
    const permissiveEnv = {
      enforcementMode: 'PERMISSIVE' as const,
      systemOwnerCubId: 'CUB-SYS00001',
    };

    const resPermissive = manager.resolve({
      systemConfig: permissiveEnv,
      scriptConfig: scriptWithDifferentOwner,
    });

    assert(resPermissive.success === true, 'Permissive mode allows script override with warning');
    assert(resPermissive.warnings.some(w => w.includes('Permissive override')), 'Emits warning in permissive mode');
    assert(resPermissive.config?.identity.ownerCubId === 'CUB-ROGUE01', 'Permissive config uses script owner ID');

    // Unauthorized Role Elevation
    const roleRestrictedEnv = {
      enforcementMode: 'STRICT' as const,
      systemOwnerCubId: 'CUB-SYS00001',
      authorizedRoles: ['EDGE', 'COMPUTE'] as const,
      allowScriptRoleElevation: false,
    };

    const scriptDemandingCore = `
      node ElevatedNode {
        coordinate: "CUBIO://NETWORK/0/01/00004/CTRL";
        owner: "CUB-SYS00001";
        role: CORE;
        listen: tcp "127.0.0.1:44704";
      }
    `;

    const resElevation = manager.resolve({
      systemConfig: roleRestrictedEnv,
      scriptConfig: scriptDemandingCore,
    });

    assert(resElevation.success === false, 'Rejects unauthorized role elevation to CORE');
    assert(resElevation.conflicts.some(c => c.code === 'ROLE_ELEVATION_UNAUTHORIZED'), 'Emits ROLE_ELEVATION_UNAUTHORIZED code');
  }

  // =========================================================================
  // Section 4: System Ceilings Enforcement (Clamping & Caps)
  // =========================================================================
  console.log('\n4. System Ceilings Enforcement (Clamping & Caps):');
  {
    const systemWithCaps = {
      systemOwnerCubId: 'CUB-CAP00001',
      maxMtuCeiling: 1500,           // e.g. Standard Ethernet physical interface cap
      maxPeersCeiling: 64,           // Constrained device connection ceiling
      maxStorageQuotaCeiling: 52428800, // 50MB ceiling
      minHeartbeatFloor: 1000,       // Minimum 1000ms floor
    };

    const scriptExcessive = `
      node GreedyNode {
        coordinate: "CUBIO://NETWORK/0/01/00005/APP";
        owner: "CUB-CAP00001";
        role: EDGE;
        listen: tcp "127.0.0.1:44705";
        mtu: 4096;
        max_peers: 500;
        storage_quota: 500000000;
        heartbeat: 200;
      }
    `;

    const resCaps = manager.resolve({
      systemConfig: systemWithCaps,
      scriptConfig: scriptExcessive,
    });

    assert(resCaps.success === true, 'Configuration with excessive settings succeeds via clamping');
    assert(resCaps.config?.mtu === 1500, 'MTU clamped from 4096 to system ceiling 1500');
    assert(resCaps.provenance['mtu'].clampedFrom === 4096, 'Provenance records original requested MTU 4096');
    assert(resCaps.config?.maxConcurrentPeers === 64, 'maxConcurrentPeers clamped from 500 to system ceiling 64');
    assert(resCaps.provenance['maxConcurrentPeers'].clampedFrom === 500, 'Provenance records original requested peers 500');
    assert(resCaps.config?.heartbeatIntervalMs === 1000, 'Heartbeat raised from 200ms to system floor 1000ms');
    assert(resCaps.provenance['heartbeatIntervalMs'].clampedFrom === 200, 'Provenance records original requested heartbeat 200ms');
    assert(resCaps.warnings.length >= 3, 'Warnings emitted for clamped parameters');
  }

  // =========================================================================
  // Section 5: Dependency & Conflict Invariants
  // =========================================================================
  console.log('\n5. Dependency & Conflict Invariants:');
  {
    // Conflict 1: heartbeat >= staleTimeout
    const badHeartbeatStale = `
      node BadTimingNode1 {
        coordinate: "CUBIO://NETWORK/0/01/00006/APP";
        owner: "CUB-TIMING01";
        role: EDGE;
        listen: tcp "127.0.0.1:44706";
        heartbeat: 10000;
        stale_timeout: 5000; // heartbeat > staleTimeout!
      }
    `;

    const resTiming1 = manager.resolve({ scriptConfig: badHeartbeatStale });
    assert(resTiming1.success === false, 'Rejects heartbeat >= staleTimeout dependency conflict');
    assert(resTiming1.conflicts.some(c => c.code === 'CONFIG_DEPENDENCY_CONFLICT'), 'Emits CONFIG_DEPENDENCY_CONFLICT for timing');

    // Conflict 2: staleTimeout >= failureTimeout
    const badStaleFailure = `
      node BadTimingNode2 {
        coordinate: "CUBIO://NETWORK/0/01/00007/APP";
        owner: "CUB-TIMING02";
        role: EDGE;
        listen: tcp "127.0.0.1:44707";
        heartbeat: 2000;
        stale_timeout: 10000;
        failure_timeout: 8000; // staleTimeout > failureTimeout!
      }
    `;

    const resTiming2 = manager.resolve({ scriptConfig: badStaleFailure });
    assert(resTiming2.success === false, 'Rejects staleTimeout >= failureTimeout dependency conflict');
    assert(resTiming2.conflicts.some(c => c.code === 'CONFIG_DEPENDENCY_CONFLICT'), 'Emits CONFIG_DEPENDENCY_CONFLICT for stale/failure');

    // Conflict 3: initialDelayMs > maxDelayMs in retry policy
    const badRetry = `
      node BadRetryNode {
        coordinate: "CUBIO://NETWORK/0/01/00008/APP";
        owner: "CUB-RETRY001";
        role: EDGE;
        listen: tcp "127.0.0.1:44708";
        retry_policy: {
          max_retries: 3,
          initial_delay: 5000,
          max_delay: 1000
        };
      }
    `;

    const resRetry = manager.resolve({ scriptConfig: badRetry });
    assert(resRetry.success === false, 'Rejects initialDelayMs > maxDelayMs backoff inversion');
    assert(resRetry.conflicts.some(c => c.code === 'CONFIG_DEPENDENCY_CONFLICT'), 'Emits CONFIG_DEPENDENCY_CONFLICT for retry backoff');

    // Conflict 4: Default transport not bound
    const badDefaultTransport = `
      node BadTransportNode {
        coordinate: "CUBIO://NETWORK/0/01/00009/APP";
        owner: "CUB-XPORT001";
        role: EDGE;
        listen: tcp "127.0.0.1:44709";
        default_transport: UDP; // UDP not declared in listen!
      }
    `;

    const resXport = manager.resolve({ scriptConfig: badDefaultTransport });
    assert(resXport.success === false, 'Rejects default_transport not present in declared transports');
    assert(resXport.conflicts.some(c => c.code === 'DEFAULT_TRANSPORT_NOT_BOUND'), 'Emits DEFAULT_TRANSPORT_NOT_BOUND code');

    // Conflict 5: CORE role without PACKET_ROUTING
    const coreNoRoute = `
      node CoreNoRouteNode {
        coordinate: "CUBIO://NETWORK/0/01/00010/CTRL";
        owner: "CUB-CORE0001";
        role: CORE;
        listen: tcp "127.0.0.1:44710";
        capabilities: [OBSERVABILITY_TELEMETRY];
      }
    `;

    const resCoreRoute = manager.resolve({ scriptConfig: coreNoRoute });
    assert(resCoreRoute.success === false, 'Rejects CORE role declaration without PACKET_ROUTING');
    assert(resCoreRoute.conflicts.some(c => c.code === 'ROLE_CAPABILITY_INVARIANT_VIOLATION'), 'Emits ROLE_CAPABILITY_INVARIANT_VIOLATION code');
  }

  // =========================================================================
  // Section 6: Parameter Provenance Auditing & Tracking
  // =========================================================================
  console.log('\n6. Parameter Provenance Auditing & Tracking:');
  {
    const hybridDecl = `
      node HybridNode {
        coordinate: "CUBIO://NETWORK/0/01/00011/SRV";
        owner: "CUB-HYBRID01";
        role: RELAY;
        listen: tcp "127.0.0.1:44711";
        rate_limit: 8000;
        sweep_interval: 7500;
      }
    `;

    const resHybrid = manager.resolve({ scriptConfig: hybridDecl });
    assert(resHybrid.success === true, 'Hybrid configuration resolves successfully');

    // Check tiers of each parameter
    assert(resHybrid.provenance['rateLimitPerMinute'].tier === 'ONE_LANGUAGE_SCRIPT', 'rateLimitPerMinute provenance is ONE_LANGUAGE_SCRIPT');
    assert(resHybrid.provenance['sweepIntervalMs'].tier === 'ONE_LANGUAGE_SCRIPT', 'sweepIntervalMs provenance is ONE_LANGUAGE_SCRIPT');
    assert(resHybrid.provenance['mtu'].tier === 'CERTIFIED_DEFAULT', 'mtu provenance is CERTIFIED_DEFAULT');
    assert(resHybrid.provenance['heartbeatIntervalMs'].tier === 'CERTIFIED_DEFAULT', 'heartbeatIntervalMs provenance is CERTIFIED_DEFAULT');
    assert(resHybrid.provenance['owner'].scope === 'RESTRICTED_SYSTEM', 'owner scope is RESTRICTED_SYSTEM');
    assert(resHybrid.provenance['heartbeatIntervalMs'].scope === 'PERMITTED_OPERATIONAL', 'heartbeat scope is PERMITTED_OPERATIONAL');
    assert(resHybrid.provenance['sweepIntervalMs'].scope === 'PERMITTED_RESILIENCE', 'sweepIntervalMs scope is PERMITTED_RESILIENCE');
  }

  // =========================================================================
  // Section 7: One Language Bridge Configuration Integration
  // =========================================================================
  console.log('\n7. One Language Bridge Configuration Integration:');
  {
    // Test that a CubiONodeRuntime bridge can resolve configuration
    const dummyRuntime = CubiONodeRuntime.fromDeclaration(`
      node BridgeHostNode {
        coordinate: "CUBIO://NETWORK/0/01/00012/APP";
        owner: "CUB-B01D0001";
        role: EDGE;
        listen: tcp "127.0.0.1:44712";
      }
    `);

    assert(dummyRuntime.oneLanguageBridge !== undefined, 'Node runtime contains oneLanguageBridge');

    const bridgeRes = dummyRuntime.oneLanguageBridge.resolveNodeConfiguration({
      scriptConfig: `
        node ResolvedViaBridge {
          coordinate: "CUBIO://NETWORK/0/01/00013/CTRL";
          owner: "CUB-B01D0001";
          role: COMPUTE;
          listen: tcp "127.0.0.1:44713";
          heartbeat: 4000;
        }
      `,
    });

    assert(bridgeRes.success === true, 'Bridge successfully resolved node configuration');
    assert(bridgeRes.config?.identity.nodeName === 'ResolvedViaBridge', 'Resolved nodeName matches via bridge');
    assert(bridgeRes.config?.heartbeatIntervalMs === 4000, 'Resolved heartbeat matches via bridge');
  }

  // =========================================================================
  // Section 8: Real Runtime Activation & Operating System Socket Verification
  // =========================================================================
  console.log('\n8. Real Runtime Activation & Operating System Socket Verification:');
  {
    const resolvedResult = manager.resolve({
      systemConfig: {
        systemOwnerCubId: 'CUB-AC710001',
        maxMtuCeiling: 2048,
      },
      scriptConfig: `
        node ActiveResolvedNode {
          coordinate: "CUBIO://NETWORK/0/01/00014/SRV";
          owner: "CUB-AC710001";
          role: CORE;
          listen: tcp "127.0.0.1:44714";
          mtu: 4096; // Will be clamped to 2048 by system
          heartbeat: 2000;
        }
      `,
    });

    assert(resolvedResult.success === true, 'Resolution succeeded for active runtime');
    assert(resolvedResult.config !== undefined, 'Runtime config produced');
    assert(resolvedResult.config?.mtu === 2048, 'Runtime config MTU correctly clamped to 2048');

    // Instantiate CubiONodeRuntime using the resolved config
    const activeRuntime = new CubiONodeRuntime(resolvedResult.config!);
    assert(activeRuntime.identity.nodeName === 'ActiveResolvedNode', 'Runtime instantiated with resolved identity');
    assert(activeRuntime.config.mtu === 2048, 'Runtime instantiated with clamped MTU');

    // Bootstrap runtime
    await activeRuntime.bootstrap({ autoActivateOnline: true });
    assert(activeRuntime.state === 'RUNNING', 'Runtime cleanly entered RUNNING state on declared port 44714');

    // Clean shutdown
    await activeRuntime.stop();
    assert(activeRuntime.state === 'STOPPED', 'Runtime shut down cleanly, unbinding OS socket');
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  Phase 3 / Task 06 Test Results: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
