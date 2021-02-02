import React from 'react';
import Link from 'next/link';

export const CreateCard: React.FC<{ href: string }> = (props) => {
  return (
    <Link href={props.href}>
      <a className="max-h-14 flex rounded-md text-center border-2 border-dashed border-gray-500 flex items-center text-gray-500 hover:text-gray-700 hover:border-gray-700">
        <div className="tracking-wider font-base text-base flex-1 px-3 py-3 text-sm">
          {props.children}
        </div>
      </a>
    </Link>
  );
};
