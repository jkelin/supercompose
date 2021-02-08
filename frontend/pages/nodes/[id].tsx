import { DashboardLayout } from 'containers';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

const NodeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const nodeId: string = router.query.id as any;

  return (
    <DashboardLayout>
      <div>asdasd {nodeId} asdas</div>
    </DashboardLayout>
  );
};

export default NodeDetail;
