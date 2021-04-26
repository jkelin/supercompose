import Head from 'next/head';
import React from 'react';
import { ComposeList, NodeList } from 'containers';
import { Navbar } from './Navbar';
import { usePanelbear } from 'lib/usePanelbear';

export const PublicLayout: React.FC<{}> = (props) => {
  usePanelbear();

  return (
    <React.Fragment>
      <Head>
        <title>SuperCompose</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Navbar />
      {props.children}
    </React.Fragment>
  );
};
