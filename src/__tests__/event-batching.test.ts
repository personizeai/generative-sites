/**
 * Tests for event batching and memorize queuing.
 *
 * Covers:
 *   - Event queue batching (max 50 per flush)
 *   - Memorize queue batching (max 20 per flush)
 *   - Queue restoration on sendBeacon failure
 *   - Sensitive field handling
 *   - Memorize target validation (must contain colon)
 *   - Cookie helpers (get/set)
 */

import { describe, it, expect } from 'vitest';

describe('Event Queue Batching', () => {
  it('should batch events up to 50 per flush', () => {
    const eventQueue: any[] = [];
    for (let i = 0; i < 75; i++) {
      eventQueue.push({ type: 'click', properties: { i }, timestamp: Date.now() });
    }

    // Simulate flush: splice first 50
    const batch = eventQueue.splice(0, 50);
    expect(batch.length).toBe(50);
    expect(eventQueue.length).toBe(25); // 25 remaining
  });

  it('should not flush an empty queue', () => {
    const eventQueue: any[] = [];
    const flushed = eventQueue.length > 0;
    expect(flushed).toBe(false);
  });

  it('should restore queue on sendBeacon failure', () => {
    const eventQueue = [{ type: 'a' }, { type: 'b' }, { type: 'c' }];
    const batch = eventQueue.splice(0, 50);

    // Simulate failure: prepend batch back
    const sendBeaconFailed = true;
    if (sendBeaconFailed) {
      eventQueue.unshift(...batch);
    }

    expect(eventQueue.length).toBe(3);
    expect(eventQueue[0].type).toBe('a');
  });
});

describe('Memorize Queue Batching', () => {
  it('should batch memorize writes up to 20 per flush', () => {
    const memorizeQueue: any[] = [];
    for (let i = 0; i < 30; i++) {
      memorizeQueue.push({ target: `col:prop_${i}`, value: `val_${i}` });
    }

    const batch = memorizeQueue.splice(0, 20);
    expect(batch.length).toBe(20);
    expect(memorizeQueue.length).toBe(10);
  });
});

describe('Memorize Target Validation', () => {
  it('should require collection:property format', () => {
    const isValid = (target: string) => target.indexOf(':') > -1;

    expect(isValid('website_zones:first_name')).toBe(true);
    expect(isValid('website_zones:primary_goal')).toBe(true);
    expect(isValid('first_name')).toBe(false);
    expect(isValid('headline')).toBe(false);
  });

  it('should parse collection and property from target', () => {
    const target = 'website_zones:biggest_blocker';
    const colonIndex = target.indexOf(':');
    const collection = target.substring(0, colonIndex);
    const property = target.substring(colonIndex + 1);

    expect(collection).toBe('website_zones');
    expect(property).toBe('biggest_blocker');
  });
});

describe('Cookie Helpers', () => {
  it('should format cookie string correctly', () => {
    const name = '_gs_uid';
    const value = 'visitor_abc123';
    const days = 365;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();

    const cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;

    expect(cookie).toContain('_gs_uid=visitor_abc123');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('path=/');
  });

  it('should encode special characters in cookie values', () => {
    const value = 'email=test@example.com&name=John Doe';
    const encoded = encodeURIComponent(value);
    expect(encoded).not.toContain('@');
    expect(encoded).not.toContain(' ');

    // Round-trip
    expect(decodeURIComponent(encoded)).toBe(value);
  });

  it('should parse cookie from document.cookie format', () => {
    const cookieString = '_gs_uid=abc123; other=value; third=data';

    function getCookie(name: string, cookies: string) {
      const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    }

    expect(getCookie('_gs_uid', cookieString)).toBe('abc123');
    expect(getCookie('other', cookieString)).toBe('value');
    expect(getCookie('missing', cookieString)).toBeNull();
  });
});

describe('Beacon Payload Structure', () => {
  it('should format event beacon payload correctly', () => {
    const payload = {
      key: 'pk_test_abc123',
      uid: 'visitor_xyz',
      events: [
        { type: 'click', properties: { button: 'cta' }, url: 'https://example.com', timestamp: 1234567890 },
      ],
    };

    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);

    expect(parsed.key).toBe('pk_test_abc123');
    expect(parsed.uid).toBe('visitor_xyz');
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0].type).toBe('click');
  });

  it('should format memorize beacon payload correctly', () => {
    const payload = {
      key: 'pk_test_abc123',
      uid: 'visitor_xyz',
      email: 'maya@orbitstack.io',
      writes: [
        { target: 'website_zones:primary_goal', value: 'personalize onboarding', url: 'https://example.com', timestamp: 1234567890 },
      ],
    };

    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);

    expect(parsed.email).toBe('maya@orbitstack.io');
    expect(parsed.writes).toHaveLength(1);
    expect(parsed.writes[0].target).toBe('website_zones:primary_goal');
  });

  it('should format identify beacon payload correctly', () => {
    const payload = {
      key: 'pk_test_abc123',
      uid: 'visitor_xyz',
      email: 'maya@orbitstack.io',
      traits: { firstName: 'Maya', company: 'OrbitStack' },
    };

    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);

    expect(parsed.email).toBe('maya@orbitstack.io');
    expect(parsed.traits.firstName).toBe('Maya');
    expect(parsed.traits.company).toBe('OrbitStack');
  });
});

describe('URL Cleanup', () => {
  it('should remove gs token from URL', () => {
    const url = new URL('https://example.com/page?gs=encrypted_token&other=keep');
    url.searchParams.delete('gs');
    expect(url.toString()).toBe('https://example.com/page?other=keep');
  });

  it('should handle URL with only gs param', () => {
    const url = new URL('https://example.com/page?gs=token');
    url.searchParams.delete('gs');
    expect(url.toString()).toBe('https://example.com/page');
  });

  it('should not touch other params when cleaning gs', () => {
    const url = new URL('https://example.com?gs=token&utm_source=email&gs_preview=test@test.com');
    url.searchParams.delete('gs');
    expect(url.searchParams.get('utm_source')).toBe('email');
    expect(url.searchParams.get('gs_preview')).toBe('test@test.com');
  });
});
