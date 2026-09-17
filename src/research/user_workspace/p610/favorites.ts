/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Favorites & Pinning Engine
 *
 * Manages pinned workspace entity metadata without mutating underlying Reality.
 */

import { IndexRecord } from './types';

export class FavoritesEngine {
  public static pinEntity(record: IndexRecord): IndexRecord {
    return Object.freeze({
      ...record,
      isPinned: true,
      status: 'PINNED',
      updatedAt: 0,
    });
  }

  public static unpinEntity(record: IndexRecord): IndexRecord {
    return Object.freeze({
      ...record,
      isPinned: false,
      status: 'ACTIVE',
      updatedAt: 0,
    });
  }
}
