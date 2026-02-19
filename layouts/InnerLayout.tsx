import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Button, em, Stack, Transition, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { useSettings } from '../hooks/useSettings'
import { IconGripHorizontal, IconTerminal } from '@tabler/icons-react'
import SystemLogs from '@/components/common/SystemLogs'
import { useColorScheme } from '@mantine/hooks'

const InnerLayout = ({ children, showLogsButton = true }: { children: React.ReactNode, showLogsButton?: boolean }) => {
    const { areLogsVisible, toggleLogsVisibility } = useSettings()

    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'

    return (
        <Stack h={'100%'} pos="relative" pb={showLogsButton ? "40px" : "40px"}>
            <PanelGroup direction="vertical" autoSaveId={"inner-layout"}>
                <Panel defaultSize={70} minSize={10} maxSize={85}>
                    {children}
                </Panel>
                {
                    (areLogsVisible && showLogsButton) ? (
                        <>
                            <PanelResizeHandle
                                style={{
                                    backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-2)',
                                    cursor: 'row-resize',
                                    borderRadius: '2px',
                                    margin: '4px 0',
                                    transition: 'background-color 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <IconGripHorizontal stroke={em(1)} size={"16px"} color={isDark ? "white" : "black"} />
                            </PanelResizeHandle>
                            <Panel defaultSize={30} minSize={10} maxSize={85}>
                                <SystemLogs />
                            </Panel>
                        </>
                    ) : null
                }
            </PanelGroup>
            {
                (!areLogsVisible && showLogsButton) ? (
                    <div style={{ position: 'absolute', right: 10, bottom: 40, zIndex: 100 }}>
                        <Button size='xs'
                            variant="light"
                            onClick={toggleLogsVisibility}
                            leftSection={<IconTerminal stroke={em(1)} size={"16px"} color={isDark ? "white" : "black"} />}
                            color='violet'
                            radius={"sm"}
                        >
                            Show Logs
                        </Button>
                    </div>
                ) : null
            }
        </Stack>
    )
}

export default InnerLayout