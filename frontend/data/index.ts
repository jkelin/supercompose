import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
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
  name: Scalars['String'];
  content: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  serviceName?: Maybe<Scalars['String']>;
  deployments: Array<Deployment>;
};

export type Deployment = {
  __typename?: 'Deployment';
  id: Scalars['ID'];
  node: Node;
  compose: Compose;
  enabled: Scalars['Boolean'];
};

export type Node = {
  __typename?: 'Node';
  id: Scalars['ID'];
  name: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  deployments: Array<Deployment>;
};

export type TestConnectionError = {
  __typename?: 'TestConnectionError';
  error: Scalars['String'];
  field?: Maybe<Scalars['String']>;
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

export type Mutation = {
  __typename?: 'Mutation';
  createCompose: Compose;
  updateCompose: Compose;
  createNode: CreateNodeResult;
  testConnection?: Maybe<TestConnectionError>;
};

export type MutationCreateComposeArgs = {
  compose: ComposeInput;
};

export type MutationUpdateComposeArgs = {
  compose: ComposeInput;
  id: Scalars['ID'];
};

export type MutationCreateNodeArgs = {
  node: CreateNodeInput;
};

export type MutationTestConnectionArgs = {
  node: TestConnectionInput;
};

export type ComposeInput = {
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
};

export type CreateNodeResult = Node | TestConnectionError;

export type CreateNodeInput = {
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['Int']>;
  username?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
  name: Scalars['String'];
};

export type TestConnectionInput = {
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['Int']>;
  username?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
};

export type CreateComposeMutationVariables = Exact<{
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
}>;

export type CreateComposeMutation = { __typename?: 'Mutation' } & {
  createCompose: { __typename?: 'Compose' } & Pick<
    Compose,
    'id' | 'name' | 'directory' | 'serviceEnabled' | 'content'
  >;
};

export type CreateNodeMutationVariables = Exact<{
  name: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
}>;

export type CreateNodeMutation = { __typename?: 'Mutation' } & {
  createNode:
    | ({ __typename?: 'Node' } & Pick<
        Node,
        'id' | 'name' | 'host' | 'username'
      >)
    | ({ __typename?: 'TestConnectionError' } & Pick<
        TestConnectionError,
        'error' | 'field'
      >);
};

export type TestConnectionMutationVariables = Exact<{
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
}>;

export type TestConnectionMutation = { __typename?: 'Mutation' } & {
  testConnection?: Maybe<
    { __typename?: 'TestConnectionError' } & Pick<
      TestConnectionError,
      'error' | 'field'
    >
  >;
};

export type UpdateComposeMutationVariables = Exact<{
  id: Scalars['ID'];
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
}>;

export type UpdateComposeMutation = { __typename?: 'Mutation' } & {
  updateCompose: { __typename?: 'Compose' } & Pick<
    Compose,
    'id' | 'name' | 'directory' | 'serviceEnabled' | 'serviceName' | 'content'
  >;
};

export type GetComposeByIdQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type GetComposeByIdQuery = { __typename?: 'Query' } & {
  compose: { __typename?: 'Compose' } & Pick<
    Compose,
    'id' | 'name' | 'content' | 'directory' | 'serviceName' | 'serviceEnabled'
  >;
};

export type GetComposesQueryVariables = Exact<{ [key: string]: never }>;

export type GetComposesQuery = { __typename?: 'Query' } & {
  composes: Array<{ __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'>>;
};

export type GetNodeByIdQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type GetNodeByIdQuery = { __typename?: 'Query' } & {
  node: { __typename?: 'Node' } & Pick<
    Node,
    'id' | 'name' | 'host' | 'username' | 'port'
  > & {
      deployments: Array<
        { __typename?: 'Deployment' } & Pick<Deployment, 'id'>
      >;
    };
};

export type GetNodesQueryVariables = Exact<{ [key: string]: never }>;

export type GetNodesQuery = { __typename?: 'Query' } & {
  nodes: Array<
    { __typename?: 'Node' } & Pick<Node, 'id' | 'name' | 'host' | 'username'>
  >;
};

export const CreateComposeDocument = gql`
  mutation createCompose(
    $name: String!
    $directory: String!
    $serviceEnabled: Boolean!
    $compose: String!
  ) {
    createCompose(
      compose: {
        name: $name
        directory: $directory
        serviceEnabled: $serviceEnabled
        compose: $compose
      }
    ) {
      id
      name
      directory
      serviceEnabled
      content
    }
  }
`;
export type CreateComposeMutationFn = Apollo.MutationFunction<
  CreateComposeMutation,
  CreateComposeMutationVariables
>;

/**
 * __useCreateComposeMutation__
 *
 * To run a mutation, you first call `useCreateComposeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateComposeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createComposeMutation, { data, loading, error }] = useCreateComposeMutation({
 *   variables: {
 *      name: // value for 'name'
 *      directory: // value for 'directory'
 *      serviceEnabled: // value for 'serviceEnabled'
 *      compose: // value for 'compose'
 *   },
 * });
 */
export function useCreateComposeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateComposeMutation,
    CreateComposeMutationVariables
  >,
) {
  return Apollo.useMutation<
    CreateComposeMutation,
    CreateComposeMutationVariables
  >(CreateComposeDocument, baseOptions);
}
export type CreateComposeMutationHookResult = ReturnType<
  typeof useCreateComposeMutation
>;
export type CreateComposeMutationResult = Apollo.MutationResult<CreateComposeMutation>;
export type CreateComposeMutationOptions = Apollo.BaseMutationOptions<
  CreateComposeMutation,
  CreateComposeMutationVariables
>;
export const CreateNodeDocument = gql`
  mutation createNode(
    $name: String!
    $host: String!
    $port: Int!
    $username: String!
    $password: String
    $privateKey: String
  ) {
    createNode(
      node: {
        name: $name
        host: $host
        port: $port
        username: $username
        password: $password
        privateKey: $privateKey
      }
    ) {
      ... on Node {
        id
        name
        host
        username
      }
      ... on TestConnectionError {
        error
        field
      }
    }
  }
`;
export type CreateNodeMutationFn = Apollo.MutationFunction<
  CreateNodeMutation,
  CreateNodeMutationVariables
>;

/**
 * __useCreateNodeMutation__
 *
 * To run a mutation, you first call `useCreateNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNodeMutation, { data, loading, error }] = useCreateNodeMutation({
 *   variables: {
 *      name: // value for 'name'
 *      host: // value for 'host'
 *      port: // value for 'port'
 *      username: // value for 'username'
 *      password: // value for 'password'
 *      privateKey: // value for 'privateKey'
 *   },
 * });
 */
export function useCreateNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateNodeMutation,
    CreateNodeMutationVariables
  >,
) {
  return Apollo.useMutation<CreateNodeMutation, CreateNodeMutationVariables>(
    CreateNodeDocument,
    baseOptions,
  );
}
export type CreateNodeMutationHookResult = ReturnType<
  typeof useCreateNodeMutation
