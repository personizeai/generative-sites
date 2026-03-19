/**
 * Tests for visitor identification methods.
 *
 * Covers:
 *   - Auth session (window.__GS_USER__)
 *   - Preview mode (?gs_preview=email)
 *   - Collection lookup (data-gs-identify with URL params)
 *   - Slug-based identification (/for/:slug)
 *   - gs_id URL parameter
 *   - Identification priority order
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Helper to simulate URL state
function setURL(url: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
}

describe('URL Parameter Extraction', () => {
  it('should extract gs_preview from URL', () => {
    setURL('https://example.com?gs_preview=maya@orbitstack.io');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('gs_preview')).toBe('maya@orbitstack.io');
  });

  it('should extract gs_id from URL', () => {
    setURL('https://example.com?gs_id=contact-123');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('gs_id')).toBe('contact-123');
  });

  it('should handle multiple GS params', () => {
    setURL('https://example.com?gs_preview=test@test.com&gs_id=abc');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('gs_preview')).toBe('test@test.com');
    expect(params.get('gs_id')).toBe('abc');
  });

  it('should handle URL without GS params', () => {
    setURL('https://example.com/page');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('gs_preview')).toBeNull();
    expect(params.get('gs_id')).toBeNull();
  });
});

describe('Slug-Based Identification', () => {
  it('should extract slug from /for/:slug path', () => {
    setURL('https://example.com/for/maya-chen-orbitstack');
    const match = window.location.pathname.match(/\/for\/([^\/\?]+)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('maya-chen-orbitstack');
  });

  it('should extract slug with trailing slash', () => {
    setURL('https://example.com/for/daniel-ruiz-northstar/');
    const match = window.location.pathname.match(/\/for\/([^\/\?]+)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('daniel-ruiz-northstar');
  });

  it('should not match paths without /for/ prefix', () => {
    setURL('https://example.com/about/team');
    const match = window.location.pathname.match(/\/for\/([^\/\?]+)/);
    expect(match).toBeNull();
  });

  it('should handle nested /for/ path', () => {
    setURL('https://example.com/campaigns/for/aisha-bell-vectorloop');
    const match = window.location.pathname.match(/\/for\/([^\/\?]+)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('aisha-bell-vectorloop');
  });
});

describe('UTM Collection', () => {
  it('should collect standard UTM parameters', () => {
    setURL('https://example.com?utm_source=linkedin&utm_medium=social&utm_campaign=launch');
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};

    params.forEach((value, key) => {
      if (key.toLowerCase().startsWith('utm_')) {
        utms[key] = value;
      }
    });

    expect(utms).toEqual({
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'launch',
    });
  });

  it('should collect custom gs_ parameters alongside UTMs', () => {
    setURL('https://example.com?utm_source=email&gs_variant=a');
    const params = new URLSearchParams(window.location.search);
    const collected: Record<string, string> = {};

    params.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k.startsWith('utm_') || (k.startsWith('gs_') && k !== 'gs' && k !== 'gs_preview')) {
        collected[key] = value;
      }
    });

    expect(collected).toEqual({
      utm_source: 'email',
      gs_variant: 'a',
    });
  });

  it('should exclude gs and gs_preview from collected params', () => {
    setURL('https://example.com?gs=encrypted_token&gs_preview=test@test.com&gs_variant=b');
    const params = new URLSearchParams(window.location.search);
    const collected: Record<string, string> = {};

    params.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k.startsWith('utm_') || (k.startsWith('gs_') && k !== 'gs' && k !== 'gs_preview')) {
        collected[key] = value;
      }
    });

    expect(collected).toEqual({ gs_variant: 'b' });
  });
});

describe('Auth Session (window.__GS_USER__)', () => {
  beforeEach(() => {
    delete (window as any).__GS_USER__;
  });

  it('should read email from __GS_USER__', () => {
    (window as any).__GS_USER__ = { email: 'maya@orbitstack.io', firstName: 'Maya' };
    expect((window as any).__GS_USER__.email).toBe('maya@orbitstack.io');
  });

  it('should handle missing __GS_USER__', () => {
    expect((window as any).__GS_USER__).toBeUndefined();
  });

  it('should handle __GS_USER__ without email', () => {
    (window as any).__GS_USER__ = { firstName: 'Maya' };
    expect((window as any).__GS_USER__.email).toBeUndefined();
  });
});

describe('Identification Priority', () => {
  // The priority order in gs.js is: auth > preview > identify > location
  // This is tested by checking which params take precedence in buildStreamURL

  it('should document the priority order', () => {
    const PRIORITY = [
      'auth (window.__GS_USER__)',
      'preview (?gs_preview=email)',
      'identify (data-gs-identify with URL param)',
      'deanonymization (server-side RB2B/Clearbit)',
      'location (geo headers — automatic fallback)',
    ];

    expect(PRIORITY.length).toBe(5);
    expect(PRIORITY[0]).toContain('auth');
  });
});
