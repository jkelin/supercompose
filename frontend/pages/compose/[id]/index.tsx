import { LinkButton, NamedCodePill, Spinner } from 'components';
import { DashboardLayout } from 'containers';
import { useGetComposeByIdQuery } from 'data';
import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml';

SyntaxHighlighter.registerLanguage('yaml', js);

const ComposeDetail: NextPage<{}> = (props) => {
  const router = useRouter();
  const composeQuery = useGetComposeByIdQuery({
    variables: { id: router.query.id as string },
    fetchPolicy: 'cache-and-network',
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

  const compose = composeQuery.data!.compose!;

  return (
    <DashboardLayout>
      <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 ">
        <div className="px-4 py-5 sm:px-6 flex flex-col lg:flex-row items-stretch justify-between lg:items-center">
          <div>
            <h1 className="text-lg font-semibold mb-0">
              {compose.name}

              {composeQuery.loading && (
                <Spinner className="inline-block ml-1 w-5 h-5" />
              )}
            </h1>
            <div className="text-sm text-gray-600">Docker Compose</div>
          </div>

          <LinkButton kind="primary" href={`/compose/${router.query.id}/edit`}>
            Update
          </LinkButton>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap">
            <NamedCodePill label="Service enabled">
              {compose.current!.serviceEnabled ? 'true' : 'false'}
            </NamedCodePill>
            <div className="mt-1 mr-6" />

            {compose.current!.serviceEnabled && (
              <>
                <NamedCodePill label="Service name">
                  {compose.current!.serviceName}
                </NamedCodePill>
                <div className="mt-1 mr-6" />
              </>
            )}

            <NamedCodePill label="Directory">
              {compose.current!.directory}
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
                {compose.current!.content.trim()}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComposeDetail;