>;
export type CreateNodeMutationResult = Apollo.MutationResult<CreateNodeMutation>;
export type CreateNodeMutationOptions = Apollo.BaseMutationOptions<
  CreateNodeMutation,
  CreateNodeMutationVariables
>;
export const TestConnectionDocument = gql`
  mutation testConnection(
    $host: String!
    $port: Int!
    $username: String!
    $password: String
    $privateKey: String
  ) {
    testConnection(
      node: {
        host: $host
        port: $port
        username: $username
        password: $password
        privateKey: $privateKey
      }
    ) {
      error
      field
    }
  }
`;
export type TestConnectionMutationFn = Apollo.MutationFunction<
  TestConnectionMutation,
  TestConnectionMutationVariables
>;

/**
 * __useTestConnectionMutation__
 *
 * To run a mutation, you first call `useTestConnectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTestConnectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [testConnectionMutation, { data, loading, error }] = useTestConnectionMutation({
 *   variables: {
 *      host: // value for 'host'
 *      port: // value for 'port'
 *      username: // value for 'username'
 *      password: // value for 'password'
 *      privateKey: // value for 'privateKey'
 *   },
 * });
 */
export function useTestConnectionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    TestConnectionMutation,
    TestConnectionMutationVariables
  >,
) {
  return Apollo.useMutation<
    TestConnectionMutation,
    TestConnectionMutationVariables
  >(TestConnectionDocument, baseOptions);
}
export type TestConnectionMutationHookResult = ReturnType<
  typeof useTestConnectionMutation
>;
export type TestConnectionMutationResult = Apollo.MutationResult<TestConnectionMutation>;
export type TestConnectionMutationOptions = Apollo.BaseMutationOptions<
  TestConnectionMutation,
  TestConnectionMutationVariables
>;
export const UpdateComposeDocument = gql`
  mutation updateCompose(
    $id: ID!
    $name: String!
    $directory: String!
    $serviceEnabled: Boolean!
    $compose: String!
  ) {
    updateCompose(
      id: $id
      compose: {
        name: $name
        directory: $directory
        serviceEnabled: $serviceEnabled
        compose: $compose
      }
    ) {
      id
      name
      directory
      serviceEnabled
      serviceName
      content
    }
  }
`;
export type UpdateComposeMutationFn = Apollo.MutationFunction<
  UpdateComposeMutation,
  UpdateComposeMutationVariables
>;

/**
 * __useUpdateComposeMutation__
 *
 * To run a mutation, you first call `useUpdateComposeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateComposeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateComposeMutation, { data, loading, error }] = useUpdateComposeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      directory: // value for 'directory'
 *      serviceEnabled: // value for 'serviceEnabled'
 *      compose: // value for 'compose'
 *   },
 * });
 */
export function useUpdateComposeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateComposeMutation,
    UpdateComposeMutationVariables
  >,
) {
  return Apollo.useMutation<
    UpdateComposeMutation,
    UpdateComposeMutationVariables
  >(UpdateComposeDocument, baseOptions);
}
export type UpdateComposeMutationHookResult = ReturnType<
  typeof useUpdateComposeMutation
