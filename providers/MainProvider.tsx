import React from 'react'
import { MantineColorScheme, MantineProvider } from '@mantine/core'
import { theme } from '../theme'
import { CustomColorSchemeManager } from '@/components/ColorSchemeToggle/CustomColorSchemeManager'
import { THEME_COOKIE_NAME } from '@/constants'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import AppProvider from './AppProvider'

import { CodeHighlightAdapterProvider, createShikiAdapter } from '@mantine/code-highlight';
import ts from '@shikijs/langs/typescript'

// Shiki requires async code to load the highlighter
async function loadShiki() {
    const { createHighlighter } = await import('shiki');
    const shiki = await createHighlighter({
        langs: ['tsx', 'scss', 'html', 'bash', 'json', 'ts'],
        // You can load supported themes here
        themes: [],
    });

    return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);

interface MainProviderProps {
    children: React.ReactNode;
    colorScheme: MantineColorScheme;
}

const MainProvider = ({ children, colorScheme }: MainProviderProps) => {
    return (
        <MantineProvider
            theme={theme}
            colorSchemeManager={CustomColorSchemeManager({ key: THEME_COOKIE_NAME })}
            defaultColorScheme={colorScheme}
        >
            <ModalsProvider modalProps={{
                overlayProps: {
                    blur: 10,
                    opacity: 0.5,
                }
            }}>
                <Notifications />
                <AppProvider>
                    <CodeHighlightAdapterProvider adapter={shikiAdapter}>
                        {children}
                    </CodeHighlightAdapterProvider>
                </AppProvider>
            </ModalsProvider>
        </MantineProvider>
    )
}

export default MainProvider