import { GetDeploymentConnectionLogsQueryResult, ConnectionLog } from 'data';
import { format } from 'date-fns';
import { orderBy } from 'lodash';

const ConnectionLogRow: React.FC<{
  log: ConnectionLog;
}> = ({ log }) => {
  const when = new Date(log.time);

  return (
    <tr>
      <td className="pl-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {log.severity}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(when, 'yyyy-MM-dd')}
        <br />
        {format(when, 'HH:mm:ss.SSS')}
      </td>
      <td className="pr-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {log.message}
        {log.error && (
          <span className="text-sm text-gray-500">
            <br />
            {log.error}
          </span>
        )}
      </td>
    </tr>
  );
};

export const ConnectionLogs: React.FC<{
  connectionLogsQuery: GetDeploymentConnectionLogsQueryResult;
}> = (props) => {
  const logs = orderBy(
    props.connectionLogsQuery.data?.connectionLogs,
    ['time', 'id'],
    ['asc', 'desc'],
  );

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-ml-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200">
            <table
              className="min-w-full divide-y divide-gray-200 block overflow-auto"
              style={{ maxHeight: '50vh' }}
            >
              <thead className="bg-gray-50 sticky t-0">
                <tr>
                  <th
                    scope="col"
                    className="pl-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Severity
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="pr-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Event
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs &&
                  logs.map((x) => <ConnectionLogRow key={x.id} log={x} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
