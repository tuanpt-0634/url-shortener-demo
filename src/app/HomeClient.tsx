"use client";
import UrlShortenerForm from '@/components/UrlShortenerForm';

export default function HomeClient() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-green-300 via-green-200 via-emerald-200 to-green-100">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full mx-auto py-12">
          <header className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-3 tracking-tight drop-shadow-sm">
              URL Shortener
            </h1>
            <p className="text-xl text-emerald-700 font-medium max-w-2xl mx-auto">
              Transform long URLs into short, shareable links
            </p>
            <p className="text-base text-emerald-600 max-w-xl mx-auto">
              Fast • Secure • Analytics-powered
            </p>
          </header>

          <UrlShortenerForm autoFocus />
        </div>
      </div>
      <footer className="w-full py-6 bg-transparent text-center text-sm text-emerald-700 mt-auto">
        <p>Track your links with powerful analytics and insights</p>
      </footer>
    </div>
  );
}