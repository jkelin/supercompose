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
  TogglField,
} from 'components';
import { DashboardLayout, useToast as useToast } from 'containers';
import {
  TestConnectionError,
  useCreateNodeMutation,
  useTestConnectionMutation,
} from 'data';
import { useRouter } from 'next/dist/client/router';
import Head from 'next/head';
import React, {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Control,
  Controller,
  FieldError,
  FormProvider,
  useForm,
  useFormContext,
  UseFormMethods,
} from 'react-hook-form';

import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';

const YamlEditorField: React.FC<{
  onChange: (value: string) => void;
  value: string;
}> = (props) => {
  return (
    <Editor
      theme="vs-dark"
      className="border"
      path="docker-compose.yaml"
      value={props.value}
      onChange={(x) => props.onChange(x!)}
      height="45vh"
      language="yaml"
      options={{ formatOnPaste: true, insertSpaces: true, tabSize: 2 }}
    />
  );
};

const defaultYaml = `version: "3.9"
services:
  redis:
    image: redis
    ports:
      - "6379:6379"
  postgres:
    image: postgres
    ports:
      - "5432:5432"
`;

interface FormData {
  name: string;
  compose: string;
  directory?: string;
  serviceEnabled: boolean;
}

function directoryFromName(name: string) {
  return (
    '/opt/docker/' + name.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-')
  );
}

function useDeriveDirectoryFromName(form: UseFormMethods<any>) {
  const { name, directory } = form.watch(['name', 'directory']);
  const [prevName, setPrevName] = useState(name);
  const [prevDirectory, setPrevDirectory] = useState(directory);
  useEffect(() => {
    if (prevName !== name) {
      const prevDirectoryFromPrevName = directoryFromName(prevName);
      const newDirectory = directoryFromName(name);
      if (
        prevDirectory === prevDirectoryFromPrevName &&
        newDirectory !== directory
      ) {
        form.setValue('directory', newDirectory);
      }
    }

    if (name !== prevName) {
      setPrevName(name);
    }
    if (directory !== prevDirectory) {
      setPrevDirectory(directory);
    }
  }, [name, directory, form, form.setValue, prevName, prevDirectory]);
}

export default function CreateCompose() {
  const router = useRouter();
  const [createNode] = useCreateNodeMutation();
  const toast = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      serviceEnabled: true,
      compose: defaultYaml,
      directory: '/opt/docker/',
    },
  });

  const onSubmit = form.handleSubmit((data) => console.log('data', data));

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

  useDeriveDirectoryFromName(form);

  return (
    <DashboardLayout>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} autoComplete="off">
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
              <div className="grid grid-cols-2 gap-6">
                <FieldContainer
                  name="name"
                  label="Name"
                  text="Compose display name will be visible throughout supercompose"
                >
                  <TextField
                    name="name"
                    ref={form.register({ required: true, maxLength: 32 })}
                  />
                </FieldContainer>

                <FieldContainer
                  name="directory"
                  label="Directory"
                  className="col-span-1"
                  text="A folder in which docker-compose.yaml will be stored"
                >
                  <TextField
                    name="directory"
                    ref={form.register({
                      required: true,
                      pattern: /^(\/[^/ ]*)+\/?$/,
                    })}
                  />
                </FieldContainer>
              </div>

              <Controller
                name="serviceEnabled"
                render={(props) => (
                  <TogglField value={props.value} onChange={props.onChange}>
                    <span className="text-sm font-medium text-gray-900">
                      Automatic startup
                    </span>
                    <br />
                    <span className="text-sm text-gray-500">
                      Configure a <strong>systemd</strong> service to keep
                      automatically start this docker-compose and keep it
                      running
                    </span>
                  </TogglField>
                )}
              />

              <FieldContainer
                name="content"
                label="docker-compose.yaml"
                className="col-span-3"
              >
                <Controller
                  name="compose"
                  control={form.control}
                  defaultValue={false}
                  rules={{ required: true }}
                  render={(props) => <YamlEditorField {...props} />}
                />
              </FieldContainer>
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
