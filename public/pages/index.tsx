import Head from 'next/head';
import Logo from '../svg/logo2.svg';
import SpeechBubble from '../svg/speech-bubble.svg';
import DotPattern from '../svg/dot-pattern.svg';
import Link from 'next/link';
import Image from 'next/image';
import React, { Fragment, ReactNode } from 'react';
import classNames from 'classnames';
import { Menu, Popover, Transition } from '@headlessui/react';
import {
  BookmarkAltIcon,
  CalendarIcon,
  ChartBarIcon,
  CursorClickIcon,
  MenuIcon,
  PhoneIcon,
  PlayIcon,
  RefreshIcon,
  ShieldCheckIcon,
  SupportIcon,
  ViewGridIcon,
  XIcon,
} from '@heroicons/react/outline';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { usePanelbear } from '../lib/usePanelbear';

function mailTo(email: string, name: string, subject?: string) {
  let link = `mailto:${encodeURIComponent(`"${name}"<${email}>`).replace(
    '%40',
    '@',
  )}`;

  if (subject) {
    link += `?subject=${encodeURIComponent(subject)}`;
  }

  return link;
}

const FeatureItem: React.FC<{
  title: ReactNode;
  icon: React.ComponentType<{ width: any; height: any }>;
  titleSuffix?: ReactNode;
  className?: string;
}> = (props) => {
  const Icon = props.icon;
  return (
    <div className={classNames('flex flex-row', props.className)}>
      <div className="flex-shrink-0 min-w-48 w-48 min-h-48 h-48 bg-indigo-500 rounded-md flex items-center justify-center text-white">
        <Icon width={18} height={14} />
      </div>
      <div className="w-16" />
      <div className="flex-1">
        <div className="text-base">
          <span className="text-gray-900 font-medium">{props.title}</span>
          {props.titleSuffix && (
            <span className="text-gray-400"> {props.titleSuffix}</span>
          )}
        </div>
        <div className="text-sm md:text-base text-gray-500 mt-4 md:mt-8">
          {props.children}
        </div>
      </div>
    </div>
  );
};

const NavbarMenuItem: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  href?: string;
  target?: string;
}> = (props) => {
  return (
    <a
      key={props.title}
      href={props.href}
      target={props.target}
      className="-m-12 p-12 flex items-center rounded-md hover:bg-gray-50"
    >
      <props.icon
        className="flex-shrink-0 h-24 w-24 text-indigo-600"
        aria-hidden="true"
      />
      <span className="ml-12 text-base font-medium text-gray-900">
        {props.title}
      </span>
    </a>
  );
};

