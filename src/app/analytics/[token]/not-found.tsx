/**
 * Not Found Page for Analytics
 * Displayed when analytics token is not found
 */

import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Analytics Not Found
          </h2>
        </div>

        <Alert type="warning">
          <p className="mb-4">
            The analytics token you're looking for doesn't exist or may have been deleted.
          </p>
          <p className="text-sm">
            Please check the token and try again, or create a new short URL.
          </p>
        </Alert>

        <div className="mt-6">
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
