/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R8: Selection Engine
 *
 * Deterministic 3D selection resolving Visual Object → Workspace Object → Reality Object → Reality State.
 * Selection NEVER modifies Reality (ΔReality = 0).
 */

import {
  InteractionSelection,
  SelectionMode,
  InteractionTarget,
} from './types';
import {
  generateDeterministicSelectionId,
  computeSelectionChecksum,
} from './determinism';

export class R8SelectionEngine {
  public static readonly EMPTY_SELECTION: InteractionSelection = Object.freeze({
    selectionId: 'SEL_R8_EMPTY',
    selectedObjectIds: Object.freeze([]),
    primarySelectedObjectId: null,
    selectionMode: 'SINGLE' as SelectionMode,
    selectionChecksum: computeSelectionChecksum('SEL_R8_EMPTY', [], null, 'SINGLE'),
  });

  public static selectSingle(
    sessionId: string,
    visualObjectId: string,
    seq = 0
  ): InteractionSelection {
    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const selectedObjectIds = Object.freeze([visualObjectId]);
    const checksum = computeSelectionChecksum(selectionId, selectedObjectIds, visualObjectId, 'SINGLE');

    return Object.freeze({
      selectionId,
      selectedObjectIds,
      primarySelectedObjectId: visualObjectId,
      selectionMode: 'SINGLE' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static selectMultiple(
    sessionId: string,
    visualObjectIds: readonly string[],
    seq = 0
  ): InteractionSelection {
    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const ids = Object.freeze([...visualObjectIds]);
    const primary = ids.length > 0 ? ids[0] : null;
    const checksum = computeSelectionChecksum(selectionId, ids, primary, 'MULTI');

    return Object.freeze({
      selectionId,
      selectedObjectIds: ids,
      primarySelectedObjectId: primary,
      selectionMode: 'MULTI' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static addToSelection(
    current: InteractionSelection,
    sessionId: string,
    visualObjectId: string,
    seq = 0
  ): InteractionSelection {
    if (current.selectedObjectIds.includes(visualObjectId)) return current;

    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const ids = Object.freeze([...current.selectedObjectIds, visualObjectId]);
    const primary = current.primarySelectedObjectId ?? visualObjectId;
    const checksum = computeSelectionChecksum(selectionId, ids, primary, 'ADDITIVE');

    return Object.freeze({
      selectionId,
      selectedObjectIds: ids,
      primarySelectedObjectId: primary,
      selectionMode: 'ADDITIVE' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static removeFromSelection(
    current: InteractionSelection,
    sessionId: string,
    visualObjectId: string,
    seq = 0
  ): InteractionSelection {
    const ids = Object.freeze(current.selectedObjectIds.filter((id) => id !== visualObjectId));
    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const primary = ids.length > 0 ? ids[0] : null;
    const checksum = computeSelectionChecksum(selectionId, ids, primary, 'SINGLE');

    return Object.freeze({
      selectionId,
      selectedObjectIds: ids,
      primarySelectedObjectId: primary,
      selectionMode: 'SINGLE' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static replaceSelection(
    sessionId: string,
    visualObjectId: string,
    seq = 0
  ): InteractionSelection {
    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const ids = Object.freeze([visualObjectId]);
    const checksum = computeSelectionChecksum(selectionId, ids, visualObjectId, 'REPLACE');

    return Object.freeze({
      selectionId,
      selectedObjectIds: ids,
      primarySelectedObjectId: visualObjectId,
      selectionMode: 'REPLACE' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static clearSelection(sessionId: string, seq = 0): InteractionSelection {
    const selectionId = generateDeterministicSelectionId(sessionId, seq);
    const checksum = computeSelectionChecksum(selectionId, [], null, 'SINGLE');

    return Object.freeze({
      selectionId,
      selectedObjectIds: Object.freeze([]),
      primarySelectedObjectId: null,
      selectionMode: 'SINGLE' as SelectionMode,
      selectionChecksum: checksum,
    });
  }

  public static inspectSelection(
    selection: InteractionSelection,
    targets: Readonly<Record<string, InteractionTarget>>
  ): readonly InteractionTarget[] {
    return Object.freeze(
      selection.selectedObjectIds
        .map((id) => targets[id])
        .filter((t): t is InteractionTarget => t !== undefined)
    );
  }
}
