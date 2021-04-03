import React, { useContext, useMemo, useState } from 'react';
import classNames from 'classnames';

const tabCtx = React.createContext<{
  selectedTab?: string;
  changeTab: (value?: string) => unknown;
}>({ changeTab: () => undefined });

export const TabContainer: React.FC<{ default: string }> = (props) => {
  const [active, setActiveTab] = useState<string | undefined>(props.default);

  const ctx = useMemo(
    () => ({ selectedTab: active, changeTab: (x?: string) => setActiveTab(x) }),
    [active, setActiveTab],
  );

  return <tabCtx.Provider value={ctx}>{props.children}</tabCtx.Provider>;
};

export const TabList: React.FC<{}> = (props) => {
  return (
    <div className="flex flex-row space-x-4 h-12" role="tablist">
      {props.children}
    </div>
  );
};

export const Tab: React.FC<{ id: string }> = (props) => {
  const ctx = useContext(tabCtx);
  const isSelected = ctx.selectedTab === props.id;

  return (
    <button
      type="button"
      onClick={() => ctx.changeTab(props.id)}
      role="tab"
      aria-selected={isSelected}
      aria-controls={props.id}
      className={classNames(
        'border-indigo-500 text-gray-900 inline-flex items-center px-6 pt-1 text-sm font-medium focus:outline-none',
        isSelected && 'border-b-2',
      )}
      style={(!isSelected && { paddingBottom: 2 }) || undefined}
    >
      {props.children}
    </button>
  );
};

export const TabPanel: React.FC<{ id: string }> = (props) => {
  const ctx = useContext(tabCtx);
  const isSelected = ctx.selectedTab === props.id;

  return (
    <div
      role="tabpanel"
      aria-labelledby={props.id}
      className={classNames(isSelected ? 'block' : 'hidden')}
    >
      {props.children}
    </div>
  );
};
