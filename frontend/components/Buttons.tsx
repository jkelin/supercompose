import classNames from 'classnames';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { Spinner } from './Icons';

type ButtonKind =
  | 'primary'
  | 'primary-danger'
  | 'secondary'
  | 'secondary-danger';

function buttonClassName(opts: {
  isLoading?: boolean;
  kind: ButtonKind;
  className?: string;
}) {
  if (opts.kind === 'secondary') {
    return classNames(
      'select-none border border-grey-600 rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
      !opts.isLoading && 'bg-white ',
      opts.isLoading && 'bg-gray-400 disabled cursor-wait',
      opts.className,
    );
  } else if (opts.kind === 'secondary-danger') {
    return classNames(
      'select-none border border-red-600 rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
      !opts.isLoading && 'bg-white ',
      opts.isLoading && 'bg-red-400 disabled cursor-wait',
      opts.className,
    );
  } else if (opts.kind === 'primary') {
    return classNames(
      'select-none border border-transparent rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-white  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
      !opts.isLoading && 'bg-indigo-600 hover:bg-indigo-700',
      opts.isLoading && 'bg-gray-600 disabled cursor-wait',
      opts.className,
    );
  } else if (opts.kind === 'primary-danger') {
    return classNames(
      'select-none border border-transparent rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-white  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
      !opts.isLoading && 'bg-red-600 hover:bg-red-700',
      opts.isLoading && 'bg-gray-600 disabled cursor-wait',
      opts.className,
    );
  }
}

export const ActionButton: React.FC<{
  onClick: () => unknown | Promise<unknown>;
  isLoading?: boolean;
  kind: ButtonKind;
}> = (props) => {
  const [isPromiseExecuting, setIsLoading] = useState(false);

  const propsOnClick = props.onClick;
  const onClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await propsOnClick();
    } finally {
      setIsLoading(false);
    }
  }, [propsOnClick, setIsLoading]);

  const isLoading = props.isLoading || isPromiseExecuting;

  return (
    <button
      type="button"
      disabled={isLoading}
      className={buttonClassName({
        isLoading: isLoading,
        kind: props.kind,
      })}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <Spinner className="absolute animate-spin h-5 w-5" />
          <span className="opacity-0">{props.children}</span>
        </>
      ) : (
        props.children
      )}
    </button>
  );
};

export const LinkButton: React.FC<{
  className?: string;
  href: string;
  kind: ButtonKind;
}> = (props) => {
  return (
    <Link href={props.href}>
      <a
        className={buttonClassName({
          kind: props.kind,
          className: props.className,
        })}
      >
        {props.children}
      </a>
    </Link>
  );
};

export const SubmitButton: React.FC<{ kind: ButtonKind }> = (props) => {
  const { formState } = useFormContext();

  return (
    <button
      type="submit"
      disabled={formState.isSubmitting}
      className={buttonClassName({
        isLoading: formState.isSubmitting,
        kind: props.kind,
      })}
    >
      {formState.isSubmitting ? (
        <>
          <Spinner className="absolute animate-spin h-5 w-5" />
          <span className="opacity-0">{props.children}</span>
        </>
      ) : (
        props.children
      )}
    </button>
  );
};
