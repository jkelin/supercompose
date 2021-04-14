import classnames from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';

const DropdownContext = React.createContext<{
  setOpen: (val: boolean) => unknown;
  isOpen: boolean;
  id: string;
}>(undefined as any);

export const Dropdown: React.FC<{ id: string }> = (props) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <DropdownContext.Provider
      value={useMemo(() => ({ isOpen, setOpen, id: props.id }), [
        isOpen,
        setOpen,
        props,
      ])}
    >
      {props.children}
    </DropdownContext.Provider>
  );
};

export const DropdownButton: React.FC<{ className: string }> = (props) => {
  const ctx = useContext(DropdownContext);

  return (
    <button
      type="button"
      className={props.className}
      onClick={useCallback(() => ctx.setOpen(true), [ctx])}
      id={ctx.id}
      aria-haspopup="true"
    >
      <span className="sr-only">Open dropdown</span>
      {props.children}
    </button>
  );
};

export const DropdownMenu: React.FC<{ className?: string }> = (props) => {
  const ctx = useContext(DropdownContext);
  const onClose = useCallback(() => ctx.setOpen(false), [ctx]);

  return (
    <>
      {ctx.isOpen && (
        <button
          type="button"
          className="fixed left-0 top-0 w-screen h-screen opacity-0"
          onClick={onClose}
        >
          <span className="sr-only">Close dropdown</span>
        </button>
      )}
      <div
        className={classnames(
          'origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5',
          ctx.isOpen
            ? 'transform opacity-100 scale-100'
            : 'transform opacity-0 scale-95',
          ctx.isOpen
            ? 'transition ease-out duration-100'
            : 'transition ease-in duration-75',
          props.className,
        )}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby={ctx.id}
      >
        {props.children}
      </div>
    </>
  );
};
