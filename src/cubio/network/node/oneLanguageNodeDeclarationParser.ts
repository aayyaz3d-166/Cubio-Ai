/**
 * CUBiO AI — Phase 3 / Task 05: One Language Node Declaration Parser
 * ===================================================================
 *
 * Deterministic recursive-descent parser for canonical CUBiO Node Declarations
 * in One Language syntax (`node <Name> { ... }`).
 *
 * Enforces:
 *   - Strict syntax validity
 *   - Duplicate field rejection (single-definition invariant for scalar properties)
 *   - Multi-transport listen endpoint collection
 *   - Line and column tracking for all parsed elements
 */

import { OneLexer, Token, TokenType } from 'file:///F:/ONE%20language/src/one/oneLexer.ts';
import {
  type CubiONodeDeclarationAST,
  type NodeDeclarationListenBindingAST,
  type NodeDeclarationSourceLocation,
  type NodeDeclarationRetryPolicyAST,
  type NodeDeclarationPipelineOptionsAST,
} from './oneLanguageNodeDeclarationTypes';
import { type NodeRole, type NodeCapability } from '../protocol/v1/nodeTypes';
import { type TransportType } from '../transport/types';

export class NodeDeclarationParseError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly code: string;

  constructor(message: string, line: number, column: number, code: string = 'SYNTAX_ERROR') {
    super(`[NodeDeclarationParser Error at ${line}:${column}] ${message}`);
    this.name = 'NodeDeclarationParseError';
    this.line = line;
    this.column = column;
    this.code = code;
  }
}

export class CubiONodeDeclarationParser {
  private tokens: Token[] = [];
  private current: number = 0;

  /**
   * Parses source text into a CubiONodeDeclarationAST.
   */
  public parse(source: string): CubiONodeDeclarationAST {
    const lexer = new OneLexer(source);
    this.tokens = lexer.tokenize();
    this.current = 0;

    // Skip any leading comments or whitespace tokens (OneLexer handles whitespace, comments are skipped)
    this.skipSemicolons();

    if (this.isAtEnd()) {
      throw new NodeDeclarationParseError('Source is empty or contains no node declaration', 1, 1, 'EMPTY_SOURCE');
    }

    return this.parseNode();
  }

  private parseNode(): CubiONodeDeclarationAST {
    // 1. Must start with 'node'
    if (!this.match(TokenType.KEYWORD_NODE)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected 'node' keyword at start of declaration, found '${token.value}'`,
        token.line,
        token.column,
        'EXPECTED_NODE_KEYWORD'
      );
    }

    // 2. Node Identifier
    if (!this.check(TokenType.IDENTIFIER)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected node identifier after 'node', found '${token.value}'`,
        token.line,
        token.column,
        'EXPECTED_IDENTIFIER'
      );
    }
    const nameToken = this.advance();
    const name = nameToken.value;
    const nameLocation: NodeDeclarationSourceLocation = { line: nameToken.line, column: nameToken.column };

