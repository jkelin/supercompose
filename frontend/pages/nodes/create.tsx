import classNames from 'classnames';
import { ActionButton, LinkButton, SubmitButton } from 'components';
import { DashboardLayout } from 'containers';
import { useTestConnectionMutation } from 'data';
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

function useFormError(field: string): FieldError | undefined {
  const { errors } = useFormContext();

  if (errors[field]?.type === 'global') return undefined;
  return errors[field];
}

const NumberField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    className?: string;
  }
>(function NumberField(props, ref) {
  return (
    <input
      type="number"
      min={0}
      max={65535}
      name={props.name}
      id={props.name}
      ref={ref}
      className={classNames(
        'focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300',
        props.className,
      )}
    />
  );
});

const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  {
    name: string;
    className?: string;
  }
>(function TextAreaField(props, ref) {
  const error = useFormError(props.name);

  return (
    <textarea
      rows={3}
      name={props.name}
      id={props.name}
      ref={ref}
      className={classNames(
        'shadow-sm mt-1 block w-full sm:text-sm rounded-md',
        props.className,
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
      )}
    />
  );
});

const TextField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    className?: string;
  }
>(function TextField(props, ref) {
  const error = useFormError(props.name);

  return (
    <input
      type="text"
      name={props.name}
      id={props.name}
      ref={ref}
      className={classNames(
        'flex-grow block w-full min-w-0 rounded-md sm:text-sm',
        props.className,
        error
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
      )}
    />
  );
});

const FieldContainer: React.FC<{
  name: string;
  label?: ReactNode;
  text?: ReactNode;
  className?: string;
}> = (props) => {
  const error = useFormError(props.name);

  return (
    <div className={props.className}>
      {props.label && (
        <label
          htmlFor={props.name}
          className="block text-sm font-medium text-gray-700"
        >
          {props.label}

          {error?.message && (
            <>
              <span> - </span>
              <span className="text-red-500">{error.message}</span>
            </>
          )}
        </label>
      )}
      {props.children}
      {props.text && <p className="mt-2 text-sm text-gray-500">{props.text}</p>}
    </div>
  );
};

export default function CreateNode() {
  const [testConnection] = useTestConnectionMutation();
  const form = useForm<FormData>({
    defaultValues: { port: 22 },
  });
  const [testSuccess, setTestSuccess] = useState<boolean | undefined>(
    undefined,
  );

  const globalError =
    form.errors.username?.type === 'global' && form.errors.username?.message;

  const onSubmit = form.handleSubmit(async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(data);
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
        },
        fetchPolicy: 'no-cache',
      });

      if (resp.data?.testConnection) {
        const err = resp.data?.testConnection;
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
      } else {
        setTestSuccess(true);
      }
    } else {
      form.handleSubmit(undefined as any)();
    }
  }, [form, testConnection]);

  return (
    <DashboardLayout>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="bg-white py-6 px-4 space-y-6 sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Configure new node
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Supercompose uses <strong>SSH</strong> to connect to nodes.
                  Please setup SSH credentials to access your node. Adding a new
                  node will allow you to manage compose files on it.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-6">
                <FieldContainer
                  name="host"
                  label="Host or IP address"
                  className="col-span-4"
                >
                  <TextField
                    name="host"
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
                  name="username"
                  label="Username"
                  className="col-span-4"
                >
                  <TextField
                    name="username"
                    ref={form.register({ required: true })}
                  />
                </FieldContainer>
                <FieldContainer
                  name="password"
                  label="Password"
                  className="col-span-2"
                >
                  <TextField name="password" ref={form.register()} />
                </FieldContainer>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <FieldContainer
                  name="privateKey"
                  label="SSH Private key"
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
              <SubmitButton kind="primary">Create</SubmitButton>
            </div>
          </div>
        </form>
      </FormProvider>
    </DashboardLayout>
  );
}
