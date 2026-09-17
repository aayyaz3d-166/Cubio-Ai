/**
 * 3D Memory Studio — Funnel 76
 * Data Boot Adapter (F71 Integration)
 */

import { StudioDataRepository } from '../../funnel71/data/studioDataRepository';

export class DataBootAdapter {
  public async checkReadiness(repository?: StudioDataRepository): Promise<{ ready: boolean; error?: string }> {
    try {
      const activeRepo = repository ?? new StudioDataRepository();
      await activeRepo.initialize();
      const records = await activeRepo.getRecords();
      return { ready: Array.isArray(records) };
    } catch (err: any) {
      return { ready: false, error: err?.message || 'Data persistence check failed' };
    }
  }
}
