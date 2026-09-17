/**
 * 3D Memory Studio — Funnel 64
 * Database Panel Adapter
 *
 * Exposes permitted indexed states from F49 fixture for DatabasePanel UI.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';

export class DatabasePanelAdapter {
  public async getPermittedRecords(): Promise<readonly DimensionalInformationState[]> {
    const fixture = getStandardInformationUniverseFixture();
    return fixture.states.filter((s) => s.classification === 'GREEN');
  }

  public async getRecordById(stateId: string): Promise<DimensionalInformationState | undefined> {
    const records = await this.getPermittedRecords();
    return records.find((r) => r.stateId === stateId);
  }
}