>;
export type UpdateComposeMutationResult = Apollo.MutationResult<UpdateComposeMutation>;
export type UpdateComposeMutationOptions = Apollo.BaseMutationOptions<
  UpdateComposeMutation,
  UpdateComposeMutationVariables
>;
export const GetComposeByIdDocument = gql`
  query getComposeById($id: ID!) {
    compose(id: $id) {
      id
      name
      content
      directory
      serviceName
      serviceEnabled
    }
  }
`;

/**
 * __useGetComposeByIdQuery__
 *
 * To run a query within a React component, call `useGetComposeByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetComposeByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetComposeByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetComposeByIdQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetComposeByIdQuery,
    GetComposeByIdQueryVariables
  >,
) {
  return Apollo.useQuery<GetComposeByIdQuery, GetComposeByIdQueryVariables>(
    GetComposeByIdDocument,
    baseOptions,
  );
}
export function useGetComposeByIdLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetComposeByIdQuery,
    GetComposeByIdQueryVariables
  >,
) {
  return Apollo.useLazyQuery<GetComposeByIdQuery, GetComposeByIdQueryVariables>(
    GetComposeByIdDocument,
    baseOptions,
  );
}
export type GetComposeByIdQueryHookResult = ReturnType<
  typeof useGetComposeByIdQuery
>;
export type GetComposeByIdLazyQueryHookResult = ReturnType<
  typeof useGetComposeByIdLazyQuery
>;
export type GetComposeByIdQueryResult = Apollo.QueryResult<
  GetComposeByIdQuery,
  GetComposeByIdQueryVariables
>;
export const GetComposesDocument = gql`
  query getComposes {
    composes {
      id
      name
    }
  }
`;

/**
 * __useGetComposesQuery__
 *
 * To run a query within a React component, call `useGetComposesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetComposesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetComposesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetComposesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetComposesQuery,
    GetComposesQueryVariables
  >,
) {
  return Apollo.useQuery<GetComposesQuery, GetComposesQueryVariables>(
    GetComposesDocument,
    baseOptions,
  );
}
export function useGetComposesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetComposesQuery,
    GetComposesQueryVariables
  >,
) {
  return Apollo.useLazyQuery<GetComposesQuery, GetComposesQueryVariables>(
    GetComposesDocument,
    baseOptions,
  );
}
export type GetComposesQueryHookResult = ReturnType<typeof useGetComposesQuery>;
export type GetComposesLazyQueryHookResult = ReturnType<
  typeof useGetComposesLazyQuery
>;
export type GetComposesQueryResult = Apollo.QueryResult<
  GetComposesQuery,
  GetComposesQueryVariables
>;
export const GetNodeByIdDocument = gql`
  query getNodeById($id: ID!) {
    node(id: $id) {
      id
      name
      host
      username
      port
      deployments {
        id
      }
    }
  }
`;

/**
 * __useGetNodeByIdQuery__
 *
 * To run a query within a React component, call `useGetNodeByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodeByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodeByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNodeByIdQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetNodeByIdQuery,
    GetNodeByIdQueryVariables
  >,
) {
  return Apollo.useQuery<GetNodeByIdQuery, GetNodeByIdQueryVariables>(
    GetNodeByIdDocument,
    baseOptions,
  );
}
export function useGetNodeByIdLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetNodeByIdQuery,
    GetNodeByIdQueryVariables
  >,
) {
  return Apollo.useLazyQuery<GetNodeByIdQuery, GetNodeByIdQueryVariables>(
    GetNodeByIdDocument,
    baseOptions,
  );
}
export type GetNodeByIdQueryHookResult = ReturnType<typeof useGetNodeByIdQuery>;
export type GetNodeByIdLazyQueryHookResult = ReturnType<
  typeof useGetNodeByIdLazyQuery
>;
export type GetNodeByIdQueryResult = Apollo.QueryResult<
  GetNodeByIdQuery,
  GetNodeByIdQueryVariables
>;
export const GetNodesDocument = gql`
  query getNodes {
    nodes {
      id
      name
      host
      username
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
export function useGetNodesQuery(
  baseOptions?: Apollo.QueryHookOptions<GetNodesQuery, GetNodesQueryVariables>,
) {
  return Apollo.useQuery<GetNodesQuery, GetNodesQueryVariables>(
    GetNodesDocument,
    baseOptions,
  );
}
export function useGetNodesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetNodesQuery,
    GetNodesQueryVariables
  >,
) {
  return Apollo.useLazyQuery<GetNodesQuery, GetNodesQueryVariables>(
    GetNodesDocument,
    baseOptions,
  );
}
export type GetNodesQueryHookResult = ReturnType<typeof useGetNodesQuery>;
export type GetNodesLazyQueryHookResult = ReturnType<
  typeof useGetNodesLazyQuery
>;
export type GetNodesQueryResult = Apollo.QueryResult<
  GetNodesQuery,
  GetNodesQueryVariables
>;
