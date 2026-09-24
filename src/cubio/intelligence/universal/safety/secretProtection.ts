/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F67: Secret Protection & Sanitization
 *
 * Scans text and structured payloads for credentials, private keys, and API tokens,
 * redacting them into safe placeholders ([REDACTED_SECRET]).
 */

import { SecretProtectionResult } from './types';

export class SecretProtectionFilter {
  private secretPatterns = [
    /(?:sk-|pk-|api[_-]?key[_-]?)[a-zA-Z0-9_\-]{16,}/gi,
    /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
    /ghp_[a-zA-Z0-9]{36}/gi,
    /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/gi,
    /password["']?\s*[:=]\s*["'][^"']+["']/gi,
  ];

  public sanitizeText(input: string): Readonly<SecretProtectionResult> {
    let sanitized = input;
    let secretsFoundCount = 0;

    for (const pattern of this.secretPatterns) {
      const matches = sanitized.match(pattern);
      if (matches) {
        secretsFoundCount += matches.length;
        sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
      }
    }

    return Object.freeze({
      redactedText: sanitized,
      secretsFoundCount,
      hasSecrets: secretsFoundCount > 0,
    });
  }

  public sanitizeObject<T>(obj: T): T {
    const json = JSON.stringify(obj);
    const { redactedText } = this.sanitizeText(json);
    return JSON.parse(redactedText) as T;
  }
}
