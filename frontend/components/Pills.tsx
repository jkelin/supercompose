import { ReactNode } from 'react';

export const NamedCodePill: React.FC<{ label: ReactNode }> = (props) => {
  return (
    <div className="">
      <div className="text-sm font-semibold">{props.label}</div>
      <code className="w-full inline-flex items-center px-2 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm shadow-sm">
        {props.children}
      </code>
    </div>
  );
};
