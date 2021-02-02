import Head from 'next/head';
import React from 'react';
import { ComposeList, NodeList } from 'containers';
import { Navbar } from './Navbar';

export const DashboardLayout: React.FC<{}> = (props) => {
  return (
    <React.Fragment>
      <Navbar />
      <div className="mx-auto container">
        <Head>
          <title>Create Next App</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <ul className="mt-3 grid grid-cols-layout gap-4">
          <NodeList />
          <div />
          <ComposeList />
        </ul>
      </div>
    </React.Fragment>
  );
};
