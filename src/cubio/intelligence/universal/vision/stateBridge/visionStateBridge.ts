/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3 (F49): Vision to CubiO State Bridge
 *
 * Transforms visual perceptions into formal, verifiable CubiOStates.
 */

import { CubiOStateFactory } from '../../../../state/stateEngine';
import { CubiOState } from '../../../../state/types';
import { CubiODimension } from '../../../../types';
import { Math369 } from '../../../../engine_369/math369';
import { VisualUnderstandingReport } from '../types';

export class VisionStateBridge {
  /**
   * Transforms a VisualUnderstandingReport into an authoritative CubiOState.
   */
  public transformToCubiOState(
    report: VisualUnderstandingReport,
    targetDimension: CubiODimension = 'D3'
  ): CubiOState {
    const stateId = `ST_VIS_${report.analysisId.slice(0, 12)}`;

    // Compute dominant spatial coordinates from detected visual entities
    let posX = 0;
    let posY = 0;
    let posZ = 0;

    if (report.detectedEntities.length > 0) {
      const coords = report.detectedEntities
        .map((e) => e.spatialCoordinates3D || [0, 0, 0])
        .filter((c) => c !== undefined);

      if (coords.length > 0) {
        posX = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
        posY = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
        posZ = coords.reduce((acc, c) => acc + c[2], 0) / coords.length;
      }
    }

    const digitalRoot = Math369.computeDigitalRoot(
      Math.round((posX + posY + posZ + report.detectedEntities.length) * 100) || 9
    );

    return CubiOStateFactory.createState(
      stateId,
      [posX, posY, posZ],
      targetDimension,
      {
        inputType: report.inputType,
        description: report.naturalDescription,
        detectedEntitiesCount: report.detectedEntities.length,
        hasCadMesh: Boolean(report.cadMesh),
        hasDiagramGraph: Boolean(report.diagramGraph),
        hasOcrBlocks: Boolean(report.ocrBlocks),
        digitalRoot369: digitalRoot,
        sourceChecksum: report.imageChecksum,
      }
    );
  }
}
