/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Emulator Tool Executor & Security Boundary
 *
 * Implements safe, validated programmatic execution of simulation tools through CubiOEmulator.
 * Invariant: AI/LLM never has direct DB/RAM access; all mutations pass through typed commands.
 */

import { CubiOEmulator } from '../../../emulator/cubioEmulator';
import { EmulatorResult } from '../../../emulator/types';
import { CubiODimension } from '../../../types';
import { CubiOMemoryTier } from '../../../memory/types';

export interface EmulatorToolExecutionResult<T = any> {
  readonly success: boolean;
  readonly toolName: string;
  readonly observation: string;
  readonly rawResult?: EmulatorResult<T>;
  readonly error?: string;
}

export class EmulatorToolExecutor {
  private readonly emulator: CubiOEmulator;

  constructor(emulator?: CubiOEmulator) {
    this.emulator = emulator || new CubiOEmulator();
  }

  public getEmulator(): CubiOEmulator {
    return this.emulator;
  }

  /**
   * Executes a validated tool call against the CubiO Emulator.
   */
  public async executeTool(
    toolName: string,
    args: Record<string, any>,
    actor = 'CUBIO_AI'
  ): Promise<EmulatorToolExecutionResult> {
    try {
      switch (toolName) {
        case 'createState': {
          const label = String(args.label || 'Object');
          const position = Array.isArray(args.position)
            ? args.position.map((n: any) => Number(n) || 0)
            : [0, 0, 0];
          const dimension = (args.dimension as CubiODimension) || 'D3';
          const properties = typeof args.properties === 'object' && args.properties !== null ? args.properties : {};
          const customId = args.customId ? String(args.customId) : this.sanitizeIdFromLabel(label);

          const result = await this.emulator.createState(
            {
              label,
              position,
              dimension,
              properties: { ...properties, label },
              customId,
            },
            actor
          );

          if (!result.success || !result.data) {
            return {
              success: false,
              toolName,
              observation: `Failed to create state '${label}': ${result.error || 'Unknown error'}`,
              rawResult: result,
              error: result.error,
            };
          }

          const st = result.data;
          const posStr = `[${st.position.join(', ')}]`;
          return {
            success: true,
            toolName,
            observation: `State '${st.properties.label || st.id}' (ID: ${st.id}) created successfully at position ${posStr} in dimension ${st.dimension} with checksum ${st.checksum}.`,
            rawResult: result,
          };
        }

        case 'readState': {
          const requestedId = String(args.stateId || '');
          const resolvedId = this.resolveStateId(requestedId);

          const result = await this.emulator.readState(resolvedId);
          if (!result.success || !result.data) {
            return {
              success: false,
              toolName,
              observation: `State '${requestedId}' not found in State Universe.`,
              rawResult: result,
              error: result.error,
            };
          }

          const st = result.data;
          const posStr = `[${st.position.join(', ')}]`;
          const propStr = JSON.stringify(st.properties);
          return {
            success: true,
            toolName,
            observation: `State '${st.properties.label || st.id}' (ID: ${st.id}) is located at position ${posStr} in dimension ${st.dimension}. Properties: ${propStr}. Checksum: ${st.checksum}.`,
            rawResult: result,
          };
        }

        case 'updateState': {
          const requestedId = String(args.stateId || '');
          const resolvedId = this.resolveStateId(requestedId);
          const position = Array.isArray(args.position)
            ? args.position.map((n: any) => Number(n) || 0)
            : undefined;
          const properties = typeof args.properties === 'object' && args.properties !== null ? args.properties : undefined;
          const dimension = args.dimension as CubiODimension | undefined;

          const result = await this.emulator.updateState(
            {
              stateId: resolvedId,
              position,
              properties,
              dimension,
              reason: args.reason || 'AI_TOOL_UPDATE',
            },
            actor
          );

          if (!result.success || !result.data) {
            return {
              success: false,
              toolName,
              observation: `Failed to update state '${requestedId}': ${result.error}`,
              rawResult: result,
              error: result.error,
            };
          }

          const st = result.data;
          const posStr = `[${st.position.join(', ')}]`;
          return {
            success: true,
            toolName,
            observation: `State '${st.properties.label || st.id}' (ID: ${st.id}) updated successfully. New position: ${posStr}, dimension: ${st.dimension}, checksum: ${st.checksum}.`,
            rawResult: result,
          };
        }

        case 'removeState': {
          const requestedId = String(args.stateId || '');
          const resolvedId = this.resolveStateId(requestedId);

          const result = await this.emulator.removeState(resolvedId, args.reason || 'AI_TOOL_REMOVE', actor);
          if (!result.success) {
            return {
              success: false,
              toolName,
              observation: `Failed to remove state '${requestedId}': ${result.error}`,
              rawResult: result,
              error: result.error,
            };
          }

          return {
            success: true,
            toolName,
            observation: `State '${requestedId}' (ID: ${resolvedId}) has been cleanly removed from the State Universe.`,
            rawResult: result,
          };
        }

        case 'searchMemory': {
          const tier = args.tier as CubiOMemoryTier | undefined;
          const tags = Array.isArray(args.tags) ? args.tags.map(String) : undefined;
          const keyPrefix = args.keyPrefix ? String(args.keyPrefix) : undefined;

          const result = await this.emulator.searchMemory({ tier, tags, keyPrefix });
          const matches = result.data || [];

          if (matches.length === 0) {
            return {
              success: true,
              toolName,
              observation: `No memory records found matching query parameters.`,
              rawResult: result,
            };
          }

          const summaries = matches.map(
            (m) => `[Key: ${m.indexEntry.key}, Tier: ${m.indexEntry.tier}, Tags: ${m.indexEntry.tags.join(',')}]`
          );
          return {
            success: true,
            toolName,
            observation: `Found ${matches.length} memory records: ${summaries.join('; ')}`,
            rawResult: result,
          };
        }

        case 'storeMemory': {
          const tier = (args.tier as CubiOMemoryTier) || 'STATE_MEMORY';
          const key = String(args.key || `mem_${Date.now()}`);
          const payload = args.payload || {};
          const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];

          const result = await this.emulator.storeMemory({
            tier,
            key,
            payload,
            tags,
          });

          if (!result.success || !result.data) {
            return {
              success: false,
              toolName,
              observation: `Failed to store memory: ${result.error}`,
              rawResult: result,
              error: result.error,
            };
          }

          return {
            success: true,
            toolName,
            observation: `Information remembered successfully in tier '${tier}' under key '${key}' with CID ${result.data.cid}.`,
            rawResult: result,
          };
        }

        case 'transformState': {
          const requestedId = String(args.stateId || '');
          const resolvedId = this.resolveStateId(requestedId);
          const targetDimension = (args.targetDimension as CubiODimension) || 'D4';

          const result = await this.emulator.transformState({
            stateId: resolvedId,
            targetDimension,
          });

          if (!result.success || !result.data) {
            return {
              success: false,
              toolName,
              observation: `Failed to transform state '${requestedId}': ${result.error}`,
              rawResult: result,
              error: result.error,
            };
          }

          return {
            success: true,
            toolName,
            observation: `State '${requestedId}' successfully transformed (${result.data.transitionType}) to dimension ${targetDimension}. Rank: ${result.data.outputTensor.rank}.`,
            rawResult: result,
          };
        }

        default:
          return {
            success: false,
            toolName,
            observation: `Unrecognized tool '${toolName}'. Permitted tools: createState, readState, updateState, removeState, searchMemory, storeMemory, transformState.`,
            error: `INVALID_TOOL: ${toolName}`,
          };
      }
    } catch (err: any) {
      return {
        success: false,
        toolName,
        observation: `Execution error in tool '${toolName}': ${err?.message || String(err)}`,
        error: err?.message || String(err),
      };
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private resolveStateId(labelOrId: string): string {
    const raw = labelOrId.trim();
    // If state exists by direct ID
    const direct = this.emulator.getStateUniverse().getState(raw);
    if (direct) return direct.id;

    // Check if sanitized ID matches
    const sanitized = this.sanitizeIdFromLabel(raw);
    const sanitizedMatch = this.emulator.getStateUniverse().getState(sanitized);
    if (sanitizedMatch) return sanitizedMatch.id;

    // Search by label in properties
    const all = this.emulator.getStateUniverse().getAllStates();
    const labelMatch = all.find(
      (s) => s.properties.label && s.properties.label.toLowerCase() === raw.toLowerCase()
    );
    if (labelMatch) return labelMatch.id;

    return raw;
  }

  private sanitizeIdFromLabel(label: string): string {
    const clean = label.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return clean ? `ST_${clean}` : `ST_OBJ_${Date.now()}`;
  }
}
