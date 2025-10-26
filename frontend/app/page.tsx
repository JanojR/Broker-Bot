'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Contractr.AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/projects" className="text-gray-700 hover:text-gray-900">
                Projects
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find & Negotiate with Contractors Automatically
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stage 1: Discover contractors. Stage 2: Negotiate the best deal.
          </p>
          <Link href="/projects/new" className="btn btn-primary text-lg px-8">
            Create Project
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Stage 1: Discovery</h3>
            <p className="text-gray-600">
              Automated web scraping finds relevant contractors with validated contact info.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Stage 2: Negotiation</h3>
            <p className="text-gray-600">
              AI-powered outreach via email/SMS to negotiate terms, match prices, and close deals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
