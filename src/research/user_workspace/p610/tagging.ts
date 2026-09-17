/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Tagging Engine
 *
 * Manages user-defined tags on indexed workspace entities.
 */

import { IndexRecord } from './types';

export class TaggingEngine {
  public static addTag(record: IndexRecord, tag: string): IndexRecord {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag || record.tags.includes(cleanTag)) {
      return record;
    }

    return Object.freeze({
      ...record,
      tags: Object.freeze([...record.tags, cleanTag]),
      updatedAt: 0,
    });
  }

  public static removeTag(record: IndexRecord, tag: string): IndexRecord {
    const cleanTag = tag.trim().toLowerCase();
    return Object.freeze({
      ...record,
      tags: Object.freeze(record.tags.filter((t) => t.toLowerCase() !== cleanTag)),
      updatedAt: 0,
    });
  }
}
