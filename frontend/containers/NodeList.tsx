import { useGetNodesQuery, Node } from 'data';
import React from 'react';
import Link from 'next/link';
import { CreateCard } from 'components';

function createNodeQuickTitle(name: string) {
  return ('' + name[0] + name[1]).toUpperCase();
}

const NodeCard: React.FC<{
  node: Pick<Node, 'id' | 'host' | 'name' | 'username'>;
}> = (props) => {
  return (
    <li className="col-span-1 flex shadow-sm rounded-md max-h-14">
      <div className="flex-shrink-0 flex items-center justify-center w-16 bg-pink-600 text-white text-sm font-medium rounded-l-md">
        {createNodeQuickTitle(props.node.name)}
      </div>
      <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 bg-white rounded-r-md truncate">
        <div className="flex-1 px-4 py-2 text-sm truncate">
          <Link href={`/node/${props.node.id}`}>
            <a className="text-gray-900 font-medium hover:text-gray-600">
              {props.node.name}
            </a>
          </Link>
          <p className="text-gray-500">
            {props.node.username}@{props.node.host}
          </p>
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

export const NodeList: React.FC<{}> = (props) => {
  const nodes = useGetNodesQuery();
  return (
    <ul className="flex flex-col">
      <CreateCard key="create" href="/node/create">
        Create node
      </CreateCard>
      {nodes && nodes.loading && <div>Loading</div>}
      {nodes?.data?.nodes?.map((node, i) => (
        <React.Fragment key={node.id}>
          {i !== nodes!.data!.nodes!.length && <div className="h-4" />}
          <NodeCard node={node} />
        </React.Fragment>
      ))}
    </ul>
  );
};
