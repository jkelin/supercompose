import React, { useState, useEffect } from 'react';
import { UseFormMethods } from 'react-hook-form';
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';

export const YamlEditorField: React.FC<{
  onChange: (value: string) => void;
  value: string;
}> = (props) => {
  return (
    <Editor
      theme="vs-dark"
      className="border"
      path="docker-compose.yaml"
      value={props.value}
      onChange={(x) => props.onChange(x!)}
      height="45vh"
      language="yaml"
      options={{ formatOnPaste: true, insertSpaces: true, tabSize: 2 }}
    />
  );
};

export const defaultComposeYaml = `version: "3.9"
services:
  redis:
    image: redis
    ports:
      - "6379:6379"
  postgres:
    image: postgres
    ports:
      - "5432:5432"
`;

export function directoryFromName(name: string) {
  return (
    '/opt/docker/' + name.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-')
  );
}

export function useDeriveDirectoryFromName(form: UseFormMethods<any>) {
  const { name, directory } = form.watch(['name', 'directory']);
  const [prevName, setPrevName] = useState(name);
  const [prevDirectory, setPrevDirectory] = useState(directory);

  useEffect(() => {
    if (prevName !== name) {
      const prevDirectoryFromPrevName = directoryFromName(prevName);
      const newDirectory = directoryFromName(name);
      if (
        prevDirectory === prevDirectoryFromPrevName &&
        newDirectory !== directory
      ) {
        form.setValue('directory', newDirectory);
      }
    }

    if (name !== prevName) {
      setPrevName(name);
    }
    if (directory !== prevDirectory) {
      setPrevDirectory(directory);
    }
  }, [name, directory, form, form.setValue, prevName, prevDirectory]);
}
