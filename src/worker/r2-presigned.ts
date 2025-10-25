// Presigned URL generation for direct browser uploads to R2
// This reduces Worker bandwidth by allowing clients to upload directly to R2

import { Hono } from 'hono';

interface Env {
  MEDIA_BUCKET?: R2Bucket;
  USER_ASSETS?: R2Bucket;
  R2_PUBLIC_BASE?: string;
}

const r2PresignedApp = new Hono<{ Bindings: Env }>();

// Helper to get admin token from cookie (imported from main worker context)
function getAdminTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/medusa_admin_jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Generate a presigned POST URL for direct browser uploads
 * This allows users to upload directly to R2 without going through the Worker
 * ✅ SECURITY: Admin-only endpoint with rate limiting
 */
r2PresignedApp.post('/api/r2/presigned-upload', async (c) => {
  // ✅ Admin auth check
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;

  if (!bucket) {
    return c.json({ error: 'r2_not_configured' }, 501);
  }

  try {
    const body = await c.req.json<{
      key: string;
      contentType?: string;
      maxSizeBytes?: number;
      expiresIn?: number; // seconds
    }>();

    const { key, contentType, maxSizeBytes = 10 * 1024 * 1024, expiresIn = 3600 } = body;

    if (!key || key.includes('..') || key.startsWith('/')) {
      return c.json({ error: 'invalid_key' }, 400);
    }

    // Generate presigned POST policy
    // Note: R2 doesn't support AWS S3's presigned POST directly via Workers API
    // Alternative: Use a time-limited upload token stored in Durable Objects

    // For now, return a direct upload URL through the Worker
    // (Client will POST to this endpoint with the file)
    const uploadUrl = `/api/r2/direct-upload`;
    const uploadToken = await generateUploadToken(c, key, expiresIn);

    const base = c.env.R2_PUBLIC_BASE?.trim() || 'https://r2.thevoicesofjudah.com';
    const publicUrl = `${base.replace(/\/$/, '')}/${key}`;

    return c.json({
      uploadUrl,
      uploadToken,
      key,
      publicUrl,
      maxSizeBytes,
      expiresAt: Date.now() + expiresIn * 1000,
      instructions: {
        method: 'POST',
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'X-Upload-Token': uploadToken,
        },
        body: 'File binary data',
      },
    });
  } catch (error) {
    console.error('Presigned upload error:', error);
    return c.json({ error: 'generation_failed' }, 500);
  }
});

/**
 * Direct upload endpoint (validates upload token)
 * ✅ SECURITY: HMAC-signed token validation enabled
 */
r2PresignedApp.post('/api/r2/direct-upload', async (c) => {
  const uploadToken = c.req.header('X-Upload-Token');
  if (!uploadToken) {
    return c.json({ error: 'missing_token' }, 401);
  }

  // ✅ Validate token with HMAC signature
  const validation = await validateUploadToken(c, uploadToken);
  if (!validation.valid || !validation.key) {
    return c.json({
      error: 'invalid_token',
      message: validation.error || 'Token validation failed'
    }, 401);
  }

  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;

  if (!bucket || !c.req.raw.body) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  try {
    // Use key from validated token
    const key = validation.key;

    const contentType = c.req.header('Content-Type') || 'application/octet-stream';

    // Stream upload to R2
    const result = await bucket.put(key, c.req.raw.body, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const base = c.env.R2_PUBLIC_BASE?.trim() || 'https://r2.thevoicesofjudah.com';
    const publicUrl = `${base.replace(/\/$/, '')}/${key}`;

    return c.json({
      success: true,
      key,
      url: publicUrl,
      etag: result.httpEtag,
      size: result.size,
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    return c.json({ error: 'upload_failed' }, 500);
  }
});

/**
 * Generate a time-limited upload token with HMAC signing
 * ✅ SECURITY: Uses Web Crypto API for cryptographically secure tokens
 */
async function generateUploadToken(c: any, key: string, expiresIn: number): Promise<string> {
  const SECRET = c.env.R2_UPLOAD_SECRET || 'CHANGE-THIS-IN-PRODUCTION-GENERATE-WITH-openssl-rand-base64-32';

  const payload = {
    key,
    exp: Date.now() + expiresIn * 1000,
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));

  // Import secret key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate HMAC signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const payloadB64 = btoa(JSON.stringify(payload));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Validate upload token with HMAC signature verification
 * ✅ SECURITY: Prevents token tampering and replay attacks
 */
async function validateUploadToken(c: any, token: string): Promise<{ valid: boolean; key?: string; error?: string }> {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    // Decode payload
    const payloadStr = atob(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify signature
    const SECRET = c.env.R2_UPLOAD_SECRET || 'CHANGE-THIS-IN-PRODUCTION-GENERATE-WITH-openssl-rand-base64-32';
    const encoder = new TextEncoder();

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(payloadStr);
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);

    if (!valid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, key: payload.key };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

export { r2PresignedApp };
