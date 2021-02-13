import { gql, useApolloClient } from '@apollo/react-hooks';
import {
  FieldContainer,
  LinkButton,
  Spinner,
  SubmitButton,
  TextField,
  TogglField,
} from 'components';
import {
  DashboardLayout,
  defaultComposeYaml,
  useDeriveDirectoryFromName,
  useToast as useToast,
  YamlEditorField,
} from 'containers';
import {
  GetComposeByIdQuery,
  useCreateComposeMutation,
  useGetComposeByIdQuery,
} from 'data';
import { useRouter } from 'next/dist/client/router';
import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

interface FormData {
  name: string;
  compose: string;
  directory: string;
  serviceEnabled: boolean;
}

const EditComposeForm: React.FC<{
  composeQuery: ReturnType<typeof useGetComposeByIdQuery>;
}> = (props) => {
  const compose = props.composeQuery.data!.compose;

  const router = useRouter();
  const toast = useToast();
  const [createCompose] = useCreateComposeMutation();
  const apollo = useApolloClient();

  const form = useForm<FormData>({
    defaultValues: {
      name: compose.name,
      serviceEnabled: compose.serviceEnabled,
      compose: compose.content,
      directory: compose.directory,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const resp = await createCompose({
      variables: {
        name: data.name,
        directory: data.directory,
        compose: data.compose,
        serviceEnabled: data.serviceEnabled,
      },
      fetchPolicy: 'no-cache',
    });

    apollo.cache.modify({
      fields: {
        nodes(existingComposesRefs = [], {}) {
          const newComposeRef = apollo.cache.writeFragment({
            data: resp?.data?.createCompose,
            fragment: gql`
              fragment NewCompose on Compose {
                id
                name
                serviceEnabled
              }
            `,
          });

          return [...existingComposesRefs, newComposeRef];
        },
      },
    });

    toast({
      kind: 'success',
      title: 'Compose updated',
    });
    router.push(`/compose/${resp?.data?.createCompose.id}`);
  });

  useDeriveDirectoryFromName(form);

  return (
    <DashboardLayout>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="bg-white py-6 px-4 space-y-6 sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Update Compose {compose.name}
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
              <LinkButton href={`/compose/${compose.id}`} kind="secondary">
                Cancel
              </LinkButton>
              <div className="flex-grow"></div>

              <SubmitButton kind="primary">Update</SubmitButton>
            </div>
          </div>
        </form>
      </FormProvider>
    </DashboardLayout>
  );
};

const EditCompose: React.FC<{}> = (props) => {
  const router = useRouter();
  const composeQuery = useGetComposeByIdQuery({
    variables: { id: router.query.id as string },
  });

  if (composeQuery.loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16 bg-white shadow rounded-lg">
          <Spinner className="animate-spin h-8 w-8 text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  return <EditComposeForm composeQuery={composeQuery} />;
};

export default EditCompose;
