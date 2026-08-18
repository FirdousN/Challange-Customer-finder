import crypto from 'crypto';
import { normalizeInstagramUsername } from '../identity/instagram';

export interface ParsedInstagramQr {
  instagramUsername: string;
  normalizedUsername: string;
  hostname: string;
  pathname: string;
  igsh: string | null;
  utm_source: string | null;
  queryParams: Record<string, string>;
  rawPayload: string;
  payloadHash: string;
}

/**
 * Parses and validates an Instagram QR code URL payload.
 * 
 * @param payload The raw string from the QR scanner
 * @returns ParsedInstagramQr object containing extracted and normalized data
 * @throws Error if the URL is invalid, unsupported, or malformed
 */
export function parseInstagramQr(payload: string): ParsedInstagramQr {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid QR payload provided');
  }

  const trimmedPayload = payload.trim();
  
  if (trimmedPayload.length > 2000) {
    throw new Error('QR payload exceeds maximum length');
  }

  // Prevent javascript/data URIs
  if (/^(javascript|data|file|vbscript):/i.test(trimmedPayload)) {
    throw new Error('Unsupported protocol in QR payload');
  }

  let url: URL;
  try {
    url = new URL(trimmedPayload);
  } catch {
    throw new Error('Malformed URL in QR payload');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are supported');
  }

  if (url.hostname !== 'instagram.com' && url.hostname !== 'www.instagram.com') {
    throw new Error('This QR code is not an Instagram profile QR');
  }

  // Pathname is usually "/username" or "/username/"
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length === 0) {
    throw new Error('No Instagram username found in QR payload');
  }

  // Take the first path segment as the username (e.g., /yesbharathweddingcollections)
  const rawUsername = pathParts[0];
  
  let normalizedUsername: string;
  try {
    normalizedUsername = normalizeInstagramUsername(rawUsername);
  } catch (err) {
    throw new Error(`Invalid Instagram username in QR: ${err instanceof Error ? err.message : String(err)}`);
  }

  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const payloadHash = crypto.createHash('sha256').update(trimmedPayload).digest('hex');

  return {
    instagramUsername: rawUsername,
    normalizedUsername,
    hostname: url.hostname,
    pathname: url.pathname,
    igsh: url.searchParams.get('igsh'),
    utm_source: url.searchParams.get('utm_source'),
    queryParams,
    rawPayload: trimmedPayload,
    payloadHash,
  };
}
