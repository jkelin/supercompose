import {
  GetDeploymentConnectionLogsQueryResult,
  ConnectionLog,
  useGetDeploymentConnectionLogsQuery,
  OnConnectionLogDocument,
  ConnectionLogSeverity,
  useGetDeploymentContainersQuery,
  Container,
  ContainerState,
} from 'data';
import { format } from 'date-fns';
import { groupBy, orderBy, takeRight, uniqBy } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const containerStateColors: Record<ContainerState, string> = {
  [ContainerState.Created]: 'text-yellow-900',
  [ContainerState.Exited]: 'text-yellow-900',
  [ContainerState.Restarting]: 'text-yellow-900',
  [ContainerState.Removing]: 'text-yellow-900',
  [ContainerState.Paused]: 'text-red-900',
  [ContainerState.Dead]: 'text-red-900',
  [ContainerState.Running]: 'text-green-900',
};

const ContainerRow: React.FC<{
  container: Container;
}> = (props) => {
  const state = props.container.state;

  return (
    <div className="flex">
      <div
        className={classNames(
          'w-24 py-2 pr-4 text-sm',
          containerStateColors[state],
        )}
      >
        {state.toLowerCase()}
      </div>
      <div className="flex-grow py-2 pr-4 text-sm text-gray-900">
        {props.container.containerName}
      </div>
    </div>
  );
};

const ServiceRow: React.FC<{
  service: string;
  containers: Container[];
}> = (props) => {
  return (
    <div className="flex flex-row items-center" role="row">
      <div className="w-20 py-2 ml-6 font-semibold text-sm">
        {props.service}
      </div>
      <div className="flex-grow flex flex-col">
        {props.containers.map((x) => (
          <ContainerRow key={x.id} container={x} />
        ))}
      </div>
    </div>
  );
};

export const Containers: React.FC<{
  deploymentId: string;
}> = (props) => {
  const containersQuery = useGetDeploymentContainersQuery({
    variables: { id: props.deploymentId },
  });

  if (!containersQuery.data?.containers.length) {
    return <div />;
  }

  const services = groupBy(
    containersQuery.data?.containers,
    (x) => x.serviceName,
  );

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-ml-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200">
            <div className="min-w-full divide-y divide-gray-200 ">
              <div className="bg-gray-50 sticky t-0 flex flex-row px-6 py-3">
                <div className="w-20 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Service
                </div>
                <div className="w-24 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  State
                </div>
                <div className="flex-grow text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Container
                </div>
              </div>
              <div
                className="bg-white divide-y divide-gray-200 overflow-auto"
                style={{ maxHeight: '45vh' }}
              >
                {Object.entries(services).map(([service, containers]) => (
                  <ServiceRow
                    key={service}
                    service={service}
                    containers={containers as any}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
