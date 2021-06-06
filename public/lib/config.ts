import getConfig from 'next/config';

export const SupercomposeConfig: {
  BACKEND_URI: string;
  PANELBEAR_SITE_ID?: string;
} = getConfig().publicRuntimeConfig;
