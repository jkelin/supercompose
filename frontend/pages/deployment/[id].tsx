import classNames from 'classnames';
import {
  ActionButton,
  LinkButton,
  NamedCodePill,
  Spinner,
  Tab,
  TabContainer,
  TabList,
  TabPanel,
} from 'components';
import {
  Containers,
  createQuickIdentificationTitle,
  DashboardLayout,
  IdentificationIcon,
  useComposeList,
  useToast,
} from 'containers';
import { ConnectionLogs } from 'containers/ConnectionLogs';
import {
  GetDeploymentConnectionLogsDocument,
  OnConnectionLogDocument,
  useCreateDeploymentMutation,
  useDisableDeploymentMutation,
  useEnableDeploymentMutation,
  useGetDeploymentByIdQuery,
  useGetDeploymentConnectionLogsQuery,
  useGetDeploymentsQuery,
  useGetNodeByIdQuery,
  useOnConnectionLogSubscription,
  useRedeployDeploymentMutation,
} from 'data';
import { create, divide } from 'lodash';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';

const DeploymentDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const deploymentQuery = useGetDeploymentByIdQuery({
    variables: { id: router.query.id as string },
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

  const [redeployDeployment] = useRedeployDeploymentMutation({
    variables: {
      id: router.query.id,
    },
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
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 place-self-start w-full">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">
              {deployment.compose!.name} @ {deployment.node!.name}
            </h1>
            <div className="text-sm text-gray-600">Deployment</div>
          </div>
          <div className="flex flex-row">
            {deployment?.enabled && (
              <ActionButton
                kind="danger-outline"
                onClick={disableDeployment}
                className="mr-4"
              >
                Disable
              </ActionButton>
            )}
            {!deployment?.enabled && (
              <ActionButton
                kind="primary-outline"
                onClick={enableDeployment}
                className="mr-4"
              >
                Enable
              </ActionButton>
            )}

            {deployment?.enabled && (
              <ActionButton kind="primary-outline" onClick={redeployDeployment}>
                Redeploy
              </ActionButton>
            )}
          </div>
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
            <div className="mt-3 mr-6" />
            <NamedCodePill label="Sync. error">
              {deployment?.reconciliationFailed ? 'true' : 'false'}
            </NamedCodePill>
          </div>
        </div>
        <TabContainer default="connection logs">
          <TabList>
            <Tab id="connection logs">Connection logs</Tab>
            <Tab id="containers">Containers</Tab>
          </TabList>
          <TabPanel id="connection logs">
            <ConnectionLogs deploymentId={router.query.id as any} />
          </TabPanel>
          <TabPanel id="containers">
            <Containers deploymentId={router.query.id as any} />
          </TabPanel>
        </TabContainer>
      </div>
    </DashboardLayout>
  );
};

export default DeploymentDetail;
