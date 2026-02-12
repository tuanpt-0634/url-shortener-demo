import UrlShortenerForm from '@/components/UrlShortenerForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-teal-900 mb-3 tracking-tight">
            URL Shortener
          </h1>
          <p className="text-xl text-teal-700 font-medium max-w-2xl mx-auto">
            Transform long URLs into short, shareable links
          </p>
          <p className="text-base text-teal-600 max-w-xl mx-auto">
            Fast • Secure • Analytics-powered
          </p>
        </header>

        <UrlShortenerForm />

        <footer className="mt-16 text-center text-sm text-teal-600">
          <p>Track your links with powerful analytics and insights</p>
        </footer>
      </div>
    </div>
  );
}

