import { PublicLayout } from 'containers';
import Link from 'next/link';
import React from 'react';

export default function Landing() {
  return (
    <PublicLayout>
      <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Orchestrate Docker</span>
            <span className="block">
              the way{' '}
              <span className="text-indigo-600">you already understand</span>
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Manage{' '}
            <span className="text-indigo-600 font-semibold">
              docker-compose
            </span>{' '}
            on your servers.
            <span className="block xl:inline ml-1">
              Automate Continuous Delivery with WebHooks.
            </span>
            <span className="block xl:inline ml-1">
              Redeploy on image changes in Docker registries.
            </span>
            <span className="block">
              Nothing more, nothing less.
              <span className="block xl:inline">
                <span className="ml-1  text-indigo-600 font-semibold">
                  $12/year
                </span>{' '}
                when ready, currently in{' '}
                <span className="text-red-600 font-semibold">ALPHA</span>.
              </span>
            </span>
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/api/auth/login">
                <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                  Get started
                </a>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/demo">
                <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                  Demo
                </a>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
