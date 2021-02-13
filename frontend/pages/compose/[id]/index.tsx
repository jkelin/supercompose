import { LinkButton, Spinner } from 'components';
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

  const compose = composeQuery.data!.compose;

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
            <div className="mt-1 mr-6">
              <div className="text-sm font-semibold">Service enabled</div>
              <code className="w-full inline-flex items-center px-2 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm shadow-sm">
                {compose.serviceEnabled ? 'true' : 'false'}
              </code>
            </div>

            {compose.serviceEnabled && (
              <div className="mt-1 mr-6">
                <div className="text-sm font-semibold">Service name</div>
                <code className="w-full inline-flex items-center px-2 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm shadow-sm">
                  {compose.serviceName}
                </code>
              </div>
            )}

            <div className="mt-1 mr-6">
              <div className="text-sm font-semibold">Directory</div>
              <code className="w-full inline-flex items-center px-2 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-700 sm:text-sm shadow-sm">
                {compose.directory}
              </code>
            </div>
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
                {compose.content.trim()}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComposeDetail;
