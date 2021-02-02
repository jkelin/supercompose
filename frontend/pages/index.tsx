import { NodeDashboard } from 'containers';
import { useGetNodesQuery } from 'data';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="mx-auto container p-32 bg-red-100">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NodeDashboard />
    </div>
  );
}
