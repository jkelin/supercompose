import classnames from 'classnames';
import React, {
  Fragment,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Menu, Transition } from '@headlessui/react';

export const DropdownMenu: React.FC<{ className?: string }> = (props) => {
  return (
    <div className={classnames(props.className, 'flex items-center')}>
      <Menu as="div" className="relative inline-block text-left">
        {props.children}
      </Menu>
    </div>
  );
};

export const DropdownItems: React.FC<{ className?: string }> = (props) => {
  return (
    <Menu.Items className={props.className} static>
      {({ open }) => (
        <Transition
          show={open}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            {props.children}
          </div>
        </Transition>
      )}
    </Menu.Items>
  );
};

export const DropdownButton: React.FC<{ className?: string }> = (props) => {
  return (
    <Menu.Button className={props.className}>{props.children}</Menu.Button>
  );
};

export const DropdownItemText: React.FC<{
  className?: string;
}> = (props) => {
  return (
    <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-300">
      <div>{props.children}</div>
    </div>
  );
};

export const DropdownItemButton: React.FC<{
  className?: string;
  disabled?: boolean;
  onClick?: () => unknown;
}> = (props) => {
  return (
    <Menu.Item disabled={props.disabled} onClick={props.onClick}>
      {(x) => (
        <button
          onClick={props.onClick}
          className={classnames(
            props.className,
            'block w-full text-left px-4 py-2 text-sm text-gray-700 last:rounded-b-md',
            x.active && 'bg-gray-100',
          )}
          disabled={props.disabled}
          role="menuitem"
          type="button"
        >
          {props.children}
        </button>
      )}
    </Menu.Item>
  );
};
