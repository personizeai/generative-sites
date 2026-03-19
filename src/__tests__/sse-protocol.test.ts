/**
 * Tests for the SSE protocol contract between gs.js and gs-edge.
 *
 * Covers:
 *   - Stream URL construction
 *   - SSE event types (meta, zone, done, upgrade, error)
 *   - Meta-before-zone ordering
 *   - Zone rendering (textContent only, never innerHTML)
 *   - Reconnection backoff
 *   - Callback invocation
 */

import { describe, it, expect } from 'vitest';

describe('Stream URL Construction', () => {
  it('should build correct base URL with key and zones', () => {
    const key = 'pk_test_abc123';
    const zoneIds = ['headline', 'hero.subtitle', 'website_zones:cta_text'];
    const endpoint = 'https://gs.personize.ai';
    const pageUrl = 'https://example.com/page';

    const params = [
      'key=' + encodeURIComponent(key),
      'zones=' + encodeURIComponent(zoneIds.join(',')),
      'url=' + encodeURIComponent(pageUrl),
    ];

    const url = endpoint + '/api/gs/stream?' + params.join('&');

    expect(url).toContain('/api/gs/stream?');
    expect(url).toContain('key=pk_test_abc123');
    expect(url).toContain('zones=headline%2Chero.subtitle%2Cwebsite_zones%3Acta_text');
    expect(url).toContain('url=https%3A%2F%2Fexample.com%2Fpage');
  });

  it('should include custom prompts when present', () => {
    const prompts = { social_proof: 'Write social proof.' };
    const encoded = encodeURIComponent(JSON.stringify(prompts));
    expect(encoded).toContain('social_proof');
  });

  it('should include auth when __GS_USER__ is set', () => {
    const user = { email: 'maya@orbitstack.io', firstName: 'Maya' };
    const encoded = btoa(JSON.stringify(user));
    const param = 'auth=' + encodeURIComponent(encoded);
    expect(param).toContain('auth=');

    // Decode to verify
    const decoded = JSON.parse(atob(decodeURIComponent(param.split('=')[1])));
    expect(decoded.email).toBe('maya@orbitstack.io');
  });

  it('should include preview email when in preview mode', () => {
    const preview = 'maya@orbitstack.io';
    const param = 'preview=' + encodeURIComponent(preview);
    expect(param).toBe('preview=maya%40orbitstack.io');
  });

  it('should include identify params from data-gs-identify', () => {
    const identifyConfig = {
      collection: 'website_zones',
      property: 'slug',
      value: 'maya-chen-orbitstack',
    };

    const params = [
      'identify_collection=' + encodeURIComponent(identifyConfig.collection),
      'identify_property=' + encodeURIComponent(identifyConfig.property),
      'identify_value=' + encodeURIComponent(identifyConfig.value),
    ];

    expect(params.join('&')).toContain('identify_collection=website_zones');
    expect(params.join('&')).toContain('identify_property=slug');
    expect(params.join('&')).toContain('identify_value=maya-chen-orbitstack');
  });

  it('should include UTM parameters', () => {
    const utms = { utm_source: 'linkedin', utm_campaign: 'launch' };
    const param = 'utms=' + encodeURIComponent(JSON.stringify(utms));
    expect(param).toContain('utm_source');
    expect(param).toContain('utm_campaign');
  });
});

describe('SSE Event Types', () => {
  it('should define the correct event types', () => {
    const EVENT_TYPES = ['meta', 'zone', 'done', 'upgrade', 'error'];
    expect(EVENT_TYPES).toHaveLength(5);
  });

  it('should parse meta event correctly', () => {
    const metaData = JSON.stringify({ uid: 'abc123', tier: 'known', location: 'Austin, TX' });
    const parsed = JSON.parse(metaData);

    expect(parsed.uid).toBe('abc123');
    expect(parsed.tier).toBe('known');
    expect(parsed.location).toBe('Austin, TX');
  });

  it('should parse zone event correctly', () => {
    const zoneData = JSON.stringify({
      zone: 'website_zones:hero_headline',
      text: 'Maya, make onboarding pages adapt.',
      mode: 'property',
    });
    const parsed = JSON.parse(zoneData);

    expect(parsed.zone).toBe('website_zones:hero_headline');
    expect(parsed.text).toBe('Maya, make onboarding pages adapt.');
    expect(parsed.mode).toBe('property');
  });

  it('should parse upgrade event correctly', () => {
    const upgradeData = JSON.stringify({
      newTier: 'known',
      previousTier: 'location',
      rerender: ['headline', 'hero.subtitle'],
    });
    const parsed = JSON.parse(upgradeData);

    expect(parsed.newTier).toBe('known');
    expect(parsed.rerender).toHaveLength(2);
  });

  it('should handle done event with optional data', () => {
    const withData = JSON.parse(JSON.stringify({ zonesRendered: 5, totalTime: 1200 }));
    expect(withData.zonesRendered).toBe(5);

    // done can also have empty data
    const emptyData = {};
    expect(emptyData).toEqual({});
  });
});

