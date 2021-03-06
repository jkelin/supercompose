import {
  GetDeploymentConnectionLogsQueryResult,
  ConnectionLog,
  useGetDeploymentConnectionLogsQuery,
  OnConnectionLogDocument,
  ConnectionLogSeverity,
} from 'data';
import { format } from 'date-fns';
import { orderBy, takeRight, takeRightWhile, takeWhile, uniqBy } from 'lodash';
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
import { Spinner } from 'components';

const ConnectionLogRow: React.FC<{
  log: ConnectionLog;
}> = ({ log }) => {
  const when = new Date(log.time);

  return (
    <div className="flex flex-row max-w-full  items-center" role="row">
      <div
        className={classNames(
          'flex-none self-stretch w-2',
          log.severity === ConnectionLogSeverity.Error && 'bg-red-400',
          log.severity === ConnectionLogSeverity.Warning && 'bg-yellow-400',
        )}
      />
      <time
        className="flex-none w-24 py-2 ml-4 text-xs text-gray-500"
        dateTime={when.toISOString()}
      >
        <div className="font-medium">{format(when, 'yyyy-MM-dd')}</div>
        {format(when, 'HH:mm:ss.SSS')}
      </time>
      <span className="flex-shrink py-2 pr-4 text-sm text-gray-900">
        {log.message}
        {log.error && (
          <span className="text-sm text-gray-500 break-all">
            <br />
            {log.error}
            <br />
            {(log.metadata?.find((x) => x.key == 'details') as any)?.value}
          </span>
        )}
      </span>
    </div>
  );
};

// This ugly hack is needed to get the subscription to work even with hot reload
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Adds a new log to a sorted collection of connection logs
function addConnectionLog(
  oldLogs: ConnectionLog[],
  newLog: ConnectionLog,
): ConnectionLog[] {
  const before = takeWhile(
    oldLogs,
    (x) => x.time <= newLog.time && x.id !== newLog.id,
  );
  const after = takeRightWhile(
    oldLogs,
    (x) => x.time > newLog.time && x.id !== newLog.id,
  );

  const outLogs = [...before, newLog, ...after];

  return takeRight(outLogs, 500);
}

export const ConnectionLogs: React.FC<{
  deploymentId: string;
}> = (props) => {
  const listRef = useRef<HTMLDivElement>();
  const connectionLogsQuery = useGetDeploymentConnectionLogsQuery({
    variables: { id: props.deploymentId },
  });

  const [isSubbed, setIsSubbed] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  useIsomorphicLayoutEffect(() => {
    if (
      isSubbed ||
      typeof window === 'undefined' ||
      !connectionLogsQuery ||
      !connectionLogsQuery.subscribeToMore
    ) {
      return;
    }

    connectionLogsQuery.subscribeToMore({
      variables: {
        deploymentId: props.deploymentId,
        after: new Date().toISOString(),
      },
      document: OnConnectionLogDocument,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data || !subscriptionData.data.connectionLogs) {
          return prev;
        }

        const logs = addConnectionLog(
          prev.connectionLogs?.nodes as any,
          subscriptionData.data.connectionLogs as any,
        );

        return {
          ...prev,
          connectionLogs: {
            ...prev.connectionLogs,
            nodes: logs,
          },
        };
      },
    });

    setIsSubbed(true);
  }, [connectionLogsQuery, props.deploymentId, isSubbed]);

  const logs = connectionLogsQuery.data?.connectionLogs?.nodes || [];

  useIsomorphicLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      listRef.current &&
      isScrolledToBottom
    ) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [listRef, logs[logs.length - 1]?.id, isScrolledToBottom]);

  const checkScrolledToBottom = useCallback(() => {
    if (typeof window !== 'undefined' && listRef.current) {
      const height = listRef.current.scrollHeight;
      const scrolled =
        listRef.current.scrollTop +
        listRef.current.clientHeight +
        0.1 * listRef.current.scrollHeight;

      if (scrolled >= height) {
        if (!isScrolledToBottom) {
          setIsScrolledToBottom(true);
        }
      } else {
        if (isScrolledToBottom) {
          setIsScrolledToBottom(false);
        }
      }
    }
  }, [isScrolledToBottom]);

  if (!logs) {
    return (
      <div className="h-32 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-center font-semibold">No relevant logs found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-ml-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full max-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200">
            <div className="min-w-full divide-y divide-gray-200 ">
              <div className="bg-gray-50 sticky t-0 flex flex-row px-6 py-3">
                <div className="w-24 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Time
                </div>
                <div className="flex-grow text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Event
                </div>
              </div>
              <div
                className="bg-white divide-y divide-gray-200 overflow-auto"
                style={{ maxHeight: '45vh' }}
                ref={listRef as any}
                onScroll={() => checkScrolledToBottom()}
              >
                {logs &&
                  logs.map((x) => <ConnectionLogRow key={x.id} log={x} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
