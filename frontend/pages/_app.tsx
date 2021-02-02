import withApollo from 'next-with-apollo';
import { ApolloProvider } from '@apollo/react-hooks';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { getDataFromTree } from '@apollo/react-ssr';
import { setContext } from '@apollo/client/link/context';

import '../styles/globals.css';
import { auth0, getToken } from 'lib/auth0';
import axios from 'axios';

const App = ({ Component, pageProps, apollo }: any) => (
  <ApolloProvider client={apollo}>
    <Component {...pageProps} />
  </ApolloProvider>
);

const gqlHoC = withApollo(
  (opts) => {
    const httpLink = createHttpLink({
      uri: process.env.BACKEND_URI
        ? process.env.BACKEND_URI + '/graphql'
        : '/api/graphql',
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

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache().restore(opts.initialState || {}),
      credentials: 'include',
    }) as any;
  },
  { getDataFromTree },
);

export default gqlHoC(App);
