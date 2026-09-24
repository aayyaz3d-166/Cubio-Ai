/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Emulator Tool Definitions
 *
 * Formal JSON schemas for the 7 initial simulation control tools.
 */

export interface EmulatorToolParameterProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly description: string;
  readonly enum?: readonly string[];
  readonly items?: { readonly type: string };
}

export interface EmulatorToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: {
    readonly type: 'object';
    readonly properties: Readonly<Record<string, EmulatorToolParameterProperty>>;
    readonly required: readonly string[];
  };
}

export const CUBIO_EMULATOR_TOOL_DEFINITIONS: readonly EmulatorToolDefinition[] = Object.freeze([
  {
    name: 'createState',
    description: 'Creates and registers a new 3D spatial object / state node in the CubiO State Universe and 3D memory.',
    parameters: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Descriptive name or label for the object (e.g., "Object A", "Test Cube").',
        },
        position: {
          type: 'array',
          description: 'Coordinates vector [x, y, z] in 3D space.',
          items: { type: 'number' },
        },
        dimension: {
          type: 'string',
          description: 'Logical state space dimension (default: "D3").',
          enum: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        },
        properties: {
          type: 'object',
          description: 'Key-value dictionary of physical, geometric, or semantic attributes.',
        },
        customId: {
          type: 'string',
          description: 'Optional custom identifier for the state (e.g. "ST_OBJ_A").',
        },
      },
      required: ['label'],
    },
  },
  {
    name: 'readState',
    description: 'Retrieves an existing object state, coordinates, dimension, and checksum from the State Universe.',
    parameters: {
      type: 'object',
      properties: {
        stateId: {
          type: 'string',
          description: 'Identifier or label of the state to retrieve (e.g., "ST_OBJ_A" or "Object A").',
        },
      },
      required: ['stateId'],
    },
  },
  {
    name: 'updateState',
    description: 'Updates properties, position, or dimensions of an existing object state in the State Universe.',
    parameters: {
      type: 'object',
      properties: {
        stateId: {
          type: 'string',
          description: 'Identifier of the state to update.',
        },
        position: {
          type: 'array',
          description: 'New coordinate vector [x, y, z].',
          items: { type: 'number' },
        },
        properties: {
          type: 'object',
          description: 'Updated key-value attributes.',
        },
        dimension: {
          type: 'string',
          description: 'Target dimension if changing state space.',
          enum: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        },
        reason: {
          type: 'string',
          description: 'Reason for the state modification.',
        },
      },
      required: ['stateId'],
    },
  },
  {
    name: 'removeState',
    description: 'Removes an object state cleanly from the State Universe without leaving orphan references.',
    parameters: {
      type: 'object',
      properties: {
        stateId: {
          type: 'string',
          description: 'Identifier of the state to remove.',
        },
        reason: {
          type: 'string',
          description: 'Reason for state removal.',
        },
      },
      required: ['stateId'],
    },
  },
  {
    name: 'searchMemory',
    description: 'Queries 7-tier spatial memory by tier, tag, dimension, or key prefix.',
    parameters: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          description: 'Memory tier to search.',
          enum: ['SHORT_TERM', 'LONG_TERM', 'CONTEXT', 'RELATIONSHIPS', 'HISTORY', 'EMBEDDINGS', 'STATE_MEMORY'],
        },
        tags: {
          type: 'array',
          description: 'Array of tag strings to match.',
          items: { type: 'string' },
        },
        keyPrefix: {
          type: 'string',
          description: 'Prefix filter for memory keys.',
        },
      },
      required: [],
    },
  },
  {
    name: 'storeMemory',
    description: 'Stores information or metadata into a specified tier of CubiO Spatial Memory.',
    parameters: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          description: 'Target memory tier.',
          enum: ['SHORT_TERM', 'LONG_TERM', 'CONTEXT', 'RELATIONSHIPS', 'HISTORY', 'EMBEDDINGS', 'STATE_MEMORY'],
        },
        key: {
          type: 'string',
          description: 'Unique memory key or identifier.',
        },
        payload: {
          type: 'object',
          description: 'Payload data to store.',
        },
        tags: {
          type: 'array',
          description: 'Optional tags for indexing.',
          items: { type: 'string' },
        },
      },
      required: ['tier', 'key', 'payload'],
    },
  },
  {
    name: 'transformState',
    description: 'Applies a dimensional elevation or projection transformation (e.g. D3 to D4) on a state.',
    parameters: {
      type: 'object',
      properties: {
        stateId: {
          type: 'string',
          description: 'Identifier of the state to transform.',
        },
        targetDimension: {
          type: 'string',
          description: 'Target dimension space.',
          enum: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
        },
      },
      required: ['stateId', 'targetDimension'],
    },
  },
]);
