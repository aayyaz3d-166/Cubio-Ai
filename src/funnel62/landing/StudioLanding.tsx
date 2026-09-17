/**
 * 3D Memory Studio — Funnel 62
 * Component: StudioLanding
 *
 * Interactive 3D Cube / Puzzle Landing Experience with central [ START ] action.
 */

import React, { useState, useRef, useEffect } from 'react';
import { LandingCubeState } from '../types';
import {
  createInitialLandingCubeState,
  rotateLandingCube,
  updateLandingCubeAutoRotate,
} from './landingCube';
import { Play, Box, Sparkles, Compass, ShieldCheck } from 'lucide-react';

interface StudioLandingProps {
  onStart: () => void;
  isTransitioning?: boolean;
}

export const StudioLanding: React.FC<StudioLandingProps> = ({
  onStart,
  isTransitioning = false,
}) => {
  const [cubeState, setCubeState] = useState<LandingCubeState>(createInitialLandingCubeState);
  const dragRef = useRef<{ isDown: boolean; startX: number; startY: number }>({
    isDown: false,
    startX: 0,
    startY: 0,
  });

  // Auto rotation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCubeState((prev) => {
        const next = { ...prev };
        updateLandingCubeAutoRotate(next, 0.03);
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { isDown: true, startX: e.clientX, startY: e.clientY };
    setCubeState((prev) => ({ ...prev, isDragging: true }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDown) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;

    setCubeState((prev) => {
      const next = { ...prev };
      rotateLandingCube(next, dx, dy);
      return next;
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDown = false;
    setCubeState((prev) => ({ ...prev, isDragging: false }));
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-screen h-screen bg-[#070709] flex flex-col items-center justify-center select-none overflow-hidden font-mono cursor-grab active:cursor-grabbing"
    >
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="absolute top-8 flex flex-col items-center gap-1.5 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 backdrop-blur-md border border-cyan-900/50 rounded-full text-cyan-400 text-xs font-bold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>3D Memory Studio Research</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          3D MEMORY STUDIO
        </h1>
        <p className="text-xs text-zinc-400">
          Deterministic Computational 3D Spatial Knowledge Universe
        </p>
      </div>

      {/* Interactive 3D CSS Cube Representation */}
      <div
        className={`relative z-10 my-8 transition-transform duration-500 ${
          isTransitioning ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          perspective: '1000px',
        }}
      >
        <div
          className="relative w-44 h-44 transition-transform duration-75"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${cubeState.rotationX}deg) rotateY(${cubeState.rotationY}deg)`,
          }}
        >
          {/* 6 Faces of the 3D Studio Cube */}
          <div
            className="absolute inset-0 border border-cyan-500/60 bg-cyan-950/30 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-cyan-500/20 rounded-xl"
            style={{ transform: 'translateZ(88px)' }}
          >
            <Box className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
          <div
            className="absolute inset-0 border border-amber-500/60 bg-amber-950/30 backdrop-blur-xs flex items-center justify-center rounded-xl"
            style={{ transform: 'rotateY(180deg) translateZ(88px)' }}
          >
            <Compass className="w-12 h-12 text-amber-400" />
          </div>
          <div
            className="absolute inset-0 border border-emerald-500/60 bg-emerald-950/30 backdrop-blur-xs flex items-center justify-center rounded-xl"
            style={{ transform: 'rotateY(-90deg) translateZ(88px)' }}
          >
            <span className="text-xl font-bold text-emerald-400">Z3</span>
          </div>
          <div
            className="absolute inset-0 border border-purple-500/60 bg-purple-950/30 backdrop-blur-xs flex items-center justify-center rounded-xl"
            style={{ transform: 'rotateY(90deg) translateZ(88px)' }}
          >
            <span className="text-xl font-bold text-purple-400">Z16</span>
          </div>
          <div
            className="absolute inset-0 border border-blue-500/60 bg-blue-950/30 backdrop-blur-xs flex items-center justify-center rounded-xl"
            style={{ transform: 'rotateX(90deg) translateZ(88px)' }}
          >
            <ShieldCheck className="w-12 h-12 text-blue-400" />
          </div>
          <div
            className="absolute inset-0 border border-teal-500/60 bg-teal-950/30 backdrop-blur-xs flex items-center justify-center rounded-xl"
            style={{ transform: 'rotateX(-90deg) translateZ(88px)' }}
          >
            <span className="text-xs font-bold text-teal-300">STUDIO</span>
          </div>
        </div>
      </div>

      {/* Center [ START ] CTA Action */}
      <div className="relative z-20 flex flex-col items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          disabled={isTransitioning}
          className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm rounded-xl shadow-xl shadow-cyan-500/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-black text-black group-hover:translate-x-0.5 transition-transform" />
          <span>START</span>
        </button>

        <span className="text-[11px] text-zinc-500">
          Click & Drag Cube to Rotate • Click START to Enter
        </span>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 flex items-center gap-6 text-[10px] text-zinc-600 font-mono">
        <span>F55–F61 RENDER INFRASTRUCTURE</span>
        <span>•</span>
        <span>DETERMINISTIC 3D GRAPH & CLUSTERS</span>
        <span>•</span>
        <span>F47 SECURITY BOUNDARY ACTIVE</span>
      </div>
    </div>
  );
};
