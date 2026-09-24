/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F52: Project Structure Analyzer
 *
 * File hierarchy parsing, purpose classification, directory depth calculation,
 * and project entry point detection.
 */

import { deterministicHash } from '../../../state/determinism';
import { FilePurpose, ProjectFileNode, ProjectStructureReport } from './types';

/**
 * Classifies a file path into its primary architectural purpose.
 */
export function classifyFilePurpose(filePath: string): FilePurpose {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();

  if (/(dist|build|out|\.next|\.output|\.cache)\//.test(norm)) {
    return 'BUILD_OUTPUT';
  }
  if (/(\.test\.|\.spec\.|test_|tests\/|__tests__\/)/.test(norm)) {
    return 'TEST';
  }
  if (/(\.md|\.txt|\.rst|docs\/|documentation\/|readme|license)/.test(norm)) {
    return 'DOCUMENTATION';
  }
  if (/(\.schema\.json|\.prisma|\.graphql|\.proto|schema)/.test(norm)) {
    return 'SCHEMA';
  }
  if (/(tsconfig|\.eslintrc|\.prettierrc|package\.json|cargo\.toml|pyproject\.toml|vite\.config|\.env)/.test(norm)) {
    return 'CONFIG';
  }
  if (/(\.png|\.jpg|\.jpeg|\.svg|\.webp|\.ico|\.obj|\.gltf|\.glb|\.wav|\.mp3|\.ogg|\.hdr)/.test(norm)) {
    return 'ASSET';
  }
  if (/(\.ts|\.tsx|\.js|\.jsx|\.py|\.rs|\.cpp|\.c|\.h|\.glsl|\.frag|\.vert|\.sql|\.html|\.css)/.test(norm)) {
    return 'SOURCE_CODE';
  }

  return 'UNKNOWN';
}

/**
 * Determines if a file is an architectural entry point.
 */
export function isProjectEntryPoint(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  return /(index\.(ts|tsx|js|jsx)|main\.(ts|tsx|js|jsx|py|rs)|app\.(ts|tsx|js|jsx|py)|server\.(ts|js)|lib\.rs|mod\.rs)$/.test(norm);
}

/**
 * Analyzes a collection of project files into a ProjectStructureReport.
 */
export function analyzeProjectStructure(
  files: Readonly<Record<string, string | number>>
): Readonly<ProjectStructureReport> {
  const filePaths = Object.keys(files);
  const totalFiles = filePaths.length;

  const directories = new Set<string>();
  let totalLines = 0;
  const entryPoints: string[] = [];

  const purposeDistribution: Record<FilePurpose, number> = {
    SOURCE_CODE: 0,
    TEST: 0,
    CONFIG: 0,
    SCHEMA: 0,
    DOCUMENTATION: 0,
    ASSET: 0,
    BUILD_OUTPUT: 0,
    UNKNOWN: 0,
  };

  for (const path of filePaths) {
    const norm = path.replace(/\\/g, '/');
    const parts = norm.split('/');
    if (parts.length > 1) {
      directories.add(parts.slice(0, -1).join('/'));
    }

    const purpose = classifyFilePurpose(norm);
    purposeDistribution[purpose] = (purposeDistribution[purpose] || 0) + 1;

    if (isProjectEntryPoint(norm)) {
      entryPoints.push(norm);
    }

    const contentOrSize = files[path];
    if (typeof contentOrSize === 'string') {
      totalLines += contentOrSize.split('\n').length;
    } else {
      totalLines += Math.round(contentOrSize / 40); // estimate lines from byte size
    }
  }

  const structureChecksum = deterministicHash(
    `STRUCT:${totalFiles}:${directories.size}:${totalLines}:${JSON.stringify(purposeDistribution)}`
  );

  return Object.freeze({
    totalFiles,
    totalDirectories: directories.size,
    totalLines,
    purposeDistribution: Object.freeze(purposeDistribution),
    entryPoints: Object.freeze(entryPoints),
    structureChecksum,
  });
}
