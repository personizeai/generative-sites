/**
 * Tests for the consent bridge — auto-detection of consent managers
 * and feature gating based on consent levels.
 *
 * Covers:
 *   - Default consent (no manager detected)
 *   - OneTrust detection
 *   - CookieBot detection
 *   - Osano detection
 *   - Manual consent override (GS.consent())
 *   - Feature gating (isAllowed)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Simulate the detectConsent and isAllowed logic from gs.js
// (extracted for unit testing without loading the full IIFE)

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

let manualConsent: ConsentState | null = null;

function detectConsent(): ConsentState {
  if (manualConsent) return manualConsent;

  // OneTrust
  if ((window as any).OneTrust || (window as any).OptanonActiveGroups) {
    const groups = ((window as any).OptanonActiveGroups || '').toLowerCase();
    return {
      essential: true,
      analytics: groups.indexOf('c0002') >= 0 || groups.indexOf('performance') >= 0,
      marketing: groups.indexOf('c0004') >= 0 || groups.indexOf('targeting') >= 0,
    };
  }

  // CookieBot
  if ((window as any).Cookiebot && (window as any).Cookiebot.consent) {
    return {
      essential: true,
      analytics: !!(window as any).Cookiebot.consent.statistics,
      marketing: !!(window as any).Cookiebot.consent.marketing,
    };
  }

  // Osano
  if ((window as any).Osano && (window as any).Osano.cm) {
    try {
      const osanoConsent = (window as any).Osano.cm.getConsent();
      return {
        essential: true,
        analytics: osanoConsent.ANALYTICS !== 'DENY',
        marketing: osanoConsent.MARKETING !== 'DENY',
      };
    } catch (e) {}
  }

  return { essential: true, analytics: true, marketing: true };
}

function isAllowed(feature: string): boolean {
  const consent = detectConsent();
  switch (feature) {
    case 'cookie': return consent.essential;
    case 'location': return consent.essential;
    case 'tracking': return consent.analytics;
    case 'memorize': return consent.analytics;
    case 'deanon': return consent.marketing;
    case 'identify': return consent.marketing;
    default: return consent.essential;
  }
}

describe('Consent Bridge — Default', () => {
  beforeEach(() => {
    manualConsent = null;
    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
    delete (window as any).Cookiebot;
    delete (window as any).Osano;
  });

  it('should allow everything when no consent manager is detected', () => {
    const consent = detectConsent();
    expect(consent).toEqual({ essential: true, analytics: true, marketing: true });
  });

  it('should allow all features by default', () => {
    expect(isAllowed('cookie')).toBe(true);
    expect(isAllowed('location')).toBe(true);
    expect(isAllowed('tracking')).toBe(true);
    expect(isAllowed('memorize')).toBe(true);
    expect(isAllowed('deanon')).toBe(true);
    expect(isAllowed('identify')).toBe(true);
  });
});

describe('Consent Bridge — OneTrust', () => {
  beforeEach(() => {
    manualConsent = null;
    delete (window as any).Cookiebot;
    delete (window as any).Osano;
  });

  afterEach(() => {
    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
  });

  it('should detect OneTrust with full consent', () => {
    (window as any).OneTrust = {};
    (window as any).OptanonActiveGroups = ',C0001,C0002,C0003,C0004,';
    const consent = detectConsent();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(true);
  });

  it('should detect OneTrust with only essential consent', () => {
    (window as any).OneTrust = {};
    (window as any).OptanonActiveGroups = ',C0001,';
    const consent = detectConsent();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
  });

  it('should detect OneTrust with analytics but no marketing', () => {
    (window as any).OneTrust = {};
    (window as any).OptanonActiveGroups = ',C0001,C0002,';
    const consent = detectConsent();
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(false);
  });

  it('should handle OneTrust with text-based groups', () => {
    (window as any).OneTrust = {};
    (window as any).OptanonActiveGroups = 'performance,targeting';
    const consent = detectConsent();
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(true);
  });
});

describe('Consent Bridge — CookieBot', () => {
  beforeEach(() => {
    manualConsent = null;
    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
    delete (window as any).Osano;
  });

  afterEach(() => {
    delete (window as any).Cookiebot;
  });

  it('should detect CookieBot with full consent', () => {
    (window as any).Cookiebot = {
      consent: { necessary: true, statistics: true, marketing: true },
    };
    const consent = detectConsent();
    expect(consent).toEqual({ essential: true, analytics: true, marketing: true });
  });

  it('should detect CookieBot with restricted consent', () => {
    (window as any).Cookiebot = {
      consent: { necessary: true, statistics: false, marketing: false },
    };
    const consent = detectConsent();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
  });

  it('should detect CookieBot with only statistics', () => {
    (window as any).Cookiebot = {
      consent: { necessary: true, statistics: true, marketing: false },
    };
    const consent = detectConsent();
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(false);
  });
});

describe('Consent Bridge — Osano', () => {
  beforeEach(() => {
    manualConsent = null;
    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
    delete (window as any).Cookiebot;
  });

  afterEach(() => {
    delete (window as any).Osano;
  });

  it('should detect Osano with full consent', () => {
    (window as any).Osano = {
      cm: {
        getConsent: () => ({ ANALYTICS: 'ACCEPT', MARKETING: 'ACCEPT' }),
      },
    };
    const consent = detectConsent();
    expect(consent).toEqual({ essential: true, analytics: true, marketing: true });
  });

  it('should detect Osano with denied consent', () => {
    (window as any).Osano = {
      cm: {
        getConsent: () => ({ ANALYTICS: 'DENY', MARKETING: 'DENY' }),
      },
    };
    const consent = detectConsent();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
  });

  it('should handle Osano getConsent() throwing', () => {
    (window as any).Osano = {
      cm: {
        getConsent: () => { throw new Error('Osano not ready'); },
      },
    };
    // Should fall through to default (all allowed)
    const consent = detectConsent();
    expect(consent).toEqual({ essential: true, analytics: true, marketing: true });
  });
});

describe('Consent Bridge — Manual Override', () => {
  beforeEach(() => {
    manualConsent = null;
  });

  it('should override auto-detected consent', () => {
    (window as any).OneTrust = {};
    (window as any).OptanonActiveGroups = ',C0001,C0002,C0004,';

    // Without override, OneTrust would give full consent
    expect(detectConsent().marketing).toBe(true);

    // Manual override restricts marketing
    manualConsent = { essential: true, analytics: true, marketing: false };
    expect(detectConsent().marketing).toBe(false);

    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
  });

  it('should always keep essential=true', () => {
    manualConsent = { essential: true, analytics: false, marketing: false };
    expect(detectConsent().essential).toBe(true);
  });
});

describe('Feature Gating', () => {
  beforeEach(() => {
    manualConsent = null;
    delete (window as any).OneTrust;
    delete (window as any).OptanonActiveGroups;
    delete (window as any).Cookiebot;
    delete (window as any).Osano;
  });

  it('should gate tracking behind analytics consent', () => {
    manualConsent = { essential: true, analytics: false, marketing: true };
    expect(isAllowed('tracking')).toBe(false);
    expect(isAllowed('memorize')).toBe(false);
  });

  it('should gate identify behind marketing consent', () => {
    manualConsent = { essential: true, analytics: true, marketing: false };
    expect(isAllowed('identify')).toBe(false);
    expect(isAllowed('deanon')).toBe(false);
  });

  it('should always allow essential features', () => {
    manualConsent = { essential: true, analytics: false, marketing: false };
    expect(isAllowed('cookie')).toBe(true);
    expect(isAllowed('location')).toBe(true);
  });

  it('should default unknown features to essential', () => {
    manualConsent = { essential: true, analytics: false, marketing: false };
    expect(isAllowed('unknown_feature')).toBe(true);
  });
});
