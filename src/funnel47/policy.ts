/**
 * 3D Memory Studio — Funnel 47
 * Deterministic Classification Policy & Rule Registry
 *
 * Defines explicit rules, domain allowlists, restricted categories,
 * and AI_MODEL permission policies with priority ordering.
 */

import { ClassificationRule, RawInputRecord } from './types';

export const ALLOWLISTED_RESEARCH_DOMAINS: ReadonlySet<string> = new Set([
  'w3.org',
  'ietf.org',
  'schema.org',
  'wikipedia.org',
  'unicode.org',
  'iso.org',
  'rfc-editor.org',
  'standards.ieee.org',
  'open-telemetry.io',
]);

export const ALLOWLISTED_RESEARCH_CATEGORIES: ReadonlySet<string> = new Set([
  'STANDARDS',
  'PROTOCOLS',
  'ONTOLOGY',
  'TAXONOMY',
  'ENCODING',
  'METRICS',
  'RESEARCH_DOCUMENTATION',
  'PUBLIC_SPECIFICATION',
]);

export const RESTRICTED_CATEGORIES: ReadonlySet<string> = new Set([
  'PII_RESTRICTED',
  'PROPRIETARY_CREDENTIALS',
  'PRIVATE_KEYS',
  'MALWARE_PAYLOAD',
  'UNFILTERED_RAW_SCRAPE',
  'DARKWEB_LEAK',
  'SECURITY_EXPLOIT',
  'CLASSIFIED_INTERNAL',
  'UNLICENSED_COMMERCIAL',
]);

export const RESTRICTED_DOMAINS: ReadonlySet<string> = new Set([
  'darkweb.onion',
  'unauthorized-scrape.net',
  'leaked-credentials.org',
  'malware-drop.com',
  'private-intranet.local',
]);

/**
 * Deterministic classification rules ordered by priority descending.
 */
export const DEFAULT_CLASSIFICATION_RULES: readonly ClassificationRule[] = Object.freeze([
  {
    ruleId: 'RULE-RED-SECURITY-001',
    priority: 100,
    description: 'High-priority rejection of security-sensitive or restricted categories',
    classification: 'RED',
    reason: 'CATEGORY_IS_SECURITY_RESTRICTED',
    condition: (rec: RawInputRecord) => {
      const upperCat = (rec.category || '').toUpperCase();
      return RESTRICTED_CATEGORIES.has(upperCat);
    },
  },
  {
    ruleId: 'RULE-RED-SOURCE-002',
    priority: 90,
    description: 'High-priority rejection of blacklisted or restricted source domains',
    classification: 'RED',
    reason: 'SOURCE_DOMAIN_IS_RESTRICTED',
    condition: (rec: RawInputRecord) => {
      const domain = (rec.sourceDomain || '').toLowerCase();
      return RESTRICTED_DOMAINS.has(domain);
    },
  },
  {
    ruleId: 'RULE-RED-AI-UNAUTHORIZED-003',
    priority: 80,
    description: 'AI_MODEL records without explicit authorization permit are blocked',
    classification: 'RED',
    reason: 'AI_MODEL_LACKS_EXPLICIT_PERMIT',
    condition: (rec: RawInputRecord) => {
      const upperCat = (rec.category || '').toUpperCase();
      if (upperCat !== 'AI_MODEL') return false;
      const isPermitted = rec.metadata?.explicitlyPermitted === true;
      const isDomainAllowed = ALLOWLISTED_RESEARCH_DOMAINS.has((rec.sourceDomain || '').toLowerCase());
      return !(isPermitted && isDomainAllowed);
    },
  },
  {
    ruleId: 'RULE-GREEN-AI-AUTHORIZED-004',
    priority: 70,
    description: 'AI_MODEL records with explicit permit and allowlisted research source',
    classification: 'GREEN',
    reason: 'AI_MODEL_EXPLICITLY_AUTHORIZED_RESEARCH',
    condition: (rec: RawInputRecord) => {
      const upperCat = (rec.category || '').toUpperCase();
      if (upperCat !== 'AI_MODEL') return false;
      const isPermitted = rec.metadata?.explicitlyPermitted === true;
      const isDomainAllowed = ALLOWLISTED_RESEARCH_DOMAINS.has((rec.sourceDomain || '').toLowerCase());
      return isPermitted && isDomainAllowed;
    },
  },
  {
    ruleId: 'RULE-GREEN-RESEARCH-ALLOWLIST-005',
    priority: 60,
    description: 'Explicitly allowlisted research domain and standard category',
    classification: 'GREEN',
    reason: 'ALLOWLISTED_RESEARCH_SOURCE_AND_CATEGORY',
    condition: (rec: RawInputRecord) => {
      const domain = (rec.sourceDomain || '').toLowerCase();
      const upperCat = (rec.category || '').toUpperCase();
      return ALLOWLISTED_RESEARCH_DOMAINS.has(domain) && ALLOWLISTED_RESEARCH_CATEGORIES.has(upperCat);
    },
  },
  {
    ruleId: 'RULE-UNKNOWN-DEFAULT-999',
    priority: 0,
    description: 'Default fallback: unknown or unverified data defaults to RED / blocked',
    classification: 'RED',
    reason: 'NO_EXPLICIT_PERMIT_FOUND_DEFAULT_BLOCKED',
    condition: () => true, // Catches any record not matched above
  },
]);
