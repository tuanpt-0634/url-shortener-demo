'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import type { CreateShortUrlResponse, ErrorResponse } from '@/lib/types';

export default function UrlShortenerForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateShortUrlResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        setError(errorData.message || 'An error occurred while creating the short URL');
        return;
      }

      setResult(data as CreateShortUrlResponse);
      setUrl(''); // Clear the input
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Error creating short URL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [result]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="text"
            label="Enter your long URL"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            aria-label="URL to shorten"
            autoFocus={autoFocus}
          />

          <Button type="submit" disabled={loading} className="w-full text-lg py-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Shorten URL'
            )}
          </Button>
        </form>
      </Card>

      {error && (
        <Alert type="error" className="mb-6">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {result && (
        <div ref={resultRef}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-teal-900">Your short URL is ready!</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-2">Short URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.shortUrl}
                    className="flex-1 px-4 py-3 border border-teal-200 rounded-lg bg-teal-50 text-teal-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Short URL"
                  />
                  <Button
                    onClick={() => handleCopy(result.shortUrl)}
                    variant="secondary"
                    type="button"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-2">Original URL</label>
                <input
                  type="text"
                  readOnly
                  value={result.originalUrl}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none"
                  aria-label="Original URL"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-2">
                  Analytics Dashboard
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.analyticsUrl}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none"
                    aria-label="Analytics URL"
                  />
                  <Button
                    onClick={() => window.open(result.analyticsUrl, '_blank')}
                    variant="secondary"
                    type="button"
                  >
                    View
                  </Button>
                </div>
              </div>

              <Alert type="info" className="text-sm">
                <strong>💡 Tip:</strong> Save your analytics URL to track clicks and view detailed statistics for your short link.
              </Alert>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
