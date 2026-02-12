'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Custom 404 Not Found page
 *
 * Shown when:
 * - A short URL slug doesn't exist
 * - User navigates to an invalid route
 *
 * Provides helpful guidance and navigation back to home
 */
export default function NotFound() {
  const pathname = usePathname();

  // Extract potential slug from pathname
  const slug = pathname?.replace('/', '') || '';
  const isLikelySlug = slug.length >= 6 && slug.length <= 8 && /^[A-Za-z0-9]+$/.test(slug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            404 - Not Found
          </h1>

          {isLikelySlug ? (
            <div className="space-y-2">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Short URL not found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                The short URL <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-red-600 dark:text-red-400 font-mono">/{slug}</code> doesn&apos;t exist or may have expired.
              </p>
            </div>
          ) : (
            <p className="text-xl text-gray-600 dark:text-gray-400">
              The page you&apos;re looking for doesn&apos;t exist
            </p>
          )}
        </div>

        {/* Helpful Suggestions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left space-y-2">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            Possible reasons:
          </h2>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>The URL was mistyped or copied incorrectly</li>
            <li>The short URL may have been deleted</li>
            <li>The link may be outdated</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <Button size="lg" variant="primary">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Home
            </Button>
          </Link>

          <Button size="lg" variant="outline" onClick={() => window.history.back()}>
            <svg
              className="w-5 h-5 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </Button>
        </div>

        {/* Additional Help */}
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-4">
          Need help? Create a new short URL from the{' '}
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            home page
          </Link>
        </p>
      </Card>
    </div>
  );
}
