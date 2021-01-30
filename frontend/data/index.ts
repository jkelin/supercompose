import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Compose = {
  __typename?: 'Compose';
  id: Scalars['ID'];
  contents: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  serviceName?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  content: Scalars['String'];
};

export type Node = {
  __typename?: 'Node';
  id: Scalars['ID'];
  name: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  composes: Array<Compose>;
};

export type Query = {
  __typename?: 'Query';
  compose: Compose;
  composes: Array<Compose>;
  node: Node;
  nodes: Array<Node>;
};


export type QueryComposeArgs = {
  id: Scalars['ID'];
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = (
  { __typename?: 'Query' }
  & { nodes: Array<(
    { __typename?: 'Node' }
    & Pick<Node, 'id'>
  )> }
);


export const GetNodesDocument = gql`
    query getNodes {
  nodes {
    id
  }
}
    `;

/**
 * __useGetNodesQuery__
 *
 * To run a query within a React component, call `useGetNodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetNodesQuery(baseOptions?: Apollo.QueryHookOptions<GetNodesQuery, GetNodesQueryVariables>) {
        return Apollo.useQuery<GetNodesQuery, GetNodesQueryVariables>(GetNodesDocument, baseOptions);
      }
export function useGetNodesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNodesQuery, GetNodesQueryVariables>) {
          return Apollo.useLazyQuery<GetNodesQuery, GetNodesQueryVariables>(GetNodesDocument, baseOptions);
        }
export type GetNodesQueryHookResult = ReturnType<typeof useGetNodesQuery>;
export type GetNodesLazyQueryHookResult = ReturnType<typeof useGetNodesLazyQuery>;
export type GetNodesQueryResult = Apollo.QueryResult<GetNodesQuery, GetNodesQueryVariables>;