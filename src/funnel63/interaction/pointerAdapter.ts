/**
 * 3D Memory Studio — Funnel 63
 * Pointer & Mouse Event Adapter
 */

export interface PointerDragEvent {
  deltaX: number;
  deltaY: number;
}

export class PointerAdapter {
  private isPointerDown = false;
  private lastX = 0;
  private lastY = 0;

  public onPointerDown(clientX: number, clientY: number): void {
    this.isPointerDown = true;
    this.lastX = clientX;
    this.lastY = clientY;
  }

  public onPointerMove(clientX: number, clientY: number): PointerDragEvent | null {
    if (!this.isPointerDown) return null;

    const deltaX = clientX - this.lastX;
    const deltaY = clientY - this.lastY;

    this.lastX = clientX;
    this.lastY = clientY;

    return { deltaX, deltaY };
  }

  public onPointerUp(): void {
    this.isPointerDown = false;
  }

  public get isDragging(): boolean {
    return this.isPointerDown;
  }
}
