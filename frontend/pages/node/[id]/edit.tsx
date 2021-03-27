import { gql, useApolloClient } from '@apollo/react-hooks';
import classNames from 'classnames';
import {
  ActionButton,
  FieldContainer,
  LinkButton,
  NumberField,
  Spinner,
  SubmitButton,
  TextAreaField,
  TextField,
} from 'components';
import { DashboardLayout, useToast as useToast } from 'containers';
import {
  NodeConnectionFailed,
  SuccessfulNodeUpdate,
  useUpdateNodeMutation,
  useTestConnectionMutation,
  useGetNodeByIdQuery,
} from 'data';
import { useRouter } from 'next/dist/client/router';
import Head from 'next/head';
import React, { forwardRef, ReactNode, useCallback, useState } from 'react';
import {
  FieldError,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';

interface FormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

const EditNodeForm: React.FC<{
  nodeQuery: ReturnType<typeof useGetNodeByIdQuery>;
}> = (props) => {
  const node = props.nodeQuery.data!.node!;
  const apollo = useApolloClient();
  const router = useRouter();
  const [testConnection] = useTestConnectionMutation();
  const [updateNode] = useUpdateNodeMutation();
  const toast = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      name: node.name,
      username: node.username,
      host: node.host,
      port: node.port,
      privateKey: '',
      password: '',
    },
  });
  const [testSuccess, setTestSuccess] = useState<boolean | undefined>(
    undefined,
  );

  const globalError =
    form.errors.username?.type === 'global' && form.errors.username?.message;

  const handleErrors = useCallback(
    (err: NodeConnectionFailed) => {
      if (err.field) {
        form.setError(err.field as any, {
          type: 'specific',
          message: err.error,
          shouldFocus: true,
        });
      } else {
        form.setError('username', {
          type: 'global',
          message: err.error,
        });
      }
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const resp = await updateNode({
      variables: {
        id: router.query.id,
        name: data.name,
        host: data.host,
        port: parseInt(data.port + ''),
        username: data.username,
        password: data.password,
        privateKey: data.privateKey,
      },
    });

    if (resp?.data?.updateNode?.__typename == 'SuccessfulNodeUpdate') {
      // apollo.cache.modify({
      //   fields: {
      //     nodes(existingNodesRefs = [], { readField }) {
      //       const nodeRef = apollo.cache.writeFragment({
      //         data: (resp?.data?.updateNode as SuccessfulNodeUpdate)?.node,
      //         fragment: gql`
      //           fragment NewNode on Node {
      //             id
      //             host
      //             username
      //             name
      //           }
      //         `,
      //       });

      //       return [...existingNodesRefs, nodeRef];
      //     },
      //   },
      // });

      toast({
        kind: 'success',
        title: 'Node updated',
      });
      router.push(`/node/${resp?.data?.updateNode!.node.id}`);
    } else {
      handleErrors(resp?.data?.updateNode as any);
    }
  });

  const onTestConnection = useCallback(async () => {
    setTestSuccess(undefined);
    if (
      await form.trigger(['host', 'port', 'username', 'password', 'privateKey'])
    ) {
      const formValues = form.getValues();
      const resp = await testConnection({
        variables: {
          host: formValues.host,
          port: parseInt(formValues.port + ''),
          username: formValues.username,
          password: formValues.password,
          privateKey: formValues.privateKey,
          nodeId: router.query.id,
        },
        fetchPolicy: 'no-cache',
      });

      if (resp.data?.testConnection) {
        handleErrors(resp.data?.testConnection);
      } else {
        setTestSuccess(true);
      }
    } else {
      form.handleSubmit(undefined as any)();
    }
  }, [form, testConnection, router.query.id, handleErrors]);

  return (
    <DashboardLayout>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="bg-white py-6 px-4 space-y-6 sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Update node
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Supercompose uses <strong>SSH</strong> to connect to nodes.
                  Please setup SSH credentials to access your node. Adding a new
                  node will allow you to manage compose files on it.
                </p>
              </div>

              <FieldContainer
                name="name"
                label="Display name"
                text="Node display name will be visible throughout supercompose to help you tell apart your nodes"
              >
                <TextField
                  name="name"
                  ref={form.register({ required: true })}
                />
              </FieldContainer>

              <div className="grid grid-cols-6 gap-6">
                <FieldContainer
                  name="host"
                  label="Host or IP address"
                  className="col-span-6 lg:col-span-4 xl:col-span-5"
                >
                  <TextField
                    name="host"
                    ref={form.register({ required: true })}
                  />
                </FieldContainer>
                <FieldContainer
                  name="port"
                  label="Port"
                  className="col-span-6 lg:col-span-2 xl:col-span-1"
                >
                  <NumberField
                    name="port"
                    ref={form.register({ required: true, min: 0, max: 65535 })}
                  />
                </FieldContainer>
              </div>

              <div className="grid grid-cols-6 gap-6">
                <FieldContainer
                  name="username"
                  label="Username"
                  className="col-span-6 lg:col-span-3 xl:col-span-4"
                >
                  <TextField
                    name="username"
                    ref={form.register({ required: true })}
                  />
                </FieldContainer>
                <FieldContainer
                  name="password"
                  label="Update password"
                  className="col-span-6 lg:col-span-3 xl:col-span-2"
                >
                  <TextField name="password" ref={form.register()} />
                </FieldContainer>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <FieldContainer
                  name="privateKey"
                  label="Update SSH Private key"
                  text="Fill out either private key or password. Or both."
                  className="col-span-3"
                >
                  <TextAreaField name="privateKey" ref={form.register()} />
                </FieldContainer>
              </div>

              {globalError && (
                <div className="bg-red-500 text-white rounded py-2 px-4 text-sm">
                  {globalError}
                </div>
              )}
              {testSuccess && (
                <div className="bg-green-500 text-white rounded py-2 px-4 text-sm">
                  Connection test succeeded
                </div>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 flex flex-row justify-end sm:px-6">
              <LinkButton href="/dashboard" kind="secondary">
                Cancel
              </LinkButton>
              <div className="flex-grow"></div>
              <ActionButton onClick={onTestConnection} kind="secondary">
                Test Connection
              </ActionButton>
              <span className="ml-4"></span>
              <SubmitButton kind="primary">Save</SubmitButton>
            </div>
          </div>
        </form>
      </FormProvider>
    </DashboardLayout>
  );
};

const EditNode: React.FC<{}> = (props) => {
  const router = useRouter();
  const nodeQuery = useGetNodeByIdQuery({
    variables: { id: router.query.id as string },
  });

  if (nodeQuery.loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16 bg-white shadow rounded-lg">
          <Spinner className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  return <EditNodeForm nodeQuery={nodeQuery} />;
};

export default EditNode;
