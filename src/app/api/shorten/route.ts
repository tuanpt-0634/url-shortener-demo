import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { UrlShortenerService } from '@/lib/services/url-shortener';
import { SecurityService } from '@/lib/services/security';
import type { CreateShortUrlRequest, CreateShortUrlResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateShortUrlRequest = await request.json();

    // Validate request
    if (!body.url || typeof body.url !== 'string') {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request',
        message: 'URL is required and must be a string',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for malicious URLs
    try {
      await SecurityService.validateUrlSafety(body.url);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        error: 'Malicious URL detected',
        message:
          error instanceof Error
            ? error.message
            : 'This URL has been identified as potentially harmful and cannot be shortened',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get database instance
    const db = await getDb();

    // Create short URL
    const { shortUrl } = await UrlShortenerService.createShortUrl({
      originalUrl: body.url,
      db,
    });

    // Build response
    const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const response: CreateShortUrlResponse = {
      shortUrl: `${baseUrl}/${shortUrl.slug}`,
      slug: shortUrl.slug,
      originalUrl: shortUrl.originalUrl,
      analyticsToken: shortUrl.analyticsToken,
      analyticsUrl: `${baseUrl}/analytics/${shortUrl.analyticsToken}`,
      createdAt: shortUrl.createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating short URL:', error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid URL format',
        message: error.message,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Handle slug generation errors
    if (error instanceof Error && error.message.includes('Unable to generate unique slug')) {
      const errorResponse: ErrorResponse = {
        error: 'Slug generation failed',
        message: error.message,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Generic error
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the short URL',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
