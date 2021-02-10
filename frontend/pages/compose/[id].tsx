import { Spinner } from 'components';
import { DashboardLayout } from 'containers';
import { useGetComposeByIdQuery } from 'data';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

const NodeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const composeQuery = useGetComposeByIdQuery({
    variables: { id: router.query.id as string },
  });

  if (composeQuery.loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16 bg-white shadow rounded-lg">
          <Spinner className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  const node = composeQuery.data!.compose;

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-lg font-semibold mb-0">{node.name}</h1>
          <div className="text-sm text-gray-600">Compose</div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div>{node.name}</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NodeDetail;