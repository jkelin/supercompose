import classNames from 'classnames';
import Link from 'next/link';
import { useForm, useFormContext } from 'react-hook-form';

const Spinner: React.FC<{ className?: string }> = (props) => (
  <svg
    className={props.className}
    viewBox="0 0 44 44"
    xmlns="http://www.w3.org/2000/svg"
    stroke="#fff"
  >
    <g fill="none" fillRule="evenodd" strokeWidth="2">
      <circle cx="22" cy="22" r="1">
        <animate
          attributeName="r"
          begin="0s"
          dur="1.8s"
          values="1; 20"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.165, 0.84, 0.44, 1"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="0s"
          dur="1.8s"
          values="1; 0"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.3, 0.61, 0.355, 1"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="22" cy="22" r="1">
        <animate
          attributeName="r"
          begin="-0.9s"
          dur="1.8s"
          values="1; 20"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.165, 0.84, 0.44, 1"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="-0.9s"
          dur="1.8s"
          values="1; 0"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.3, 0.61, 0.355, 1"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  </svg>
);

export const CancelButton: React.FC<{ href: string }> = (props) => {
  return (
    <Link href={props.href}>
      <a className="bg-white border border-grey-600 rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
        {props.children}
      </a>
    </Link>
  );
};

export const SubmitButton: React.FC<{}> = (props) => {
  const { formState } = useFormContext();

  return (
    <button
      type="submit"
      disabled={formState.isSubmitting}
      className={classNames(
        'border border-transparent rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-white  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        !formState.isSubmitting && 'bg-indigo-600 hover:bg-indigo-700',
        formState.isSubmitting && 'bg-gray-600 disabled cursor-wait',
      )}
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
