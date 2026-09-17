/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.8: Space Repository
 *
 * Safe repository abstraction for isolated Personal Spaces.
 */

import { PersonalSpace } from './types';

export class SpaceRepository {
  private spaces: Map<string, PersonalSpace> = new Map();

  public create(space: PersonalSpace): void {
    if (this.spaces.has(space.spaceId)) {
      throw new Error(`Space with ID ${space.spaceId} already exists in repository.`);
    }
    this.spaces.set(space.spaceId, space);
  }

  public get(spaceId: string): PersonalSpace | undefined {
    return this.spaces.get(spaceId);
  }

  public list(): readonly PersonalSpace[] {
    return Object.freeze(Array.from(this.spaces.values()));
  }

  public update(space: PersonalSpace): void {
    if (!this.spaces.has(space.spaceId)) {
      throw new Error(`Cannot update non-existent space ${space.spaceId}.`);
    }
    this.spaces.set(space.spaceId, space);
  }

  public delete(spaceId: string): boolean {
    return this.spaces.delete(spaceId);
  }

  public search(query: string): readonly PersonalSpace[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.list();
    return Object.freeze(
      Array.from(this.spaces.values()).filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.spaceId.toLowerCase().includes(q) ||
          s.metadata.tags.some((t) => t.toLowerCase().includes(q))
      )
    );
  }

  public clear(): void {
    this.spaces.clear();
  }
}
