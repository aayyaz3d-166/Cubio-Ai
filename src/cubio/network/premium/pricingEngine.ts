/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: Premium Pricing & Tier Classification Engine
 */

import { PremiumAddressTier, PremiumPricingModel } from './types';

export class CubiOPremiumPricingEngine {
  public static readonly SYSTEM_NAMES = new Set([
    'admin',
    'root',
    'cubio',
    'system',
    'support',
    'security',
    'null',
    'undefined',
    'postmaster',
    'hostmaster',
    'webmaster',
    'abuse',
    'api',
    'mail',
    'omail',
    'node',
    'network',
    'master',
    'official',
    'bot',
    'agent',
    'service',
    'billing',
    'auth',
    'identity',
    'storage',
    'coordinate',
    'spatial',
  ]);

  public static readonly BRAND_NAMES = new Set([
    'google',
    'meta',
    'apple',
    'microsoft',
    'amazon',
    'sony',
    'spacex',
    'tesla',
    'ethereum',
    'bitcoin',
    'openai',
    'deepmind',
    'nvidia',
    'valve',
  ]);

  private static readonly TIER_PRICING: Record<PremiumAddressTier, PremiumPricingModel> = {
    SYSTEM: Object.freeze({
      tier: 'SYSTEM',
      basePriceUsd: 0,
      annualRenewalUsd: 0,
      minimumLength: 3,
      isAuctionOnly: false,
      isRestricted: true,
    }),
    BRAND: Object.freeze({
      tier: 'BRAND',
      basePriceUsd: 1000,
      annualRenewalUsd: 500,
      minimumLength: 3,
      isAuctionOnly: false,
      isRestricted: true,
    }),
    EXCLUSIVE: Object.freeze({
      tier: 'EXCLUSIVE',
      basePriceUsd: 500,
      annualRenewalUsd: 250,
      minimumLength: 1,
      isAuctionOnly: true,
      isRestricted: false,
    }),
    VANITY: Object.freeze({
      tier: 'VANITY',
      basePriceUsd: 100,
      annualRenewalUsd: 50,
      minimumLength: 3,
      isAuctionOnly: false,
      isRestricted: false,
    }),
    STANDARD: Object.freeze({
      tier: 'STANDARD',
      basePriceUsd: 20,
      annualRenewalUsd: 20,
      minimumLength: 5,
      isAuctionOnly: false,
      isRestricted: false,
    }),
  };

  /**
   * Normalizes a username for premium evaluation.
   */
  public static normalizeUsername(username: string): string {
    return username.trim().toLowerCase().replace(/@cubio\.com$/i, '');
  }

  /**
   * Evaluates and classifies a username into a pricing tier.
   */
  public static evaluateTier(username: string): PremiumPricingModel {
    const norm = this.normalizeUsername(username);

    if (this.SYSTEM_NAMES.has(norm)) {
      return this.TIER_PRICING.SYSTEM;
    }

    if (this.BRAND_NAMES.has(norm)) {
      return this.TIER_PRICING.BRAND;
    }

    if (norm.length <= 2) {
      return this.TIER_PRICING.EXCLUSIVE;
    }

    if (norm.length <= 4) {
      return this.TIER_PRICING.VANITY;
    }

    return this.TIER_PRICING.STANDARD;
  }

  /**
   * Validates username format.
   */
  public static validateUsername(username: string): { isValid: boolean; error?: string } {
    const norm = this.normalizeUsername(username);

    if (!norm || norm.length === 0) {
      return { isValid: false, error: 'Username cannot be empty.' };
    }

    if (norm.length > 32) {
      return { isValid: false, error: 'Username exceeds maximum length of 32 characters.' };
    }

    const validCharsRegex = /^[a-z0-9][a-z0-9._-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!validCharsRegex.test(norm)) {
      return { isValid: false, error: 'Username contains invalid characters or illegal edge punctuation.' };
    }

    if (norm.includes('..') || norm.includes('--') || norm.includes('__')) {
      return { isValid: false, error: 'Username cannot contain consecutive punctuation characters.' };
    }

    return { isValid: true };
  }
}
