import classNames from 'classnames';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { v4 } from 'uuid';

interface Toast {
  id?: string;
  kind: 'success' | 'error';
  title: React.ReactNode;
  message?: React.ReactNode;
  timeout?: number;
  onClose: () => unknown;
}

const ToastContext = createContext<
  (toast: Omit<Toast, 'id' | 'onClose'>) => Promise<unknown>
>(undefined as any);

const Toast: React.FC<{ toast: Toast }> = (props) => {
  return (
    <div className="pointer-events-auto flex-shrink-0 mx-4 mt-2 mb-4 w-32 w-96 bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {props.toast.kind === 'success' && (
              <svg
                className="h-6 w-6 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {props.toast.kind === 'error' && (
              <svg
                className="h-6 w-6 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {props.toast.title}
            </p>
            {props.toast.message && (
              <p className="mt-1 text-sm text-gray-500">
                {props.toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={props.toast.onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function useToast() {
  return useContext(ToastContext);
}

export function globalCreateToast(
  toast: Omit<Toast, 'id' | 'onClose'>,
): boolean {
  if (typeof window !== 'undefined' && (window as any).createToast) {
    (window as any).createToast(toast);
    return true;
  }

  return false;
}

function toastTimeoutFromContents(toast: Toast) {
  if (
    typeof toast.title === 'string' &&
    (!toast.message || typeof toast.message === 'string')
  ) {
    const totalText = toast.title + (toast.message || '');

    return totalText.length * (toast.kind === 'success' ? 40 : 60);
  }

  return toast.kind === 'success' ? 1000 : 3000;
}

export const ToastProvider: React.FC<{}> = (props) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const createToast = useCallback(
    async (toast) => {
      const typedToast = toast as Toast;
      typedToast.id = v4();
      typedToast.onClose = () =>
        setToasts((toasts) => toasts.filter((x) => x !== toast));

      setToasts((toasts) => toasts.concat(typedToast));
      await new Promise((resolve) =>
        setTimeout(resolve, toast.timeout || toastTimeoutFromContents(toast)),
      );
      typedToast.onClose();
    },
    [setToasts],
  );

  // const [i, setI] = useState(0);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     createToast({
  //       kind: 'success',
  //       title: 'Saved',
  //       message: 'Hello world ' + i,
  //       timeout: 100000,
  //     });
  //     setI(i + 1);
  //   }, 200);
  //   return () => clearInterval(interval);
  // }, [i, createToast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).createToast = createToast;
    }
  }, [createToast]);

  return (
    <ToastContext.Provider value={createToast}>
      <div className="overflow-hidden fixed relative pointer-events-none z-50">
        <div className="fixed top-0 right-0 max-w-screen w-screen max-h-screen h-screen flex flex-col items-end">
          <div className="mt-20" />
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </div>
      </div>
      {props.children}
    </ToastContext.Provider>
  );
};
