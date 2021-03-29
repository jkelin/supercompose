import Head from 'next/head';
import React from 'react';
import { ComposeList, NodeList } from 'containers';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';

export const DashboardLayout: React.FC<{}> = (props) => {
  return (
    <React.Fragment>
      <Navbar />
      <Head>
        <style>{`html, body { background-color: rgba(249, 250, 251) }`}</style>
      </Head>
      <main className="mx-auto container">
        <Head>
          <title>Create Next App</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <ul className="my-8 grid grid-cols-layout gap-4">
          <ErrorBoundary>
            <NodeList />
            {props.children}
            <ComposeList />
          </ErrorBoundary>
        </ul>
      </main>
    </React.Fragment>
  );
};
