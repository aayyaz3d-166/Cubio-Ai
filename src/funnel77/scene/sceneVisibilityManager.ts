/**
 * 3D Memory Studio — Funnel 77
 * Scene Visibility Manager
 */

export class SceneVisibilityManager {
  private showAxes = true;
  private showGrid = true;
  private showLabels = true;

  public setAxesVisible(visible: boolean): void {
    this.showAxes = visible;
  }

  public setGridVisible(visible: boolean): void {
    this.showGrid = visible;
  }

  public setLabelsVisible(visible: boolean): void {
    this.showLabels = visible;
  }

  public areAxesVisible(): boolean {
    return this.showAxes;
  }

  public isGridVisible(): boolean {
    return this.showGrid;
  }

  public areLabelsVisible(): boolean {
    return this.showLabels;
  }
}
