'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import type { CreateShortUrlResponse, ErrorResponse } from '@/lib/types';

export default function UrlShortenerForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateShortUrlResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          label="Enter your long URL"
          placeholder="https://example.com/very/long/url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          aria-label="URL to shorten"
          required
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Shorten URL'}
        </Button>
      </form>

      {error && (
        <Alert type="error" className="mt-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {result && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Success! Your short URL is ready</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.shortUrl}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Original URL</label>
              <input
                type="text"
                readOnly
                value={result.originalUrl}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                aria-label="Original URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analytics Dashboard
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.analyticsUrl}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
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
              <strong>Analytics Token:</strong> Save your analytics URL to track clicks on your
              short link. You&apos;ll need it to view statistics later.
            </Alert>
          </div>
        </Card>
      )}
    </div>
  );
}
