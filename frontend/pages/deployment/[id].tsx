import classNames from 'classnames';
import { ActionButton, LinkButton, NamedCodePill, Spinner } from 'components';
import {
  createQuickIdentificationTitle,
  DashboardLayout,
  IdentificationIcon,
  useComposeList,
  useToast,
} from 'containers';
import {
  useCreateDeploymentMutation,
  useGetDeploymentByIdQuery,
  useGetDeploymentsQuery,
  useGetNodeByIdQuery,
} from 'data';
import { create, divide } from 'lodash';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React, { useCallback } from 'react';

const DeploymentDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const deploymentQuery = useGetDeploymentByIdQuery({
    variables: { id: router.query.id as string },
  });

  if (deploymentQuery.loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16 bg-white shadow rounded-lg">
          <Spinner className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  const deployment = deploymentQuery.data!.deployment!;

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">
              {deployment.compose!.name} @ {deployment.node!.name}
            </h1>
            <div className="text-sm text-gray-600">Deployment</div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6"></div>
      </div>
    </DashboardLayout>
  );
};

export default DeploymentDetail;
