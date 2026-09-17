/**
 * 3D Memory Studio — Funnel 64
 * Workspace Layout Engine
 */

import { WorkspaceLayoutType, ViewportBounds } from '../types';

export class WorkspaceLayoutEngine {
  private currentLayout: WorkspaceLayoutType = 'SIDEBAR';

  public setLayout(layout: WorkspaceLayoutType): void {
    this.currentLayout = layout;
  }

  public get layout(): WorkspaceLayoutType {
    return this.currentLayout;
  }

  public calculateViewportBounds(
    containerWidth: number,
    containerHeight: number,
    sidebarWidth = 320,
    secondaryWidth = 320
  ): ViewportBounds {
    const safeW = Math.max(100, containerWidth);
    const safeH = Math.max(100, containerHeight);

    switch (this.currentLayout) {
      case 'FULL':
      case 'OVERLAY':
        return { x: 0, y: 0, width: safeW, height: safeH };

      case 'SIDEBAR': {
        const w = Math.max(100, safeW - sidebarWidth);
        return { x: sidebarWidth, y: 0, width: w, height: safeH };
      }

      case 'SPLIT': {
        const halfW = Math.floor(safeW / 2);
        return { x: halfW, y: 0, width: halfW, height: safeH };
      }

      case 'THREE_COLUMN': {
        const w = Math.max(100, safeW - sidebarWidth - secondaryWidth);
        return { x: sidebarWidth, y: 0, width: w, height: safeH };
      }

      case 'BOTTOM_PANEL': {
        const h = Math.max(100, safeH - 240);
        return { x: 0, y: 0, width: safeW, height: h };
      }

      case 'FOCUS':
      default:
        return { x: 0, y: 0, width: safeW, height: safeH };
    }
  }
}
