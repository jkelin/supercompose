import withApollo from 'next-with-apollo';
import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import { getDataFromTree } from '@apollo/react-ssr';

import '../styles/globals.css';

const App = ({ Component, pageProps, apollo }: any) => (
  <ApolloProvider client={apollo}>
    <Component {...pageProps} />
  </ApolloProvider>
);

export default withApollo(
  ({ initialState }) => {
    return new ApolloClient({
      uri: process.env.BACKEND_URI
        ? process.env.BACKEND_URI + '/graphql'
        : '/api/graphql',
      cache: new InMemoryCache().restore(initialState || {}),
    });
  },
  { getDataFromTree },
)(App);
