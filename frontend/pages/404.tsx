import { PublicLayout } from 'containers';
import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <PublicLayout>
      <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block xl:inline text-indigo-600">404</span>
            <br />
            <span className="block xl:inline">Page not found</span>
          </h1>
        </div>
      </main>
    </PublicLayout>
  );
}
