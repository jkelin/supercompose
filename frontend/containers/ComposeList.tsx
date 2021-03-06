import { useGetNodesQuery, Node, useGetComposesQuery, Compose } from 'data';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { CreateCard } from 'components';
import { orderBy } from 'lodash';
import classNames from 'classnames';

export function createQuickIdentificationTitle(name: string) {
  return ('' + name[0] + name[1]).toUpperCase();
}

export const IdentificationIcon: React.FC<{
  id: string;
  name: string;
  className?: string;
}> = (props) => {
  return (
    <div
      className={classNames(
        'flex-shrink-0 flex items-center justify-center w-16 bg-pink-600 text-white text-sm font-medium',
        props.className,
      )}
    >
      {createQuickIdentificationTitle(props.name)}
    </div>
  );
};

const ComposeCard: React.FC<{
  compose: Pick<Compose, 'id' | 'name'>;
}> = (props) => {
  return (
    <Link href={`/compose/${props.compose.id}`}>
      <a className="hover:text-gray-600 max-h-14 col-span-1 flex shadow-sm hover:shadow-inner rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
        <IdentificationIcon
          className="rounded-l-md"
          name={props.compose.name}
          id={props.compose.id}
        />
        <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 bg-white rounded-r-md truncate">
          <div className="flex-1 px-4 py-2 text-sm truncate">
            <span className="text-gray-900 font-medium">
              {props.compose.name}
            </span>

            {/* <p className="text-gray-500">
            {props.node.username}@{props.node.host}
          </p> */}
          </div>
          {/* <div className="flex-shrink-0 pr-2">
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
        </div> */}
        </div>
      </a>
    </Link>
  );
};

export const useComposeList = (): [Compose[], { loading: boolean }] => {
  const composes = useGetComposesQuery();

  const composeList = composes?.data?.composes;
  return [
    useMemo(() => orderBy(composeList, 'name'), [composeList]) as any,
    { loading: composes.loading },
  ];
};

export const ComposeList: React.FC<{}> = (props) => {
  const [composes, composeQuery] = useComposeList();

  return (
    <ul className="flex flex-col">
      <CreateCard href="/compose/create">Create compose</CreateCard>
      {composeQuery && composeQuery.loading && !composes.length && (
        <div>Loading</div>
      )}
      {composes?.map((compose, i) => (
        <React.Fragment key={compose.id}>
          {i !== composes.length && <div className="h-4" />}
          <ComposeCard compose={compose} />
        </React.Fragment>
      ))}
    </ul>
  );
};
