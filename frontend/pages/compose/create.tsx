import { gql, useApolloClient } from '@apollo/react-hooks';
import classNames from 'classnames';
import {
  ActionButton,
  FieldContainer,
  LinkButton,
  NumberField,
  SubmitButton,
  TextAreaField,
  TextField,
} from 'components';
import { DashboardLayout, useToast as useToast } from 'containers';
import {
  TestConnectionError,
  useCreateNodeMutation,
  useTestConnectionMutation,
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
  compose: string;
  directory?: string;
  serviceEnabled: boolean;
  serviceName?: string;
}

export default function CreateCompose() {
  const router = useRouter();
  const [createNode] = useCreateNodeMutation();
  const toast = useToast();

  const form = useForm<FormData>({
    defaultValues: { serviceEnabled: true },
  });

  // const onSubmit = form.handleSubmit(async (data) => {
  //   const resp = await createNode({
  //     variables: {
  //       name: data.name,
  //       host: data.host,
  //       port: parseInt(data.port + ''),
  //       username: data.username,
  //       password: data.password,
  //       privateKey: data.privateKey,
  //     },
  //     fetchPolicy: 'no-cache',
  //   });

  //   if (resp?.data?.createNode.__typename == 'Node') {
  //     apollo.cache.modify({
  //       fields: {
  //         nodes(existingNodesRefs = [], { readField }) {
  //           const newNodeRef = apollo.cache.writeFragment({
  //             data: resp?.data?.createNode,
  //             fragment: gql`
  //               fragment NewNode on Node {
  //                 id
  //                 host
  //                 username
  //                 name
  //               }
  //             `,
  //           });

  //           return [...existingNodesRefs, newNodeRef];
  //         },
  //       },
  //     });

  //     toast({
  //       kind: 'success',
  //       title: 'Node created',
  //     });
  //     router.push(`/node/${resp?.data?.createNode.id}`);
  //   } else {
  //     handleErrors(resp?.data?.createNode as any);
  //   }
  // });

  return (
    <DashboardLayout>
      <FormProvider {...form}>
        <form onSubmit={() => undefined} autoComplete="off">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="bg-white py-6 px-4 space-y-6 sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Configure new Docker Compose
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Supercompose will create a <strong>docker-compose</strong>{' '}
                  files in the location that you specify and will optionally
                  configure a <strong>systemd</strong> service to make sure it
                  keeps on running
                </p>
              </div>

              <FieldContainer
                name="name"
                label="Display name"
                text="Compose display name will be visible throughout supercompose"
              >
                <TextField
                  name="name"
                  ref={form.register({ required: true })}
                />
              </FieldContainer>

              <div className="grid grid-cols-5 gap-6">
                <FieldContainer
                  name="serviceName"
                  label="Systemd Service Name"
                  className="col-span-4"
                  text="Optional name of the service file that will be installed on your server"
                >
                  <TextField
                    name="serviceName"
                    ref={form.register({ required: true })}
                  />
                </FieldContainer>
                <FieldContainer name="port" label="Port" className="col-span-1">
                  <NumberField
                    name="port"
                    ref={form.register({ required: true, min: 0, max: 65535 })}
                  />
                </FieldContainer>
              </div>

              <div className="grid grid-cols-6 gap-6">
                <FieldContainer
                  name="directory"
                  label="Directory"
                  className="col-span-6"
                  text="Location that your Compose file will be stored at. Paths referenced in the Compose file will be relative to this directory"
                >
                  <TextField
                    name="directory"
                    ref={form.register({ required: true })}
                  />
                </FieldContainer>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <FieldContainer
                  name="content"
                  label="Compose File Content"
                  className="col-span-3"
                >
                  <TextAreaField
                    rows={8}
                    name="content"
                    ref={form.register()}
                  />
                </FieldContainer>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 flex flex-row justify-end sm:px-6">
              <LinkButton href="/dashboard" kind="secondary">
                Cancel
              </LinkButton>
              <div className="flex-grow"></div>

              <SubmitButton kind="primary">Create</SubmitButton>
            </div>
          </div>
        </form>
      </FormProvider>
    </DashboardLayout>
  );
}
