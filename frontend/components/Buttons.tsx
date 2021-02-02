import Link from 'next/link';

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
  return (
    <button
      type="submit"
      className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {props.children}
    </button>
  );
};
