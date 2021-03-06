import withApollo from 'next-with-apollo';
import { ApolloProvider } from '@apollo/react-hooks';
import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { getDataFromTree } from '@apollo/react-ssr';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';

import '../styles/globals.css';
import { getToken } from 'lib/auth0';
import axios from 'axios';
import { globalCreateToast, ToastProvider } from 'containers';
import { SupercomposeConfig } from 'lib/config';
import { onError } from '@apollo/client/link/error';
import { UserProvider } from '@auth0/nextjs-auth0';
import { usePanelbear } from 'lib/usePanelbear';
import jwt_decode from 'jwt-decode';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const App = ({ Component, pageProps, apollo }: any) => {
  return (
    <ToastProvider>
      <UserProvider>
        <ApolloProvider client={apollo}>
          <Component {...pageProps} />
        </ApolloProvider>
      </UserProvider>
    </ToastProvider>
  );
};

const gqlHoC = withApollo(
  (opts) => {
    // const httpLink = createHttpLink({
    //   uri: SupercomposeConfig.BACKEND_URI + '/graphql',
    // });
    const httpLink = new BatchHttpLink({
      uri: SupercomposeConfig.BACKEND_URI + '/graphql',
    });

    const wsLink =
      typeof window !== 'undefined' &&
      new WebSocketLink({
        uri:
          SupercomposeConfig.BACKEND_URI.replace(/^http:\/\//, 'ws://').replace(
            /^https:\/\//,
            'wss://',
          ) + '/graphql',
        options: {
          reconnect: true,
        },
      });

    let authLink: ApolloLink;
    if (typeof window === 'undefined') {
      authLink = setContext(async (_, { headers }) => {
        try {
          const accessToken = await getToken(
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
        } catch (ex) {
          return {};
        }
      });
    } else {
      authLink = setContext(async (_, { headers }) => {
        try {
          let accessToken = sessionStorage.getItem('access_token');
          const jwt: any = accessToken && jwt_decode(accessToken);

          if (
            !jwt ||
            !jwt.exp ||
            new Date(jwt.exp * 1000 + 10000) < new Date()
          ) {
            const tokenResp = await axios.get('/api/auth/token');
            accessToken = tokenResp.data.access_token;
            sessionStorage.setItem('access_token', accessToken as any);
          }

          return {
            headers: {
              ...headers,
              authorization: `Bearer ${accessToken}`,
            },
          };
        } catch (ex) {
          sessionStorage.removeItem('access_token');
          return {};
        }
      });
    }

    const errorLink = onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.forEach(({ message, locations, path }) => {
          const toastCreated = globalCreateToast({
            kind: 'error',
            title: 'Something went wrong!',
            message: message,
          });

          if (!toastCreated) {
            console.error(
              `[GraphQL error]: Message: ${message}, Path: ${path}`,
              { locations },
            );
          }
        });

      if (networkError) console.log(`[Network error]: ${networkError}`);
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
            authLink.concat(errorLink).concat(wsLink as any),
            authLink.concat(errorLink).concat(httpLink),
          )
        : authLink.concat(errorLink).concat(httpLink);

    const client = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache().restore(opts.initialState || {}),
      credentials: 'include',
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'cache-and-network' as any,
          errorPolicy: 'all',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
    });

    return client as any;
  },
  { getDataFromTree },
);

export default gqlHoC(App);
