import classNames from 'classnames';
import { ActionButton } from 'components';
import React, { useEffect, useState } from 'react';
import ReactModal, { setAppElement } from 'react-modal';

// TODO this thing is a mess and should be made to properly work with transitions

export const Modal: React.FC<{ isOpen: boolean; onClose: () => unknown }> = (
  props,
) => {
  const [isOpening, setIsOpening] = useState(props.isOpen);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setAppElement(document.getElementById('__next')!);
    }
  });

  return (
    <ReactModal
      isOpen={props.isOpen}
      onAfterOpen={() => {
        setIsOpening(true);
      }}
      // onAfterClose={
      //   () => {
      //     console.warn('onafteclose');
      //   }
      //   /* Function that will be run after the modal has closed. */
      // }
      onRequestClose={
        () => {
          console.warn('request close');
          props.onClose();
          setIsOpening(false);
        }
        /* Function that will be run when the modal is requested
       to be closed (either by clicking on overlay or pressing ESC).
       Note: It is not called if isOpen is changed by other means. */
      }
      closeTimeoutMS={
        200
        /* Number indicating the milliseconds to wait before closing
     the modal. */
      }
      portalClassName={
        classNames(props.isOpen && 'top-0 fixed w-full h-full ')
        /* String className to be applied to the portal.
     See the `Styles` section for more details. */
      }
      style={{
        overlay: {
          backgroundColor: 'rgba(107, 114, 128, 0.75)',
        },
      }}
      overlayClassName={
        'w-full h-full bg-gray-500 flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center block sm:p-0'
        /* String className to be applied to the overlay.
     See the `Styles` section for more details. */
      }
      shouldCloseOnOverlayClick={true}
      className={
        'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-lg sm:w-full'
        /* String className to be applied to the modal content.
     See the `Styles` section for more details. */
      }
      bodyOpenClassName={
        'ReactModal__Body--open'
        /* String className to be applied to the document.body
     (must be a constant string).
     This attribute when set as `null` doesn't add any class
     to document.body.
     See the `Styles` section for more details. */
      }
      htmlOpenClassName={
        'ReactModal__Html--open'
        /* String className to be applied to the document.html
     (must be a constant string).
     This attribute is `null` by default.
     See the `Styles` section for more details. */
      }
      preventScroll={true}
      parentSelector={() => document.body}
      // overlayRef={
      //   setOverlayRef
      //   /* Overlay ref callback. */
      // }
      // contentRef={
      //   setContentRef
      //   /* Content ref callback. */
      // }
      // overlayElement={
      //   (props, contentElement) => <div {...props}>{contentElement}</div>
      //   /* Custom Overlay element. */
      // }
      // contentElement={
      //   (props, children) => <div {...props}>{children}</div>
      //   /* Custom Content element. */
      // }
    >
      {/* <!-- This example requires Tailwind CSS v2.0+ --> */}
      {/* <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"> */}
      {/* <!--
      Background overlay, show/hide based on modal state.

      Entering: "ease-out duration-300"
        From: "opacity-0"
        To: "opacity-100"
      Leaving: "ease-in duration-200"
        From: "opacity-100"
        To: "opacity-0"
    --> */}
      {/* <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div> */}

      {/* <!-- This element is to trick the browser into centering the modal contents. --> */}
      {/* <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span> */}
      {/* <!--
      Modal panel, show/hide based on modal state.

      Entering: "ease-out duration-300"
        From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        To: "opacity-100 translate-y-0 sm:scale-100"
      Leaving: "ease-in duration-200"
        From: "opacity-100 translate-y-0 sm:scale-100"
        To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    --> */}

      {props.children}
      {/* </div> */}
      {/* // </div> */}
    </ReactModal>
  );
};

export const ConfirmationModal: React.FC<{
  title: React.ReactNode;
  kind: 'danger';
  onConfirm: () => unknown;
  confirm: React.ReactNode;
  onClose: () => unknown;
  isOpen: boolean;
}> = (props) => {
  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          {props.kind === 'danger' && (
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              {/* <!-- Heroicon name: outline/exclamation --> */}
              <svg
                className="h-6 w-6 text-red-600"
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}

          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3
              className="text-lg leading-6 font-medium text-gray-900"
              id="modal-headline"
            >
              {props.title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">{props.children}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        {props.kind === 'danger' && (
          <ActionButton onClick={props.onConfirm} kind={'primary-danger'}>
            {props.confirm}
          </ActionButton>
        )}
        <div className="mr-4" />
        <ActionButton onClick={props.onClose} kind="secondary">
          Cancel
        </ActionButton>
      </div>
    </Modal>
  );
};
