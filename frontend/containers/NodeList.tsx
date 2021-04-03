import { useGetNodesQuery, Node } from 'data';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { CreateCard } from 'components';
import { orderBy } from 'lodash';
import { IdentificationIcon } from './ComposeList';

const NodeCard: React.FC<{
  node: Pick<Node, 'id' | 'host' | 'name' | 'username'>;
}> = (props) => {
  return (
    <Link href={`/node/${props.node.id}`}>
      <a className="hover:text-gray-600 max-h-14 col-span-1 flex shadow-sm hover:shadow-inner rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
        <IdentificationIcon
          className="rounded-l-md"
          name={props.node.name}
          id={props.node.id}
        />
        <div className="flex-1 flex items-center justify-between border-t border-r border-b border-gray-200 bg-white rounded-r-md truncate">
          <div className="flex-1 px-4 py-2 text-sm truncate">
            <span className="text-gray-900 font-medium">{props.node.name}</span>

            <p className="text-gray-500">
              {props.node.username}@{props.node.host}
            </p>
          </div>
          {/* <div className="flex-shrink-0 pr-2">
          <button className="w-8 h-8 bg-white inline-flex items-center justify-center text-gray-400 rounded-full bg-transparent hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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

export const useNodeList = (): [Node[], { loading: boolean }] => {
  const nodes = useGetNodesQuery();

  const nodeList = nodes?.data?.nodes;

  return [
    useMemo(() => orderBy(nodeList, 'name'), [nodeList]) as any,
    { loading: nodes.loading },
  ];
};

export const NodeList: React.FC<{}> = (props) => {
  const [nodes, nodeQuery] = useNodeList();

  return (
    <ul className="flex flex-col">
      <CreateCard key="create" href="/node/create">
        Create node
      </CreateCard>
      {nodeQuery && nodeQuery.loading && <div>Loading</div>}
      {nodes?.map((node, i) => (
        <React.Fragment key={node.id}>
          {i !== nodes.length && <div className="h-4" />}
          <NodeCard node={node} />
        </React.Fragment>
      ))}
    </ul>
  );
};
