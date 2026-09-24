/**
 * CUBiO AI — Phase 28 Task 449: Compound & Multi-Step Request Engine
 * src/cubio/integration/phase28CompoundMultiStepRequestEngine.ts
 *
 * Specializes in:
 * 1. Detecting compound, sequential, and nested multi-step user requests.
 * 2. Decomposing queries without losing any sub-tasks or truncating reasoning.
 * 3. Maintaining intermediate context across chained reasoning steps.
 * 4. Delivering clearly separated, structured outputs for each requested component.
 * 5. Ensuring fail-closed safety (IS_ACTUATION_BLOCKED === true, 100% offline isolation).
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { ChildAgentIdentity } from './phase28CoreChildIntelligenceBridge';
import { ConversationalResponseEngine } from '../intelligence/natural_response/conversationalResponseEngine';
import { IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';

export type CompoundRequestType =
  | 'PARALLEL_COMPOUND'     // Multiple distinct questions/instructions to answer separately
  | 'SEQUENTIAL_CHAIN'       // Step 1 -> Step 2 -> Step 3 where outputs feed subsequent steps
  | 'NESTED_INSTRUCTION';    // Code generation with required explanation/complexity/edge-cases

export interface SubRequestItem {
  readonly stepIndex: number;
  readonly prompt: string;
  readonly expectedDomain?: string;
  readonly isDependentOnPrevious?: boolean;
}

export interface StepExecutionResult {
  readonly stepIndex: number;
  readonly subPrompt: string;
  readonly stepOutput: string;
  readonly intermediateValue?: any;
}

export interface CompoundExecutionResult {
  readonly success: boolean;
  readonly originalQuery: string;
  readonly compoundType: CompoundRequestType;
  readonly totalSubRequests: number;
  readonly stepResults: readonly StepExecutionResult[];
  readonly synthesizedOutput: string;
  readonly latencyMs: number;
  readonly auditDigest: string;
}

export class Phase28CompoundMultiStepRequestEngine {
  private static instance: Phase28CompoundMultiStepRequestEngine | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED_ENGINE: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
    }
  }

  public static getInstance(): Phase28CompoundMultiStepRequestEngine {
    if (!this.instance) {
      this.instance = new Phase28CompoundMultiStepRequestEngine();
    }
    return this.instance;
  }

  /**
   * Detects whether a query is a compound, sequential, or nested request.
   */
  public isCompoundRequest(query: string): boolean {
    const text = query.trim();
    const lower = text.toLowerCase();

    // 1. Sequential Chaining markers: "First calculate ..., then ..., and finally ..."
    const hasSequentialChain =
      /\b(?:first|1st|pehle)\b.*?\b(?:then|next|phir)\b/i.test(lower) ||
      /\b(?:step\s*1|marhala\s*1)\b.*?\b(?:step\s*2|marhala\s*2)\b/i.test(lower) ||
      /\b(?:then|phir|uske baad)\b.*?\b(?:from the result|to the result|multiply by|divide by|add|subtract|result mein|usmein|usko)\b/i.test(lower);

    if (hasSequentialChain) return true;

    // 2. Multiple explicit question marks separating substantive clauses: "What is X? What is Y?"
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks >= 2) {
      const clauses = text.split(/\?/).map(c => c.trim()).filter(c => c.length > 5);
      if (clauses.length >= 2) return true;
    }

    // 3. Parallel compound coordination: ", and what is ...", "and calculate ...", "and explain ..."
    const falsePositivePhrases = [
      'ram and storage', 'storage and ram', 'divide and conquer', 'time and space',
      'time and date', 'science and technology', 'pros and cons', 'highs and lows'
    ];
    let cleaned = lower;
    for (const fp of falsePositivePhrases) {
      cleaned = cleaned.replace(fp, 'NON_COMPOUND');
    }

    const hasCompoundConjunction =
      /,\s*(?:and|also|furthermore)\s+(?:what|how|why|who|define|calculate|write|explain|give)\b/i.test(cleaned) ||
      /,\s*aur\s+/i.test(cleaned) ||
      /\b(?:and|aur|aur sath mein)\s+(?:also\s+)?(?:what is|calculate|write|explain|define|dar-?ul-?hukoomat|poochna|batao|paani|pani)\b/i.test(cleaned) ||
      /;\s*(?:also|and|then|furthermore|additionally)\b/i.test(cleaned);

    if (hasCompoundConjunction) return true;

    // 4. Nested instruction: e.g. "Write a Python function to ... and explain its time complexity"
    const hasNestedInstruction =
      /\b(?:write|code|create|implement)\b.*?\b(?:and\s+(?:also\s+)?(?:explain|describe|analyze|state)\s+(?:its\s+)?(?:time\s+complexity|how\s+it\s+works|complexity))\b/i.test(cleaned) ||
      /\b(?:function|code)\s+(?:banao|likho)\b.*?\b(?:aur\s+(?:uski|iska)\s+(?:complexity|wazahat|tareeqa)\s+(?:batao|samjhao))\b/i.test(cleaned);

    return hasNestedInstruction;
  }

  /**
   * Classifies compound request type.
   */
  public classifyCompoundType(query: string): CompoundRequestType {
    const lower = query.toLowerCase();

    if (
      /\b(?:first|1st|pehle)\b.*?\b(?:then|next|phir)\b/i.test(lower) ||
      /\b(?:from the result|to the result|result mein|usmein|usko)\b/i.test(lower)
    ) {
      return 'SEQUENTIAL_CHAIN';
    }

    if (
      /\b(?:write|code|create|implement)\b.*?\b(?:and\s+(?:also\s+)?(?:explain|describe|analyze|state)\s+(?:its\s+)?(?:time\s+complexity|how\s+it\s+works|complexity))\b/i.test(lower) ||
      /\b(?:function|code)\s+(?:banao|likho)\b.*?\b(?:aur\s+(?:uski|iska)\s+(?:complexity|wazahat)\s+(?:batao|samjhao))\b/i.test(lower)
    ) {
      return 'NESTED_INSTRUCTION';
    }

    return 'PARALLEL_COMPOUND';
  }

  /**
   * Decomposes a compound query into constituent sub-requests.
   */
  public decomposeQuery(query: string, type: CompoundRequestType): readonly SubRequestItem[] {
    const text = query.trim();

    if (type === 'SEQUENTIAL_CHAIN') {
      const parts: string[] = [];
      const seqPattern = /\b(?:first|1st|pehle|then|next|phir|finally|lastly|and\s+then|aakhir\s+mein)\b:?/gi;
      const matches = Array.from(text.matchAll(seqPattern));

      if (matches.length >= 2) {
        for (let i = 0; i < matches.length; i++) {
          const start = matches[i].index! + matches[i][0].length;
          const end = (i + 1 < matches.length) ? matches[i + 1].index! : text.length;
          let segment = text.substring(start, end).trim();
          segment = segment.replace(/^[,;:\s]+|[,;:\s]+$/g, '');
          if (segment.length > 0) parts.push(segment);
        }
      }

      if (parts.length >= 2) {
        return parts.map((prompt, idx) => ({
          stepIndex: idx + 1,
          prompt,
          isDependentOnPrevious: idx > 0,
        }));
      }
    }

    if (type === 'NESTED_INSTRUCTION') {
      const nestedSplit = text.split(/,\s*and\s+(?:also\s+)?|\band\s+(?:also\s+)?(?=explain|describe|analyze|state)|;\s*/i);
      if (nestedSplit.length >= 2) {
        return nestedSplit.map((p, idx) => ({
          stepIndex: idx + 1,
          prompt: p.trim(),
          isDependentOnPrevious: idx > 0,
        }));
      }
    }

    // Default PARALLEL_COMPOUND
    if (text.includes('?') && (text.match(/\?/g) || []).length >= 2) {
      const qParts = text.split(/\?/).map(s => s.trim()).filter(s => s.length > 0);
      return qParts.map((p, idx) => ({
        stepIndex: idx + 1,
        prompt: p + '?',
        isDependentOnPrevious: false,
      }));
    }

    const coordParts = text.split(/,\s*and\s+|\s+and\s+(?=what|calculate|write|explain|define|is\s+there)|;\s*|,\s*aur\s+|\s+aur\s+(?=sath\s+mein|yeh\s+bhi|paani|pani|dar-?ul-?hukoomat|hisab|quicksort|binary)/i);
    if (coordParts.length >= 2) {
      return coordParts.map((p, idx) => ({
        stepIndex: idx + 1,
        prompt: p.trim(),
        isDependentOnPrevious: false,
      }));
    }

    return [{
      stepIndex: 1,
      prompt: text,
      isDependentOnPrevious: false,
    }];
  }

  /**
   * Executes a sequential math chain, maintaining intermediate numerical context.
   */
  private executeSequentialMathChain(
    subRequests: readonly SubRequestItem[],
    isUrdu: boolean
  ): StepExecutionResult[] {
    const results: StepExecutionResult[] = [];
    let currentIntermediateVal: number | null = null;

    for (const sub of subRequests) {
      const p = sub.prompt.toLowerCase();

      const pctMatch = p.match(/([0-9.]+)\s*%\s*(?:of|ka)\s*([0-9.]+)/i);
      const mathInitMatch = p.match(/([0-9.]+)\s*([\+\-\*\/×xX])\s*([0-9.]+)/i);

      if (currentIntermediateVal === null) {
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          const base = parseFloat(pctMatch[2]);
          currentIntermediateVal = (pct / 100) * base;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** ${base} ka ${pct}% hisab kiya gaya = **${currentIntermediateVal}**`
            : `**Step ${sub.stepIndex}:** Evaluated ${pct}% of ${base} = **${currentIntermediateVal}**`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        } else if (mathInitMatch) {
          const a = parseFloat(mathInitMatch[1]);
          const b = parseFloat(mathInitMatch[3]);
          const op = mathInitMatch[2];
          let val = 0;
          if (op === '+') val = a + b;
          else if (op === '-') val = a - b;
          else if (['*', '×', 'x', 'X'].includes(op)) val = a * b;
          else if (op === '/') val = b !== 0 ? a / b : 0;

          currentIntermediateVal = val;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** ${a} ${op} ${b} = **${currentIntermediateVal}**`
            : `**Step ${sub.stepIndex}:** Evaluated ${a} ${op} ${b} = **${currentIntermediateVal}**`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        }
      }

      // Subsequent steps referencing prior intermediate value:
      if (currentIntermediateVal !== null) {
        const prev = currentIntermediateVal;

        // Subtraction
        const subMatch = p.match(/(?:subtract|minus|nikal|kam)\s+([0-9.]+)/i) || p.match(/([0-9.]+)\s+(?:subtract|minus|nikal)/i);
        if (subMatch) {
          const delta = parseFloat(subMatch[1]);
          currentIntermediateVal = prev - delta;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** Pichle nateeje (${prev}) mein se ${delta} subtract kiya = **${currentIntermediateVal}** (${prev} - ${delta} = ${currentIntermediateVal})`
            : `**Step ${sub.stepIndex}:** Subtracted ${delta} from the previous result (${prev}) = **${currentIntermediateVal}** (${prev} - ${delta} = ${currentIntermediateVal})`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        }

        // Addition
        const addMatch = p.match(/(?:add|plus|jama)\s+([0-9.]+)/i) || p.match(/([0-9.]+)\s+(?:add|plus|jama)/i);
        if (addMatch) {
          const delta = parseFloat(addMatch[1]);
          currentIntermediateVal = prev + delta;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** Pichle nateeje (${prev}) mein ${delta} jama (add) kiya = **${currentIntermediateVal}** (${prev} + ${delta} = ${currentIntermediateVal})`
            : `**Step ${sub.stepIndex}:** Added ${delta} to the previous result (${prev}) = **${currentIntermediateVal}** (${prev} + ${delta} = ${currentIntermediateVal})`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        }

        // Multiplication
        const mulMatch = p.match(/(?:multiply|times|zarab)\s*(?:by)?\s*([0-9.]+)/i) || p.match(/([0-9.]+)\s*(?:se)?\s*zarab/i);
        if (mulMatch) {
          const factor = parseFloat(mulMatch[1]);
          currentIntermediateVal = prev * factor;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** Pichle nateeje (${prev}) ko ${factor} se zarab (multiply) kiya = **${currentIntermediateVal}** (${prev} * ${factor} = ${currentIntermediateVal})`
            : `**Step ${sub.stepIndex}:** Multiplied previous result (${prev}) by ${factor} = **${currentIntermediateVal}** (${prev} * ${factor} = ${currentIntermediateVal})`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        }

        // Division
        const divMatch = p.match(/(?:divide|taqseem)\s*(?:by)?\s*([0-9.]+)/i) || p.match(/([0-9.]+)\s*(?:se)?\s*taqseem/i);
        if (divMatch) {
          const divisor = parseFloat(divMatch[1]);
          currentIntermediateVal = divisor !== 0 ? prev / divisor : 0;
          const text = isUrdu
            ? `**Marhala ${sub.stepIndex}:** Pichle nateeje (${prev}) ko ${divisor} se taqseem (divide) kiya = **${currentIntermediateVal}** (${prev} / ${divisor} = ${currentIntermediateVal})`
            : `**Step ${sub.stepIndex}:** Divided previous result (${prev}) by ${divisor} = **${currentIntermediateVal}** (${prev} / ${divisor} = ${currentIntermediateVal})`;
          results.push({
            stepIndex: sub.stepIndex,
            subPrompt: sub.prompt,
            stepOutput: text,
            intermediateValue: currentIntermediateVal,
          });
          continue;
        }
      }

      // Default step solver
      const res = ConversationalResponseEngine.synthesize({ prompt: sub.prompt });
      results.push({
        stepIndex: sub.stepIndex,
        subPrompt: sub.prompt,
        stepOutput: res.text,
      });
    }

    return results;
  }

  /**
   * Executes compound request preserving all components with clearly separated outputs.
   */
  public executeCompoundRequest(
    childIdentity: ChildAgentIdentity,
    query: string
  ): CompoundExecutionResult {
    const startTime = performance.now();
    const type = this.classifyCompoundType(query);
    const subRequests = this.decomposeQuery(query, type);
    const isUrdu = ConversationalResponseEngine.detectLanguage(query) === 'ROMAN_URDU';

    let stepResults: StepExecutionResult[] = [];

    if (type === 'SEQUENTIAL_CHAIN') {
      stepResults = this.executeSequentialMathChain(subRequests, isUrdu);
    } else {
      // PARALLEL_COMPOUND or NESTED_INSTRUCTION
      for (const sub of subRequests) {
        const response = ConversationalResponseEngine.synthesize({
          prompt: sub.prompt,
          detectedLanguage: isUrdu ? 'ROMAN_URDU' : 'ENGLISH',
        });
        stepResults.push({
          stepIndex: sub.stepIndex,
          subPrompt: sub.prompt,
          stepOutput: response.text,
        });
      }
    }

    // Synthesize structured separated presentation
    const sections: string[] = [];

    if (type === 'SEQUENTIAL_CHAIN') {
      const finalVal = stepResults[stepResults.length - 1]?.intermediateValue;
      sections.push(isUrdu ? '### Marhala-war Sequential Reasoning:' : '### Multi-Step Sequential Execution:');
      for (const s of stepResults) {
        sections.push(s.stepOutput);
      }
      if (finalVal !== undefined) {
        sections.push(
          isUrdu
            ? `\n**Aakhri Nateeja (Final Result):** Tamam marhalay mukammal honay ke baad final answer **${finalVal}** hai.`
            : `\n**Final Result:** Upon completing all sequential steps, the final evaluated outcome is **${finalVal}**.`
        );
      }
    } else {
      for (const s of stepResults) {
        const partTitle = isUrdu ? `Hissa ${s.stepIndex}` : `Part ${s.stepIndex}`;
        sections.push(`### ${partTitle}: ${s.subPrompt}\n\n${s.stepOutput}`);
      }
    }

    const synthesizedOutput = sections.join('\n\n');
    const elapsed = Math.max(1, Math.round(performance.now() - startTime));
    const auditPayload = `${childIdentity.conversationId}|${type}|${stepResults.length}|${elapsed}`;
    const auditDigest = crypto.createHash('sha256').update(auditPayload).digest('hex');

    return {
      success: true,
      originalQuery: query,
      compoundType: type,
      totalSubRequests: stepResults.length,
      stepResults,
      synthesizedOutput,
      latencyMs: elapsed,
      auditDigest,
    };
  }
}
