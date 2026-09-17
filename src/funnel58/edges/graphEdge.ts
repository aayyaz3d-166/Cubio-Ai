/**
 * 3D Memory Studio — Funnel 58
 * Graph Edge Mesh Wrapper (Three.js Line)
 */

import * as THREE from 'three';
import { IGraphEdgeMesh, GraphRelationship, GraphEdgeForm } from '../types';
import { createStraightEdgeGeometry, createCurvedEdgeGeometry, updateEdgeGeometryBuffer } from './edgeGeometry';
import { EdgeMaterialManager } from './edgeMaterial';

export class GraphEdgeMesh implements IGraphEdgeMesh {
  public readonly id: string;
  public readonly relationship: GraphRelationship;
  public readonly lineObject: THREE.Line;
  private form: GraphEdgeForm;
  private materialManager: EdgeMaterialManager;
  private isDisposed = false;

  constructor(
    relationship: GraphRelationship,
    materialManager: EdgeMaterialManager,
    form: GraphEdgeForm = 'STRAIGHT'
  ) {
    this.id = relationship.relationshipId;
    this.relationship = relationship;
    this.form = form;
    this.materialManager = materialManager;

    const geo =
      form === 'STRAIGHT'
        ? createStraightEdgeGeometry(relationship.sourcePos, relationship.targetPos)
        : createCurvedEdgeGeometry(relationship.sourcePos, relationship.targetPos);

    const mat = materialManager.getMaterialForType(
      relationship.relationshipType,
      relationship.strength,
      relationship.highlighted,
      relationship.selected
    );

    this.lineObject = new THREE.Line(geo, mat);
    this.lineObject.visible = relationship.visible;
  }

  public get visible(): boolean {
    return this.lineObject.visible;
  }

  public set visible(val: boolean) {
    this.lineObject.visible = val;
    this.relationship.visible = val;
  }

  public updateEndpoints(
    src: [number, number, number],
    tgt: [number, number, number]
  ): void {
    if (this.isDisposed) return;
    this.relationship.sourcePos = [...src];
    this.relationship.targetPos = [...tgt];
    updateEdgeGeometryBuffer(this.lineObject.geometry, this.form, src, tgt);
  }

  public setHighlighted(highlighted: boolean): void {
    if (this.isDisposed) return;
    this.relationship.highlighted = highlighted;
    this.lineObject.material = this.materialManager.getMaterialForType(
      this.relationship.relationshipType,
      this.relationship.strength,
      highlighted,
      this.relationship.selected
    );
  }

  public setSelected(selected: boolean): void {
    if (this.isDisposed) return;
    this.relationship.selected = selected;
    this.lineObject.material = this.materialManager.getMaterialForType(
      this.relationship.relationshipType,
      this.relationship.strength,
      this.relationship.highlighted,
      selected
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.lineObject.geometry.dispose();
  }
}
