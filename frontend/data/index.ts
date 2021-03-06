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
  Uuid: any;
  /** The `DateTime` scalar represents an ISO-8601 compliant date time type. */
  DateTime: any;
};

export type Query = {
  __typename?: 'Query';
  nodes: Array<Node>;
  node?: Maybe<Node>;
  composes: Array<Compose>;
  compose?: Maybe<Compose>;
  deployments: Array<Deployment>;
  deployment?: Maybe<Deployment>;
  connectionLogs?: Maybe<ConnectionLogConnection>;
  connectionLog?: Maybe<ConnectionLog>;
  containers: Array<Container>;
  container?: Maybe<Container>;
};

export type QueryNodesArgs = {
  where?: Maybe<NodeFilterInput>;
  order?: Maybe<Array<NodeSortInput>>;
};

export type QueryNodeArgs = {
  where?: Maybe<NodeFilterInput>;
};

export type QueryComposesArgs = {
  where?: Maybe<ComposeFilterInput>;
};

export type QueryComposeArgs = {
  where?: Maybe<ComposeFilterInput>;
};

export type QueryDeploymentsArgs = {
  where?: Maybe<DeploymentFilterInput>;
};

export type QueryDeploymentArgs = {
  where?: Maybe<DeploymentFilterInput>;
};

export type QueryConnectionLogsArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<ConnectionLogFilterInput>;
  order?: Maybe<Array<ConnectionLogSortInput>>;
};

export type QueryConnectionLogArgs = {
  where?: Maybe<ConnectionLogFilterInput>;
};

export type QueryContainersArgs = {
  where?: Maybe<ContainerFilterInput>;
  order?: Maybe<Array<ContainerSortInput>>;
};

export type QueryContainerArgs = {
  where?: Maybe<ContainerFilterInput>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createNode: NodeResult;
  testConnection?: Maybe<NodeConnectionFailed>;
  updateNode: NodeResult;
  deleteNode: Scalars['Boolean'];
  createCompose?: Maybe<Compose>;
  updateCompose?: Maybe<Compose>;
  deleteCompose: Scalars['Boolean'];
  redeployCompose?: Maybe<Compose>;
  createDeployment?: Maybe<Deployment>;
  enableDeployment?: Maybe<Deployment>;
  disableDeployment?: Maybe<Deployment>;
  redeployDeployment?: Maybe<Deployment>;
  enableNode?: Maybe<Node>;
  disableNode?: Maybe<Node>;
  redeployNode?: Maybe<Node>;
};

