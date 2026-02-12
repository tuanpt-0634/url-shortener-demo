import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.MAX_REQUESTS_PER_WINDOW || '60', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/**
 * In-memory rate limit storage
 * Format: Map<IP, Array<timestamp>>
 *
 * Note: In production with multiple Workers instances,
 * consider using Cloudflare Durable Objects or KV for distributed rate limiting
 */
const rateLimitStore = new Map<string, number[]>();

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check Cloudflare headers first
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback to other headers
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  // Default fallback
  return 'unknown';
}

/**
 * Check if request should be rate limited
 * @returns true if request should be blocked (rate limit exceeded)
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];

  // Remove timestamps outside the current window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if rate limit exceeded
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Add current timestamp
  validTimestamps.push(now);
  rateLimitStore.set(ip, validTimestamps);

  return false;
}

/**
 * Clean up old entries from rate limit store
 * Called periodically to prevent memory leaks
 */
function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    if (validTimestamps.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validTimestamps);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Next.js middleware
 * Handles rate limiting and CORS for API routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes only
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);

    // Skip rate limiting for health check endpoint
    if (pathname === '/api/health') {
      return NextResponse.next();
    }

    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${Math.ceil(RATE_LIMIT_WINDOW / 1000)} seconds.`,
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000)),
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const ip = clientIP;
    const timestamps = rateLimitStore.get(ip) || [];
    const validTimestamps = timestamps.filter(
      (timestamp) => Date.now() - timestamp < RATE_LIMIT_WINDOW
    );

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    response.headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - validTimestamps.length));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000)));

    // Add CORS headers for API routes
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': CORS_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    response.headers.set('Access-Control-Allow-Origin', CORS_ORIGIN);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
