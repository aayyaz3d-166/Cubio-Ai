/**
 * CUBiO AI — Phase 24: Native CUBiO Model Training & Genesis
 * model_artifact_scanner.ts
 *
 * Forensic Security Scanner for Native Model Artifacts.
 * Detects:
 * - Foreign weight formats (.pt, .pth, .bin, .safetensors, .onnx, .pb, etc.)
 * - External model tokens (<|im_start|>, <|im_end|>, <|endoftext|>, etc.)
 * - External model family strings (qwen, llama, mistral, gemma, gpt, claude, etc.)
 * - Unauthorized external remote URLs (http://, https://)
 * - Actuation command patterns (gpio_write, actuate_motor, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROHIBITED_EXTERNAL_MODEL_IDENTIFIERS,
  FORBIDDEN_ACTUATION_PATTERNS,
  NativeModelCheckpoint,
} from './native_model_types';

export interface ArtifactScanReport {
  readonly clean: boolean;
  readonly filesScanned: number;
  readonly foreignWeightsFound: number;
  readonly foreignTokensFound: number;
  readonly externalUrlsFound: number;
  readonly actuationCommandsFound: number;
  readonly violations: readonly string[];
}

export class ModelArtifactScanner {
  public static readonly FORBIDDEN_EXTENSIONS = [
    '.pt',
    '.pth',
    '.bin',
    '.safetensors',
    '.onnx',
    '.pb',
    '.tflite',
    '.h5',
    '.ckpt',
  ];

  public static readonly FORBIDDEN_EXTERNAL_TOKENS = [
    '<|im_start|>',
    '<|im_end|>',
    '<|endoftext|>',
    '<|fim_prefix|>',
    '<|fim_suffix|>',
    '<s>',
    '</s>',
    '[CLS]',
    '[SEP]',
    '[MASK]',
  ];

  /**
   * Scans a single NativeModelCheckpoint object for security and sovereignty violations
   */
  public static scanCheckpoint(checkpoint: NativeModelCheckpoint): ArtifactScanReport {
    const violations: string[] = [];
    let foreignTokens = 0;
    let externalUrls = 0;
    let actuationCmds = 0;

    const serialized = JSON.stringify(checkpoint).toLowerCase();

    // Check for external model names
    for (const model of PROHIBITED_EXTERNAL_MODEL_IDENTIFIERS) {
      if (serialized.includes(model)) {
        violations.push(`Checkpoint contains external model reference: '${model}'`);
      }
    }

    // Check for external tokens
    for (const tok of this.FORBIDDEN_EXTERNAL_TOKENS) {
      if (serialized.includes(tok.toLowerCase())) {
        foreignTokens++;
        violations.push(`Checkpoint contains foreign special token: '${tok}'`);
      }
    }

    // Check for remote URLs
    const urlMatches = serialized.match(/https?:\/\/[^\s"']+/g);
    if (urlMatches) {
      for (const url of urlMatches) {
        externalUrls++;
        violations.push(`Checkpoint contains external URL: '${url}'`);
      }
    }

    // Check for actuation commands
    for (const act of FORBIDDEN_ACTUATION_PATTERNS) {
      if (serialized.includes(act)) {
        actuationCmds++;
        violations.push(`Checkpoint contains forbidden actuation pattern: '${act}'`);
      }
    }

    return Object.freeze({
      clean: violations.length === 0,
      filesScanned: 1,
      foreignWeightsFound: 0,
      foreignTokensFound: foreignTokens,
      externalUrlsFound: externalUrls,
      actuationCommandsFound: actuationCmds,
      violations: Object.freeze(violations),
    });
  }

  /**
   * Scans an entire directory recursively for foreign weight files and code violations
   */
  public static scanDirectory(dirPath: string): ArtifactScanReport {
    const violations: string[] = [];
    let filesScanned = 0;
    let foreignWeights = 0;
    let foreignTokens = 0;
    let externalUrls = 0;
    let actuationCmds = 0;

    if (!fs.existsSync(dirPath)) {
      return Object.freeze({
        clean: true,
        filesScanned: 0,
        foreignWeightsFound: 0,
        foreignTokensFound: 0,
        externalUrlsFound: 0,
        actuationCommandsFound: 0,
        violations: Object.freeze([]),
      });
    }

    const traverse = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          filesScanned++;
          const ext = path.extname(entry.name).toLowerCase();

          // Check for foreign model weight files
          if (this.FORBIDDEN_EXTENSIONS.includes(ext)) {
            foreignWeights++;
            violations.push(`Foreign weight artifact detected: ${fullPath}`);
          }

          // Inspect text files (.ts, .json, .md)
          if (['.ts', '.json', '.md'].includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lower = content.toLowerCase();

              // Foreign tokens check
              for (const tok of this.FORBIDDEN_EXTERNAL_TOKENS) {
                if (lower.includes(tok.toLowerCase())) {
                  // Ignore scanner self-reference and test fixtures testing scanner
                  if (!fullPath.includes('model_artifact_scanner.ts') && !fullPath.includes('_tests.ts') && !fullPath.includes('test_')) {
                    foreignTokens++;
                    violations.push(`File ${entry.name} contains foreign token '${tok}'`);
                  }
                }
              }

              // Remote network call check in execution files (.ts)
              if (ext === '.ts' && !fullPath.includes('external_model_guard.ts')) {
                const match = content.match(/fetch\(|axios\.|http\.request\(|https\.request\(/);
                if (match) {
                  externalUrls++;
                  violations.push(`File ${entry.name} contains active network request call: '${match[0]}'`);
                }
              }
            } catch (e) {
              // Ignore unreadable binary files
            }
          }
        }
      }
    };

    traverse(dirPath);

    return Object.freeze({
      clean: violations.length === 0,
      filesScanned,
      foreignWeightsFound: foreignWeights,
      foreignTokensFound: foreignTokens,
      externalUrlsFound: externalUrls,
      actuationCommandsFound: actuationCmds,
      violations: Object.freeze(violations),
    });
  }
}
