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

export const TextField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    className?: string;
  }
>(function TextField(props, ref) {
  const error = useFormError(props.name);

  return (
    <input
      type="text"
      name={props.name}
      id={props.name}
      ref={ref}
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
