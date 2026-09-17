/**
 * 3D Memory Studio — Funnel 63
 * Touch & Swipe Event Adapter
 */

export interface TouchDragEvent {
  deltaX: number;
  deltaY: number;
}

export class TouchAdapter {
  private isTouching = false;
  private lastTouchX = 0;
  private lastTouchY = 0;

  public onTouchStart(clientX: number, clientY: number): void {
    this.isTouching = true;
    this.lastTouchX = clientX;
    this.lastTouchY = clientY;
  }

  public onTouchMove(clientX: number, clientY: number): TouchDragEvent | null {
    if (!this.isTouching) return null;

    const deltaX = clientX - this.lastTouchX;
    const deltaY = clientY - this.lastTouchY;

    this.lastTouchX = clientX;
    this.lastTouchY = clientY;

    return { deltaX, deltaY };
  }

  public onTouchEnd(): void {
    this.isTouching = false;
  }

  public get isDragging(): boolean {
    return this.isTouching;
  }
}
