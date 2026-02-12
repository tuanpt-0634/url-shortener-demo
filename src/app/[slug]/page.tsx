import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { UrlShortenerService } from '@/lib/services/url-shortener';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate slug format
  if (!/^[A-Za-z0-9]{6,8}$/.test(slug)) {
    notFound();
  }

  // Get database instance
  const db = await getDb();

  // Fetch the short URL
  const shortUrl = await UrlShortenerService.getBySlug(slug, db);

  if (!shortUrl) {
    notFound();
  }

  // Redirect to the original URL
  redirect(shortUrl.originalUrl);
}
