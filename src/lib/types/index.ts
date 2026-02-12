/**
 * Database entity types
 */

export interface ShortUrl {
  id: number;
  slug: string;
  originalUrl: string;
  analyticsToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClickEvent {
  id: number;
  shortUrlId: number;
  timestamp: string;
  referrer: string | null;
  userAgent: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface AnalyticsSummary {
  id: number;
  shortUrlId: number;
  periodStart: string;
  periodEnd: string;
  periodType: 'hour' | 'day' | 'week';
  totalClicks: number;
  clicksByDevice: string | null;
  clicksByReferrer: string | null;
  createdAt: string;
}

/**
 * API Request/Response types
 */

export interface CreateShortUrlRequest {
  url: string;
}

export interface CreateShortUrlResponse {
  shortUrl: string;
  slug: string;
  originalUrl: string;
  analyticsToken: string;
  analyticsUrl: string;
  createdAt: string;
}

export interface AnalyticsResponse {
  slug: string;
  originalUrl: string;
  createdAt: string;
  totalClicks: number;
  clicksByPeriod: {
    period: string;
    clicks: number;
  }[];
  clicksByDevice: {
    device: string;
    clicks: number;
  }[];
  clicksByReferrer: {
    referrer: string;
    clicks: number;
  }[];
}

export interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * Utility types
 */

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface ClickEventData {
  referrer: string | null;
  userAgent: string | null;
  deviceType: DeviceType;
  ipAddress: string | null;
}
