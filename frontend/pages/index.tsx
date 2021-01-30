import { useGetNodesQuery } from "data";
import Head from "next/head";

export default function Home() {
  const nodes = useGetNodesQuery();

  return (
    <div className="mx-auto container p-32 bg-red-100">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {nodes && nodes.loading && <div>Loading</div>}
      {nodes?.data?.nodes && <div>Loaded {nodes.data.nodes.length} nodes</div>}
      {nodes?.data?.nodes?.map((node) => (
        <div key={node.id}>Node #{node.id}</div>
      ))}
    </div>
  );
}
