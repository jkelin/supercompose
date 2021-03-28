import getConfig from 'next/config';

export const SupercomposeConfig: {
  BACKEND_URI: string;
} = getConfig().publicRuntimeConfig;
