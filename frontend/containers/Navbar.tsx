import React, { useCallback } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { useRouter } from 'next/dist/client/router';

// import Logo from 'svg/logo-stamp.svg';
import Logo from 'svg/logo.svg';
import LogoSymbol from 'svg/logo-symbol.svg';
import { useUser } from '@auth0/nextjs-auth0';
import {
  DropdownButton,
  DropdownMenu,
  DropdownItemText,
  DropdownItemButton,
  DropdownItems,
} from 'components';
import UserIcon from 'svg/user.svg';
import MenuIcon from 'svg/menu.svg';
import XIcon from 'svg/close.svg';
import { Disclosure, Menu, Transition } from '@headlessui/react';

function useLogout() {
  return useCallback(() => {
    sessionStorage.clear();
    window.location.assign('/api/auth/logout');
  }, []);
}

const NavbarLinkDesktop: React.FC<{
  active?: boolean;
  href: string;
  openInNewTab?: boolean;
}> = (props) => {
  return (
    <Link href={props.href}>
      <a
        className={classNames(
          `border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1  text-sm font-medium`,
          props.active && 'border-b-2',
        )}
        style={(props.active && { paddingTop: 6 }) || undefined}
        target={props.openInNewTab ? '_blank' : undefined}
      >
        {props.children}
      </a>
    </Link>
  );
};

const NavbarLinkPhone: React.FC<{
  active?: boolean;
  href: string;
  openInNewTab?: boolean;
}> = (props) => {
  return (
    <Link href={props.href}>
      <a
        className={classNames(
          `block pl-3 pr-4 py-2 border-l-4 text-base font-medium`,
          props.active
            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
        )}
        target={props.openInNewTab ? '_blank' : undefined}
      >
        {props.children}
      </a>
    </Link>
  );
};

const ProfileDesktop: React.FC<{}> = (props) => {
  const { user, error, isLoading } = useUser();
  const onLogout = useLogout();

  return (
    <DropdownMenu className="hidden lg:ml-4 lg:flex lg:items-center">
      {!user && (
        <Link href="/api/auth/login">
          <a
            className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            id="user-menu"
          >
            <span className="sr-only">Login</span>
            <UserIcon className="h-8 w-8 text-gray-400" />
          </a>
        </Link>
      )}
      {user && (
        <DropdownButton className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="sr-only">Open user menu</span>
          {user.picture && (
            <img className="h-8 w-8 rounded-full" src={user.picture} alt="" />
          )}
        </DropdownButton>
      )}
      <DropdownItems>
        <DropdownItemText>{user?.name}</DropdownItemText>

        <DropdownItemButton onClick={onLogout}>Sign out</DropdownItemButton>
      </DropdownItems>
    </DropdownMenu>
  );
};

const NavbarDesktop: React.FC<{}> = (props) => {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  return (
    <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
      <NavbarLinkDesktop href="/docs" active={/^\/docs/.test(router.pathname)}>
        Documentation
      </NavbarLinkDesktop>
      <a
        href="https://github.com/jkelin/supercompose"
        className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1  text-sm font-medium"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
      {user && (
        <NavbarLinkDesktop
          href="/"
          active={/^\/(dashboard|node|compose|deployment)/.test(
            router.pathname,
          )}
        >
          Dashboard
        </NavbarLinkDesktop>
      )}
    </div>
  );
};

const NavbarPhone: React.FC<{}> = (props) => {
  const { user, error, isLoading } = useUser();
  const onLogout = useLogout();
  const router = useRouter();

  return (
    <Disclosure.Panel className="lg:hidden">
      <div className="pt-2 pb-3 space-y-1">
        {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800" */}
        <NavbarLinkPhone href="/docs" active={/^\/docs/.test(router.pathname)}>
          Documentation
        </NavbarLinkPhone>
        <NavbarLinkPhone
          href="https://github.com/jkelin/supercompose"
          openInNewTab={true}
        >
          GitHub
        </NavbarLinkPhone>
        {user && (
          <NavbarLinkPhone
            href="/"
            active={/^\/(dashboard|node|compose|deployment)/.test(
              router.pathname,
            )}
          >
            Dashboard
          </NavbarLinkPhone>
        )}
      </div>
      <div className="pt-4 pb-3 border-t border-gray-200">
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            {user?.picture && (
              <img
                className="h-10 w-10 rounded-full"
                src={user.picture}
                alt=""
              />
            )}
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-gray-800">
              {user?.name}
            </div>
            <div className="text-sm font-medium text-gray-500">
              {user?.email}
            </div>
          </div>
        </div>
        {user && (
          <div className="mt-3 space-y-1">
            <button
              onClick={onLogout}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        )}
        {!user && (
          <div className="mt-3 space-y-1">
            <NavbarLinkPhone href="/api/auth/login">Login</NavbarLinkPhone>
          </div>
        )}
      </div>
    </Disclosure.Panel>
  );
};

const NavbarPhoneButton: React.FC<{}> = (props) => {
  return (
    <div className="flex items-center lg:hidden">
      {/* Mobile menu button */}
      <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
        {({ open }) => (
          <>
            <span className="sr-only">Open main menu</span>
            {open ? (
              <XIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <MenuIcon className="block h-6 w-6" aria-hidden="true" />
            )}
          </>
        )}
      </Disclosure.Button>
    </div>
  );
};

export const Navbar: React.FC<{}> = (props) => {
  return (
    <Disclosure as="nav" className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex px-2 lg:px-0">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <LogoSymbol
                  className="block lg:hidden h-8 w-auto"
                  style={{ height: 39 }}
                />
                <Logo
                  className="hidden lg:block h-8 w-auto"
                  style={{ height: 41 }}
                />
              </a>
            </Link>
            <NavbarDesktop />
          </div>
          <ProfileDesktop />
          <NavbarPhoneButton />
        </div>
      </div>
      <NavbarPhone />
    </Disclosure>
  );
};