    // 3. Opening Brace '{'
    if (!this.match(TokenType.LBRACE)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected '{' to open node declaration body, found '${token.value}'`,
        token.line,
        token.column,
        'EXPECTED_OPEN_BRACE'
      );
    }

    // State tracking for duplicate detection
    const declaredFields = new Map<string, NodeDeclarationSourceLocation>();
    const declaredPropertiesList: string[] = [];

    // Fields to populate
    let coordinateUri: string | undefined = undefined;
    let coordinateLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let owner: string | undefined = undefined;
    let ownerLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let role: NodeRole | undefined = undefined;
    let roleLocation: NodeDeclarationSourceLocation | undefined = undefined;

    const listenBindings: NodeDeclarationListenBindingAST[] = [];

    let defaultTransport: TransportType | undefined = undefined;
    let defaultTransportLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let mtu: number | undefined = undefined;
    let mtuLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let heartbeat: number | undefined = undefined;
    let heartbeatLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let rateLimit: number | undefined = undefined;
    let rateLimitLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let maxPeers: number | undefined = undefined;
    let maxPeersLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let storageQuota: number | undefined = undefined;
    let storageQuotaLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let routingPolicy: 'STRICT_COORDINATE' | 'DIRECT_ONLY' | undefined = undefined;
    let routingPolicyLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let capabilities: NodeCapability[] | undefined = undefined;
    let capabilitiesLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let publicKey: string | undefined = undefined;
    let publicKeyLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let hardwareFingerprint: string | undefined = undefined;
    let hardwareFingerprintLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let space: { x: number; y: number; z: number } | undefined = undefined;
    let spaceLocation: NodeDeclarationSourceLocation | undefined = undefined;

    let grid777: { i: number; j: number; k: number } | undefined = undefined;
    let grid777Location: NodeDeclarationSourceLocation | undefined = undefined;

    let staleTimeoutMs: number | undefined = undefined;
    let failureTimeoutMs: number | undefined = undefined;
    let sweepIntervalMs: number | undefined = undefined;
    let retryPolicy: NodeDeclarationRetryPolicyAST | undefined = undefined;
    let pipelineOptions: NodeDeclarationPipelineOptionsAST | undefined = undefined;

    // Helper to enforce single-definition invariant
    const assertNotDuplicate = (fieldName: string, loc: NodeDeclarationSourceLocation) => {
      if (declaredFields.has(fieldName)) {
        const prev = declaredFields.get(fieldName)!;
        throw new NodeDeclarationParseError(
          `Duplicate declaration of field '${fieldName}' (previously declared at line ${prev.line}, column ${prev.column})`,
          loc.line,
          loc.column,
          'DUPLICATE_FIELD_ERROR'
        );
      }
      declaredFields.set(fieldName, loc);
      declaredPropertiesList.push(fieldName);
    };

    // 4. Parse properties until closing '}'
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Allow extra semicolons between statements
      if (this.match(TokenType.SEMICOLON)) {
        continue;
      }

      // Property key can be an identifier or keyword like 'role', 'mtu', etc.
      const keyToken = this.peek();
      const loc: NodeDeclarationSourceLocation = { line: keyToken.line, column: keyToken.column };

      // Normal property: <key> : <value> ;
      const keyName = this.parsePropertyName();

      // Expect COLON ':'
      if (!this.match(TokenType.COLON)) {
        const errTok = this.peek();
        throw new NodeDeclarationParseError(
          `Expected ':' after property name '${keyName}', found '${errTok.value}'`,
          errTok.line,
          errTok.column,
          'EXPECTED_COLON'
        );
      }

      switch (keyName.toLowerCase()) {
        case 'coordinate':
        case 'coordinate_uri': {
          assertNotDuplicate('coordinate', loc);
          coordinateLocation = loc;
          coordinateUri = this.consumeString('Expected string literal for coordinate URI');
          this.consumeSemicolon();
          break;
        }

        case 'owner':
        case 'owner_id':
        case 'owner_cub_id': {
          assertNotDuplicate('owner', loc);
          ownerLocation = loc;
          owner = this.consumeString('Expected string literal for owner ID');
          this.consumeSemicolon();
          break;
        }

        case 'role': {
          assertNotDuplicate('role', loc);
          roleLocation = loc;
          const roleToken = this.consumeIdentifierOrString('Expected identifier for role (e.g. CORE, RELAY, EDGE)');
          role = roleToken.toUpperCase() as NodeRole;
          this.consumeSemicolon();
          break;
        }

        case 'listen': {
          // Listen bindings can appear multiple times for multi-transport support!
          declaredPropertiesList.push('listen');
          const binding = this.parseListenBinding(loc);
          // Check for duplicate endpoint with same protocol and port/address
          for (const existing of listenBindings) {
            if (existing.protocol === binding.protocol && existing.port === binding.port && existing.host === binding.host) {
              throw new NodeDeclarationParseError(
                `Duplicate listen binding for '${binding.protocol}' on '${binding.host}:${binding.port}' (already declared at line ${existing.location.line})`,
                loc.line,
                loc.column,
                'DUPLICATE_LISTEN_ENDPOINT'
              );
            }
          }
          listenBindings.push(binding);
          this.consumeSemicolon();
          break;
        }

        case 'default_transport': {
          assertNotDuplicate('default_transport', loc);
          defaultTransportLocation = loc;
          const dtVal = this.consumeIdentifierOrString('Expected identifier for default_transport');
          defaultTransport = dtVal.toUpperCase() as TransportType;
          this.consumeSemicolon();
          break;
        }

        case 'mtu': {
          assertNotDuplicate('mtu', loc);
          mtuLocation = loc;
          mtu = this.consumeNumber('Expected integer value for MTU');
          this.consumeSemicolon();
          break;
        }

        case 'heartbeat':
        case 'heartbeat_interval': {
          assertNotDuplicate('heartbeat', loc);
          heartbeatLocation = loc;
          heartbeat = this.consumeNumber('Expected integer milliseconds for heartbeat');
          this.consumeSemicolon();
          break;
        }

        case 'rate_limit':
        case 'rate_limit_per_minute': {
          assertNotDuplicate('rate_limit', loc);
          rateLimitLocation = loc;
          rateLimit = this.consumeNumber('Expected integer for rate_limit');
          this.consumeSemicolon();
          break;
        }

        case 'max_peers':
        case 'max_concurrent_peers': {
          assertNotDuplicate('max_peers', loc);
          maxPeersLocation = loc;
          maxPeers = this.consumeNumber('Expected integer for max_peers');
          this.consumeSemicolon();
          break;
        }

        case 'storage_quota':
        case 'storage_quota_bytes': {
          assertNotDuplicate('storage_quota', loc);
          storageQuotaLocation = loc;
          storageQuota = this.consumeNumber('Expected integer bytes for storage_quota');
          this.consumeSemicolon();
          break;
        }

        case 'routing':
        case 'routing_policy': {
          assertNotDuplicate('routing_policy', loc);
          routingPolicyLocation = loc;
          const policyStr = this.consumeIdentifierOrString('Expected routing policy (STRICT_COORDINATE or DIRECT_ONLY)');
          routingPolicy = policyStr.toUpperCase() as 'STRICT_COORDINATE' | 'DIRECT_ONLY';
          this.consumeSemicolon();
          break;
        }

        case 'capabilities': {
          assertNotDuplicate('capabilities', loc);
          capabilitiesLocation = loc;
          capabilities = this.parseCapabilitiesArray();
          this.consumeSemicolon();
          break;
        }

        case 'public_key': {
          assertNotDuplicate('public_key', loc);
          publicKeyLocation = loc;
          publicKey = this.consumeString('Expected string literal for public key');
          this.consumeSemicolon();
          break;
        }

        case 'hardware_fingerprint': {
          assertNotDuplicate('hardware_fingerprint', loc);
          hardwareFingerprintLocation = loc;
          hardwareFingerprint = this.consumeString('Expected string literal for hardware_fingerprint');
          this.consumeSemicolon();
          break;
        }

        case 'space': {
          assertNotDuplicate('space', loc);
          spaceLocation = loc;
          space = this.parse3DCoordinate();
          this.consumeSemicolon();
          break;
        }

        case 'grid777': {
          assertNotDuplicate('grid777', loc);
          grid777Location = loc;
          grid777 = this.parseGrid777();
          this.consumeSemicolon();
          break;
        }

        case 'stale_timeout': {
          assertNotDuplicate('stale_timeout', loc);
          staleTimeoutMs = this.consumeNumber('Expected integer for stale_timeout');
          this.consumeSemicolon();
          break;
        }

        case 'failure_timeout': {
          assertNotDuplicate('failure_timeout', loc);
          failureTimeoutMs = this.consumeNumber('Expected integer for failure_timeout');
          this.consumeSemicolon();
          break;
        }

        case 'sweep_interval': {
          assertNotDuplicate('sweep_interval', loc);
          sweepIntervalMs = this.consumeNumber('Expected integer for sweep_interval');
          this.consumeSemicolon();
          break;
        }

        case 'retry_policy': {
          assertNotDuplicate('retry_policy', loc);
          retryPolicy = this.parseRetryPolicy(loc);
          this.consumeSemicolon();
          break;
        }

        case 'pipeline_options': {
          assertNotDuplicate('pipeline_options', loc);
          pipelineOptions = this.parsePipelineOptions(loc);
          this.consumeSemicolon();
          break;
        }

        default: {
          throw new NodeDeclarationParseError(
            `Unknown node property '${keyName}' inside node declaration body`,
            loc.line,
            loc.column,
            'UNKNOWN_PROPERTY'
          );
        }
      }
    }

    // 5. Must close with '}'
    if (!this.match(TokenType.RBRACE)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected '}' to close node declaration body, found '${token.value}'`,
        token.line,
        token.column,
        'UNCLOSED_BLOCK'
      );
    }

    return {
      type: 'CubiONodeDeclaration',
      name,
      nameLocation,
      coordinateUri,
      coordinateLocation,
      owner,
      ownerLocation,
      role,
      roleLocation,
      listenBindings,
      defaultTransport,
      defaultTransportLocation,
      mtu,
      mtuLocation,
      heartbeat,
      heartbeatLocation,
      rateLimit,
      rateLimitLocation,
      maxPeers,
      maxPeersLocation,
      storageQuota,
      storageQuotaLocation,
      routingPolicy,
      routingPolicyLocation,
      capabilities,
      capabilitiesLocation,
      publicKey,
      publicKeyLocation,
      hardwareFingerprint,
      hardwareFingerprintLocation,
      space,
      spaceLocation,
      grid777,
      grid777Location,
      staleTimeoutMs,
      failureTimeoutMs,
      sweepIntervalMs,
      retryPolicy,
      pipelineOptions,
      declaredProperties: declaredPropertiesList,
    };
  }

  // --- Parsing Helpers ---

  private parsePropertyName(): string {
    const token = this.peek();
    // In OneLexer, tokens might be keywords (like KEYWORD_ROLE) or generic IDENTIFIER
    if (
      token.type === TokenType.IDENTIFIER ||
      token.type.startsWith('KEYWORD_') ||
      token.type.startsWith('TYPE_')
    ) {
      this.advance();
      return token.value;
    }
    throw new NodeDeclarationParseError(
      `Expected property name, found '${token.value}' (${token.type})`,
      token.line,
      token.column,
      'EXPECTED_PROPERTY_NAME'
    );
  }

  private parseListenBinding(loc: NodeDeclarationSourceLocation): NodeDeclarationListenBindingAST {
    // format: listen: <protocol> "<endpoint_address>";
    const protoToken = this.consumeIdentifierOrString('Expected transport protocol (e.g. tcp, udp, ws, ipc, memory)');
    const protoUpper = protoToken.toUpperCase();
    let protocol: TransportType;
    if (protoUpper === 'TCP') protocol = 'TCP';
    else if (protoUpper === 'UDP') protocol = 'UDP';
    else if (protoUpper === 'WS' || protoUpper === 'WEBSOCKET') protocol = 'WEBSOCKET';
    else if (protoUpper === 'IPC' || protoUpper === 'PIPE' || protoUpper === 'IPC_PIPE') protocol = 'IPC_PIPE';
    else if (protoUpper === 'MEMORY' || protoUpper === 'MEM') protocol = 'MEMORY';
    else {
      throw new NodeDeclarationParseError(
        `Unsupported transport protocol '${protoToken}' in listen binding. Valid: TCP, UDP, WS, IPC, MEMORY`,
        loc.line,
        loc.column,
        'INVALID_TRANSPORT_PROTOCOL'
      );
    }

    const address = this.consumeString('Expected endpoint address string (e.g. "127.0.0.1:44001")');
    let host = '127.0.0.1';
    let port = 0;
    let path: string | undefined = undefined;

    if (protocol === 'IPC') {
      path = address;
      host = 'localhost';
      port = 0;
    } else if (protocol === 'MEMORY') {
      host = 'memory';
      port = 0;
    } else {
      // Parse host:port or ws://host:port/path
      const cleanAddr = address.replace(/^[a-z]+:\/\//i, '');
      const parts = cleanAddr.split('/');
      const hostPort = parts[0].split(':');
      if (hostPort.length < 2) {
        throw new NodeDeclarationParseError(
          `Invalid endpoint address '${address}'. Expected format 'host:port' (e.g. "127.0.0.1:44001")`,
          loc.line,
          loc.column,
          'INVALID_ENDPOINT_FORMAT'
        );
      }
      host = hostPort[0];
      port = parseInt(hostPort[1], 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new NodeDeclarationParseError(
          `Invalid port '${hostPort[1]}' in endpoint '${address}'. Must be integer 1..65535`,
          loc.line,
          loc.column,
          'INVALID_PORT_NUMBER'
        );
      }
      if (parts.length > 1) {
        path = '/' + parts.slice(1).join('/');
      }
    }

    return {
      protocol,
      address,
      host,
      port,
      path,
      location: loc,
    };
  }

  private parseCapabilitiesArray(): NodeCapability[] {
    if (!this.match(TokenType.LBRACKET)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected '[' to begin capabilities list, found '${token.value}'`,
        token.line,
        token.column,
        'EXPECTED_LBRACKET'
      );
    }

    const caps: NodeCapability[] = [];
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      const capStr = this.consumeIdentifierOrString('Expected capability name');
      caps.push(capStr.toUpperCase() as NodeCapability);
      if (!this.check(TokenType.RBRACKET)) {
        this.consume(TokenType.COMMA, "Expected ',' between capabilities");
      }
    }

    this.consume(TokenType.RBRACKET, "Expected ']' to end capabilities list");
    return caps;
  }

  private parse3DCoordinate(): { x: number; y: number; z: number } {
    const x = this.consumeNumber('Expected numeric x coordinate');
    this.consume(TokenType.COMMA, "Expected ',' after x coordinate");
    const y = this.consumeNumber('Expected numeric y coordinate');
    this.consume(TokenType.COMMA, "Expected ',' after y coordinate");
    const z = this.consumeNumber('Expected numeric z coordinate');
    return { x, y, z };
  }

  private parseGrid777(): { i: number; j: number; k: number } {
    const i = this.consumeNumber('Expected integer i in Grid777 (0..6)');
    this.consume(TokenType.COMMA, "Expected ',' after i index");
    const j = this.consumeNumber('Expected integer j in Grid777 (0..6)');
    this.consume(TokenType.COMMA, "Expected ',' after j index");
    const k = this.consumeNumber('Expected integer k in Grid777 (0..6)');
    return { i, j, k };
  }

  private parseRetryPolicy(loc: NodeDeclarationSourceLocation): NodeDeclarationRetryPolicyAST {
    this.consume(TokenType.LBRACE, "Expected '{' to start retry_policy block");
    let maxRetries: number | undefined;
    let initialDelayMs: number | undefined;
    let maxDelayMs: number | undefined;

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.parsePropertyName().toLowerCase();
      this.consume(TokenType.COLON, "Expected ':' after property in retry_policy");
      if (key === 'max_retries') maxRetries = this.consumeNumber('Expected number for max_retries');
      else if (key === 'initial_delay' || key === 'initial_delay_ms') initialDelayMs = this.consumeNumber('Expected number for initial_delay');
      else if (key === 'max_delay' || key === 'max_delay_ms') maxDelayMs = this.consumeNumber('Expected number for max_delay');
      if (this.match(TokenType.COMMA) || this.match(TokenType.SEMICOLON)) {
        // optional separator
      }
    }
    this.consume(TokenType.RBRACE, "Expected '}' to end retry_policy block");
    return { maxRetries, initialDelayMs, maxDelayMs, location: loc };
  }

  private parsePipelineOptions(loc: NodeDeclarationSourceLocation): NodeDeclarationPipelineOptionsAST {
    this.consume(TokenType.LBRACE, "Expected '{' to start pipeline_options block");
    let maxQueueSize: number | undefined;
    let assemblyTimeoutMs: number | undefined;

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.parsePropertyName().toLowerCase();
      this.consume(TokenType.COLON, "Expected ':' after property in pipeline_options");
      if (key === 'max_queue_size') maxQueueSize = this.consumeNumber('Expected number for max_queue_size');
      else if (key === 'assembly_timeout_ms' || key === 'assembly_timeout') assemblyTimeoutMs = this.consumeNumber('Expected number for assembly_timeout');
      if (this.match(TokenType.COMMA) || this.match(TokenType.SEMICOLON)) {
        // optional separator
      }
    }
    this.consume(TokenType.RBRACE, "Expected '}' to end pipeline_options block");
    return { maxQueueSize, assemblyTimeoutMs, location: loc };
  }

  // --- Token Navigation Helpers ---

  private consumeString(errorMsg: string): string {
    const token = this.peek();
    if (token.type === TokenType.STRING_LITERAL) {
      this.advance();
      return token.value;
    }
    throw new NodeDeclarationParseError(
      `${errorMsg}, found '${token.value}' (${token.type})`,
      token.line,
      token.column,
      'EXPECTED_STRING'
    );
  }

  private consumeNumber(errorMsg: string): number {
    const token = this.peek();
    if (token.type === TokenType.NUMBER_LITERAL) {
      this.advance();
      const num = parseFloat(token.value);
      if (isNaN(num)) {
        throw new NodeDeclarationParseError(
          `Invalid numeric literal '${token.value}'`,
          token.line,
          token.column,
          'INVALID_NUMBER'
        );
      }
      return num;
    }
    throw new NodeDeclarationParseError(
      `${errorMsg}, found '${token.value}' (${token.type})`,
      token.line,
      token.column,
      'EXPECTED_NUMBER'
    );
  }

  private consumeIdentifierOrString(errorMsg: string): string {
    const token = this.peek();
    if (
      token.type === TokenType.IDENTIFIER ||
      token.type === TokenType.STRING_LITERAL ||
      token.type.startsWith('KEYWORD_') ||
      token.type.startsWith('TYPE_')
    ) {
      this.advance();
      return token.value;
    }
    throw new NodeDeclarationParseError(
      `${errorMsg}, found '${token.value}' (${token.type})`,
      token.line,
      token.column,
      'EXPECTED_IDENTIFIER_OR_STRING'
    );
  }

  private consumeSemicolon(): void {
    if (!this.match(TokenType.SEMICOLON)) {
      const token = this.peek();
      throw new NodeDeclarationParseError(
        `Expected ';' after property statement, found '${token.value}'`,
        token.line,
        token.column,
        'EXPECTED_SEMICOLON'
      );
    }
  }

  private consume(type: TokenType, errorMsg: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    const token = this.peek();
    throw new NodeDeclarationParseError(
      `${errorMsg}, found '${token.value}'`,
      token.line,
      token.column,
      'UNEXPECTED_TOKEN'
    );
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    if (this.current >= this.tokens.length) {
      const last = this.tokens[this.tokens.length - 1];
      return { type: TokenType.EOF, value: '', line: last ? last.line : 1, column: last ? last.column : 1 };
    }
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private skipSemicolons(): void {
    while (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }
  }
}
