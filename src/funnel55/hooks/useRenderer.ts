/**
 * 3D Memory Studio — Funnel 55
 * Hook: useRenderer
 *
 * Connects MemoryRendererHost to a canvas ref with resize observer and unmount cleanup.
 */

import React, { useRef, useEffect, useState } from 'react';
import { MemoryRendererHost, RendererHostOptions } from '../renderer/rendererHost';
import { RendererStats } from '../types';

export function useRenderer(options: RendererHostOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [host] = useState(() => new MemoryRendererHost(options));
  const [stats, setStats] = useState<RendererStats>(() => host.getStats());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      host.attach(canvas);
      host.start();
    }

    // Interval for stats telemetry
    const statsInterval = setInterval(() => {
      setStats(host.getStats());
    }, 250);

    return () => {
      clearInterval(statsInterval);
      host.dispose();
    };
  }, [host]);

  // Resize Observer for responsive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          host.resize(width, height);
        }
      }
    });

    observer.observe(canvas.parentElement || canvas);
    return () => observer.disconnect();
  }, [host]);

  return {
    canvasRef,
    host,
    stats,
  };
}
