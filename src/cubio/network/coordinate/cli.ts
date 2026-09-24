/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-NET-00: CobioNetwork CLI & Terminal Interface
 *
 * Minimal terminal/CLI command interpreter implementing:
 * - cobionetwork status
 * - cobionetwork coordinate <dim> <zone> <node> <service>
 * - cobionetwork register <uri> [name]
 * - cobionetwork lookup <uri>
 * - cobionetwork list
 *
 * Invariant: CLI uses the same core coordinate library and does NOT duplicate parsing logic.
 */

import { CubiONetworkCoordinateEngine } from './coordinate';
import { CubiONodeRegistry } from './registry';
import { CubiOLogicalRouter } from './routing';
import { createStandardTestRegistry } from './fixtures';
import { CliCommandResult, CubiONetworkNode } from './types';

export class CobioNetworkCli {
  private registry: CubiONodeRegistry;
  private router: CubiOLogicalRouter;

  constructor(registry?: CubiONodeRegistry) {
    this.registry = registry || createStandardTestRegistry();
    this.router = new CubiOLogicalRouter(this.registry);
  }

  /**
   * Executes a command string and returns structured terminal output.
   */
  public execute(commandLine: string): CliCommandResult {
    const raw = (commandLine || '').trim();
    if (!raw) {
      return {
        command: '',
        success: false,
        exitCode: 1,
        output: 'Error: Empty command provided. Type "cobionetwork help" for usage.',
      };
    }

    const parts = raw.split(/\s+/);
    let cmd = parts[0].toLowerCase();
    let args = parts.slice(1);

    // If prefixed with 'cobionetwork', strip it
    if (cmd === 'cobionetwork') {
      cmd = (args[0] || 'status').toLowerCase();
      args = args.slice(1);
    }

    switch (cmd) {
      case 'status':
        return this.status();

      case 'coordinate':
      case 'coord':
        return this.coordinate(args);

      case 'register':
      case 'reg':
        return this.register(args);

      case 'lookup':
      case 'get':
        return this.lookup(args);

      case 'list':
      case 'ls':
        return this.list();

      case 'route':
        return this.route(args);

      case 'help':
      default:
        return this.help();
    }
  }

  /**
   * cobionetwork status
   */
  public status(): CliCommandResult {
    const count = this.registry.count();
    const output = [
      '================================================================',
      'CUBiO NETWORK COORDINATE SUBSYSTEM (CNC) — STATUS',
      '================================================================',
      '• Subsystem:      ONLINE & DETERMINISTIC',
      '• Addressing:     CUBIO://NETWORK/<dimension>/<zone>/<node>/<service>',
      `• Registered:     ${count} Logical Nodes`,
      '• Logical Router: READY (Zero External Transport Dependencies)',
      '================================================================',
    ].join('\n');

    return {
      command: 'cobionetwork status',
      success: true,
      exitCode: 0,
      output,
      data: { registeredNodesCount: count, status: 'ONLINE' },
    };
  }

  /**
   * cobionetwork coordinate <dim> <zone> <node> <service>
   */
  public coordinate(args: string[]): CliCommandResult {
    if (args.length < 4) {
      return {
        command: 'cobionetwork coordinate',
        success: false,
        exitCode: 1,
        output: 'Usage: cobionetwork coordinate <dimension> <zone> <node> <service>\nExample: cobionetwork coordinate 0 1 3 INTELLIGENCE',
      };
    }

    try {
      const dim = Number(args[0]);
      const zone = Number(args[1]);
      const node = Number(args[2]);
      const service = args[3];

      const coord = CubiONetworkCoordinateEngine.create(dim, zone, node, service);
      const uri = CubiONetworkCoordinateEngine.format(coord);
      const hash = CubiONetworkCoordinateEngine.hash(coord);

      const output = [
        `Canonical URI: ${uri}`,
        `Coordinate:    [dim=${coord.dimension}, zone=${coord.zone}, node=${coord.node}, service=${coord.service}]`,
        `Address Hash:  ${hash}`,
      ].join('\n');

      return {
        command: `cobionetwork coordinate ${args.join(' ')}`,
        success: true,
        exitCode: 0,
        output,
        data: { coordinate: coord, uri, hash },
      };
    } catch (err: any) {
      return {
        command: `cobionetwork coordinate ${args.join(' ')}`,
        success: false,
        exitCode: 1,
        output: `Error formatting coordinate: ${err.message}`,
      };
    }
  }

