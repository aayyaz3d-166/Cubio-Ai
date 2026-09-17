import { deterministicHash } from '../../state/determinism';

export class CanonicalSerializer {
  public serializeDeterministic(obj: unknown): string {
    return JSON.stringify(this.sortKeysDeep(obj));
  }

  public computeDigest(obj: unknown): string {
    const canonicalStr = this.serializeDeterministic(obj);
    return deterministicHash(canonicalStr);
  }

  private sortKeysDeep(val: unknown): unknown {
    if (val === null || typeof val !== 'object') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(item => this.sortKeysDeep(item));
    }
    const record = val as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = this.sortKeysDeep(record[key]);
    }
    return result;
  }
}
