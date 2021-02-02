import { CancelButton, SubmitButton } from 'components';
import { DashboardLayout } from 'containers';
import Head from 'next/head';
import React from 'react';

export default function CreateNode() {
  return (
    <DashboardLayout>
      <form action="#" method="POST" autoComplete="off">
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
              <div className="col-span-4">
                <label
                  htmlFor="host"
                  className="block text-sm font-medium text-gray-700"
                >
                  Host or IP address
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <input
                    type="text"
                    name="host"
                    id="host"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label
                  htmlFor="port"
                  className="block text-sm font-medium text-gray-700"
                >
                  Port
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <input
                    type="number"
                    name="port"
                    min={0}
                    max={65535}
                    defaultValue={22}
                    id="port"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-3">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                  />
                </div>
              </div>
              <div className="col-span-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <input
                    type="text"
                    name="password"
                    id="password"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-grow block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-3">
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-700"
                >
                  SSH Private key
                </label>
                <div className="mt-1">
                  <textarea
                    id="about"
                    name="about"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Fill out either private key or password. Or both.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 flex flex-row justify-end sm:px-6">
            <CancelButton href="/dashboard">Cancel</CancelButton>
            <div className="flex-grow"></div>
            <CancelButton href="/dashboard">Test Connection</CancelButton>
            <span className="ml-4"></span>
            <SubmitButton>Create</SubmitButton>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
