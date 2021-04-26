import * as Panelbear from '@panelbear/panelbear-js';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { SupercomposeConfig } from './config';

if (typeof document !== 'undefined' && SupercomposeConfig.PANELBEAR_SITE_ID) {
  Panelbear.load(SupercomposeConfig.PANELBEAR_SITE_ID, {
    scriptSrc: '/_panelbear.js',
    analyticsHost: '/_panelbear',
  });

  Panelbear.trackPageview();
}

export const usePanelbear = () => {
  const router = useRouter();

  useEffect(() => {
    if (SupercomposeConfig.PANELBEAR_SITE_ID) {
      // Add on route change handler for client-side navigation
      const handleRouteChange = () => Panelbear.trackPageview();
      router.events.on('routeChangeComplete', handleRouteChange);

      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
  }, [router.events]);
};
