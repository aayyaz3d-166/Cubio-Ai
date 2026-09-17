/**
 * 3D Memory Studio — Funnel 60
 * Dimension Visibility Manager
 */

export class DimensionVisibilityManager {
  private showGrid = true;
  private showAxes = true;
  private showProjectionGuides = true;
  private showLabels = true;

  public get isGridVisible(): boolean {
    return this.showGrid;
  }

  public set isGridVisible(v: boolean) {
    this.showGrid = v;
  }

  public get isAxesVisible(): boolean {
    return this.showAxes;
  }

  public set isAxesVisible(v: boolean) {
    this.showAxes = v;
  }

  public get isProjectionGuidesVisible(): boolean {
    return this.showProjectionGuides;
  }

  public set isProjectionGuidesVisible(v: boolean) {
    this.showProjectionGuides = v;
  }

  public get isLabelsVisible(): boolean {
    return this.showLabels;
  }

  public set isLabelsVisible(v: boolean) {
    this.showLabels = v;
  }
}
