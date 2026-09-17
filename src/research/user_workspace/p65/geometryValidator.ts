/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.5: Geometry Validator
 *
 * Implements rigorous checks on 3D mesh integrity, transform finiteness,
 * non-empty scenes, and duplicate ID detection.
 */

import { ModelScene3D, ValidationReport, ValidationStatus } from './types';
import { TransformController } from './transformController';
import { deterministicHash } from './determinism';

export class GeometryValidator {
  public static validateScene(scene: ModelScene3D): ValidationReport {
    const issues: string[] = [];
    let status: ValidationStatus = 'VALID';

    if (!scene.objects || scene.objects.length === 0) {
      return {
        status: 'EMPTY_MODEL',
        isValid: false,
        objectCount: 0,
        issues: ['Scene contains 0 model objects.'],
        checksum: scene.sceneChecksum,
      };
    }

    const seenIds = new Set<string>();

    for (const obj of scene.objects) {
      // 1. Identity Check
      if (!obj.modelObjectId || typeof obj.modelObjectId !== 'string') {
        issues.push(`Model object missing valid string ID: ${obj.name}`);
        status = 'INVALID_IDENTITY';
      }
      if (seenIds.has(obj.modelObjectId)) {
        issues.push(`Duplicate model object ID detected: ${obj.modelObjectId}`);
        status = 'INVALID_IDENTITY';
      }
      seenIds.add(obj.modelObjectId);

      // 2. Transform Check
      if (!TransformController.validateVector3(obj.transform.position)) {
        issues.push(`Non-finite position in object ${obj.modelObjectId}: [${obj.transform.position}]`);
        status = 'INVALID_TRANSFORM';
      }
      if (!TransformController.validateVector3(obj.transform.rotation)) {
        issues.push(`Non-finite rotation in object ${obj.modelObjectId}: [${obj.transform.rotation}]`);
        status = 'INVALID_TRANSFORM';
      }
      if (!TransformController.validateScale(obj.transform.scale)) {
        issues.push(`Invalid scale in object ${obj.modelObjectId}: [${obj.transform.scale}]`);
        status = 'INVALID_TRANSFORM';
      }

      // 3. Geometry Check
      const geo = obj.geometry;
      if (!geo || !Array.isArray(geo.vertices) || geo.vertices.length === 0) {
        issues.push(`Empty or missing geometry vertices in object ${obj.modelObjectId}`);
        status = 'INVALID_GEOMETRY';
      } else {
        for (let i = 0; i < geo.vertices.length; i++) {
          const v = geo.vertices[i];
          if (!Array.isArray(v) || v.length !== 3 || v.some((n) => typeof n !== 'number' || isNaN(n) || !isFinite(n))) {
            issues.push(`Vertex #${i} in ${obj.modelObjectId} contains non-finite values: [${v}]`);
            status = 'INVALID_GEOMETRY';
          }
        }
      }

      // 4. Bounding Box Check
      if (!geo.boundingBox || !Array.isArray(geo.boundingBox.dimensions) || geo.boundingBox.dimensions.some((d) => d < 0)) {
        issues.push(`Malformed bounding box in object ${obj.modelObjectId}`);
        status = 'INVALID_GEOMETRY';
      }
    }

    const isValid = issues.length === 0;
    const checksum = deterministicHash(JSON.stringify([status, isValid, issues, scene.sceneChecksum]));

    return Object.freeze({
      status: isValid ? 'VALID' : status,
      isValid,
      objectCount: scene.objects.length,
      issues: Object.freeze(issues),
      checksum,
    });
  }
}
