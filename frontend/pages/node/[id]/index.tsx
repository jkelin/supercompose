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
  useDisableNodeMutation,
  useEnableNodeMutation,
  useGetDeploymentsQuery,
  useGetNodeByIdQuery,
} from 'data';
import { create, divide } from 'lodash';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React, { useCallback } from 'react';

const NodeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const nodeQuery = useGetNodeByIdQuery({
    variables: { id: router.query.id as string },
  });
  const node = nodeQuery.data?.node;
  const [composes] = useComposeList();
  const [createDeployment] = useCreateDeploymentMutation();
  const toast = useToast();
  const deploymentsQuery = useGetDeploymentsQuery();

  const onDeploy = useCallback(
    async (compose: string) => {
      if (node) {
        const resp = await createDeployment({
          variables: {
            compose: compose,
            node: node.id,
          },
        });

        toast({
          kind: 'success',
          title: 'Deployment created',
        });
        router.push(`/deployment/${resp?.data?.createDeployment!.id}`);
      }
    },
    [createDeployment, node, router, toast],
  );

  const [enableNode] = useEnableNodeMutation({
    variables: {
      node: router.query.id,
    },
  });

  const [disableNode] = useDisableNodeMutation({
    variables: {
      node: router.query.id,
    },
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

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 place-self-start w-full">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">{node?.name}</h1>
            <div className="text-sm text-gray-600">Node</div>
          </div>

          <div className="flex flex-row">
            {node?.enabled && (
              <ActionButton
                className="mr-4"
                kind="danger-outline"
                onClick={disableNode}
              >
                Disable
              </ActionButton>
            )}

            {!node?.enabled && (
              <ActionButton
                className="mr-4"
                kind="primary-outline"
                onClick={enableNode}
              >
                Enable
              </ActionButton>
            )}

            <LinkButton kind="primary" href={`/node/${node?.id}/edit`}>
              Update
            </LinkButton>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap">
            <NamedCodePill label="Host">{node?.host}</NamedCodePill>
            <div className="mt-1 mr-6" />
            <NamedCodePill label="Port">{node?.port}</NamedCodePill>
            <div className="mt-1 mr-6" />
            <NamedCodePill label="Username">{node?.username}</NamedCodePill>
            <div className="mt-1 mr-6" />
            <NamedCodePill label="Enabled">
              {node?.enabled ? 'true' : 'false'}
            </NamedCodePill>
          </div>

          <div className="mt-5 pb-1 mb-1 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Deployments
            </h3>
          </div>
          <ul className="flex flex-col">
            {composes.map((x, i) => {
              console.warn(deploymentsQuery.data?.deployments, node?.id);
              const deployment = deploymentsQuery.data?.deployments.find(
                (y) => y.node!.id === node?.id && y.compose!.id === x.id,
              );

              return (
                <React.Fragment key={x.id}>
                  <li className="block flex items-stretch">
                    <IdentificationIcon name={x.name} id={x.id} />
                    <div className="ml-4 text-sm leading-none flex flex-col justify-center">
                      <div className="text-gray-900 font-medium">{x.name}</div>
                      <div className="text-gray-500">Docker Compose</div>
                    </div>
                    <div className="flex-grow" />
                    {deployment ? (
                      <LinkButton
                        className="w-20"
                        kind="secondary"
                        href={`/deployment/${deployment.id}`}
                      >
                        View
                      </LinkButton>
                    ) : (
                      <ActionButton
                        className="w-20"
                        kind="secondary"
                        onClick={() => onDeploy(x.id)}
                      >
                        Deploy
                      </ActionButton>
                    )}
                  </li>

                  {i < composes.length - 1 && <hr className="my-1" />}
                </React.Fragment>
              );
            })}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NodeDetail;
