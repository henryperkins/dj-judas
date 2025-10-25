// Multipart upload support for large files (>100MB)
// Enables resumable uploads and better reliability for large media files

import { Hono } from 'hono';

interface Env {
  MEDIA_BUCKET?: R2Bucket;
  USER_ASSETS?: R2Bucket;
  R2_PUBLIC_BASE?: string;
}

const r2MultipartApp = new Hono<{ Bindings: Env }>();

// Helper to get admin token from cookie
function getAdminTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/medusa_admin_jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Initiate a multipart upload
 * Returns an uploadId for subsequent part uploads
 * ✅ SECURITY: Admin-only endpoint
 */
r2MultipartApp.post('/api/r2/multipart/init', async (c) => {
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
    }>();

    const { key, contentType = 'application/octet-stream' } = body;

    if (!key || key.includes('..')) {
      return c.json({ error: 'invalid_key' }, 400);
    }

    // Create multipart upload
    const multipartUpload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    return c.json({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key,
    });
  } catch (error) {
    console.error('Multipart init error:', error);
    return c.json({ error: 'init_failed' }, 500);
  }
});

/**
 * Upload a single part (5MB - 5GB per part)
 * ✅ SECURITY: Admin-only endpoint
 */
r2MultipartApp.put('/api/r2/multipart/part', async (c) => {
  // ✅ Admin auth check
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;

  if (!bucket || !c.req.raw.body) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  try {
    const key = c.req.query('key');
    const uploadId = c.req.query('uploadId');
    const partNumber = parseInt(c.req.query('partNumber') || '0', 10);

    if (!key || !uploadId || partNumber < 1 || partNumber > 10000) {
      return c.json({ error: 'invalid_params' }, 400);
    }

    // Get the multipart upload instance
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

    // Upload the part
    const uploadedPart = await multipartUpload.uploadPart(partNumber, c.req.raw.body);

    return c.json({
      partNumber,
      etag: uploadedPart.etag,
    });
  } catch (error) {
    console.error('Part upload error:', error);
    return c.json({ error: 'upload_failed' }, 500);
  }
});

/**
 * Complete multipart upload
 * Assembles all parts into final object
 * ✅ SECURITY: Admin-only endpoint
 */
r2MultipartApp.post('/api/r2/multipart/complete', async (c) => {
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
      uploadId: string;
      parts: Array<{ partNumber: number; etag: string }>;
    }>();

    const { key, uploadId, parts } = body;

    if (!key || !uploadId || !parts || parts.length === 0) {
      return c.json({ error: 'invalid_params' }, 400);
    }

    // Get the multipart upload instance
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

    // Complete the upload
    const result = await multipartUpload.complete(parts);

    const base = c.env.R2_PUBLIC_BASE?.trim() || 'https://r2.thevoicesofjudah.com';
    const publicUrl = `${base.replace(/\/$/, '')}/${key}`;

    return c.json({
      success: true,
      key: result.key,
      url: publicUrl,
      etag: result.httpEtag,
      size: result.size,
      version: result.version,
    });
  } catch (error) {
    console.error('Multipart complete error:', error);
    return c.json({ error: 'complete_failed' }, 500);
  }
});

/**
 * Abort multipart upload
 * Cleans up parts to avoid storage charges
 * ✅ SECURITY: Admin-only endpoint
 */
r2MultipartApp.delete('/api/r2/multipart/abort', async (c) => {
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
    const key = c.req.query('key');
    const uploadId = c.req.query('uploadId');

    if (!key || !uploadId) {
      return c.json({ error: 'invalid_params' }, 400);
    }

    // Get the multipart upload instance
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

    // Abort the upload
    await multipartUpload.abort();

    return c.json({
      success: true,
      message: 'Multipart upload aborted',
    });
  } catch (error) {
    console.error('Multipart abort error:', error);
    return c.json({ error: 'abort_failed' }, 500);
  }
});

export { r2MultipartApp };
