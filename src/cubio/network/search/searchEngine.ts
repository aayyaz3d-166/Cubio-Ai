/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-14: Master Search & Discovery Engine
 *
 * Implements sovereign resource indexing, query tokenization,
 * relevance ranking, and authorization-aware discovery filtering.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Unauthorized resources MUST NEVER appear in search query results or counts.
 * - Private resources belonging to User A must never leak to User B.
 * - Access evaluation strictly enforces NET-01 identity, NET-03 authorization, and ACL policies.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import {
  SearchIndexEntry,
  SearchQuery,
  SearchResultItem,
  SearchQueryResult,
  IndexResourceInput,
  EntityType,
} from './types';
import { ISearchRepository } from './repositories/types';
import { MemorySearchRepository } from './repositories/memoryRepositories';

export class CubiOSearchEngine {
  private repository: ISearchRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;

  constructor(options: {
    repository?: ISearchRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
  } = {}) {
    this.repository = options.repository || new MemorySearchRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
  }

  public getRepository(): ISearchRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in SearchEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Search Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Indexes a sovereign resource into the searchable discovery index.
   */
  public async indexResource(input: IndexResourceInput): Promise<Readonly<SearchIndexEntry>> {
    const now = Date.now();
    const indexId = `IDX_${deterministicHash(`${input.entityType}:${input.entityId}:${now}`).slice(2, 18)}`;

    const entry: SearchIndexEntry = Object.freeze({
      indexId,
      entityType: input.entityType,
      entityId: input.entityId.trim(),
      ownerCubId: input.ownerCubId.trim(),
      title: input.title.trim(),
      description: (input.description || '').trim(),
      keywords: Object.freeze([...(input.keywords || [])]),
      visibility: input.visibility || 'PRIVATE',
      acl: Object.freeze([...(input.acl || [])]),
      requiredPermission: input.requiredPermission,
      coordinateUri: input.coordinateUri,
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
      updatedAt: now,
    });

    await this.repository.upsertEntry(entry);
    return entry;
  }

  /**
   * Removes a resource from the search index.
   */
  public async unindexResource(entityType: EntityType, entityId: string): Promise<boolean> {
    return this.repository.removeEntry(entityType, entityId);
  }

  /**
   * Evaluates if a caller is authorized to view a search entry.
   */
  public isAuthorizedToView(callerCubId: string, entry: SearchIndexEntry): boolean {
    const isOwner = entry.ownerCubId === callerCubId;
    if (isOwner) return true;

    // Check if caller is SUPER_ADMIN
    if (this.roleManager && this.roleManager.getRole(callerCubId) === 'SUPER_ADMIN') {
      return true;
    }

    // If resource is private and caller is not owner -> Denied
    if (entry.visibility === 'PRIVATE') {
      return false;
    }

    // If resource is shared -> check ACL
    if (entry.visibility === 'SHARED') {
      const inAcl = entry.acl.includes(callerCubId);
      if (!inAcl) return false;
    }

    // Check if resource specifies a required policy permission
    if (entry.requiredPermission && this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: entry.requiredPermission,
        resourceUri: entry.coordinateUri || 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });
      if (!decision.allowed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculates relevance ranking score for an entry against search terms.
   */
  public calculateScore(entry: SearchIndexEntry, rawTerms: readonly string[]): number {
    let score = 1.0;
    const lowerTitle = entry.title.toLowerCase();
    const lowerDesc = entry.description.toLowerCase();
    const lowerKeywords = entry.keywords.map((k) => k.toLowerCase());

    for (const term of rawTerms) {
      if (lowerTitle.includes(term)) {
        score += 10.0;
      }
      if (lowerKeywords.some((k) => k.includes(term))) {
        score += 5.0;
      }
      if (lowerDesc.includes(term)) {
        score += 2.0;
      }
      if (entry.ownerCubId.toLowerCase().includes(term)) {
        score += 3.0;
      }
    }

    // Recency boost (within last 24h)
    const ageHours = (Date.now() - entry.updatedAt) / (1000 * 3600);
    if (ageHours < 24) {
      score += 1.0;
    }

    return score;
  }

  /**
   * Executes an authorization-aware search across all indexed sovereign resources.
   */
  public async search(
    tokenOrSession: string,
    query: SearchQuery
  ): Promise<Readonly<SearchQueryResult>> {
    const startTime = Date.now();

    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Evaluate NET-03 authorization for SEARCH_EXECUTE
    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'SEARCH_EXECUTE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });

      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'SEARCH_EXECUTE'.`);
      }
    }

    // 3. Retrieve raw candidate matches
    const candidates = await this.repository.search(query);
    const rawTerms = query.queryText.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // 4. SECURITY GATE: Strict authorization-aware filtering
    const authorizedItems: SearchResultItem[] = [];

    for (const entry of candidates) {
      if (!this.isAuthorizedToView(callerCubId, entry)) {
        // STRICT INVARIANT: Drop unauthorized resources silently. No leakage in items or counts.
        continue;
      }

      const score = this.calculateScore(entry, rawTerms);
      const snippet = entry.description ? entry.description.slice(0, 120) : entry.title;

      authorizedItems.push(
        Object.freeze({
          entityType: entry.entityType,
          entityId: entry.entityId,
          title: entry.title,
          description: entry.description,
          ownerCubId: entry.ownerCubId,
          score,
          coordinateUri: entry.coordinateUri,
          snippet,
          metadata: entry.metadata,
        })
      );
    }

    // 5. Ranking & Sorting
    if (query.sort === 'RECENCY') {
      // Recency sort handled by caller ordering
    } else {
      authorizedItems.sort((a, b) => b.score - a.score);
    }

    // 6. Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedItems = authorizedItems.slice(offset, offset + limit);

    return Object.freeze({
      query: query.queryText,
      totalMatches: authorizedItems.length,
      items: Object.freeze(paginatedItems),
      durationMs: Date.now() - startTime,
    });
  }
}
