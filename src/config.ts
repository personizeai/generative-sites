import { Personize } from '@personize/sdk';
import 'dotenv/config';

// ─── Required Environment Variables ─────────────────────────────────────────
const REQUIRED_ENV = ['PERSONIZE_SECRET_KEY'] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// ─── Personize Client ───────────────────────────────────────────────────────
export const client = new Personize({
  secretKey: process.env.PERSONIZE_SECRET_KEY!,
});

/** Call once at startup to verify auth and print plan limits. */
export async function verifySetup() {
  const me = await client.me();
  console.log('[gs-setup] Verified:', {
    org: me.data?.organization,
    rateLimit: `${me.data?.plan?.limits?.maxApiCallsPerMinute}/min`,
  });
  return me.data;
}

// ─── GS-Specific Config ────────────────────────────────────────────────────

/** The collection slug used by the flagship demo and default zone setup. */
export const WEBSITE_ZONES_COLLECTION = process.env.GS_COLLECTION_SLUG || 'website_zones';

/** Primary key field for the website_zones collection. */
export const PRIMARY_KEY_FIELD = 'email';

/** Configurable rate-limit pause (ms) between batched API calls. */
export const RATE_LIMIT_PAUSE_MS = Number(process.env.RATE_LIMIT_PAUSE_MS) || 2000;
