/**
 * CUBiO AI — Phase 6: Task 87
 * Native Language + Spatial Intelligence Layer
 * src/cubio/language/native/spatial/spatialLanguageParser.ts
 *
 * Deterministic natural language parser extracting explicit coordinates,
 * linear Cell IDs, Formula A 369 addresses, relative directional vectors,
 * and spatial relations strictly validated against src/core/address369.ts.
 */

import { Coordinate3D } from '../../../../types/memory';
import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  validateCoordinate,
  validateCellId,
  validateAddress,
  TOTAL_SPATIAL_CELLS,
  DIMENSION,
} from '../../../../core/address369';
import {
  SpatialDirection,
  SpatialRelationType,
  SpatialEpistemicStatus,
  SpatialClaim,
} from './spatialLanguageTypes';
import crypto from 'crypto';

export interface ParsedCoordinateResult {
  readonly coordinate?: Coordinate3D;
  readonly cellId?: number;
  readonly address369?: number;
  readonly isOutOfBounds: boolean;
  readonly errorMessage?: string;
}

export interface ParsedCellResult {
  readonly cellId?: number;
  readonly coordinate?: Coordinate3D;
  readonly address369?: number;
  readonly isOutOfBounds: boolean;
  readonly errorMessage?: string;
}

export interface ParsedAddressResult {
  readonly address369?: number;
  readonly cellId?: number;
  readonly coordinate?: Coordinate3D;
  readonly isOutOfBounds: boolean;
  readonly errorMessage?: string;
}

export interface ParsedStepResult {
  readonly direction?: SpatialDirection;
  readonly distance?: number;
  readonly isRecognized: boolean;
}

export class SpatialLanguageParser {
  /**
   * Extracts explicit 3D coordinate (x, y, z) from natural language.
   * Enforces Formula A bounds [0..6] on every axis.
   */
  public parseExplicitCoordinates(text: string): ParsedCoordinateResult {
    if (!text) return { isOutOfBounds: false };

    // Form 1: (x=1, y=2, z=3) or (x: 1, y: 2, z: 3)
    const labeledMatch = text.match(/x\s*[:=]\s*(-?\d+)\s*,\s*y\s*[:=]\s*(-?\d+)\s*,\s*z\s*[:=]\s*(-?\d+)/i);
    if (labeledMatch) {
      const x = parseInt(labeledMatch[1], 10);
      const y = parseInt(labeledMatch[2], 10);
      const z = parseInt(labeledMatch[3], 10);
      return this._validateAndPackCoordinate(x, y, z);
    }

    // Form 2: coordinates (1, 2, 3) or at (1, 2, 3) or [1, 2, 3]
    const tupleMatch = text.match(/(?:coordinates?|position|coords?|at|location)?\s*[\(\[]\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*[\)\]]/i);
    if (tupleMatch) {
      const x = parseInt(tupleMatch[1], 10);
      const y = parseInt(tupleMatch[2], 10);
      const z = parseInt(tupleMatch[3], 10);
      return this._validateAndPackCoordinate(x, y, z);
    }

    // Form 3: coordinates 1, 2, 3
    const bareMatch = text.match(/(?:coordinates?|coords?|position)\s*[:=]?\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/i);
    if (bareMatch) {
      const x = parseInt(bareMatch[1], 10);
      const y = parseInt(bareMatch[2], 10);
      const z = parseInt(bareMatch[3], 10);
      return this._validateAndPackCoordinate(x, y, z);
    }

    return { isOutOfBounds: false };
  }

