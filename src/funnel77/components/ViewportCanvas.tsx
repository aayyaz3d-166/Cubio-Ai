import React, { useEffect, useRef } from 'react';
import { CameraEngine } from '../../funnel61/camera/cameraEngine';

interface ViewportCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  camera?: CameraEngine;
  onInteract?: () => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  canvasRef,
  camera,
  onInteract,
}) => {
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'ORBIT' | 'PAN'>('ORBIT');
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      dragModeRef.current = e.button === 1 || e.shiftKey || e.button === 2 ? 'PAN' : 'ORBIT';
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for environments where setPointerCapture is unsupported
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !camera) return;

      const deltaX = e.clientX - lastPosRef.current.x;
      const deltaY = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      if (deltaX === 0 && deltaY === 0) return;

      if (dragModeRef.current === 'ORBIT') {
        camera.navigation.orbit(camera.state, deltaX * 0.4, -deltaY * 0.4);
      } else {
        camera.navigation.pan(camera.state, -deltaX * 0.2, deltaY * 0.2);
      }

      if (onInteract) {
        onInteract();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe release
      }
    };

    const handlePointerCancel = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!camera) return;
      e.preventDefault();
      const deltaDistance = e.deltaY > 0 ? 15 : -15;
      camera.navigation.zoom(camera.state, deltaDistance);
      if (onInteract) {
        onInteract();
      }
    };

    const handleDblClick = () => {
      if (!camera) return;
      camera.navigation.resetCamera(camera.state);
      if (onInteract) {
        onInteract();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('dblclick', handleDblClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDblClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canvasRef, camera, onInteract]);

  return (
    <canvas
      id="viewport-canvas-f77"
      ref={canvasRef as any}
      className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
    />
  );
};
