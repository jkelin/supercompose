import { LinkButton, NamedCodePill, Spinner } from 'components';
import { DashboardLayout } from 'containers';
import { useGetNodeByIdQuery } from 'data';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

const NodeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const nodeQuery = useGetNodeByIdQuery({
    variables: { id: router.query.id as string },
  });

  if (nodeQuery.loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16 bg-white shadow rounded-lg">
          <Spinner className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  const node = nodeQuery.data!.node;

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">{node.name}</h1>
            <div className="text-sm text-gray-600">Node</div>
          </div>

          <LinkButton kind="primary" href={`/node/${node.id}/edit`}>
            Update
          </LinkButton>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap">
            <NamedCodePill label="Host">{node.host}</NamedCodePill>
            <div className="mt-1 mr-6" />
            <NamedCodePill label="Port">{node.port}</NamedCodePill>
            <div className="mt-1 mr-6" />
            <NamedCodePill label="Username">{node.username}</NamedCodePill>
          </div>

          <div className="mt-5 pb-1 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Deployments
            </h3>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NodeDetail;
