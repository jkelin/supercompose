import classNames from 'classnames';
import { forwardRef, ReactNode } from 'react';
import { FieldError, useFormContext } from 'react-hook-form';

function useFormError(field: string): FieldError | undefined {
  const { errors } = useFormContext();

  if (errors[field]?.type === 'global') return undefined;
  return errors[field];
}

export const NumberField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    className?: string;
  }
>(function NumberField(props, ref) {
  return (
    <input
      type="number"
      min={0}
      max={65535}
      name={props.name}
      id={props.name}
      ref={ref}
      className={classNames(
        'focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300',
        props.className,
      )}
    />
  );
});

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  {
    name: string;
    className?: string;
    rows?: number;
  }
>(function TextAreaField(props, ref) {
  const error = useFormError(props.name);

  return (
    <textarea
      rows={props.rows || 3}
      name={props.name}
      id={props.name}
      ref={ref}
      className={classNames(
        'shadow-sm mt-1 block w-full sm:text-sm rounded-md',
        props.className,
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
      )}
    />
  );
});

export const TogglField: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
}> = (props) => {
  return (
    <div className="flex items-center">
      <button
        type="button"
        className={classNames(
          props.value ? 'bg-indigo-600' : 'bg-gray-200',
          'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        )}
        aria-pressed="false"
        onClick={() => props.onChange(!props.value)}
      >
        <span className="sr-only">Use setting</span>
        <span
          className={classNames(
            props.value ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
          )}
        >
          <span
            className={classNames(
              props.value
                ? 'opacity-0 ease-out duration-100'
                : 'opacity-100 ease-in duration-200',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
            )}
            aria-hidden="true"
          >
            <svg
              className="bg-white h-3 w-3 text-gray-400"
              fill="none"
              viewBox="0 0 12 12"
            >
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={classNames(
              props.value
                ? 'opacity-100 ease-in duration-200'
                : 'opacity-0 ease-out duration-100',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
            )}
            aria-hidden="true"
          >
            <svg
              className="bg-white h-3 w-3 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </button>
      <span className="ml-3">{props.children}</span>
    </div>
  );
};

export const TextField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    className?: string;
    placeholder?: string;
  }
>(function TextField(props, ref) {
  const error = useFormError(props.name);

  return (
    <input
      type="text"
      name={props.name}
      id={props.name}
      ref={ref}
      placeholder={props.placeholder}
      className={classNames(
        'flex-grow block w-full min-w-0 rounded-md sm:text-sm',
        props.className,
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
      )}
    />
  );
});

export const FieldContainer: React.FC<{
  name: string;
  label?: ReactNode;
  text?: ReactNode;
  className?: string;
}> = (props) => {
  const error = useFormError(props.name);

  return (
    <div className={props.className}>
      {props.label && (
        <label
          htmlFor={props.name}
          className="block text-sm font-medium text-gray-700"
        >
          {props.label}

          {error?.message && (
            <>
              <span> - </span>
              <span className="text-red-500">{error.message}</span>
            </>
          )}
        </label>
      )}
      {props.children}
      {props.text && <p className="mt-1 text-sm text-gray-500">{props.text}</p>}
    </div>
  );
};