  /**
   * Extracts linear Cell ID [0..342] from text.
   */
  public parseExplicitCellId(text: string): ParsedCellResult {
    if (!text) return { isOutOfBounds: false };

    const match = text.match(/\b(?:cell|cellId|lattice cell|cell id)\s*[:=]?\s*#?(-?\d+)\b/i);
    if (!match) return { isOutOfBounds: false };

    const rawCell = parseInt(match[1], 10);
    try {
      validateCellId(rawCell);
      const coordinate = cellIdToCoordinate(rawCell);
      const address369 = cellIdToAddress369(rawCell);
      return {
        cellId: rawCell,
        coordinate,
        address369,
        isOutOfBounds: false,
      };
    } catch (err: any) {
      return {
        cellId: rawCell,
        isOutOfBounds: true,
        errorMessage: err.message,
      };
    }
  }

  /**
   * Extracts Formula A 369 address [26..368] from text.
   */
  public parseExplicitAddress369(text: string): ParsedAddressResult {
    if (!text) return { isOutOfBounds: false };

    const match = text.match(/\b(?:address|address369|369 address|formula a address)\s*[:=]?\s*#?(-?\d+)\b/i);
    if (!match) return { isOutOfBounds: false };

    const rawAddr = parseInt(match[1], 10);
    try {
      validateAddress(rawAddr);
      const cellId = address369ToCellId(rawAddr);
      const coordinate = cellIdToCoordinate(cellId);
      return {
        address369: rawAddr,
        cellId,
        coordinate,
        isOutOfBounds: false,
      };
    } catch (err: any) {
      return {
        address369: rawAddr,
        isOutOfBounds: true,
        errorMessage: err.message,
      };
    }
  }

  /**
   * Parses directional step movements, e.g. "2 steps east", "3 units above", "1 cell north".
   */
  public parseDirectionAndSteps(text: string): ParsedStepResult {
    if (!text) return { isRecognized: false };
    const lower = text.toLowerCase();

    // Pattern 1: <distance> [steps|cells|units] <direction>
    const dMatch1 = lower.match(/(\d+)\s*(?:steps?|cells?|units?)?\s*(east|west|north|south|above|below|up|down|\+x|-x|\+y|-y|\+z|-z)\b/);
    if (dMatch1) {
      const dist = parseInt(dMatch1[1], 10);
      const dir = this._normalizeDirection(dMatch1[2]);
      if (dir) return { direction: dir, distance: dist, isRecognized: true };
    }

    // Pattern 2: <direction> by <distance> [steps]
    const dMatch2 = lower.match(/(east|west|north|south|above|below|up|down|\+x|-x|\+y|-y|\+z|-z)\s*(?:by)?\s*(\d+)\s*(?:steps?|cells?|units?)?\b/);
    if (dMatch2) {
      const dir = this._normalizeDirection(dMatch2[1]);
      const dist = parseInt(dMatch2[2], 10);
      if (dir) return { direction: dir, distance: dist, isRecognized: true };
    }

    // Pattern 3: single-step direction alone (e.g. "move east", "go north")
    const dMatch3 = lower.match(/\b(?:move|step|go|shift)?\s*(east|west|north|south|above|below|up|down|\+x|-x|\+y|-y|\+z|-z)\b/);
    if (dMatch3) {
      const dir = this._normalizeDirection(dMatch3[1]);
      if (dir) return { direction: dir, distance: 1, isRecognized: true };
    }

    return { isRecognized: false };
  }

  /**
   * Parses relative spatial relation between entities (e.g. "is north of", "is adjacent to").
   */
  public parseSpatialRelation(text: string): SpatialRelationType | undefined {
    if (!text) return undefined;
    const lower = text.toLowerCase();

    if (/\b(?:same cell|coincident|colocated|identical position)\b/.test(lower)) return 'SAME_CELL';
    if (/\b(?:adjacent|next to|neighboring|beside|touches)\b/.test(lower)) return 'ADJACENT';
    if (/\b(?:east of|to the east of|eastward from)\b/.test(lower)) return 'EAST_OF';
    if (/\b(?:west of|to the west of|westward from)\b/.test(lower)) return 'WEST_OF';
    if (/\b(?:north of|to the north of|northward from)\b/.test(lower)) return 'NORTH_OF';
    if (/\b(?:south of|to the south of|southward from)\b/.test(lower)) return 'SOUTH_OF';
    if (/\b(?:above|over|higher than|on top of)\b/.test(lower)) return 'ABOVE';
    if (/\b(?:below|under|beneath|lower than)\b/.test(lower)) return 'BELOW';
    if (/\b(?:aligned on x|collinear x|same y and z)\b/.test(lower)) return 'COLLINEAR_X';
    if (/\b(?:aligned on y|collinear y|same x and z)\b/.test(lower)) return 'COLLINEAR_Y';
    if (/\b(?:aligned on z|collinear z|same x and y)\b/.test(lower)) return 'COLLINEAR_Z';
    if (/\b(?:within distance|within \d+ cells?)\b/.test(lower)) return 'DISTANCE_WITHIN';

    return undefined;
  }

  /**
   * Detects vague/ambiguous spatial statements that lack concrete coordinates.
   */
  public detectAmbiguity(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return /\b(?:near|somewhere near|close to|around|in the vicinity of|not far from|somewhere in the cube|approximately)\b/.test(lower);
  }

  /**
   * Extracts a structured SpatialClaim from a sentence or query.
   */
  public extractSpatialClaim(text: string): SpatialClaim {
    const rawText = (text || '').trim();
    const claimId = `claim_sp_${crypto.randomBytes(4).toString('hex')}`;

    const coordRes = this.parseExplicitCoordinates(rawText);
    const cellRes = this.parseExplicitCellId(rawText);
    const addrRes = this.parseExplicitAddress369(rawText);
    const stepRes = this.parseDirectionAndSteps(rawText);
    const relation = this.parseSpatialRelation(rawText);
    const isAmbiguous = this.detectAmbiguity(rawText);
    const isOutOfBounds = coordRes.isOutOfBounds || cellRes.isOutOfBounds || addrRes.isOutOfBounds;

    // Extract subject entity and target entity
    let subjectEntity = 'unknown_entity';
    let targetEntity: string | undefined;

    // Pattern A: "Is [Subject] [relation] [Target]?" (e.g. "Is ReactorCore above Tokamak?")
    const isRelMatch = rawText.match(/^\s*is\s+([A-Za-z0-9_\-\s]+?)\s+(above|below|east\s+of|west\s+of|north\s+of|south\s+of|adjacent\s+to|same\s+cell\s+as)\s+([A-Za-z0-9_\-\s]+?)(?:\?|\.|$)/i);
    if (isRelMatch) {
      subjectEntity = isRelMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
      targetEntity = isRelMatch[3].replace(/^(?:the|a|an)\s+/i, '').trim();
    } else {
      // Pattern B: "Where is [Entity] located?" or "What is the position of [Entity]?"
      const whereMatch = rawText.match(/^\s*(?:where\s+is|what\s+is\s+the\s+(?:position|cell|location|coordinates?)\s+of)\s+([A-Za-z0-9_\-\s]+?)(?:\s+located)?(?:\s+in\s+the\s+lattice)?(?:\?|\.|$)/i);
      if (whereMatch) {
        subjectEntity = whereMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
      } else {
        // Pattern C: "[Entity] is at..."
        const subMatch = rawText.match(/^\s*([A-Za-z0-9_\-\s]+?)\s+(?:is|at|located at|positioned at|in)\b/i);
        if (subMatch && !/^(?:is|what|where|does|can|please|verify)\b/i.test(subMatch[1].trim())) {
          subjectEntity = subMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
        } else {
          // Pattern D: Known entity keywords
          const kw = rawText.match(/\b(tokamak|reactor\s*core|solar\s*array|sensor\s+[a-z0-9]+|device\s+[a-z0-9]+|beacon\s+[a-z0-9]+|entity\s+[a-z0-9]+|node\s+[a-z0-9]+)\b/i);
          if (kw) {
            subjectEntity = kw[1].trim();
          }
        }
      }

      // Extract target entity if relation exists but wasn't caught by Pattern A
      if (relation && !targetEntity) {
        const relPattern = /(?:east of|west of|north of|south of|above|below|adjacent to|next to|same cell as)\s+([A-Za-z0-9_\-\s]+?)(?:\?|\.|$)/i;
        const tMatch = rawText.match(relPattern);
        if (tMatch) {
          targetEntity = tMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
        }
      }
    }

    let epistemicStatus: SpatialEpistemicStatus = 'EPISTEMIC_UNKNOWN';
    if (isOutOfBounds) {
      epistemicStatus = 'OUT_OF_BOUNDS';
    } else if (isAmbiguous) {
      epistemicStatus = 'AMBIGUOUS_SPATIAL';
    } else if (coordRes.coordinate || cellRes.cellId !== undefined || addrRes.address369 !== undefined) {
      epistemicStatus = 'OBSERVED_FACT';
    } else if (relation) {
      epistemicStatus = 'INFERRED_RELATIONSHIP';
    }

    const explicitCoord = coordRes.coordinate ?? cellRes.coordinate ?? addrRes.coordinate;
    const explicitCell = cellRes.cellId ?? coordRes.cellId ?? addrRes.cellId;
    const explicitAddr = addrRes.address369 ?? cellRes.address369 ?? coordRes.address369;

    return Object.freeze({
      claimId,
      rawText,
      subjectEntity,
      targetEntity,
      relation,
      explicitCoordinate: explicitCoord,
      explicitCellId: explicitCell,
      explicitAddress369: explicitAddr,
      stepDistance: stepRes.distance,
      stepDirection: stepRes.direction,
      epistemicStatus,
      isAmbiguous,
      isOutOfBounds,
    });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private _validateAndPackCoordinate(x: number, y: number, z: number): ParsedCoordinateResult {
    try {
      validateCoordinate(x, y, z);
      const cellId = coordinateToCellId(x, y, z);
      const address369 = cellIdToAddress369(cellId);
      return {
        coordinate: Object.freeze({ x, y, z }),
        cellId,
        address369,
        isOutOfBounds: false,
      };
    } catch (err: any) {
      return {
        coordinate: Object.freeze({ x, y, z }),
        isOutOfBounds: true,
        errorMessage: err.message,
      };
    }
  }

  private _normalizeDirection(raw: string): SpatialDirection | undefined {
    switch (raw.toLowerCase()) {
      case 'east':
      case '+x':
      case 'right':
        return 'EAST';
      case 'west':
      case '-x':
      case 'left':
        return 'WEST';
      case 'north':
      case '+y':
      case 'forward':
        return 'NORTH';
      case 'south':
      case '-y':
      case 'backward':
        return 'SOUTH';
      case 'above':
      case 'up':
      case '+z':
        return 'ABOVE';
      case 'below':
      case 'down':
      case '-z':
        return 'BELOW';
      default:
        return undefined;
    }
  }
}
