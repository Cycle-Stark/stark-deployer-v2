import { useSettings } from '@/hooks/useSettings'
import { useLogs } from '@/hooks/useLogs'
import { ISysLog, LogLevel } from '@/types'
import { Stack, Group, Button, ScrollArea, Badge, Text, useMantineColorScheme, useMantineTheme, useComputedColorScheme, Box, Spoiler } from '@mantine/core'
import { useColorScheme, useHover } from '@mantine/hooks'
import { IconTerminal } from '@tabler/icons-react'
import React, { useRef, useEffect } from 'react'
import { modals } from '@mantine/modals'

const SysLog = ({ log }: { log: ISysLog }) => {
    const getBadgeColor = (level: LogLevel) => {
        switch (level) {
            case LogLevel.INFO: return '';
            case LogLevel.SUCCESS: return 'green';
            case LogLevel.ERROR: return 'red';
            case LogLevel.WARNING: return 'yellow';
            case LogLevel.PENDING: return 'orange';
            default: return 'gray';
        }
    };

    const badgeColor = getBadgeColor(log.level);
    const { hovered, ref } = useHover()

    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'
    const theme = useMantineTheme()

    return (
        <Group
            ref={ref}
            gap="xs"
            wrap="nowrap"
            align="flex-start"
            style={{
                fontFamily: 'monospace',
                border: '1px solid',
                borderColor: isDark ? theme.colors.dark[6] : theme.colors.gray[2],
                borderRadius: theme.radius.md,
                transition: 'background-color 0.2s ease',
                cursor: 'pointer',
                ...(hovered && {
                    backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[1],
                    borderColor: isDark ? theme.colors.dark[5] : theme.colors.gray[2],
                })
            }}
            p={"xs"}
        >
            <Text size="xs" c="dimmed" style={{ minWidth: '90px' }}>
                {log.timestamp}
            </Text>
            <Badge
                size="sm"
                color={badgeColor}
                variant="dot"
                radius={"sm"}
                ta={"center"}
                styles={{
                    label: {
                        textAlign: "center",
                        fontWeight: 400,
                        textTransform: "uppercase",
                    }
                }}
                miw={"80px"}
                w={"80px"}
                maw={"80px"}
            >
                {log.level}
            </Badge>
            {/* <Text size="xs" c={badgeColor} style={{
                flex: 1,
                wordBreak: 'break-word',
                fontFamily: 'JetBrains Mono',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
            }}>
                {log.message}
            </Text> */}
            <Spoiler maxHeight={120} styles={{
                control: {
                    fontSize: "12px",
                    color: theme.colors.violet[6]
                }
            }} showLabel="Show more" hideLabel="Hide">
                <Text size="xs" c={badgeColor} style={{
                    flex: 1,
                    wordBreak: 'break-word',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                }}>
                    {typeof log.message === 'string' ? log.message : String(log.message)}
                </Text>
            </Spoiler>
        </Group>
    )
}

const SystemLogs = () => {
    const { toggleLogsVisibility } = useSettings()
    const { logs, clearLogs, isLoading } = useLogs()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'
    const theme = useMantineTheme()

    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (scrollRef.current && logs.length > 0) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs])

    const handleClearLogs = () => modals.openConfirmModal({
        title: 'Clear logs',
        centered: true,
        radius: "lg",
        children: <Text size="sm">Are you sure you want to clear all logs?</Text>,
        labels: { confirm: 'Clear', cancel: 'Cancel' },
        confirmProps: {
            color: "red",
            radius: "md",
        },
        cancelProps: {
            radius: "md",
        },
        onCancel: () => { },
        onConfirm: () => clearLogs(),
    })

    return (
        <Stack h="100%" gap={"sm"} style={{
            border: "1px solid",
            borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[2],
            borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
            overflow: "hidden",
            zIndex: 2,
        }} pb={"lg"}>
            <Group p={"xs"} justify="space-between"
                bg={isDark ? theme.colors.dark[8] : theme.colors.gray[2]}
            >
                <Group gap={"xs"}>
                    <IconTerminal size={24} />
                    <Text size='sm'>Logs</Text>
                </Group>
                <Group gap={"4px"}>
                    <Button size='xs' variant='default' radius={"md"} onClick={toggleLogsVisibility}>Hide</Button>
                    <Button size='xs' variant='default' c='red' radius={"md"} onClick={handleClearLogs}>Clear</Button>
                </Group>
            </Group>
            <ScrollArea h="calc(100% - 40px)">
                <Stack gap="2px" px={"xs"}>
                    {isLoading ? (
                        <Text size="xs" c="dimmed" ta="center" py="md">Loading logs...</Text>
                    ) : logs.length === 0 ? (
                        <Text size="xs" c="dimmed" ta="center" py="md">No logs available</Text>
                    ) : (
                        logs.map((log) => (
                            <SysLog key={log.id || Math.random()} log={log} />
                        ))
                    )}
                </Stack>
                <Box h={"10px"} ref={scrollRef} />
            </ScrollArea>
        </Stack>
    )
}

export default SystemLogs