  /**
   * cobionetwork register <uri> [nodeName]
   */
  public register(args: string[]): CliCommandResult {
    if (args.length < 1) {
      return {
        command: 'cobionetwork register',
        success: false,
        exitCode: 1,
        output: 'Usage: cobionetwork register <CUBIO_URI> [nodeName]\nExample: cobionetwork register CUBIO://NETWORK/0/01/00006/ROUTER "Core Router"',
      };
    }

    const uri = args[0];
    const nodeName = args.slice(1).join(' ') || undefined;

    try {
      const registered = this.registry.register({
        coordinate: uri,
        nodeName,
        status: 'ACTIVE',
      });

      const output = [
        'SUCCESS: Registered CubiO Network Node',
        `• URI:    ${registered.uri}`,
        `• Name:   ${registered.nodeName}`,
        `• Status: ${registered.status}`,
      ].join('\n');

      return {
        command: `cobionetwork register ${uri}`,
        success: true,
        exitCode: 0,
        output,
        data: registered,
      };
    } catch (err: any) {
      return {
        command: `cobionetwork register ${uri}`,
        success: false,
        exitCode: 1,
        output: `Error registering node: ${err.message}`,
      };
    }
  }

  /**
   * cobionetwork lookup <uri>
   */
  public lookup(args: string[]): CliCommandResult {
    if (args.length < 1) {
      return {
        command: 'cobionetwork lookup',
        success: false,
        exitCode: 1,
        output: 'Usage: cobionetwork lookup <CUBIO_URI>\nExample: cobionetwork lookup CUBIO://NETWORK/0/01/00003/INTELLIGENCE',
      };
    }

    const uri = args[0];
    const node = this.registry.lookup(uri);

    if (!node) {
      return {
        command: `cobionetwork lookup ${uri}`,
        success: false,
        exitCode: 1,
        output: `NOT FOUND: No registered node at coordinate '${uri}'.`,
      };
    }

    const output = [
      'FOUND: CubiO Network Node',
      `• Address:   ${node.uri}`,
      `• Name:      ${node.nodeName}`,
      `• Service:   ${node.service}`,
      `• Status:    ${node.status}`,
      `• Dimension: D${node.coordinate.dimension} (Zone ${node.coordinate.zone})`,
    ].join('\n');

    return {
      command: `cobionetwork lookup ${uri}`,
      success: true,
      exitCode: 0,
      output,
      data: node,
    };
  }

  /**
   * cobionetwork list
   */
  public list(): CliCommandResult {
    const nodes = this.registry.list();
    if (nodes.length === 0) {
      return {
        command: 'cobionetwork list',
        success: true,
        exitCode: 0,
        output: 'Registry is empty. 0 nodes registered.',
        data: [],
      };
    }

    const rows = nodes.map(
      (n, i) =>
        `[${(i + 1).toString().padStart(2, ' ')}] ${n.uri.padEnd(46, ' ')} | ${n.service.padEnd(12, ' ')} | ${n.status.padEnd(8, ' ')} | ${n.nodeName}`
    );

    const output = [
      '========================================================================================================',
      'INDEX  LOGICAL COORDINATE                             | SERVICE      | STATUS   | NODE NAME',
      '--------------------------------------------------------------------------------------------------------',
      ...rows,
      '========================================================================================================',
      `Total: ${nodes.length} registered nodes.`,
    ].join('\n');

    return {
      command: 'cobionetwork list',
      success: true,
      exitCode: 0,
      output,
      data: nodes,
    };
  }

  /**
   * cobionetwork route <uri>
   */
  public route(args: string[]): CliCommandResult {
    if (args.length < 1) {
      return {
        command: 'cobionetwork route',
        success: false,
        exitCode: 1,
        output: 'Usage: cobionetwork route <CUBIO_URI>',
      };
    }

    const routeResult = this.router.route(args[0]);
    if (!routeResult.success) {
      return {
        command: `cobionetwork route ${args[0]}`,
        success: false,
        exitCode: 1,
        output: `ROUTING FAILED: ${routeResult.error}`,
        data: routeResult,
      };
    }

    const output = [
      `ROUTE DISCOVERED: ${routeResult.destinationUri}`,
      `• Path:      ${routeResult.routePath.join(' → ')}`,
      `• Target:    ${routeResult.targetNode?.nodeName}`,
      `• Latency:   ~${routeResult.latencyEstimateMs} ms`,
    ].join('\n');

    return {
      command: `cobionetwork route ${args[0]}`,
      success: true,
      exitCode: 0,
      output,
      data: routeResult,
    };
  }

  public help(): CliCommandResult {
    const output = [
      'CUBiO Network Coordinate (CNC) CLI Commands:',
      '  cobionetwork status                                  - Display subsystem status',
      '  cobionetwork coordinate <dim> <zone> <node> <serv>   - Format canonical coordinate',
      '  cobionetwork register <uri> [nodeName]               - Register node in registry',
      '  cobionetwork lookup <uri>                            - Find registered node',
      '  cobionetwork list                                    - List all registered nodes',
      '  cobionetwork route <uri>                             - Resolve logical route to destination',
    ].join('\n');

    return {
      command: 'cobionetwork help',
      success: true,
      exitCode: 0,
      output,
    };
  }
}
