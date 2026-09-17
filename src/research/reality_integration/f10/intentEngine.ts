/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Intent Extraction Engine
 *
 * Deterministically extracts AIIntentType and SemanticSlots from natural language utterances.
 */

import { AIIntentType, SpatialRelationType, SpatialAxis } from './types';
import { SemanticSlots, ParsedUtterance, LanguageToken } from './languageTypes';
import { GeometryPrimitiveType, BooleanOperationType, MeasurementType } from '../r9/types';

export class F10IntentEngine {
  public static parseUtterance(rawText: string): ParsedUtterance {
    const text = rawText.trim();
    const normalized = text.toLowerCase().replace(/[.,!?;:]/g, '');
    const tokens: LanguageToken[] = normalized.split(/\s+/).filter(Boolean).map((t) => ({
      text: t,
      normalized: t,
    }));

    const slots = this.extractSlots(normalized, tokens);

    return {
      rawText: text,
      normalizedText: normalized,
      tokens,
      slots,
      parseConfidence: slots.intent === 'UNKNOWN' ? 0.0 : 0.95,
    };
  }

  private static extractSlots(normalized: string, tokens: readonly LanguageToken[]): SemanticSlots {
    let intent: AIIntentType = 'UNKNOWN';
    let primitive: GeometryPrimitiveType | undefined;
    let quantity = 1;
    let targetNoun: string | undefined;
    let pronoun: 'IT' | 'THAT' | 'THIS' | 'THEM' | 'ALL' | undefined;
    let spatialRelation: SpatialRelationType | undefined;
    let referenceNoun: string | undefined;
    let distance: number | undefined;
    let axis: SpatialAxis | undefined;
    let direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'FORWARD' | 'BACKWARD' | undefined;
    let degrees: number | undefined;
    let scaleFactor: number | undefined;
    let booleanOp: BooleanOperationType | undefined;
    let measurementType: MeasurementType | undefined;
    let queryType: 'LOCATION' | 'ORIGIN' | 'DIMENSION' | 'LINEAGE' | 'REALITY' | 'GENERAL' | undefined;

    // Detect Pronouns
    if (/\bit\b/.test(normalized)) pronoun = 'IT';
    else if (/\bthat\b/.test(normalized)) pronoun = 'THAT';
    else if (/\bthis\b/.test(normalized)) pronoun = 'THIS';
    else if (/\bthem\b/.test(normalized)) pronoun = 'THEM';
    else if (/\ball\b/.test(normalized)) pronoun = 'ALL';

    // Detect Quantities
    const numMatch = normalized.match(/\b(two|three|four|five|\d+)\b/);
    if (numMatch) {
      const val = numMatch[1];
      if (val === 'two') quantity = 2;
      else if (val === 'three') quantity = 3;
      else if (val === 'four') quantity = 4;
      else if (val === 'five') quantity = 5;
      else if (/^\d+$/.test(val)) quantity = parseInt(val, 10);
    }

    // Detect Spatial Relations
    if (/\babove\b|\bon top of\b/.test(normalized)) spatialRelation = 'ABOVE';
    else if (/\bbelow\b|\bunder\b|\bunderneath\b/.test(normalized)) spatialRelation = 'BELOW';
    else if (/\bto the left of\b|\bleft of\b/.test(normalized)) spatialRelation = 'LEFT_OF';
    else if (/\bto the right of\b|\bright of\b/.test(normalized)) spatialRelation = 'RIGHT_OF';
    else if (/\bbeside\b|\bnext to\b/.test(normalized)) spatialRelation = 'BESIDE';
    else if (/\bin front of\b/.test(normalized)) spatialRelation = 'IN_FRONT_OF';
    else if (/\bbehind\b/.test(normalized)) spatialRelation = 'BEHIND';
    else if (/\bnear\b/.test(normalized)) spatialRelation = 'NEAR';
    else if (/\binside\b/.test(normalized)) spatialRelation = 'INSIDE';
    else if (/\bcentered on\b|\bcenter on\b/.test(normalized)) spatialRelation = 'CENTERED_ON';

    // Detect Spatial Directions
    if (/\bleft\b/.test(normalized)) direction = 'LEFT';
    else if (/\bright\b/.test(normalized)) direction = 'RIGHT';
    else if (/\bup\b|\bupward\b/.test(normalized)) direction = 'UP';
    else if (/\bdown\b|\bdownward\b/.test(normalized)) direction = 'DOWN';
    else if (/\bforward\b/.test(normalized)) direction = 'FORWARD';
    else if (/\bbackward\b|\bback\b/.test(normalized)) direction = 'BACKWARD';

    // Detect Axis
    if (/\bon x\b|\bx axis\b|\bx\b/.test(normalized)) axis = 'X';
    else if (/\bon y\b|\by axis\b|\by\b/.test(normalized)) axis = 'Y';
    else if (/\bon z\b|\bz axis\b|\bz\b/.test(normalized)) axis = 'Z';

    // Parse Target Noun and Reference Noun based on preposition split if spatial relation exists
    if (spatialRelation) {
      const parts = normalized.split(/\b(?:above|on top of|below|under|underneath|to the left of|left of|to the right of|right of|beside|next to|in front of|behind|near|inside|centered on)\b/);
      if (parts.length >= 2) {
        const before = parts[0];
        const after = parts[1];

        // Before preposition is target
        if (/\b(cube|box)\b/.test(before)) { targetNoun = 'BOX'; primitive = 'BOX'; }
        else if (/\b(sphere|ball)\b/.test(before)) { targetNoun = 'SPHERE'; primitive = 'SPHERE'; }
        else if (/\b(cylinder|tube)\b/.test(before)) { targetNoun = 'CYLINDER'; primitive = 'CYLINDER'; }
        else if (/\bcone\b/.test(before)) { targetNoun = 'CONE'; primitive = 'CONE'; }
        else if (/\b(torus|donut)\b/.test(before)) { targetNoun = 'TORUS'; primitive = 'TORUS'; }
        else if (/\b(plane|floor)\b/.test(before)) { targetNoun = 'PLANE'; primitive = 'PLANE'; }

        // After preposition is reference
        if (/\b(cube|box)\b/.test(after)) referenceNoun = 'BOX';
        else if (/\b(sphere|ball)\b/.test(after)) referenceNoun = 'SPHERE';
        else if (/\b(cylinder|tube)\b/.test(after)) referenceNoun = 'CYLINDER';
        else if (/\bcone\b/.test(after)) referenceNoun = 'CONE';
        else if (/\b(torus|donut)\b/.test(after)) referenceNoun = 'TORUS';
        else if (/\b(plane|floor)\b/.test(after)) referenceNoun = 'PLANE';
      }
    } else {
      // Direct single noun detection
      if (/\b(cube|box)\b/.test(normalized)) { primitive = 'BOX'; targetNoun = 'BOX'; }
      else if (/\b(sphere|ball)\b/.test(normalized)) { primitive = 'SPHERE'; targetNoun = 'SPHERE'; }
      else if (/\b(cylinder|tube)\b/.test(normalized)) { primitive = 'CYLINDER'; targetNoun = 'CYLINDER'; }
      else if (/\bcone\b/.test(normalized)) { primitive = 'CONE'; targetNoun = 'CONE'; }
      else if (/\b(torus|donut)\b/.test(normalized)) { primitive = 'TORUS'; targetNoun = 'TORUS'; }
      else if (/\b(plane|floor|ground)\b/.test(normalized)) { primitive = 'PLANE'; targetNoun = 'PLANE'; }
    }

    // 1. UNDO / REDO
    if (/\bundo\b|\brevert\b/.test(normalized)) {
      intent = 'UNDO';
    } else if (/\bredo\b/.test(normalized)) {
      intent = 'REDO';
    }
    // 2. CREATE
    else if (/\b(create|make|add|spawn|generate|build|new)\b/.test(normalized) && (primitive || /\bobject\b/.test(normalized))) {
      intent = 'CREATE';
    }
    // 3. SELECT / DESELECT
    else if (/\b(deselect|unselect|clear selection)\b/.test(normalized)) {
      intent = 'DESELECT';
    } else if (/\b(select|pick|choose|focus|highlight)\b/.test(normalized)) {
      intent = 'SELECT';
    }
    // 4. SCALE
    else if (
      /\b(scale|enlarge|shrink|bigger|smaller|twice|half|double|triple|size)\b/.test(normalized) ||
      /\b\d+(\.\d+)?(x|%| percent)\b/.test(normalized)
    ) {
      intent = 'SCALE';
      if (/\btwice\b|\bdouble\b|\b2x\b|\b200%\b/.test(normalized)) scaleFactor = 2.0;
      else if (/\btriple\b|\b3x\b|\b300%\b/.test(normalized)) scaleFactor = 3.0;
      else if (/\bhalf\b|\b50%\b|\b0\.5x\b/.test(normalized)) scaleFactor = 0.5;
      else if (/\bbigger\b|\blarger\b/.test(normalized)) scaleFactor = 1.25;
      else if (/\bsmaller\b/.test(normalized)) scaleFactor = 0.8;
      else {
        const factorMatch = normalized.match(/(\d+(\.\d+)?)\s*(x|%|percent)?/);
        if (factorMatch) {
          const num = parseFloat(factorMatch[1]);
          if (factorMatch[3] === '%' || factorMatch[3] === 'percent') scaleFactor = num / 100;
          else scaleFactor = num;
        }
      }
    }
    // 5. ROTATE
    else if (/\b(rotate|turn|spin|orient)\b/.test(normalized) || /\bdegrees?\b|\bdeg\b/.test(normalized)) {
      intent = 'ROTATE';
      const degMatch = normalized.match(/(\d+)\s*(degrees?|deg)?/);
      if (degMatch) degrees = parseFloat(degMatch[1]);
      else degrees = 45;
    }
    // 6. MOVE / TRANSLATE / PUT / PLACE
    else if (/\b(move|translate|put|place|position|shift|relocate)\b/.test(normalized) || spatialRelation || direction) {
      intent = 'MOVE';
      const distMatch = normalized.match(/(\d+(\.\d+)?)\s*(units?|m|meters?)?/);
      if (distMatch) distance = parseFloat(distMatch[1]);
      else distance = 2.0;
    }
    // 7. DELETE / REMOVE
    else if (/\b(delete|remove|destroy|erase)\b/.test(normalized)) {
      intent = 'DELETE';
    }
    // 8. DUPLICATE / COPY
    else if (/\b(duplicate|copy|clone)\b/.test(normalized)) {
      intent = 'DUPLICATE';
    }
    // 9. HIDE / SHOW
    else if (/\b(hide|invisible|conceal)\b/.test(normalized)) {
      intent = 'HIDE';
    } else if (/\b(show|unhide|visible|reveal)\b/.test(normalized)) {
      intent = 'SHOW';
    }
    // 10. RESET
    else if (/\b(reset|clear all|clean workspace)\b/.test(normalized)) {
      intent = 'RESET';
    }
    // 11. MEASURE
    else if (/\b(measure|distance|length|area|volume|calculate)\b/.test(normalized)) {
      intent = 'MEASURE';
      if (/\barea\b/.test(normalized)) measurementType = 'AREA';
      else if (/\bvolume\b/.test(normalized)) measurementType = 'VOLUME';
      else if (/\blength\b/.test(normalized)) measurementType = 'LENGTH';
      else measurementType = 'DISTANCE';
    }
    // 12. BOOLEAN
    else if (/\b(boolean|union|subtract|intersect|combine|cut)\b/.test(normalized)) {
      intent = 'BOOLEAN';
      if (/\bunion|combine\b/.test(normalized)) booleanOp = 'UNION';
      else if (/\bsubtract|cut\b/.test(normalized)) booleanOp = 'SUBTRACT';
      else if (/\bintersect\b/.test(normalized)) booleanOp = 'INTERSECT';
    }
    // 13. MESH EDITS
    else if (/\bextrude\b/.test(normalized)) intent = 'EXTRUDE';
    else if (/\binset\b/.test(normalized)) intent = 'INSET';
    else if (/\bbevel\b/.test(normalized)) intent = 'BEVEL';
    else if (/\bchamfer\b/.test(normalized)) intent = 'CHAMFER';
    else if (/\bfillet\b/.test(normalized)) intent = 'FILLET';
    else if (/\bsubdivide|smooth\b/.test(normalized)) intent = 'SUBDIVIDE';
    else if (/\bmirror\b/.test(normalized)) intent = 'MIRROR';
    else if (/\barray|repeat\b/.test(normalized)) intent = 'ARRAY';
    // 14. QUERY
    else if (/\b(why|what|where|how|who|is|tell me|show me|explain|inspect)\b/.test(normalized)) {
      intent = 'QUERY';
      if (/\breality\b/.test(normalized)) queryType = 'REALITY';
      else if (/\bwhere|location|position\b/.test(normalized)) queryType = 'LOCATION';
      else if (/\bwhy|reason|lineage|origin\b/.test(normalized)) queryType = 'LINEAGE';
      else if (/\bdimension|size\b/.test(normalized)) queryType = 'DIMENSION';
      else queryType = 'GENERAL';
    }
    // 15. HELP
    else if (/\b(help|commands|options|what can you do)\b/.test(normalized)) {
      intent = 'HELP';
    }

    return {
      intent,
      primitive,
      quantity,
      targetNoun,
      pronoun,
      spatialRelation,
      referenceNoun,
      distance,
      axis,
      direction,
      degrees,
      scaleFactor,
      booleanOp,
      measurementType,
      queryType,
    };
  }
}
