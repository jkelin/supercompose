import { DashboardLayout } from 'containers';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

const NodeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const nodeId: string = router.query.id as any;

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-lg font-semibold">Node {nodeId}</h1>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div>asdasd {nodeId} asdas</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NodeDetail;
