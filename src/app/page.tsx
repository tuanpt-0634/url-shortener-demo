import UrlShortenerForm from '@/components/UrlShortenerForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            URL Shortener
          </h1>
          <p className="text-lg text-gray-600">
            Fast, secure, and reliable URL shortening with analytics tracking
          </p>
        </header>

        <UrlShortenerForm />

        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>Create short URLs and track clicks with detailed analytics</p>
        </footer>
      </div>
    </div>
  );
}

