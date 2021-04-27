import { PublicLayout } from 'containers';
import Link from 'next/link';
import React from 'react';

export default function Landing() {
  return (
    <PublicLayout>
      <main>
        <section className="mx-auto max-w-7xl px-4 sm:mt-24 py-16">
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
                  {/* <span className="ml-1 text-indigo-600 font-semibold">
                  $12/year
                </span>{' '}
                when ready, */}{' '}
                  Currently in{' '}
                  <span className="text-red-600 font-semibold">ALPHA</span>.
                </span>
              </span>
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/api/auth/login">
                  <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                    Try SuperCompose
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
        </section>
        <section className="bg-gray-900 px-4 py-16 pb-32">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Newsletter
            </h2>

            <p className="text-white mb-3 leading-4">
              SuperCompose is still under heavy development but we will let you
              know about any updates that we have
            </p>

            <form
              action="https://supercompose.us1.list-manage.com/subscribe/post?u=a0046024c5662f89708c48a35&amp;id=7c348e4eb0"
              target="_blank"
              method="POST"
              className="grid grid-cols-1 md:grid-cols-6 gap-x-2 gap-y-2"
            >
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="EMAIL"
                type="email"
                autoComplete="email"
                className="col-span-1 md:col-span-4 block w-full shadow-sm py-2 px-4 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                placeholder="Email"
                required
              />
              <div
                style={{ position: 'absolute', left: -5000 }}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="b_a0046024c5662f89708c48a35_7c348e4eb0"
                  tabIndex={-1}
                  value=""
                ></input>
              </div>

              <button
                type="submit"
                className="col-span-1 md:col-span-2 inline-flex w-full justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign me up
              </button>
            </form>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