const Navbar: React.FC<{}> = (props) => {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-20 sm:px-24">
            <div className="flex justify-between items-center py-24 md:justify-start md:space-x-10">
              <div className="flex w-0 flex-1">
                <Link href="/">
                  <a title="SuperCompose - Landing page">
                    <span className="sr-only">SuperCompose</span>
                    <Logo className="h-47 w-auto" />
                  </a>
                </Link>
              </div>
              <div className="-mr-8 -my-8 md:hidden">
                <Popover.Button className="bg-white rounded-md p-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open menu</span>
                  <MenuIcon className="h-24 w-24" aria-hidden="true" />
                </Popover.Button>
              </div>
              <Popover.Group as="nav" className="hidden md:flex space-x-40">
                <a
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                  href="https://github.com/jkelin/supercompose"
                  target="_blank"
                >
                  GitHub
                </a>
                <a
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                  href="https://docs.supercompose.net"
                >
                  Documentation
                </a>
                {/* <Link href="/rationale">
                  <a className="text-base font-medium text-gray-500 hover:text-gray-900">
                    But Why?
                  </a>
                </Link> */}
                <a
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                  href="https://status.supercompose.net"
                >
                  Status
                </a>
              </Popover.Group>
              <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
                <a
                  href="https://app.supercompose.net/api/login"
                  className="inline-flex items-center px-20 py-8 border border-transparent text-md bg-white font-medium rounded shadow text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>

          <Transition
            show={open}
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Popover.Panel
              focus
              static
              className="absolute top-0 inset-x-0 z-10 p-8 transition transform origin-top-right md:hidden"
            >
              <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-20 bg-white divide-y-2 divide-gray-50">
                <div className="pt-20 pb-24 px-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <Logo className="h-47 w-auto" />
                    </div>
                    <div className="-mr-8">
                      <Popover.Button className="bg-white rounded-md p-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                        <span className="sr-only">Close menu</span>
                        <XIcon className="h-24 w-24" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="mt-24">
                    <nav className="grid gap-y-32">
                      <NavbarMenuItem
                        icon={ChartBarIcon}
                        href="https://github.com/jkelin/supercompose"
                        target="_blank"
                        title="GitHub"
                      />
                      <NavbarMenuItem
                        icon={ChartBarIcon}
                        href="https://docs.supercompose.net"
                        title="Documentation"
                      />
                      <Link href="/rationale">
                        <NavbarMenuItem icon={ChartBarIcon} title="But Why?" />
                      </Link>
                    </nav>
                  </div>
                </div>
                <div className="py-24 px-20 space-y-24">
                  {/* <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <a
                      className="text-base font-medium text-gray-900 hover:text-gray-700"
                      href="https://github.com/jkelin/supercompose"
                      target="_blank"
                    >
                      GitHub
                    </a>
                    <a
                      className="text-base font-medium text-gray-900 hover:text-gray-700"
                      href="https://docs.supercompose.net"
                    >
                      Documentation
                    </a>
                    <Link href="/rationale">
                      <a className="text-base font-medium text-gray-900 hover:text-gray-700">
                        But Why?
                      </a>
                    </Link>
                  </div> */}
                  <div>
                    <a
                      href="https://app.supercompose.net/api/register"
                      className="w-full flex items-center justify-center px-16 py-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Sign up
                    </a>
                    <p className="mt-24 text-center text-base font-medium text-gray-500">
                      Existing account?{' '}
                      <a
                        href="https://app.supercompose.net/api/login"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Sign in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

const NewsletterSection: React.FC<{}> = (props) => {
  return (
    <section className="bg-gray-800 mt-32">
      <div className="max-w-7xl mx-auto py-48 px-16 sm:px-24 lg:py-64 lg:px-32 lg:flex lg:items-center">
        <div className="lg:w-0 lg:flex-1">
          <h2
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            id="newsletter-headline"
          >
            Sign up for our newsletter
          </h2>
          <p className="mt-12 max-w-3xl text-lg leading-24 text-gray-300">
            SuperCompose is still under heavy development but we will let you
            know about any updates that we have
          </p>
        </div>
        <div className="mt-32 lg:mt-0 lg:ml-32">
          <form className="sm:flex">
            <label htmlFor="emailAddress" className="sr-only">
              Email address
            </label>
            <input
              id="emailAddress"
              name="emailAddress"
              type="email"
              autoComplete="email"
              required
              className="w-full px-20 py-12 border border-transparent placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white focus:border-white sm:max-w-xs rounded-md"
              placeholder="Enter your email"
            />
            <div className="mt-12 rounded-md shadow sm:mt-0 sm:ml-12 sm:flex-shrink-0">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-20 py-12 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
              >
                Notify me
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  usePanelbear();

  return (
    <>
      <Head>
        <title>SuperCompose</title>
        <meta
          name="description"
          content="Manage docker-compose on your servers with a simple web UI"
        />
        <link rel="icon" href="/favicon.ico" />

        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800"
          rel="stylesheet"
        />
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Inter"
          rel="stylesheet"
        /> */}

        <meta property="og:title" content="SuperCompose" />
        <meta property="og:site_name" content="SuperCompose" />
        <meta
          property="og:description"
          content="Manage docker-compose on your servers with a simple web UI"
        />
        <meta property="og:url" content="https://supercompose.net/" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://supercompose.net/og_preview.png"
        />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="640" />

        <link rel="icon" href="/favicon.svg" />
      </Head>
      <div
        className="absolute w-full h-full select-none pointer-events-none m-0 p-0 top-0 overflow-hidden"
        style={{ zIndex: -1 }}
      >
        <DotPattern
          className="absolute right-0 top-0"
          style={{ zIndex: -1 }}
          aria-hidden
        />
        <DotPattern
          className="absolute left-0"
          aria-hidden
          style={{ zIndex: -1, top: 500 }}
        />
        <DotPattern
          aria-hidden
          className="absolute left-0"
          style={{ zIndex: -1, top: 1000 }}
        />
        <DotPattern
          aria-hidden
          className="absolute right-0"
          style={{ zIndex: -1, top: 2100 }}
        />
      </div>
      <Navbar />

      <main>
        <section className="px-20 text-center mx-auto max-w-3xl w-full mt-25">
          <h1 className="font-extrabold text-4xl md:text-[60px] md:leading-[60px]">
            <span className="text-gray-900">Manage your servers</span>
            <br />
            <span className="text-indigo-600">the easy way</span>
          </h1>
          <h2 className="mt-20 text-lg md:text-xl text-gray-500">
            <span className="md:block">
              Use docker-compose from a web UI to manage applications on your
              servers.
            </span>
            <span>
              {' '}
              Choose simple tech that you already know instead of complicating
              things.
            </span>
          </h2>
          <a
            href="https://app.supercompose.net/api/register"
            className="w-full sm:w-auto text-center inline-flex justify-center items-center mt-20 px-20 py-16 border border-transparent text-md bg-indigo-600 font-medium rounded-lg shadow text-white hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Get started - it’s free
          </a>
          <div className="mt-12 mb-28 md:mt-20 md:mb-20 text-gray-500 text-sm">
            Currently in ALPHA
          </div>
        </section>

        <section
          className="relative mt-24 overflow-hidden w-full"
          style={{ minHeight: 300 }}
        >
          <div className="flex justify-center z-20 mx-20">
            <div className="relative">
              <div className="hidden xl:block absolute bottom-[14px] xl:left-[-282px] rounded-lg shadow-landing">
                <img
                  src="/img/landing/ss-deployment.png"
                  srcSet="/img/landing/ss-deployment.png, /img/landing/ss-deployment-2x.png 2x"
                  alt="Screenshot of deployment"
                  className="rounded-lg"
                  width={1024 / 2}
                  height={819 / 2}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>

              <div className="hidden xl:block absolute bottom-[14px] xl:right-[-282px] rounded-lg shadow-landing">
                <img
                  src="/img/landing/ss-create-compose.png"
                  srcSet="/img/landing/ss-create-compose.png, /img/landing/ss-create-compose-2x.png 2x"
                  alt="Screenshot of compose creation"
                  className="rounded-lg"
                  width={1024 / 2}
                  height={845 / 2}
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>

              <img
                src="/img/landing/ss-create-node.png"
                srcSet="/img/landing/ss-create-node.png, /img/landing/ss-create-node-2x.png 2x"
                alt="Screenshot of node creation"
                className="relative rounded-lg shadow-landing"
                width={1024}
                height={612}
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
          <div className="w-full mt-[-100px] xs:mt-[-280px] sm:mt-[-230px] md:mt-[-200px] left-0 bg-gray-800 h-200 sm:h-250 z-10" />
        </section>

        <section className="text-center pt-40 sm:pt-60 mx-20">
          <h2 className="text-3xl sm:text-4xl text-gray-900 font-bold">
            A simpler way to deploy applications
          </h2>
          <h3 className="sm:text-lg font-normal mt-8 sm:mt-16 text-gray-500 max-w-[780px] m-auto">
            Docker-compose is widely used while developing applications. So why
            not use the same exact thing for production deployments? Save time
            and money by avoiding complexity.
          </h3>
        </section>

        <section className="mt-20 md:mt-95 grid gap-32 auto-rows-min grid-rows-2 md:grid-rows-1 md:grid-cols-2 md:max-w-5xl mx-20 lg:px-20 md:mx-auto">
          <div className="max-w-[570px]">
            <h3 className="text-3xl md:text-3xl text-gray-900 font-bold">
              Feature set
            </h3>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="Deploy compose files to servers"
            >
              Configure servers with SSH credentials and deploy compose files
              into them. SuperCompose shows a step by step log of what it is
              doing on the server so you can diagnose issues.
            </FeatureItem>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="Monitor deployments"
              titleSuffix="- planned"
            >
              Know the state of your deployment at a glance, see health
              information, stream container logs and get notified about issues.
              <br />
              <a
                href={mailTo(
                  'jan@supercompose.net',
                  'Jan Kelin',
                  "I'd like to see deployment monitoring in SuperCompose",
                )}
                className="underline text-blue-500 hover:text-blue-700"
              >
                Tell us why is this important to you?
              </a>
            </FeatureItem>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="Integrate with CI/CD"
              titleSuffix="- planned"
            >
              Redeploy on on Docker registry changes. Run pre/post deployment
              actions, like git pull or HTTP request, so that you don’t need
              other CD tools.
              <br />
              <a
                href={mailTo(
                  'jan@supercompose.net',
                  'Jan Kelin',
                  "I'd like to see deployment CI/CD integration in SuperCompose",
                )}
                className="underline text-blue-500 hover:text-blue-700"
              >
                Tell us why is this important to you?
              </a>
            </FeatureItem>
          </div>
          <div className="relative w-full md:order-first">
            <Image
              src="/img/landing/features-resource-list.png"
              alt="Picture of SuperCompose server and compose list"
              width={476}
              height={564}
              quality={95}
            />
          </div>
        </section>

        <section className="mt-20 md:mt-95 grid gap-32 auto-rows-min grid-rows-2 md:grid-rows-1 md:grid-cols-2 md:max-w-5xl mx-20 lg:px-20 lg:mx-auto">
          <div className="max-w-[570px]">
            <h2 className="text-3xl md:text-3xl text-gray-900 font-bold">
              Is SuperCompose right for you?
            </h2>
            <div className="text-gray-600 mt-12">
              Tech giants have datacentres full of servers with thousands of
              engineers writing and deploying applications so they need complex
              orchestrators like Kubernetes. If you don’t operate at their
              scale, you don’t need their complexity.
            </div>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="One person team"
            >
              Tired of complex infrastructure designed to be maintainained by a
              dedicated team of operators? Do you just need a database and a few
              services deployed without going broke because cloud is overpriced?
              Just deploy docker-compose!
            </FeatureItem>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="Small to medium enterprise"
            >
              No surprises, stable and reliable. Does not matter if it’s legacy
              or new development, we can manage it if it runs in Docker.
              Competent DevOps engineers are expensive. Cloud is expensive.
              SuperCompose saves costs and reduces operational complexity.
            </FeatureItem>
            <FeatureItem
              className="mt-20 md:mt-40"
              icon={SpeechBubble}
              title="Homelab hobbyist"
            >
              Managing a homelab is fun and solving problems is a great learning
              experience - but sometimes you just want things to work. Most
              projects come with docker-compose out of the box so all you need
              to do is deploy it with a simple web GUI.
            </FeatureItem>
          </div>
          <div className="relative w-full">
            {/* <Image
              src="/img/landing/features-compose-edit.png"
              alt="Picture of SuperCompose docker-compose edit"
              className="rounded-lg"
              width={486}
              height={685}
              quality={95}
            /> */}
            <img
              src="/img/landing/ss-compose-panel.png"
              srcSet="/img/landing/ss-compose-panel.png, /img/landing/ss-compose-panel-2x.png 2x"
              alt="Screenshot of compose detail"
              className="rounded-lg"
              style={{ imageRendering: 'crisp-edges' }}
              width={476}
              height={513}
            />
          </div>
        </section>

        <NewsletterSection />

        <section className="flex flex-col items-center border-t border-gray-900 bg-gray-800 py-48">
          <div className="flex flex-row flex-wrap items-center justify-center space-x-8">
            <a
              className="block text-gray-500 p-4"
              href="https://github.com/jkelin/supercompose"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="block text-gray-500 p-4"
              href="https://docs.supercompose.net"
            >
              Documentation
            </a>
            <a
              className="block text-gray-500 p-4"
              href="https://status.supercompose.net"
            >
              Status
            </a>
            {/* <Link href="/rationale">
              <a className="block text-gray-500 p-4">Why SuperCompose?</a>
            </Link> */}
          </div>

          <div className="mt-8 text-gray-400">
            <a
              href={mailTo('jan@supercompose.net', 'Jan Kelin')}
              className="text-gray-400"
            >
              jan@supercompose.net
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
