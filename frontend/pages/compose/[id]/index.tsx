import { ActionButton, LinkButton, NamedCodePill, Spinner } from 'components';
import {
  DashboardLayout,
  IdentificationIcon,
  useNodeList,
  useToast,
} from 'containers';
import {
  useCreateDeploymentMutation,
  useGetComposeByIdQuery,
  useGetDeploymentsQuery,
  useGetNodesQuery,
  useRedeployComposeMutation,
} from 'data';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React, { useCallback } from 'react';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml';
import node from 'postcss/lib/node';

SyntaxHighlighter.registerLanguage('yaml', js);

const ComposeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const composeQuery = useGetComposeByIdQuery({
    variables: { id: router.query.id as string },
  });

  const compose = composeQuery.data?.compose;

  const [nodes] = useNodeList();
  const [createDeployment] = useCreateDeploymentMutation();
  const toast = useToast();
  const deploymentsQuery = useGetDeploymentsQuery();

  const onDeploy = useCallback(
    async (node: string) => {
      if (compose) {
        const resp = await createDeployment({
          variables: {
            node: node,
            compose: compose.id,
          },
        });

        toast({
          kind: 'success',
          title: 'Deployment created',
        });
        router.push(`/deployment/${resp?.data?.createDeployment!.id}`);
      }
    },
    [compose, createDeployment, router, toast],
  );

  const [redeployCompose] = useRedeployComposeMutation({
    variables: {
      id: router.query.id,
    },
  });

  if (!composeQuery.data) {
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
            <h1 className="text-lg font-semibold mb-0">
              {compose?.name}

              {composeQuery.loading && (
                <Spinner className="inline-block ml-1 w-5 h-5" />
              )}
            </h1>
            <div className="text-sm text-gray-600">Docker Compose</div>
          </div>

          <div className="flex flex-row">
            <ActionButton
              className="mr-4"
              kind="primary-outline"
              onClick={redeployCompose}
            >
              Redeploy
            </ActionButton>

            <LinkButton
              kind="primary"
              href={`/compose/${router.query.id}/edit`}
            >
              Update
            </LinkButton>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap">
            <NamedCodePill label="Service enabled">
              {compose?.current!.serviceEnabled ? 'true' : 'false'}
            </NamedCodePill>
            <div className="mt-1 mr-6" />

            {compose?.current!.serviceEnabled && (
              <>
                <NamedCodePill label="Service name">
                  {compose.current!.serviceName}
                </NamedCodePill>
                <div className="mt-1 mr-6" />
              </>
            )}

            <NamedCodePill label="Directory">
              {compose?.current!.directory}
            </NamedCodePill>
            <div className="mt-1 mr-6" />
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold">Compose file</div>
            <div className="w-full inline-flex py-1 px-2 items-center rounded-md border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm shadow-sm">
              <SyntaxHighlighter
                customStyle={{
                  minWidth: '100%',
                  background: 'auto',
                  color: 'inherit',
                  padding: 0,
                }}
                language="yaml"
                style={docco}
              >
                {compose?.current!.content.trim()}
              </SyntaxHighlighter>
            </div>
          </div>

          {nodes.length != 0 && (
            <div className="mt-5 pb-1 mb-1 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Deployments
              </h3>
            </div>
          )}
          <ul className="flex flex-col">
            {nodes.map((x, i) => {
              const deployment = deploymentsQuery.data?.deployments.find(
                (y) => y.compose!.id === compose?.id && y.node!.id === x.id,
              );

              return (
                <React.Fragment key={x.id}>
                  <li className="flex items-stretch">
                    <IdentificationIcon name={x.name} id={x.id} />
                    <div className="ml-4 text-sm leading-none flex flex-col justify-center">
                      <div className="text-gray-900 font-medium">{x.name}</div>
                      <div className="text-gray-500">Server</div>
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

                  {i < nodes.length - 1 && <hr className="my-1" />}
                </React.Fragment>
              );
            })}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComposeDetail;
