/**
 * 3D Memory Studio - Funnel 12: Record Definitions for Hierarchical Levels
 * 
 * Level 0: Raw Cell Records (9 Bytes)
 * Level 1: Primitive Records (Variable: Opcode + Block + Anchor + Count + Offsets)
 * Level 2: Dictionary Pattern Definitions (DictId, RuleType, Offsets, Symbol)
 * Level 3: Composite Definitions (CompId, ChildCount, Children) & References (CompId, BlockId, Anchor, SeqStart)
 */

export interface RelOffset3D {
  readonly dx: number; // -128..127
  readonly dy: number; // -128..127
  readonly dz: number; // -128..127
}

/**
 * Level 2: Dictionary Pattern Entry (Stored once in dictionary table)
 */
export interface F12DictionaryEntry {
  readonly dictId: number; // 1-based uint16
  readonly ruleType: number; // uint8 opcode (e.g. 0x01=SPATIAL_RUN, 0x03=CLUSTER)
  readonly relativeOffsets: readonly RelOffset3D[];
  readonly symbol: string; // ASCII token
  readonly flags: number;
}

/**
 * Level 3: Child Reference within a Composite Definition
 */
export interface F12CompositeChildDef {
  readonly childDictId: number; // uint16
  readonly offset: RelOffset3D;
  readonly order: number; // uint16 logical ordering
  readonly transform: number; // 0x01 = TRANSLATION
}

/**
 * Level 3: Composite Definition (Stored once in definition table)
 */
export interface F12CompositeDefinition {
  readonly compositeId: number; // uint16
  readonly childCount: number; // uint16 (>= 2)
  readonly transformType: number; // 0x01 = TRANSLATION
  readonly flags: number;
  readonly children: readonly F12CompositeChildDef[];
}

/**
 * Level 3: Composite Occurrence Reference (Stored for each composite occurrence)
 */
export interface F12CompositeReference {
  readonly opcode: number; // 0x0C
  readonly blockId: number; // uint16
  readonly compositeId: number; // uint16
  readonly originCellId: number; // uint16 (0..342)
  readonly coveredCount: number; // uint16
  readonly startSeqIndex: number; // uint16
  readonly flags: number;
}

/**
 * Level 1: Primitive Rule Record (For spatial patterns not in composites)
 */
export interface F12PrimitiveRecord {
  readonly opcode: number; // uint8
  readonly blockId: number; // uint16
  readonly originCellId: number; // uint16
  readonly cellCount: number; // uint16
  readonly startSeqIndex: number; // uint16
  readonly symbol: string; // ASCII token
  readonly relativeOffsets: readonly RelOffset3D[];
}

/**
 * Level 0: Raw Cell Record (For isolated uncovered cells)
 */
export interface F12RawCellRecord {
  readonly opcode: number; // 0x00
  readonly blockId: number; // uint16
  readonly cellId: number; // uint16 (0..342)
  readonly sequenceIndex: number; // uint16
  readonly state: number; // uint8 (1 = active)
  readonly symbol: string; // 1-char ASCII
}
