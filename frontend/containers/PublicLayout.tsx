import Head from 'next/head';
import React from 'react';
import { ComposeList, NodeList } from 'containers';
import { Navbar } from './Navbar';

export const PublicLayout: React.FC<{}> = (props) => {
  return (
    <React.Fragment>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      {props.children}
    </React.Fragment>
  );
};
