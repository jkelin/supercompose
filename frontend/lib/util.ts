import { useEffect, useState } from 'react';
import { UseFormMethods } from 'react-hook-form';

function nameFromHost(address: string) {
  return address;
}

export function useDeriveNodeNameFromHost(form: UseFormMethods<any>) {
  const { host, name } = form.watch(['host', 'name']);
  const [prevHost, setPrevHost] = useState(host);
  const [prevName, setPrevName] = useState(name);

  console.warn(host, name);

  useEffect(() => {
    if (prevHost !== host) {
      const prevNameFromPrevAddress = nameFromHost(prevHost);
      const newName = nameFromHost(host);
      if (prevName === prevNameFromPrevAddress && newName !== name) {
        form.setValue('name', newName);
      }
    }

    if (host !== prevHost) {
      setPrevHost(host);
    }
    if (name !== prevName) {
      setPrevName(name);
    }
  }, [host, name, form, form.setValue, prevHost, prevName]);
}
