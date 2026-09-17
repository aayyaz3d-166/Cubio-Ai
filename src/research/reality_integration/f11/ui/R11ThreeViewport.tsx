/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F11: 3D World Viewport
 *
 * Visualizes World Model entities and canonical Reality Anchor [5, 3, 6] in WebGL.
 */

import React from 'react';
import { R9ThreeViewport } from '../../r9/ui/R9ThreeViewport';
import { WorkspaceGeometry } from '../../r9/types';

export interface R11ThreeViewportProps {
  readonly geometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly selectedGeometryId: string | null;
  readonly onSelectGeometry: (geometryId: string) => void;
}

export const R11ThreeViewport: React.FC<R11ThreeViewportProps> = ({
  geometries,
  selectedGeometryId,
  onSelectGeometry,
}) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#070B14' }}>
      <R9ThreeViewport
        geometries={geometries}
        selectedGeometryId={selectedGeometryId}
        onSelectGeometry={onSelectGeometry}
      />
    </div>
  );
};
