import withApollo from 'next-with-apollo';
import { ApolloProvider } from '@apollo/react-hooks';
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { getDataFromTree } from '@apollo/react-ssr';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';

import '../styles/globals.css';
import { auth0, getToken } from 'lib/auth0';
import axios from 'axios';
import { ToastProvider } from 'containers';

const App = ({ Component, pageProps, apollo }: any) => (
  <ApolloProvider client={apollo}>
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  </ApolloProvider>
);

const gqlHoC = withApollo(
  (opts) => {
    const gqlEp = process.env.BACKEND_URI
      ? process.env.BACKEND_URI + '/graphql'
      : '/api/graphql';
    const httpLink = createHttpLink({
      uri: gqlEp,
    });

    const wsLink =
      typeof window !== 'undefined' &&
      new WebSocketLink({
        // uri:
        //   window.location.origin
        //     .replace(/^http:\/\//, 'ws://')
        //     .replace(/^https:\/\//, 'wss://') + '/api/graphql',
        uri: 'ws://localhost:5000/graphql', // TODO think up a way to proxy websockets or something
        options: {
          reconnect: true,
        },
      });

    const authLink = setContext(async (_, { headers }) => {
      if (typeof window === 'undefined') {
        const accessToken = getToken(
          opts.ctx?.req as any,
          opts.ctx?.res as any,
        );

        if (accessToken) {
          return {
            headers: {
              ...headers,
              authorization: `Bearer ${accessToken}`,
            },
          };
        } else {
          return {};
        }
      } else {
        try {
          const tokenResp = await axios.get('/api/auth/token');

          return {
            headers: {
              ...headers,
              authorization: `Bearer ${tokenResp.data.access_token}`,
            },
          };
        } catch (ex) {
          return {};
        }
      }
    });

    const splitLink =
      typeof window !== 'undefined'
        ? split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
              );
            },
            authLink.concat(wsLink as any),
            authLink.concat(httpLink),
          )
        : authLink.concat(httpLink);

    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache().restore(opts.initialState || {}),
      credentials: 'include',
    }) as any;
  },
  { getDataFromTree },
);

export default gqlHoC(App);
