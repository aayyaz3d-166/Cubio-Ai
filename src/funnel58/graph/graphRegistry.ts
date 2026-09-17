/**
 * 3D Memory Studio — Funnel 58
 * Graph Registry with Fast Indexed Lookups
 */

import { GraphRelationship, GraphRelationshipType } from '../types';

export class GraphRegistry {
  private relationshipsById: Map<string, GraphRelationship> = new Map();
  private sourceIndex: Map<string, Set<string>> = new Map();
  private targetIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<GraphRelationshipType, Set<string>> = new Map();

  public registerRelationship(rel: GraphRelationship): boolean {
    if (this.relationshipsById.has(rel.relationshipId)) {
      return false; // Prevent duplicate IDs
    }

    this.relationshipsById.set(rel.relationshipId, rel);

    // Index by source
    let srcSet = this.sourceIndex.get(rel.sourceStateId);
    if (!srcSet) {
      srcSet = new Set();
      this.sourceIndex.set(rel.sourceStateId, srcSet);
    }
    srcSet.add(rel.relationshipId);

    // Index by target
    let tgtSet = this.targetIndex.get(rel.targetStateId);
    if (!tgtSet) {
      tgtSet = new Set();
      this.targetIndex.set(rel.targetStateId, tgtSet);
    }
    tgtSet.add(rel.relationshipId);

    // Index by type
    let typeSet = this.typeIndex.get(rel.relationshipType);
    if (!typeSet) {
      typeSet = new Set();
      this.typeIndex.set(rel.relationshipType, typeSet);
    }
    typeSet.add(rel.relationshipId);

    return true;
  }

  public removeRelationship(id: string): boolean {
    const rel = this.relationshipsById.get(id);
    if (!rel) return false;

    this.relationshipsById.delete(id);
    this.sourceIndex.get(rel.sourceStateId)?.delete(id);
    this.targetIndex.get(rel.targetStateId)?.delete(id);
    this.typeIndex.get(rel.relationshipType)?.delete(id);

    return true;
  }

  public getRelationship(id: string): GraphRelationship | undefined {
    return this.relationshipsById.get(id);
  }

  public hasRelationship(id: string): boolean {
    return this.relationshipsById.has(id);
  }

  public getBySource(sourceId: string): readonly GraphRelationship[] {
    const ids = this.sourceIndex.get(sourceId);
    if (!ids) return [];
    const list: GraphRelationship[] = [];
    for (const id of ids) {
      const r = this.relationshipsById.get(id);
      if (r) list.push(r);
    }
    return list;
  }

  public getByTarget(targetId: string): readonly GraphRelationship[] {
    const ids = this.targetIndex.get(targetId);
    if (!ids) return [];
    const list: GraphRelationship[] = [];
    for (const id of ids) {
      const r = this.relationshipsById.get(id);
      if (r) list.push(r);
    }
    return list;
  }

  public getByType(type: GraphRelationshipType): readonly GraphRelationship[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    const list: GraphRelationship[] = [];
    for (const id of ids) {
      const r = this.relationshipsById.get(id);
      if (r) list.push(r);
    }
    return list;
  }

  public getAll(): readonly GraphRelationship[] {
    return Array.from(this.relationshipsById.values());
  }

  public getVisible(): readonly GraphRelationship[] {
    const list: GraphRelationship[] = [];
    for (const rel of this.relationshipsById.values()) {
      if (rel.visible) list.push(rel);
    }
    return list;
  }

  public get count(): number {
    return this.relationshipsById.size;
  }

  public clear(): void {
    this.relationshipsById.clear();
    this.sourceIndex.clear();
    this.targetIndex.clear();
    this.typeIndex.clear();
  }
}
