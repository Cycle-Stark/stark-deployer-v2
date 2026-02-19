// import '@mantine/core/styles.css';
import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';

import '@mantine/code-highlight/styles.css';
import 'mantine-datatable/styles.layer.css';
import '@mantine/charts/styles.css';
import '../styles/layout.css';

import type { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import { MantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';
import { siteSettingsManager } from '../storage/siteSettings';
import { getCookie } from 'cookies-next'
import { THEME_COOKIE_NAME } from '@/constants';
import MainProvider from '@/providers/MainProvider';
import { logsManager } from '@/storage/logsDatabase';

type ComponentWithPageLayout = AppProps & {
  Component: AppProps["Component"] & {
    PageLayout?: React.ComponentType<{ children: React.ReactNode }>,
  },
  colorScheme: MantineColorScheme,
  user: any,
  loginStatus: any,
}

export default function App({ Component, pageProps, colorScheme, ...rest }: ComponentWithPageLayout) {

  // Initialize settings on mount (separate from liveQuery)
  useEffect(() => {
    siteSettingsManager.initialize();
  }, []);

  // Initialize with some sample logs on first load
    useEffect(() => {
      const initializeLogs = async () => {
        const count = await logsManager.getCount();
        if (count === 0) {
          // Add some initial sample logs
          await logsManager.logInfo("Logs initialized");
        }
      };
      
      initializeLogs();
    }, []);

  return (
    <MainProvider colorScheme={colorScheme}>
      <Head>
        <title>Contract Deployer</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@300;400;500&amp;display=swap" rel="stylesheet" />
      </Head>
      {/* <Component {...pageProps} /> */}
      {
        Component.PageLayout ? (
          <Component.PageLayout>
            <Component {...pageProps} />
          </Component.PageLayout>
        ) : (
          <Component {...pageProps} />
        )
      }
    </MainProvider>
  );
}


App.getInitialProps = async (appContext: AppContext) => {
  // const appProps = await appContext.ctx(appContext);
  return {
    // ...appProps,
    colorScheme: await getCookie(THEME_COOKIE_NAME, appContext.ctx) || 'dark',
    // user: getCookie(LOCAL_STORAGE_KEYS.user, appContext.ctx) || null,
    // loginStatus: getCookie(LOCAL_STORAGE_KEYS.login_status, appContext.ctx) || false,
  };
};