export type MutationCreateNodeArgs = {
  name: Scalars['String'];
  host: Scalars['String'];
  username: Scalars['String'];
  port: Scalars['Int'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
};

export type MutationTestConnectionArgs = {
  host: Scalars['String'];
  username: Scalars['String'];
  port: Scalars['Int'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
  nodeId?: Maybe<Scalars['Uuid']>;
};

export type MutationUpdateNodeArgs = {
  id: Scalars['Uuid'];
  name: Scalars['String'];
  host: Scalars['String'];
  username: Scalars['String'];
  port: Scalars['Int'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
};

export type MutationDeleteNodeArgs = {
  id: Scalars['Uuid'];
};

export type MutationCreateComposeArgs = {
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
};

export type MutationUpdateComposeArgs = {
  id: Scalars['Uuid'];
  name?: Maybe<Scalars['String']>;
  directory?: Maybe<Scalars['String']>;
  serviceEnabled?: Maybe<Scalars['Boolean']>;
  compose?: Maybe<Scalars['String']>;
};

export type MutationDeleteComposeArgs = {
  id: Scalars['Uuid'];
};

export type MutationRedeployComposeArgs = {
  id: Scalars['Uuid'];
};

export type MutationCreateDeploymentArgs = {
  node: Scalars['Uuid'];
  compose: Scalars['Uuid'];
};

export type MutationEnableDeploymentArgs = {
  deployment: Scalars['Uuid'];
};

export type MutationDisableDeploymentArgs = {
  deployment: Scalars['Uuid'];
};

export type MutationRedeployDeploymentArgs = {
  id: Scalars['Uuid'];
};

export type MutationEnableNodeArgs = {
  node: Scalars['Uuid'];
};

export type MutationDisableNodeArgs = {
  node: Scalars['Uuid'];
};

export type MutationRedeployNodeArgs = {
  id: Scalars['Uuid'];
};

export type Subscription = {
  __typename?: 'Subscription';
  onConnectionLog: ConnectionLog;
  onContainersChanged: ContainerChange;
};

export type SubscriptionOnConnectionLogArgs = {
  deploymentId?: Maybe<Scalars['Uuid']>;
  nodeId?: Maybe<Scalars['Uuid']>;
  composeId?: Maybe<Scalars['Uuid']>;
  after?: Maybe<Scalars['DateTime']>;
};

export type SubscriptionOnContainersChangedArgs = {
  deploymentId: Scalars['Uuid'];
};

export type SuccessfulNodeCreation = {
  __typename?: 'SuccessfulNodeCreation';
  node?: Maybe<Node>;
};

export type SuccessfulNodeUpdate = {
  __typename?: 'SuccessfulNodeUpdate';
  node?: Maybe<Node>;
};

export type NodeConnectionFailed = {
  __typename?: 'NodeConnectionFailed';
  error?: Maybe<Scalars['String']>;
  field?: Maybe<Scalars['String']>;
};

export type NodeFilterInput = {
  and?: Maybe<Array<NodeFilterInput>>;
  or?: Maybe<Array<NodeFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  enabled?: Maybe<BooleanOperationFilterInput>;
  name?: Maybe<StringOperationFilterInput>;
  host?: Maybe<StringOperationFilterInput>;
  port?: Maybe<ComparableInt32OperationFilterInput>;
  username?: Maybe<StringOperationFilterInput>;
  reconciliationFailed?: Maybe<BooleanOperationFilterInput>;
  redeploymentRequestedAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  version?: Maybe<ComparableGuidOperationFilterInput>;
  tenantId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  tenant?: Maybe<TenantFilterInput>;
  deployments?: Maybe<ListFilterInputTypeOfDeploymentFilterInput>;
  connectionLogs?: Maybe<ListFilterInputTypeOfConnectionLogFilterInput>;
};

export type NodeSortInput = {
  id?: Maybe<SortEnumType>;
  enabled?: Maybe<SortEnumType>;
  name?: Maybe<SortEnumType>;
  host?: Maybe<SortEnumType>;
  port?: Maybe<SortEnumType>;
  username?: Maybe<SortEnumType>;
  reconciliationFailed?: Maybe<SortEnumType>;
  redeploymentRequestedAt?: Maybe<SortEnumType>;
  version?: Maybe<SortEnumType>;
  tenantId?: Maybe<SortEnumType>;
  tenant?: Maybe<TenantSortInput>;
};

export type ComposeFilterInput = {
  and?: Maybe<Array<ComposeFilterInput>>;
  or?: Maybe<Array<ComposeFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  name?: Maybe<StringOperationFilterInput>;
  currentId?: Maybe<ComparableGuidOperationFilterInput>;
  tenantId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  current?: Maybe<ComposeVersionFilterInput>;
  tenant?: Maybe<TenantFilterInput>;
  composeVersions?: Maybe<ListFilterInputTypeOfComposeVersionFilterInput>;
  deployments?: Maybe<ListFilterInputTypeOfDeploymentFilterInput>;
  connectionLogs?: Maybe<ListFilterInputTypeOfConnectionLogFilterInput>;
};

export type DeploymentFilterInput = {
  and?: Maybe<Array<DeploymentFilterInput>>;
  or?: Maybe<Array<DeploymentFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  enabled?: Maybe<BooleanOperationFilterInput>;
  composeId?: Maybe<ComparableGuidOperationFilterInput>;
  lastDeployedComposeVersionId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  nodeId?: Maybe<ComparableGuidOperationFilterInput>;
  lastCheck?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  redeploymentRequestedAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  lastDeployedNodeVersion?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  lastDeployedAsEnabled?: Maybe<BooleanOperationFilterInput>;
  reconciliationFailed?: Maybe<BooleanOperationFilterInput>;
  compose?: Maybe<ComposeFilterInput>;
  lastDeployedComposeVersion?: Maybe<ComposeVersionFilterInput>;
  node?: Maybe<NodeFilterInput>;
  connectionLogs?: Maybe<ListFilterInputTypeOfConnectionLogFilterInput>;
  containers?: Maybe<ListFilterInputTypeOfContainerFilterInput>;
};

export type ConnectionLogFilterInput = {
  and?: Maybe<Array<ConnectionLogFilterInput>>;
  or?: Maybe<Array<ConnectionLogFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  severity?: Maybe<ConnectionLogSeverityOperationFilterInput>;
  message?: Maybe<StringOperationFilterInput>;
  time?: Maybe<ComparableDateTimeOperationFilterInput>;
  error?: Maybe<StringOperationFilterInput>;
  metadata?: Maybe<DictionaryOfStringAndObjectFilterInput>;
  nodeId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  node?: Maybe<NodeFilterInput>;
  deploymentId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  deployment?: Maybe<DeploymentFilterInput>;
  tenantId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  tenant?: Maybe<TenantFilterInput>;
  composeId?: Maybe<ComparableNullableOfGuidOperationFilterInput>;
  compose?: Maybe<ComposeFilterInput>;
};

export type ConnectionLogSortInput = {
  id?: Maybe<SortEnumType>;
  severity?: Maybe<SortEnumType>;
  message?: Maybe<SortEnumType>;
  time?: Maybe<SortEnumType>;
  error?: Maybe<SortEnumType>;
  nodeId?: Maybe<SortEnumType>;
  node?: Maybe<NodeSortInput>;
  deploymentId?: Maybe<SortEnumType>;
  deployment?: Maybe<DeploymentSortInput>;
  tenantId?: Maybe<SortEnumType>;
  tenant?: Maybe<TenantSortInput>;
  composeId?: Maybe<SortEnumType>;
  compose?: Maybe<ComposeSortInput>;
};

export type ContainerFilterInput = {
  and?: Maybe<Array<ContainerFilterInput>>;
  or?: Maybe<Array<ContainerFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  containerName?: Maybe<StringOperationFilterInput>;
  serviceName?: Maybe<StringOperationFilterInput>;
  containerNumber?: Maybe<ComparableInt32OperationFilterInput>;
  startedAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  finishedAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  state?: Maybe<ContainerStateOperationFilterInput>;
  lastInspectAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  deploymentId?: Maybe<ComparableGuidOperationFilterInput>;
  deployment?: Maybe<DeploymentFilterInput>;
};

export type ContainerSortInput = {
  id?: Maybe<SortEnumType>;
  containerName?: Maybe<SortEnumType>;
  serviceName?: Maybe<SortEnumType>;
  containerNumber?: Maybe<SortEnumType>;
  startedAt?: Maybe<SortEnumType>;
  finishedAt?: Maybe<SortEnumType>;
  state?: Maybe<SortEnumType>;
  lastInspectAt?: Maybe<SortEnumType>;
  deploymentId?: Maybe<SortEnumType>;
  deployment?: Maybe<DeploymentSortInput>;
};

export type ConnectionLog = {
  __typename?: 'ConnectionLog';
  id: Scalars['Uuid'];
  severity: ConnectionLogSeverity;
  message: Scalars['String'];
  time: Scalars['DateTime'];
  error?: Maybe<Scalars['String']>;
  metadata?: Maybe<Array<KeyValuePairOfStringAndObject>>;
  nodeId?: Maybe<Scalars['Uuid']>;
  node?: Maybe<Node>;
  deploymentId?: Maybe<Scalars['Uuid']>;
  deployment?: Maybe<Deployment>;
  tenantId?: Maybe<Scalars['Uuid']>;
  tenant?: Maybe<Tenant>;
  composeId?: Maybe<Scalars['Uuid']>;
  compose?: Maybe<Compose>;
};

/** A connection to a list of items. */
export type ConnectionLogConnection = {
  __typename?: 'ConnectionLogConnection';
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** A list of edges. */
  edges?: Maybe<Array<ConnectionLogEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<ConnectionLog>>;
};

export type ComparableGuidOperationFilterInput = {
  eq?: Maybe<Scalars['Uuid']>;
  neq?: Maybe<Scalars['Uuid']>;
  in?: Maybe<Array<Scalars['Uuid']>>;
  nin?: Maybe<Array<Scalars['Uuid']>>;
  gt?: Maybe<Scalars['Uuid']>;
  ngt?: Maybe<Scalars['Uuid']>;
  gte?: Maybe<Scalars['Uuid']>;
  ngte?: Maybe<Scalars['Uuid']>;
  lt?: Maybe<Scalars['Uuid']>;
  nlt?: Maybe<Scalars['Uuid']>;
  lte?: Maybe<Scalars['Uuid']>;
  nlte?: Maybe<Scalars['Uuid']>;
};

export type BooleanOperationFilterInput = {
  eq?: Maybe<Scalars['Boolean']>;
  neq?: Maybe<Scalars['Boolean']>;
};

export type StringOperationFilterInput = {
  and?: Maybe<Array<StringOperationFilterInput>>;
  or?: Maybe<Array<StringOperationFilterInput>>;
  eq?: Maybe<Scalars['String']>;
  neq?: Maybe<Scalars['String']>;
  contains?: Maybe<Scalars['String']>;
  ncontains?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
  startsWith?: Maybe<Scalars['String']>;
  nstartsWith?: Maybe<Scalars['String']>;
  endsWith?: Maybe<Scalars['String']>;
  nendsWith?: Maybe<Scalars['String']>;
};

export type ComparableInt32OperationFilterInput = {
  eq?: Maybe<Scalars['Int']>;
  neq?: Maybe<Scalars['Int']>;
  in?: Maybe<Array<Scalars['Int']>>;
  nin?: Maybe<Array<Scalars['Int']>>;
  gt?: Maybe<Scalars['Int']>;
  ngt?: Maybe<Scalars['Int']>;
  gte?: Maybe<Scalars['Int']>;
  ngte?: Maybe<Scalars['Int']>;
  lt?: Maybe<Scalars['Int']>;
  nlt?: Maybe<Scalars['Int']>;
  lte?: Maybe<Scalars['Int']>;
  nlte?: Maybe<Scalars['Int']>;
};

export type ComparableNullableOfDateTimeOperationFilterInput = {
  eq?: Maybe<Scalars['DateTime']>;
  neq?: Maybe<Scalars['DateTime']>;
  in?: Maybe<Array<Maybe<Scalars['DateTime']>>>;
  nin?: Maybe<Array<Maybe<Scalars['DateTime']>>>;
  gt?: Maybe<Scalars['DateTime']>;
  ngt?: Maybe<Scalars['DateTime']>;
  gte?: Maybe<Scalars['DateTime']>;
  ngte?: Maybe<Scalars['DateTime']>;
  lt?: Maybe<Scalars['DateTime']>;
  nlt?: Maybe<Scalars['DateTime']>;
  lte?: Maybe<Scalars['DateTime']>;
  nlte?: Maybe<Scalars['DateTime']>;
};

export type ComparableNullableOfGuidOperationFilterInput = {
  eq?: Maybe<Scalars['Uuid']>;
  neq?: Maybe<Scalars['Uuid']>;
  in?: Maybe<Array<Maybe<Scalars['Uuid']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Uuid']>>>;
  gt?: Maybe<Scalars['Uuid']>;
  ngt?: Maybe<Scalars['Uuid']>;
  gte?: Maybe<Scalars['Uuid']>;
  ngte?: Maybe<Scalars['Uuid']>;
  lt?: Maybe<Scalars['Uuid']>;
  nlt?: Maybe<Scalars['Uuid']>;
  lte?: Maybe<Scalars['Uuid']>;
  nlte?: Maybe<Scalars['Uuid']>;
};

export type TenantFilterInput = {
  and?: Maybe<Array<TenantFilterInput>>;
  or?: Maybe<Array<TenantFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  composes?: Maybe<ListFilterInputTypeOfComposeFilterInput>;
  nodes?: Maybe<ListFilterInputTypeOfNodeFilterInput>;
  connectionLogs?: Maybe<ListFilterInputTypeOfConnectionLogFilterInput>;
};

export type ListFilterInputTypeOfDeploymentFilterInput = {
  all?: Maybe<DeploymentFilterInput>;
  none?: Maybe<DeploymentFilterInput>;
  some?: Maybe<DeploymentFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ListFilterInputTypeOfConnectionLogFilterInput = {
  all?: Maybe<ConnectionLogFilterInput>;
  none?: Maybe<ConnectionLogFilterInput>;
  some?: Maybe<ConnectionLogFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export enum SortEnumType {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type TenantSortInput = {
  id?: Maybe<SortEnumType>;
};

export type ComposeVersionFilterInput = {
  and?: Maybe<Array<ComposeVersionFilterInput>>;
  or?: Maybe<Array<ComposeVersionFilterInput>>;
  id?: Maybe<ComparableGuidOperationFilterInput>;
  content?: Maybe<StringOperationFilterInput>;
  directory?: Maybe<StringOperationFilterInput>;
  serviceName?: Maybe<StringOperationFilterInput>;
  serviceEnabled?: Maybe<BooleanOperationFilterInput>;
  composeId?: Maybe<ComparableGuidOperationFilterInput>;
  pendingDelete?: Maybe<BooleanOperationFilterInput>;
  redeploymentRequestedAt?: Maybe<ComparableNullableOfDateTimeOperationFilterInput>;
  composePath?: Maybe<StringOperationFilterInput>;
  servicePath?: Maybe<StringOperationFilterInput>;
  composeNavigation?: Maybe<ComposeFilterInput>;
  compose?: Maybe<ComposeFilterInput>;
  deployments?: Maybe<ListFilterInputTypeOfDeploymentFilterInput>;
};

export type ListFilterInputTypeOfComposeVersionFilterInput = {
  all?: Maybe<ComposeVersionFilterInput>;
  none?: Maybe<ComposeVersionFilterInput>;
  some?: Maybe<ComposeVersionFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ListFilterInputTypeOfContainerFilterInput = {
  all?: Maybe<ContainerFilterInput>;
  none?: Maybe<ContainerFilterInput>;
  some?: Maybe<ContainerFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ConnectionLogSeverityOperationFilterInput = {
  eq?: Maybe<ConnectionLogSeverity>;
  neq?: Maybe<ConnectionLogSeverity>;
  in?: Maybe<Array<ConnectionLogSeverity>>;
  nin?: Maybe<Array<ConnectionLogSeverity>>;
};

export type ComparableDateTimeOperationFilterInput = {
  eq?: Maybe<Scalars['DateTime']>;
  neq?: Maybe<Scalars['DateTime']>;
  in?: Maybe<Array<Scalars['DateTime']>>;
  nin?: Maybe<Array<Scalars['DateTime']>>;
  gt?: Maybe<Scalars['DateTime']>;
  ngt?: Maybe<Scalars['DateTime']>;
  gte?: Maybe<Scalars['DateTime']>;
  ngte?: Maybe<Scalars['DateTime']>;
  lt?: Maybe<Scalars['DateTime']>;
  nlt?: Maybe<Scalars['DateTime']>;
  lte?: Maybe<Scalars['DateTime']>;
  nlte?: Maybe<Scalars['DateTime']>;
};

export type DictionaryOfStringAndObjectFilterInput = {
  and?: Maybe<Array<DictionaryOfStringAndObjectFilterInput>>;
  or?: Maybe<Array<DictionaryOfStringAndObjectFilterInput>>;
  comparer?: Maybe<IEqualityComparerOfStringFilterInput>;
  count?: Maybe<ComparableInt32OperationFilterInput>;
  keys?: Maybe<ListStringOperationFilterInput>;
  values?: Maybe<ListFilterInputTypeOfObjectFilterInput>;
};

export type DeploymentSortInput = {
  id?: Maybe<SortEnumType>;
  enabled?: Maybe<SortEnumType>;
  composeId?: Maybe<SortEnumType>;
  lastDeployedComposeVersionId?: Maybe<SortEnumType>;
  nodeId?: Maybe<SortEnumType>;
  lastCheck?: Maybe<SortEnumType>;
  redeploymentRequestedAt?: Maybe<SortEnumType>;
  lastDeployedNodeVersion?: Maybe<SortEnumType>;
  lastDeployedAsEnabled?: Maybe<SortEnumType>;
  reconciliationFailed?: Maybe<SortEnumType>;
  compose?: Maybe<ComposeSortInput>;
  lastDeployedComposeVersion?: Maybe<ComposeVersionSortInput>;
  node?: Maybe<NodeSortInput>;
};

export type ComposeSortInput = {
  id?: Maybe<SortEnumType>;
  name?: Maybe<SortEnumType>;
  currentId?: Maybe<SortEnumType>;
  tenantId?: Maybe<SortEnumType>;
  current?: Maybe<ComposeVersionSortInput>;
  tenant?: Maybe<TenantSortInput>;
};

export type ContainerStateOperationFilterInput = {
  eq?: Maybe<ContainerState>;
  neq?: Maybe<ContainerState>;
  in?: Maybe<Array<ContainerState>>;
  nin?: Maybe<Array<ContainerState>>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Indicates whether more edges exist following the set defined by the clients arguments. */
  hasNextPage: Scalars['Boolean'];
  /** Indicates whether more edges exist prior the set defined by the clients arguments. */
  hasPreviousPage: Scalars['Boolean'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']>;
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']>;
};

/** An edge in a connection. */
export type ConnectionLogEdge = {
  __typename?: 'ConnectionLogEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String'];
  /** The item at the end of the edge. */
  node: ConnectionLog;
};

export type ListFilterInputTypeOfComposeFilterInput = {
  all?: Maybe<ComposeFilterInput>;
  none?: Maybe<ComposeFilterInput>;
  some?: Maybe<ComposeFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ListFilterInputTypeOfNodeFilterInput = {
  all?: Maybe<NodeFilterInput>;
  none?: Maybe<NodeFilterInput>;
  some?: Maybe<NodeFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type IEqualityComparerOfStringFilterInput = {
  and?: Maybe<Array<IEqualityComparerOfStringFilterInput>>;
  or?: Maybe<Array<IEqualityComparerOfStringFilterInput>>;
};

export type ListStringOperationFilterInput = {
  all?: Maybe<StringOperationFilterInput>;
  none?: Maybe<StringOperationFilterInput>;
  some?: Maybe<StringOperationFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ListFilterInputTypeOfObjectFilterInput = {
  all?: Maybe<ObjectFilterInput>;
  none?: Maybe<ObjectFilterInput>;
  some?: Maybe<ObjectFilterInput>;
  any?: Maybe<Scalars['Boolean']>;
};

export type ComposeVersionSortInput = {
  id?: Maybe<SortEnumType>;
  content?: Maybe<SortEnumType>;
  directory?: Maybe<SortEnumType>;
  serviceName?: Maybe<SortEnumType>;
  serviceEnabled?: Maybe<SortEnumType>;
  composeId?: Maybe<SortEnumType>;
  pendingDelete?: Maybe<SortEnumType>;
  redeploymentRequestedAt?: Maybe<SortEnumType>;
  composePath?: Maybe<SortEnumType>;
  servicePath?: Maybe<SortEnumType>;
  composeNavigation?: Maybe<ComposeSortInput>;
  compose?: Maybe<ComposeSortInput>;
};

export type ObjectFilterInput = {
  and?: Maybe<Array<ObjectFilterInput>>;
  or?: Maybe<Array<ObjectFilterInput>>;
};

export type NodeResult =
  | SuccessfulNodeCreation
  | SuccessfulNodeUpdate
  | NodeConnectionFailed;

export type Container = {
  __typename?: 'Container';
  id: Scalars['Uuid'];
  containerName: Scalars['String'];
  serviceName: Scalars['String'];
  containerNumber: Scalars['Int'];
  startedAt?: Maybe<Scalars['DateTime']>;
  finishedAt?: Maybe<Scalars['DateTime']>;
  state: ContainerState;
  lastInspectAt?: Maybe<Scalars['DateTime']>;
  deploymentId: Scalars['Uuid'];
  deployment: Deployment;
};

export type Deployment = {
  __typename?: 'Deployment';
  id: Scalars['Uuid'];
  enabled: Scalars['Boolean'];
  composeId: Scalars['Uuid'];
  lastDeployedComposeVersionId?: Maybe<Scalars['Uuid']>;
  nodeId: Scalars['Uuid'];
  lastCheck?: Maybe<Scalars['DateTime']>;
  redeploymentRequestedAt?: Maybe<Scalars['DateTime']>;
  lastDeployedNodeVersion?: Maybe<Scalars['Uuid']>;
  lastDeployedAsEnabled?: Maybe<Scalars['Boolean']>;
  reconciliationFailed?: Maybe<Scalars['Boolean']>;
  compose?: Maybe<Compose>;
  lastDeployedComposeVersion?: Maybe<ComposeVersion>;
  node?: Maybe<Node>;
  connectionLogs: Array<ConnectionLog>;
  containers: Array<Container>;
};

export type Compose = {
  __typename?: 'Compose';
  id: Scalars['Uuid'];
  name: Scalars['String'];
  currentId: Scalars['Uuid'];
  tenantId?: Maybe<Scalars['Uuid']>;
  current?: Maybe<ComposeVersion>;
  tenant?: Maybe<Tenant>;
  composeVersions?: Maybe<Array<Maybe<ComposeVersion>>>;
  deployments?: Maybe<Array<Maybe<Deployment>>>;
  connectionLogs?: Maybe<Array<Maybe<ConnectionLog>>>;
};

export type Node = {
  __typename?: 'Node';
  id: Scalars['Uuid'];
  enabled: Scalars['Boolean'];
  name: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  reconciliationFailed?: Maybe<Scalars['Boolean']>;
  redeploymentRequestedAt?: Maybe<Scalars['DateTime']>;
  version: Scalars['Uuid'];
  tenantId?: Maybe<Scalars['Uuid']>;
  tenant?: Maybe<Tenant>;
  deployments?: Maybe<Array<Maybe<Deployment>>>;
  connectionLogs?: Maybe<Array<Maybe<ConnectionLog>>>;
};

export type ContainerChange = {
  __typename?: 'ContainerChange';
  kind: ContainerChangeKind;
  containerId: Scalars['Uuid'];
  deploymentId: Scalars['Uuid'];
};

export enum ConnectionLogSeverity {
  Info = 'INFO',
  Error = 'ERROR',
  Warning = 'WARNING',
}

export type KeyValuePairOfStringAndObject = {
  __typename?: 'KeyValuePairOfStringAndObject';
  key: Scalars['String'];
};

export type Tenant = {
  __typename?: 'Tenant';
  id: Scalars['Uuid'];
  composes?: Maybe<Array<Maybe<Compose>>>;
  nodes?: Maybe<Array<Maybe<Node>>>;
  connectionLogs?: Maybe<Array<Maybe<ConnectionLog>>>;
};

export enum ContainerState {
  Created = 'CREATED',
  Running = 'RUNNING',
  Removing = 'REMOVING',
  Paused = 'PAUSED',
  Restarting = 'RESTARTING',
  Dead = 'DEAD',
  Exited = 'EXITED',
}

export enum ContainerChangeKind {
  Created = 'CREATED',
  Removed = 'REMOVED',
  Changed = 'CHANGED',
}

export type ComposeVersion = {
  __typename?: 'ComposeVersion';
  id: Scalars['Uuid'];
  content: Scalars['String'];
  directory: Scalars['String'];
  serviceName?: Maybe<Scalars['String']>;
  serviceEnabled: Scalars['Boolean'];
  composeId: Scalars['Uuid'];
  pendingDelete: Scalars['Boolean'];
  redeploymentRequestedAt?: Maybe<Scalars['DateTime']>;
  composePath?: Maybe<Scalars['String']>;
  servicePath?: Maybe<Scalars['String']>;
  composeNavigation?: Maybe<Compose>;
  compose?: Maybe<Compose>;
  deployments?: Maybe<Array<Maybe<Deployment>>>;
};

export type CreateComposeMutationVariables = Exact<{
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
}>;

export type CreateComposeMutation = { __typename?: 'Mutation' } & {
  createCompose?: Maybe<
    { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
        current?: Maybe<
          { __typename?: 'ComposeVersion' } & Pick<
            ComposeVersion,
            'id' | 'directory' | 'serviceEnabled' | 'content'
          >
        >;
      }
  >;
};

export type CreateDeploymentMutationVariables = Exact<{
  compose: Scalars['Uuid'];
  node: Scalars['Uuid'];
}>;

export type CreateDeploymentMutation = { __typename?: 'Mutation' } & {
  createDeployment?: Maybe<
    { __typename?: 'Deployment' } & Pick<Deployment, 'id'> & {
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'>
        >;
        node?: Maybe<{ __typename?: 'Node' } & Pick<Node, 'id' | 'name'>>;
      }
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
    | ({ __typename?: 'SuccessfulNodeCreation' } & {
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'username' | 'reconciliationFailed'
          >
        >;
      })
    | { __typename?: 'SuccessfulNodeUpdate' }
    | ({ __typename?: 'NodeConnectionFailed' } & Pick<
        NodeConnectionFailed,
        'error' | 'field'
      >);
};

export type DeleteComposeMutationVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type DeleteComposeMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'deleteCompose'
>;

export type DeleteNodeMutationVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type DeleteNodeMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'deleteNode'
>;

export type DisableDeploymentMutationVariables = Exact<{
  deployment: Scalars['Uuid'];
}>;

export type DisableDeploymentMutation = { __typename?: 'Mutation' } & {
  disableDeployment?: Maybe<
    { __typename?: 'Deployment' } & Pick<
      Deployment,
      'id' | 'enabled' | 'reconciliationFailed'
    > & {
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
              current?: Maybe<
                { __typename?: 'ComposeVersion' } & Pick<
                  ComposeVersion,
                  'id' | 'serviceEnabled' | 'serviceName' | 'directory'
                >
              >;
            }
        >;
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'port' | 'username'
          >
        >;
      }
  >;
};

export type DisableNodeMutationVariables = Exact<{
  node: Scalars['Uuid'];
}>;

export type DisableNodeMutation = { __typename?: 'Mutation' } & {
  disableNode?: Maybe<
    { __typename?: 'Node' } & Pick<
      Node,
      | 'id'
      | 'name'
      | 'host'
      | 'username'
      | 'enabled'
      | 'reconciliationFailed'
      | 'port'
    > & {
        deployments?: Maybe<
          Array<Maybe<{ __typename?: 'Deployment' } & Pick<Deployment, 'id'>>>
        >;
      }
  >;
};

export type EnableDeploymentMutationVariables = Exact<{
  deployment: Scalars['Uuid'];
}>;

export type EnableDeploymentMutation = { __typename?: 'Mutation' } & {
  enableDeployment?: Maybe<
    { __typename?: 'Deployment' } & Pick<
      Deployment,
      'id' | 'enabled' | 'reconciliationFailed'
    > & {
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
              current?: Maybe<
                { __typename?: 'ComposeVersion' } & Pick<
                  ComposeVersion,
                  'id' | 'serviceEnabled' | 'serviceName' | 'directory'
                >
              >;
            }
        >;
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'port' | 'username'
          >
        >;
      }
  >;
};

export type EnableNodeMutationVariables = Exact<{
  node: Scalars['Uuid'];
}>;

export type EnableNodeMutation = { __typename?: 'Mutation' } & {
  enableNode?: Maybe<
    { __typename?: 'Node' } & Pick<
      Node,
      | 'id'
      | 'name'
      | 'host'
      | 'username'
      | 'enabled'
      | 'reconciliationFailed'
      | 'port'
    > & {
        deployments?: Maybe<
          Array<Maybe<{ __typename?: 'Deployment' } & Pick<Deployment, 'id'>>>
        >;
      }
  >;
};

export type RedeployComposeMutationVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type RedeployComposeMutation = { __typename?: 'Mutation' } & {
  redeployCompose?: Maybe<
    { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
        current?: Maybe<
          { __typename?: 'ComposeVersion' } & Pick<
            ComposeVersion,
            'id' | 'directory' | 'serviceEnabled' | 'serviceName' | 'content'
          >
        >;
      }
  >;
};

export type RedeployDeploymentMutationVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type RedeployDeploymentMutation = { __typename?: 'Mutation' } & {
  redeployDeployment?: Maybe<
    { __typename?: 'Deployment' } & Pick<
      Deployment,
      'id' | 'enabled' | 'reconciliationFailed'
    > & {
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
              current?: Maybe<
                { __typename?: 'ComposeVersion' } & Pick<
                  ComposeVersion,
                  'id' | 'serviceEnabled' | 'serviceName' | 'directory'
                >
              >;
            }
        >;
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'port' | 'username'
          >
        >;
      }
  >;
};

export type RedeployNodeMutationVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type RedeployNodeMutation = { __typename?: 'Mutation' } & {
  redeployNode?: Maybe<
    { __typename?: 'Node' } & Pick<
      Node,
      | 'id'
      | 'name'
      | 'host'
      | 'username'
      | 'enabled'
      | 'reconciliationFailed'
      | 'port'
    > & {
        deployments?: Maybe<
          Array<Maybe<{ __typename?: 'Deployment' } & Pick<Deployment, 'id'>>>
        >;
      }
  >;
};

export type TestConnectionMutationVariables = Exact<{
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
  nodeId?: Maybe<Scalars['Uuid']>;
}>;

export type TestConnectionMutation = { __typename?: 'Mutation' } & {
  testConnection?: Maybe<
    { __typename?: 'NodeConnectionFailed' } & Pick<
      NodeConnectionFailed,
      'error' | 'field'
    >
  >;
};

export type UpdateComposeMutationVariables = Exact<{
  id: Scalars['Uuid'];
  name: Scalars['String'];
  directory: Scalars['String'];
  serviceEnabled: Scalars['Boolean'];
  compose: Scalars['String'];
}>;

export type UpdateComposeMutation = { __typename?: 'Mutation' } & {
  updateCompose?: Maybe<
    { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
        current?: Maybe<
          { __typename?: 'ComposeVersion' } & Pick<
            ComposeVersion,
            'id' | 'directory' | 'serviceEnabled' | 'serviceName' | 'content'
          >
        >;
      }
  >;
};

export type UpdateNodeMutationVariables = Exact<{
  id: Scalars['Uuid'];
  name: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  username: Scalars['String'];
  password?: Maybe<Scalars['String']>;
  privateKey?: Maybe<Scalars['String']>;
}>;

export type UpdateNodeMutation = { __typename?: 'Mutation' } & {
  updateNode:
    | { __typename?: 'SuccessfulNodeCreation' }
    | ({ __typename?: 'SuccessfulNodeUpdate' } & {
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'username' | 'reconciliationFailed'
          >
        >;
      })
    | ({ __typename?: 'NodeConnectionFailed' } & Pick<
        NodeConnectionFailed,
        'error' | 'field'
      >);
};

export type GetComposeByIdQueryVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type GetComposeByIdQuery = { __typename?: 'Query' } & {
  compose?: Maybe<
    { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
        current?: Maybe<
          { __typename?: 'ComposeVersion' } & Pick<
            ComposeVersion,
            'id' | 'content' | 'directory' | 'serviceName' | 'serviceEnabled'
          >
        >;
      }
  >;
};

export type GetComposesQueryVariables = Exact<{ [key: string]: never }>;

export type GetComposesQuery = { __typename?: 'Query' } & {
  composes: Array<{ __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'>>;
};

export type GetDeploymentByIdQueryVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type GetDeploymentByIdQuery = { __typename?: 'Query' } & {
  deployment?: Maybe<
    { __typename?: 'Deployment' } & Pick<
      Deployment,
      'id' | 'enabled' | 'reconciliationFailed'
    > & {
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'> & {
              current?: Maybe<
                { __typename?: 'ComposeVersion' } & Pick<
                  ComposeVersion,
                  'id' | 'serviceEnabled' | 'serviceName' | 'directory'
                >
              >;
            }
        >;
        node?: Maybe<
          { __typename?: 'Node' } & Pick<
            Node,
            'id' | 'name' | 'host' | 'port' | 'username'
          >
        >;
      }
  >;
};

export type GetDeploymentConnectionLogsQueryVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type GetDeploymentConnectionLogsQuery = { __typename?: 'Query' } & {
  connectionLogs?: Maybe<
    { __typename?: 'ConnectionLogConnection' } & {
      nodes?: Maybe<
        Array<
          { __typename?: 'ConnectionLog' } & Pick<
            ConnectionLog,
            'id' | 'time' | 'message' | 'error' | 'severity'
          >
        >
      >;
    }
  >;
};

export type GetDeploymentContainersQueryVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type GetDeploymentContainersQuery = { __typename?: 'Query' } & {
  containers: Array<
    { __typename?: 'Container' } & Pick<
      Container,
      | 'id'
      | 'containerName'
      | 'serviceName'
      | 'containerNumber'
      | 'startedAt'
      | 'finishedAt'
      | 'state'
    >
  >;
};

export type GetDeploymentsQueryVariables = Exact<{ [key: string]: never }>;

export type GetDeploymentsQuery = { __typename?: 'Query' } & {
  deployments: Array<
    { __typename?: 'Deployment' } & Pick<Deployment, 'id' | 'enabled'> & {
        node?: Maybe<{ __typename?: 'Node' } & Pick<Node, 'id' | 'name'>>;
        compose?: Maybe<
          { __typename?: 'Compose' } & Pick<Compose, 'id' | 'name'>
        >;
      }
  >;
};

export type GetNodeByIdQueryVariables = Exact<{
  id: Scalars['Uuid'];
}>;

export type GetNodeByIdQuery = { __typename?: 'Query' } & {
  node?: Maybe<
    { __typename?: 'Node' } & Pick<
      Node,
      | 'id'
      | 'name'
      | 'host'
      | 'username'
      | 'enabled'
      | 'port'
      | 'reconciliationFailed'
    > & {
        deployments?: Maybe<
          Array<Maybe<{ __typename?: 'Deployment' } & Pick<Deployment, 'id'>>>
        >;
      }
  >;
};

export type GetNodesQueryVariables = Exact<{ [key: string]: never }>;

export type GetNodesQuery = { __typename?: 'Query' } & {
  nodes: Array<
    { __typename?: 'Node' } & Pick<Node, 'id' | 'name' | 'host' | 'username'>
  >;
};

export type OnConnectionLogSubscriptionVariables = Exact<{
  deploymentId?: Maybe<Scalars['Uuid']>;
  after: Scalars['DateTime'];
}>;

export type OnConnectionLogSubscription = { __typename?: 'Subscription' } & {
  connectionLogs: { __typename?: 'ConnectionLog' } & Pick<
    ConnectionLog,
    'id' | 'error' | 'message' | 'severity' | 'time'
  >;
};

export type OnContainersChangedSubscriptionVariables = Exact<{
  deploymentId: Scalars['Uuid'];
}>;

export type OnContainersChangedSubscription = {
  __typename?: 'Subscription';
} & {
  connectionLogs: { __typename?: 'ContainerChange' } & Pick<
    ContainerChange,
    'containerId' | 'deploymentId' | 'kind'
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
      name: $name
      directory: $directory
      serviceEnabled: $serviceEnabled
      compose: $compose
    ) {
      id
      name
      current {
        id
        directory
        serviceEnabled
        content
      }
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
export const CreateDeploymentDocument = gql`
  mutation createDeployment($compose: Uuid!, $node: Uuid!) {
    createDeployment(compose: $compose, node: $node) {
      id
      compose {
        id
        name
      }
      node {
        id
        name
      }
    }
  }
`;
export type CreateDeploymentMutationFn = Apollo.MutationFunction<
  CreateDeploymentMutation,
  CreateDeploymentMutationVariables
>;

/**
 * __useCreateDeploymentMutation__
 *
 * To run a mutation, you first call `useCreateDeploymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDeploymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDeploymentMutation, { data, loading, error }] = useCreateDeploymentMutation({
 *   variables: {
 *      compose: // value for 'compose'
 *      node: // value for 'node'
 *   },
 * });
 */
export function useCreateDeploymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateDeploymentMutation,
    CreateDeploymentMutationVariables
  >,
) {
  return Apollo.useMutation<
    CreateDeploymentMutation,
    CreateDeploymentMutationVariables
  >(CreateDeploymentDocument, baseOptions);
}
export type CreateDeploymentMutationHookResult = ReturnType<
  typeof useCreateDeploymentMutation
>;
export type CreateDeploymentMutationResult = Apollo.MutationResult<CreateDeploymentMutation>;
export type CreateDeploymentMutationOptions = Apollo.BaseMutationOptions<
  CreateDeploymentMutation,
  CreateDeploymentMutationVariables
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
      name: $name
      host: $host
      port: $port
      username: $username
      password: $password
      privateKey: $privateKey
    ) {
      ... on SuccessfulNodeCreation {
        node {
          id
          name
          host
          username
          reconciliationFailed
        }
      }
      ... on NodeConnectionFailed {
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
export const DeleteComposeDocument = gql`
  mutation deleteCompose($id: Uuid!) {
    deleteCompose(id: $id)
  }
`;
export type DeleteComposeMutationFn = Apollo.MutationFunction<
  DeleteComposeMutation,
  DeleteComposeMutationVariables
>;

/**
 * __useDeleteComposeMutation__
 *
 * To run a mutation, you first call `useDeleteComposeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteComposeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteComposeMutation, { data, loading, error }] = useDeleteComposeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteComposeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteComposeMutation,
    DeleteComposeMutationVariables
  >,
) {
  return Apollo.useMutation<
    DeleteComposeMutation,
    DeleteComposeMutationVariables
  >(DeleteComposeDocument, baseOptions);
}
export type DeleteComposeMutationHookResult = ReturnType<
  typeof useDeleteComposeMutation
>;
export type DeleteComposeMutationResult = Apollo.MutationResult<DeleteComposeMutation>;
export type DeleteComposeMutationOptions = Apollo.BaseMutationOptions<
  DeleteComposeMutation,
  DeleteComposeMutationVariables
>;
export const DeleteNodeDocument = gql`
  mutation deleteNode($id: Uuid!) {
    deleteNode(id: $id)
  }
`;
export type DeleteNodeMutationFn = Apollo.MutationFunction<
  DeleteNodeMutation,
  DeleteNodeMutationVariables
>;

/**
 * __useDeleteNodeMutation__
 *
 * To run a mutation, you first call `useDeleteNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNodeMutation, { data, loading, error }] = useDeleteNodeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeleteNodeMutation,
    DeleteNodeMutationVariables
  >,
) {
  return Apollo.useMutation<DeleteNodeMutation, DeleteNodeMutationVariables>(
    DeleteNodeDocument,
    baseOptions,
  );
}
export type DeleteNodeMutationHookResult = ReturnType<
  typeof useDeleteNodeMutation
>;
export type DeleteNodeMutationResult = Apollo.MutationResult<DeleteNodeMutation>;
export type DeleteNodeMutationOptions = Apollo.BaseMutationOptions<
  DeleteNodeMutation,
  DeleteNodeMutationVariables
>;
export const DisableDeploymentDocument = gql`
  mutation disableDeployment($deployment: Uuid!) {
    disableDeployment(deployment: $deployment) {
      id
      enabled
      reconciliationFailed
      compose {
        id
        name
        current {
          id
          serviceEnabled
          serviceName
          directory
        }
      }
      node {
        id
        name
        host
        port
        username
      }
    }
  }
`;
export type DisableDeploymentMutationFn = Apollo.MutationFunction<
  DisableDeploymentMutation,
  DisableDeploymentMutationVariables
>;

/**
 * __useDisableDeploymentMutation__
 *
 * To run a mutation, you first call `useDisableDeploymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisableDeploymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disableDeploymentMutation, { data, loading, error }] = useDisableDeploymentMutation({
 *   variables: {
 *      deployment: // value for 'deployment'
 *   },
 * });
 */
export function useDisableDeploymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DisableDeploymentMutation,
    DisableDeploymentMutationVariables
  >,
) {
  return Apollo.useMutation<
    DisableDeploymentMutation,
    DisableDeploymentMutationVariables
  >(DisableDeploymentDocument, baseOptions);
}
export type DisableDeploymentMutationHookResult = ReturnType<
  typeof useDisableDeploymentMutation
>;
export type DisableDeploymentMutationResult = Apollo.MutationResult<DisableDeploymentMutation>;
export type DisableDeploymentMutationOptions = Apollo.BaseMutationOptions<
  DisableDeploymentMutation,
  DisableDeploymentMutationVariables
>;
export const DisableNodeDocument = gql`
  mutation disableNode($node: Uuid!) {
    disableNode(node: $node) {
      id
      name
      host
      username
      enabled
      reconciliationFailed
      port
      deployments {
        id
      }
    }
  }
`;
export type DisableNodeMutationFn = Apollo.MutationFunction<
  DisableNodeMutation,
  DisableNodeMutationVariables
>;

/**
 * __useDisableNodeMutation__
 *
 * To run a mutation, you first call `useDisableNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisableNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disableNodeMutation, { data, loading, error }] = useDisableNodeMutation({
 *   variables: {
 *      node: // value for 'node'
 *   },
 * });
 */
export function useDisableNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DisableNodeMutation,
    DisableNodeMutationVariables
  >,
) {
  return Apollo.useMutation<DisableNodeMutation, DisableNodeMutationVariables>(
    DisableNodeDocument,
    baseOptions,
  );
}
export type DisableNodeMutationHookResult = ReturnType<
  typeof useDisableNodeMutation
>;
export type DisableNodeMutationResult = Apollo.MutationResult<DisableNodeMutation>;
export type DisableNodeMutationOptions = Apollo.BaseMutationOptions<
  DisableNodeMutation,
  DisableNodeMutationVariables
>;
export const EnableDeploymentDocument = gql`
  mutation enableDeployment($deployment: Uuid!) {
    enableDeployment(deployment: $deployment) {
      id
      enabled
      reconciliationFailed
      compose {
        id
        name
        current {
          id
          serviceEnabled
          serviceName
          directory
        }
      }
      node {
        id
        name
        host
        port
        username
      }
    }
  }
`;
export type EnableDeploymentMutationFn = Apollo.MutationFunction<
  EnableDeploymentMutation,
  EnableDeploymentMutationVariables
>;

/**
 * __useEnableDeploymentMutation__
 *
 * To run a mutation, you first call `useEnableDeploymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnableDeploymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enableDeploymentMutation, { data, loading, error }] = useEnableDeploymentMutation({
 *   variables: {
 *      deployment: // value for 'deployment'
 *   },
 * });
 */
export function useEnableDeploymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    EnableDeploymentMutation,
    EnableDeploymentMutationVariables
  >,
) {
  return Apollo.useMutation<
    EnableDeploymentMutation,
    EnableDeploymentMutationVariables
  >(EnableDeploymentDocument, baseOptions);
}
export type EnableDeploymentMutationHookResult = ReturnType<
  typeof useEnableDeploymentMutation
>;
export type EnableDeploymentMutationResult = Apollo.MutationResult<EnableDeploymentMutation>;
export type EnableDeploymentMutationOptions = Apollo.BaseMutationOptions<
  EnableDeploymentMutation,
  EnableDeploymentMutationVariables
>;
export const EnableNodeDocument = gql`
  mutation enableNode($node: Uuid!) {
    enableNode(node: $node) {
      id
      name
      host
      username
      enabled
      reconciliationFailed
      port
      deployments {
        id
      }
    }
  }
`;
export type EnableNodeMutationFn = Apollo.MutationFunction<
  EnableNodeMutation,
  EnableNodeMutationVariables
>;

/**
 * __useEnableNodeMutation__
 *
 * To run a mutation, you first call `useEnableNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnableNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enableNodeMutation, { data, loading, error }] = useEnableNodeMutation({
 *   variables: {
 *      node: // value for 'node'
 *   },
 * });
 */
export function useEnableNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    EnableNodeMutation,
    EnableNodeMutationVariables
  >,
) {
  return Apollo.useMutation<EnableNodeMutation, EnableNodeMutationVariables>(
    EnableNodeDocument,
    baseOptions,
  );
}
export type EnableNodeMutationHookResult = ReturnType<
  typeof useEnableNodeMutation
>;
export type EnableNodeMutationResult = Apollo.MutationResult<EnableNodeMutation>;
export type EnableNodeMutationOptions = Apollo.BaseMutationOptions<
  EnableNodeMutation,
  EnableNodeMutationVariables
>;
export const RedeployComposeDocument = gql`
  mutation redeployCompose($id: Uuid!) {
    redeployCompose(id: $id) {
      id
      name
      current {
        id
        directory
        serviceEnabled
        serviceName
        content
      }
    }
  }
`;
export type RedeployComposeMutationFn = Apollo.MutationFunction<
  RedeployComposeMutation,
  RedeployComposeMutationVariables
>;

/**
 * __useRedeployComposeMutation__
 *
 * To run a mutation, you first call `useRedeployComposeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRedeployComposeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [redeployComposeMutation, { data, loading, error }] = useRedeployComposeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRedeployComposeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RedeployComposeMutation,
    RedeployComposeMutationVariables
  >,
) {
  return Apollo.useMutation<
    RedeployComposeMutation,
    RedeployComposeMutationVariables
  >(RedeployComposeDocument, baseOptions);
}
export type RedeployComposeMutationHookResult = ReturnType<
  typeof useRedeployComposeMutation
>;
export type RedeployComposeMutationResult = Apollo.MutationResult<RedeployComposeMutation>;
export type RedeployComposeMutationOptions = Apollo.BaseMutationOptions<
  RedeployComposeMutation,
  RedeployComposeMutationVariables
>;
export const RedeployDeploymentDocument = gql`
  mutation redeployDeployment($id: Uuid!) {
    redeployDeployment(id: $id) {
      id
      enabled
      reconciliationFailed
      compose {
        id
        name
        current {
          id
          serviceEnabled
          serviceName
          directory
        }
      }
      node {
        id
        name
        host
        port
        username
      }
    }
  }
`;
export type RedeployDeploymentMutationFn = Apollo.MutationFunction<
  RedeployDeploymentMutation,
  RedeployDeploymentMutationVariables
>;

/**
 * __useRedeployDeploymentMutation__
 *
 * To run a mutation, you first call `useRedeployDeploymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRedeployDeploymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [redeployDeploymentMutation, { data, loading, error }] = useRedeployDeploymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRedeployDeploymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RedeployDeploymentMutation,
    RedeployDeploymentMutationVariables
  >,
) {
  return Apollo.useMutation<
    RedeployDeploymentMutation,
    RedeployDeploymentMutationVariables
  >(RedeployDeploymentDocument, baseOptions);
}
export type RedeployDeploymentMutationHookResult = ReturnType<
  typeof useRedeployDeploymentMutation
>;
export type RedeployDeploymentMutationResult = Apollo.MutationResult<RedeployDeploymentMutation>;
export type RedeployDeploymentMutationOptions = Apollo.BaseMutationOptions<
  RedeployDeploymentMutation,
  RedeployDeploymentMutationVariables
>;
export const RedeployNodeDocument = gql`
  mutation redeployNode($id: Uuid!) {
    redeployNode(id: $id) {
      id
      name
      host
      username
      enabled
      reconciliationFailed
      port
      deployments {
        id
      }
    }
  }
`;
export type RedeployNodeMutationFn = Apollo.MutationFunction<
  RedeployNodeMutation,
  RedeployNodeMutationVariables
>;

/**
 * __useRedeployNodeMutation__
 *
 * To run a mutation, you first call `useRedeployNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRedeployNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [redeployNodeMutation, { data, loading, error }] = useRedeployNodeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRedeployNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RedeployNodeMutation,
    RedeployNodeMutationVariables
  >,
) {
  return Apollo.useMutation<
    RedeployNodeMutation,
    RedeployNodeMutationVariables
  >(RedeployNodeDocument, baseOptions);
}
export type RedeployNodeMutationHookResult = ReturnType<
  typeof useRedeployNodeMutation
>;
export type RedeployNodeMutationResult = Apollo.MutationResult<RedeployNodeMutation>;
export type RedeployNodeMutationOptions = Apollo.BaseMutationOptions<
  RedeployNodeMutation,
  RedeployNodeMutationVariables
>;
export const TestConnectionDocument = gql`
  mutation testConnection(
    $host: String!
    $port: Int!
    $username: String!
    $password: String
    $privateKey: String
    $nodeId: Uuid
  ) {
    testConnection(
      host: $host
      port: $port
      username: $username
      password: $password
      privateKey: $privateKey
      nodeId: $nodeId
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
 *      nodeId: // value for 'nodeId'
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
    $id: Uuid!
    $name: String!
    $directory: String!
    $serviceEnabled: Boolean!
    $compose: String!
  ) {
    updateCompose(
      id: $id
      name: $name
      directory: $directory
      serviceEnabled: $serviceEnabled
      compose: $compose
    ) {
      id
      name
      current {
        id
        directory
        serviceEnabled
        serviceName
        content
      }
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
export const UpdateNodeDocument = gql`
  mutation updateNode(
    $id: Uuid!
    $name: String!
    $host: String!
    $port: Int!
    $username: String!
    $password: String
    $privateKey: String
  ) {
    updateNode(
      id: $id
      name: $name
      host: $host
      port: $port
      username: $username
      password: $password
      privateKey: $privateKey
    ) {
      ... on SuccessfulNodeUpdate {
        node {
          id
          name
          host
          username
          reconciliationFailed
        }
      }
      ... on NodeConnectionFailed {
        error
        field
      }
    }
  }
`;
export type UpdateNodeMutationFn = Apollo.MutationFunction<
  UpdateNodeMutation,
  UpdateNodeMutationVariables
>;

/**
 * __useUpdateNodeMutation__
 *
 * To run a mutation, you first call `useUpdateNodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNodeMutation, { data, loading, error }] = useUpdateNodeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      host: // value for 'host'
 *      port: // value for 'port'
 *      username: // value for 'username'
 *      password: // value for 'password'
 *      privateKey: // value for 'privateKey'
 *   },
 * });
 */
export function useUpdateNodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    UpdateNodeMutation,
    UpdateNodeMutationVariables
  >,
) {
  return Apollo.useMutation<UpdateNodeMutation, UpdateNodeMutationVariables>(
    UpdateNodeDocument,
    baseOptions,
  );
}
export type UpdateNodeMutationHookResult = ReturnType<
  typeof useUpdateNodeMutation
>;
export type UpdateNodeMutationResult = Apollo.MutationResult<UpdateNodeMutation>;
export type UpdateNodeMutationOptions = Apollo.BaseMutationOptions<
  UpdateNodeMutation,
  UpdateNodeMutationVariables
>;
export const GetComposeByIdDocument = gql`
  query getComposeById($id: Uuid!) {
    compose(where: { id: { eq: $id } }) {
      id
      name
      current {
        id
        content
        directory
        serviceName
        serviceEnabled
      }
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
export const GetDeploymentByIdDocument = gql`
  query getDeploymentById($id: Uuid!) {
    deployment(where: { id: { eq: $id } }) {
      id
      enabled
      reconciliationFailed
      compose {
        id
        name
        current {
          id
          serviceEnabled
          serviceName
          directory
        }
      }
      node {
        id
        name
        host
        port
        username
      }
    }
  }
`;

/**
 * __useGetDeploymentByIdQuery__
 *
 * To run a query within a React component, call `useGetDeploymentByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDeploymentByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDeploymentByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetDeploymentByIdQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetDeploymentByIdQuery,
    GetDeploymentByIdQueryVariables
  >,
) {
  return Apollo.useQuery<
    GetDeploymentByIdQuery,
    GetDeploymentByIdQueryVariables
  >(GetDeploymentByIdDocument, baseOptions);
}
export function useGetDeploymentByIdLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetDeploymentByIdQuery,
    GetDeploymentByIdQueryVariables
  >,
) {
  return Apollo.useLazyQuery<
    GetDeploymentByIdQuery,
    GetDeploymentByIdQueryVariables
  >(GetDeploymentByIdDocument, baseOptions);
}
export type GetDeploymentByIdQueryHookResult = ReturnType<
  typeof useGetDeploymentByIdQuery
>;
export type GetDeploymentByIdLazyQueryHookResult = ReturnType<
  typeof useGetDeploymentByIdLazyQuery
>;
export type GetDeploymentByIdQueryResult = Apollo.QueryResult<
  GetDeploymentByIdQuery,
  GetDeploymentByIdQueryVariables
>;
export const GetDeploymentConnectionLogsDocument = gql`
  query getDeploymentConnectionLogs($id: Uuid!) {
    connectionLogs(
      where: { deploymentId: { eq: $id } }
      order: { time: ASC }
      last: 500
    ) {
      nodes {
        id
        time
        message
        error
        severity
      }
    }
  }
`;

/**
 * __useGetDeploymentConnectionLogsQuery__
 *
 * To run a query within a React component, call `useGetDeploymentConnectionLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDeploymentConnectionLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDeploymentConnectionLogsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetDeploymentConnectionLogsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetDeploymentConnectionLogsQuery,
    GetDeploymentConnectionLogsQueryVariables
  >,
) {
  return Apollo.useQuery<
    GetDeploymentConnectionLogsQuery,
    GetDeploymentConnectionLogsQueryVariables
  >(GetDeploymentConnectionLogsDocument, baseOptions);
}
export function useGetDeploymentConnectionLogsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetDeploymentConnectionLogsQuery,
    GetDeploymentConnectionLogsQueryVariables
  >,
) {
  return Apollo.useLazyQuery<
    GetDeploymentConnectionLogsQuery,
    GetDeploymentConnectionLogsQueryVariables
  >(GetDeploymentConnectionLogsDocument, baseOptions);
}
export type GetDeploymentConnectionLogsQueryHookResult = ReturnType<
  typeof useGetDeploymentConnectionLogsQuery
>;
export type GetDeploymentConnectionLogsLazyQueryHookResult = ReturnType<
  typeof useGetDeploymentConnectionLogsLazyQuery
>;
export type GetDeploymentConnectionLogsQueryResult = Apollo.QueryResult<
  GetDeploymentConnectionLogsQuery,
  GetDeploymentConnectionLogsQueryVariables
>;
export const GetDeploymentContainersDocument = gql`
  query getDeploymentContainers($id: Uuid!) {
    containers(where: { deploymentId: { eq: $id } }) {
      id
      containerName
      serviceName
      containerNumber
      startedAt
      finishedAt
      state
    }
  }
`;

/**
 * __useGetDeploymentContainersQuery__
 *
 * To run a query within a React component, call `useGetDeploymentContainersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDeploymentContainersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDeploymentContainersQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetDeploymentContainersQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetDeploymentContainersQuery,
    GetDeploymentContainersQueryVariables
  >,
) {
  return Apollo.useQuery<
    GetDeploymentContainersQuery,
    GetDeploymentContainersQueryVariables
  >(GetDeploymentContainersDocument, baseOptions);
}
export function useGetDeploymentContainersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetDeploymentContainersQuery,
    GetDeploymentContainersQueryVariables
  >,
) {
  return Apollo.useLazyQuery<
    GetDeploymentContainersQuery,
    GetDeploymentContainersQueryVariables
  >(GetDeploymentContainersDocument, baseOptions);
}
export type GetDeploymentContainersQueryHookResult = ReturnType<
  typeof useGetDeploymentContainersQuery
>;
export type GetDeploymentContainersLazyQueryHookResult = ReturnType<
  typeof useGetDeploymentContainersLazyQuery
>;
export type GetDeploymentContainersQueryResult = Apollo.QueryResult<
  GetDeploymentContainersQuery,
  GetDeploymentContainersQueryVariables
>;
export const GetDeploymentsDocument = gql`
  query getDeployments {
    deployments {
      id
      enabled
      node {
        id
        name
      }
      compose {
        id
        name
      }
    }
  }
`;

/**
 * __useGetDeploymentsQuery__
 *
 * To run a query within a React component, call `useGetDeploymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDeploymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDeploymentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDeploymentsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetDeploymentsQuery,
    GetDeploymentsQueryVariables
  >,
) {
  return Apollo.useQuery<GetDeploymentsQuery, GetDeploymentsQueryVariables>(
    GetDeploymentsDocument,
    baseOptions,
  );
}
export function useGetDeploymentsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetDeploymentsQuery,
    GetDeploymentsQueryVariables
  >,
) {
  return Apollo.useLazyQuery<GetDeploymentsQuery, GetDeploymentsQueryVariables>(
    GetDeploymentsDocument,
    baseOptions,
  );
}
export type GetDeploymentsQueryHookResult = ReturnType<
  typeof useGetDeploymentsQuery
>;
export type GetDeploymentsLazyQueryHookResult = ReturnType<
  typeof useGetDeploymentsLazyQuery
>;
export type GetDeploymentsQueryResult = Apollo.QueryResult<
  GetDeploymentsQuery,
  GetDeploymentsQueryVariables
>;
export const GetNodeByIdDocument = gql`
  query getNodeById($id: Uuid!) {
    node(where: { id: { eq: $id } }) {
      id
      name
      host
      username
      enabled
      port
      reconciliationFailed
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
export const OnConnectionLogDocument = gql`
  subscription onConnectionLog($deploymentId: Uuid, $after: DateTime!) {
    connectionLogs: onConnectionLog(
      deploymentId: $deploymentId
      after: $after
    ) {
      id
      error
      message
      severity
      time
    }
  }
`;

/**
 * __useOnConnectionLogSubscription__
 *
 * To run a query within a React component, call `useOnConnectionLogSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnConnectionLogSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnConnectionLogSubscription({
 *   variables: {
 *      deploymentId: // value for 'deploymentId'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useOnConnectionLogSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    OnConnectionLogSubscription,
    OnConnectionLogSubscriptionVariables
  >,
) {
  return Apollo.useSubscription<
    OnConnectionLogSubscription,
    OnConnectionLogSubscriptionVariables
  >(OnConnectionLogDocument, baseOptions);
}
export type OnConnectionLogSubscriptionHookResult = ReturnType<
  typeof useOnConnectionLogSubscription
>;
export type OnConnectionLogSubscriptionResult = Apollo.SubscriptionResult<OnConnectionLogSubscription>;
export const OnContainersChangedDocument = gql`
  subscription onContainersChanged($deploymentId: Uuid!) {
    connectionLogs: onContainersChanged(deploymentId: $deploymentId) {
      containerId
      deploymentId
      kind
    }
  }
`;

/**
 * __useOnContainersChangedSubscription__
 *
 * To run a query within a React component, call `useOnContainersChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnContainersChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnContainersChangedSubscription({
 *   variables: {
 *      deploymentId: // value for 'deploymentId'
 *   },
 * });
 */
export function useOnContainersChangedSubscription(
  baseOptions: Apollo.SubscriptionHookOptions<
    OnContainersChangedSubscription,
    OnContainersChangedSubscriptionVariables
  >,
) {
  return Apollo.useSubscription<
    OnContainersChangedSubscription,
    OnContainersChangedSubscriptionVariables
  >(OnContainersChangedDocument, baseOptions);
}
export type OnContainersChangedSubscriptionHookResult = ReturnType<
  typeof useOnContainersChangedSubscription
>;
export type OnContainersChangedSubscriptionResult = Apollo.SubscriptionResult<OnContainersChangedSubscription>;
