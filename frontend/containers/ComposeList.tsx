import { useGetNodesQuery, Node, useGetComposesQuery, Compose } from 'data';
import React from 'react';
import Link from 'next/link';
import { CreateCard } from 'components';

function createComposeQuickTitle(name: string) {
  return ('' + name[0] + name[1]).toUpperCase();
}

const ComposeCard: React.FC<{
  compose: Pick<Compose, 'id' | 'name'>;
}> = (props) => {
  return (
    <li className="max-h-14 col-span-1 flex shadow-sm rounded-md">
      <div className="flex-shrink-0 flex items-center justify-center w-16 bg-pink-600 text-white text-sm font-medium rounded-l-md">
        {createComposeQuickTitle(props.compose.name)}
      </div>
      <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 bg-white rounded-r-md truncate">
        <div className="flex-1 px-4 py-2 text-sm truncate">
          <Link href={`/compose/${props.compose.id}`}>
            <a className="text-gray-900 font-medium hover:text-gray-600">
              {props.compose.name}
            </a>
          </Link>
          {/* <p className="text-gray-500">
            {props.node.username}@{props.node.host}
          </p> */}
        </div>
        <div className="flex-shrink-0 pr-2">
          <button className="w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span className="sr-only">Open options</span>
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
};

export const ComposeList: React.FC<{}> = (props) => {
  const composes = useGetComposesQuery();
  return (
    <ul className="flex flex-col">
      <CreateCard href="/compose/create">Create compose</CreateCard>
      {composes && composes.loading && <div>Loading</div>}
      {composes?.data?.composes?.map((compose, i) => (
        <React.Fragment key={compose.id}>
          {i !== composes!.data!.composes.length && <div className="h-4" />}
          <ComposeCard compose={compose} />
        </React.Fragment>
      ))}
    </ul>
  );
};
