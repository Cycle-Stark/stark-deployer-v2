import {
    isMantineColorScheme,
    MantineColorScheme,
    MantineColorSchemeManager,
  } from '@mantine/core';
  import { getCookie, setCookie, deleteCookie } from 'cookies-next';
  
  export interface NextCookieColorSchemeManagerOptions {
    /** Cookie key used to retrieve value with `parseCookies({req}).key`, `mantine-color-scheme` by default */
    key?: string;
  }
  
  export function CustomColorSchemeManager({
    key = 'mantine-color-scheme',
  }: NextCookieColorSchemeManagerOptions = {}): MantineColorSchemeManager {
    let handleCookieChange: (event: Event) => void;
  
    return {
      get: (defaultValue) => {
        if (typeof window === 'undefined') {
          return defaultValue;
        }
  
        try {
          const scheme = getCookie(key);
          return (scheme as MantineColorScheme) || defaultValue;
        } catch {
          return defaultValue;
        }
      },
  
      set: (value) => {
        try {
          setCookie(key, value);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            '[@mantine/core] Next-cookie color scheme manager was unable to save color scheme.',
            error
          );
        }
      },
  
      subscribe: (onUpdate) => {
        handleCookieChange = (event) => {
          if (event instanceof Event && event.type === 'cookieChange') {
            const scheme = getCookie(key);
            isMantineColorScheme(scheme) && onUpdate(scheme);
          }
        };
  
        window.addEventListener('cookieChange', handleCookieChange);
      },
  
      unsubscribe: () => {
        window.removeEventListener('cookieChange', handleCookieChange);
      },
  
      clear: () => {
        deleteCookie(key);
      },
    };
  }
  