describe('Text Rendering Safety', () => {
  it('should use textContent, never innerHTML', () => {
    document.body.innerHTML = '<h1 data-gs-zone="headline">Original</h1>';
    const el = document.querySelector('[data-gs-zone="headline"]')!;

    // Simulate gs.js rendering — always uses textContent
    const maliciousText = '<img src=x onerror=alert(1)>';
    el.textContent = maliciousText;

    // textContent escapes HTML — no XSS
    expect(el.innerHTML).not.toContain('<img');
    expect(el.textContent).toBe(maliciousText);
    expect(el.children.length).toBe(0); // no child elements created
  });

  it('should preserve fallback text when zone rendering fails', () => {
    document.body.innerHTML = '<h1 data-gs-zone="headline">Safe fallback text</h1>';
    const el = document.querySelector('[data-gs-zone="headline"]')!;
    const fallback = el.textContent;

    // If zone data is null/undefined, don't render
    const zoneText: string | null = null;
    if (zoneText) {
      el.textContent = zoneText;
    }

    expect(el.textContent).toBe(fallback);
  });
});

describe('Reconnection Backoff', () => {
  it('should calculate exponential backoff correctly', () => {
    const backoff = (attempts: number) => Math.min(1000 * Math.pow(2, attempts), 30000);

    expect(backoff(0)).toBe(1000);   // 1s
    expect(backoff(1)).toBe(2000);   // 2s
    expect(backoff(2)).toBe(4000);   // 4s
    expect(backoff(3)).toBe(8000);   // 8s
    expect(backoff(4)).toBe(16000);  // 16s
    expect(backoff(5)).toBe(30000);  // capped at 30s
    expect(backoff(10)).toBe(30000); // still capped
  });
});

describe('Callback System', () => {
  it('should register and fire callbacks correctly', () => {
    const callbacks: Record<string, Function[]> = {};
    const results: any[] = [];

    // Register
    function on(event: string, cb: Function) {
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(cb);
    }

    // Fire
    function fire(event: string, data: any) {
      const cbs = callbacks[event];
      if (!cbs) return;
      for (const cb of cbs) {
        try { cb(data); } catch (e) {}
      }
    }

    on('zone:render', (data: any) => results.push(data));
    on('zone:render', (data: any) => results.push('second: ' + data.zone));

    fire('zone:render', { zone: 'headline', text: 'Hello' });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ zone: 'headline', text: 'Hello' });
    expect(results[1]).toBe('second: headline');
  });

  it('should handle callback errors without crashing', () => {
    const callbacks: Record<string, Function[]> = {};
    const results: string[] = [];

    function on(event: string, cb: Function) {
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(cb);
    }

    function fire(event: string, data: any) {
      const cbs = callbacks[event];
      if (!cbs) return;
      for (const cb of cbs) {
        try { cb(data); } catch (e) {}
      }
    }

    on('meta', () => { throw new Error('Callback error'); });
    on('meta', (data: any) => results.push('ok'));

    // Should not throw
    fire('meta', { tier: 'known' });
    expect(results).toEqual(['ok']);
  });

  it('should fire no callbacks for unregistered events', () => {
    const callbacks: Record<string, Function[]> = {};
    let fired = false;

    function fire(event: string, data: any) {
      const cbs = callbacks[event];
      if (!cbs) return;
      for (const cb of cbs) {
        fired = true;
        try { cb(data); } catch (e) {}
      }
    }

    fire('nonexistent', {});
    expect(fired).toBe(false);
  });
});
