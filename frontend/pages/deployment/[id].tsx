import classNames from 'classnames';
import { ActionButton, LinkButton, NamedCodePill, Spinner } from 'components';
import {
  createQuickIdentificationTitle,
  DashboardLayout,
  IdentificationIcon,
  useComposeList,
  useToast,
} from 'containers';
import { ConnectionLogs } from 'containers/ConnectionLogs';
import {
  GetDeploymentConnectionLogsDocument,
  useCreateDeploymentMutation,
  useDisableDeploymentMutation,
  useEnableDeploymentMutation,
  useGetDeploymentByIdQuery,
  useGetDeploymentConnectionLogsQuery,
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

  const connectionLogsQuery = useGetDeploymentConnectionLogsQuery({
    variables: { id: router.query.id as string },
    pollInterval: 1000,
  });

  const [enableDeployment] = useEnableDeploymentMutation({
    variables: {
      deployment: router.query.id,
    },
    refetchQueries: [
      {
        query: GetDeploymentConnectionLogsDocument,
        variables: { id: router.query.id as string },
      },
    ],
  });

  const [disableDeployment] = useDisableDeploymentMutation({
    variables: {
      deployment: router.query.id,
    },
    refetchQueries: [
      {
        query: GetDeploymentConnectionLogsDocument,
        variables: { id: router.query.id as string },
      },
    ],
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

  const onDisable = async () => {
    await disableDeployment();
  };
  const onEnable = async () => {
    await enableDeployment();
  };

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 place-self-start w-full">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">
              {deployment.compose!.name} @ {deployment.node!.name}
            </h1>
            <div className="text-sm text-gray-600">Deployment</div>
          </div>

          {deployment?.enabled && (
            <ActionButton kind="danger-outline" onClick={onDisable}>
              Disable
            </ActionButton>
          )}

          {!deployment?.enabled && (
            <ActionButton kind="primary-outline" onClick={onEnable}>
              Enable
            </ActionButton>
          )}
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap">
            <NamedCodePill label="Enabled">
              {deployment?.enabled ? 'true' : 'false'}
            </NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Node">{deployment?.node?.name}</NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Node address">
              {deployment?.node?.username}@{deployment?.node?.host}:
              {deployment?.node?.port}
            </NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Compose">
              {deployment?.compose?.name}
            </NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Compose service enabled">
              {deployment?.compose?.current?.serviceEnabled ? 'true' : 'false'}
            </NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Compose service name">
              {deployment?.compose?.current?.serviceName}
            </NamedCodePill>
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Compose directory">
              {deployment?.compose?.current?.directory}
            </NamedCodePill>
          </div>
        </div>
        <ConnectionLogs connectionLogsQuery={connectionLogsQuery} />
      </div>
    </DashboardLayout>
  );
};

export default DeploymentDetail;
