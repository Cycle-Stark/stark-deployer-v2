import React, { useState } from 'react'
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Code,
    TextInput,
    Divider,
    Grid,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    Tooltip,
    CopyButton,
    useMantineColorScheme,
    useMantineTheme,
    SegmentedControl,
    Tabs,
    ScrollArea,
    Accordion,
} from '@mantine/core'
import { IconCopy, IconExternalLink, IconWorld, IconShare3, IconInfoCircle, IconJson, IconCode, IconAlertTriangle, IconBraces, IconPlugConnected, IconList, IconBolt } from '@tabler/icons-react'
import { IAbiEntry, IContract } from '@/types/contracts'
import { formatAddress } from '@/utils'
import CustomCardWithHeaderAndFooter from '../common/CustomCardWithHeaderAndFooter'
import { CodeHighlight } from '@mantine/code-highlight'
import { modals } from '@mantine/modals'
import RenderAbiEntry from './RenderAbiEntry'
import { Abi, AbiEntry } from 'starknet'

type Props = {
    contract?: Partial<IContract>
    className?: string
}

const dedupeBySignature = (arr: any[]) => {
    const seen = new Map<string, any>()
    arr.forEach((i) => {
        const key = `${(i?.type || '').toLowerCase()}|${renderSignature(i)}`
        if (!seen.has(key)) seen.set(key, i)
    })
    return Array.from(seen.values())
}

// Helpers for ABI rendering
const safeJson = (v: any) => {
    if (!v) return null
    try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return null }
}

const renderSignature = (item: any) => {
    const t = (item?.type || '').toLowerCase()
    if (t === 'function') {
        const name = item?.name || 'anonymous'
        const inputs = (item?.inputs || []).map((i: any) => `${i.name || ''}:${i.type || 'any'}`).join(', ')
        const outputs = (item?.outputs || []).map((o: any) => o.type || 'any').join(', ')
        const mut = item?.state_mutability ? ` ${item.state_mutability}` : ''
        return `${name}(${inputs})${outputs ? ` -> (${outputs})` : ''}${mut}`
    }
    if (t === 'constructor') {
        const inputs = (item?.inputs || []).map((i: any) => `${i.name || ''}:${i.type || 'any'}`).join(', ')
        return `constructor(${inputs})`
    }
    if (t === 'event') {
        return `${item?.name || 'event'}`
    }
    if (t === 'struct') return `${item?.name || 'struct'} { ... }`
    if (t === 'enum') return `${item?.name || 'enum'} <...>`
    if (t === 'interface') return `${item?.name || 'interface'}`
    if (t === 'impl') return `${item?.name || 'impl'}: ${item?.interface_name || ''}`
    return item?.name || t || 'item'
}

const renderIO = (arr: any[] = []) => {
    if (!arr?.length) return <Text c="dimmed">—</Text>
    return (
        <Stack gap={4}>
            {arr.map((i: any, idx: number) => (
                <Group key={idx} gap={6} wrap="wrap">
                    <Code fz="sm">{i.name || '(unnamed)'}</Code>
                    <Text fz="sm" c="dimmed">:</Text>
                    <Code fz="sm">{i.type || i.kind || 'any'}</Code>
                    {i.indexed ? <Badge size="xs" variant="light">indexed</Badge> : null}
                </Group>
            ))}
        </Stack>
    )
}

// Note: IconPuzzle is not imported; alias IconPuzzle to IconBraces to ensure availability
const IconPuzzle = IconBraces

const iconFor = (group: string) => {
    const size = 14
    switch (group) {
        case 'function': return <IconCode size={size} />
        case 'event': return <IconBolt size={size} />
        case 'error': return <IconAlertTriangle size={size} />
        case 'struct': return <IconBraces size={size} />
        case 'interface': return <IconPuzzle size={size} />
        case 'impl': return <IconPlugConnected size={size} />
        case 'enum': return <IconList size={size} />
        case 'constructor': return <IconBraces size={size} />
        default: return <IconJson size={size} />
    }
}

const categorizeAbi = (abiArr: any[] = []) => {
    const cats: Record<string, any[]> = {
        function: [], event: [], error: [], struct: [], interface: [], enum: [], impl: [], constructor: [], other: []
    }
    abiArr.forEach((item: any) => {
        const t = (item?.type || item?.kind || '').toLowerCase()
        if (t in cats) cats[t].push(item)
        else cats.other.push(item)
    })
    // Pull function items from interfaces
    const ifaceItems = cats.interface.flatMap((iface: any) => Array.isArray(iface?.items) ? iface.items : [])
    const ifaceFunctions = ifaceItems.filter((it: any) => (it?.type || '').toLowerCase() === 'function')
    if (ifaceFunctions.length) {
        cats.function = dedupeBySignature([...(cats.function || []), ...ifaceFunctions])
    }
    return cats
}

const shorten = (v?: string, len = 6) => {
    if (!v) return '—'
    if (v.length <= len * 2 + 2) return v
    return `${v.slice(0, len + 2)}…${v.slice(-len)}`
}

const explorerFor = (chain?: string, network?: string, address?: string, txHash?: string) => {
    const ch = (chain || '').toLowerCase()
    const net = (network || '').toLowerCase()
    if (ch.includes('stark')) {
        const base = net.includes('main') ? 'https://starkscan.co' : 'https://testnet.starkscan.co'
        return {
            address: address ? `${base}/contract/${address}` : '#',
            tx: txHash ? `${base}/tx/${txHash}` : '#',
        }
    }
    if (ch.includes('polygon')) {
        const base = net.includes('main') ? 'https://polygonscan.com' : 'https://mumbai.polygonscan.com'
        return {
            address: address ? `${base}/address/${address}` : '#',
            tx: txHash ? `${base}/tx/${txHash}` : '#',
        }
    }
    return { address: '#', tx: '#' }
}

export const StatusBadge = ({ status }: { status?: IContract['status'] }) => {
    const theme = useMantineTheme()
    const colorName = status === 'deployed' ? 'teal' : status === 'failed' ? 'red' : 'yellow'
    const label = status || 'pending'
    const dot = (theme.colors as any)[colorName]?.[5] || theme.colors.gray[5]
    return (
        <Badge variant="light" color={colorName}>
            <Group gap={6} align="center">
                <Box w={8} h={8} style={{ borderRadius: 999, backgroundColor: dot }} />
                <span>{label}</span>
            </Group>
        </Badge>
    )
}

export const MetaBadge = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
    <Badge variant="light" color="gray">
        <Group gap={6} align="center">
            {icon}
            <span>{children}</span>
        </Group>
    </Badge>
)

const InfoCell = ({
    label,
    value,
    copyable = true,
}: {
    label: string
    value?: string
    copyable?: boolean
}) => {
    const has = !!value
    return (
        <Paper withBorder radius="lg" p="md">
            <Text size="xs" c="dimmed">
                {label}
            </Text>
            <Group gap="xs" mt={6} wrap="nowrap" align="center">
                <Code fz="sm" style={{ wordBreak: 'break-all' }}>
                    {value ? formatAddress(value, 10, 6) : '—'}
                </Code>
                {copyable && (
                    <CopyButton value={value || ''} timeout={1200}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                <ActionIcon variant="light" color={copied ? 'teal' : 'gray'} onClick={copy} disabled={!has}>
                                    <IconCopy size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                )}
            </Group>
        </Paper>
    )
}

const QuickContractInfo = ({ contract, className }: Props) => {

    const [activeTab, setActiveTab] = useState('abi');
    const [abiFilter, setAbiFilter] = useState<'all' | 'functions' | 'events' | 'error' | 'structs' | 'interfaces' | 'abi'>('abi')
    const [abiQuery, setAbiQuery] = useState('')

    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'

    const name = contract?.name || 'Contract Name'
    const desc = contract?.description || '—'
    const address = contract?.address || ''
    const deployedAt = contract?.deployedAt ? new Date(contract.deployedAt as any).toLocaleString() : '—'
    const explorer = explorerFor(contract?.chain, contract?.network, contract?.address, contract?.txHash)
    const contractAbi: IAbiEntry[] = JSON.parse(contract?.abi || '')
    const cleanAbi: string = JSON.stringify(contractAbi, (key, value) => {
        if (key === 'callDataItems' || key === 'signature') {
            return undefined;
        }
        return value;
    }, 4)

    const viewCode = (code: string) => modals.open({
        title: 'Code',
        size: "lg",
        centered: true,
        // scrollAreaComponent: ScrollArea.Autosize,
        // removeScrollProps: {

        // },
        radius: "lg",
        // style(theme) {
        //     return {
        //         width: "350px",

        //     }
        // },
        styles: {
            content: {
                padding: 0
            },
            body: {
                height: "calc(100vh - 200px)",
            }
        },
        children: (
            <Box h={"100%"}>
                <ScrollArea h={"100%"}>
                    <CodeHighlight code={JSON.stringify(JSON.parse(code || ''), null, 4) || ''} language="json" />
                </ScrollArea>
            </Box>
        )
    })

    const getAllFunctions = () => {
        const functions = contractAbi.filter((entry) => ['function', 'constructor'].includes(entry.type))
        const interfaces = contractAbi.filter((entry) => entry.type === 'interface')
        return [...functions, ...interfaces.flatMap((entry) => entry.items || [])]
    }

    const contractFunctions = getAllFunctions()
    const contractEvents = contractAbi.filter((entry) => entry.type === 'event')
    const contractStructs = contractAbi.filter((entry) => entry.type === 'struct')
    const contractInterfaces = contractAbi.filter((entry) => entry.type === 'interface')

    return (
        <Paper
            withBorder
            radius="lg"
            p={{ base: 'xs', sm: 'sm' }}
            className={className}
            bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
        >
            <Stack gap="lg">
                <Grid gutter="lg" align="stretch">
                    <Grid.Col span={{ base: 12, lg: 5 }}>
                        <Stack gap={6}>
                            <Group gap={8} wrap="wrap">
                                <StatusBadge status={contract?.status} />
                                <MetaBadge icon={<IconWorld size={14} />}>{contract?.chain || '—'}</MetaBadge>
                                <MetaBadge icon={<IconShare3 size={14} />}>{contract?.network || '—'}</MetaBadge>
                            </Group>
                            <Title order={4} fw={500} style={{ letterSpacing: -0.2 }}>
                                {name}
                            </Title>
                            <Text c="dimmed" size="xs">{desc}</Text>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, lg: 7 }}>
                        <Paper withBorder radius="lg" p="sm" bg={isDark ? theme.colors.dark[7] : theme.white}>
                            <Group gap="md" wrap="nowrap" justify="space-between" align="center">
                                <Stack gap={4} style={{ minWidth: 0 }}>
                                    <Text size="xs" c="dimmed" tt="uppercase">
                                        Contract Address
                                    </Text>
                                    <Group gap="4px" align="center" wrap="nowrap">
                                        <Code fz="sm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '28rem' }}>
                                            {address ? address : '—'}
                                        </Code>
                                        <CopyButton value={address} timeout={1200}>
                                            {({ copied, copy }) => (
                                                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                                    <ActionIcon variant="light" 
                                                    size="lg" radius={"xl"} color={copied ? 'teal' : 'violet'}
                                                     onClick={copy}>
                                                        <IconCopy size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </CopyButton>
                                        <Tooltip label="Explorer">
                                            <ActionIcon
                                                variant="light"
                                                size="lg"
                                                color='violet'
                                                radius={"xl"}
                                                component="a"
                                                target="_blank"
                                                w={"150px"}
                                                href={explorer.address}
                                                children={<IconExternalLink size={14} />}
                                            />
                                        </Tooltip>
                                    </Group>
                                </Stack>

                                <Divider orientation="vertical" h={40} />

                                <Stack gap={4}>
                                    <Text size="sm" c="dimmed" tt="uppercase">
                                        Deployed
                                    </Text>
                                    <Text size="sm">{deployedAt}</Text>
                                </Stack>
                            </Group>
                        </Paper>
                    </Grid.Col>
                </Grid>

                <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <InfoCell label="Deployer Address" value={contract?.deployerAddress} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <InfoCell label="Class Hash" value={contract?.classHash} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <InfoCell label="TX Hash" value={contract?.txHash} />
                    </Grid.Col>
                   
                </Grid>

                <CustomCardWithHeaderAndFooter title='More Details' Icon={IconInfoCircle}>
                    <Stack gap="md">
                        <SegmentedControl
                            radius="xl"
                            size='md'
                            value={activeTab}
                            onChange={setActiveTab}
                            data={[
                                { label: 'ABI', value: 'abi' },
                                ...(contract?.sierra || contract?.casm) ? [{ label: 'Artifacts', value: 'artifacts' }] : [],
                            ]}
                        />
                        <Tabs defaultValue="abi" value={activeTab}>
                            <Tabs.Panel value="abi">
                                <Stack gap="xs">

                                    <SegmentedControl
                                        value={abiFilter}
                                        onChange={(value) => setAbiFilter(value as any)}
                                        data={[
                                            { label: 'ABI', value: 'abi' },
                                            { label: 'Functions', value: 'functions' },
                                            { label: 'Events', value: 'events' },
                                            { label: 'Structs', value: 'structs' },
                                            { label: 'Interfaces', value: 'interfaces' },
                                            { label: 'All', value: 'all' },
                                        ]}
                                        radius={"xl"}
                                        color='violet'
                                        size='md'
                                    />

                                    {
                                        contractAbi.filter((entry) => abiFilter === 'all' || entry.type === abiFilter).map((entry) => (
                                            <RenderAbiEntry key={entry.name} entry={entry} />
                                        ))
                                    }

                                    <Tabs defaultValue="abi" value={abiFilter}>
                                        <Tabs.Panel value="abi">
                                            <Paper withBorder radius="md" p={0}>
                                                <Group justify="space-between" align="center" px="sm" py={8} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                                    <Group gap={8}>
                                                        <IconJson size={16} />
                                                        <Text size="sm" c="dimmed">Raw ABI</Text>
                                                    </Group>
                                                    <CopyButton value={cleanAbi} timeout={1200}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                                                <ActionIcon variant="subtle" onClick={copy} color={copied ? 'teal' : 'gray'}>
                                                                    <IconCopy size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                                <ScrollArea.Autosize mah={320}>
                                                    <CodeHighlight code={cleanAbi} language="json" />
                                                </ScrollArea.Autosize>
                                            </Paper>
                                        </Tabs.Panel>
                                        <Tabs.Panel value="functions">
                                            <Stack gap="xs">
                                                {contractFunctions.length === 0 ? (
                                                    <Text size="sm" c="dimmed">
                                                        —
                                                    </Text>
                                                ) : null}
                                                {
                                                    contractFunctions.map((entry, idx) => (
                                                        <RenderAbiEntry key={`${entry.name}-${idx}`} entry={entry} />
                                                    ))
                                                }
                                            </Stack>
                                        </Tabs.Panel>
                                        <Tabs.Panel value="events">
                                            <Stack gap="xs">
                                                {contractEvents.length === 0 ? (
                                                    <Text size="sm" c="dimmed">
                                                        —
                                                    </Text>
                                                ) : null}
                                                {
                                                    contractEvents.map((entry, idx) => (
                                                        <RenderAbiEntry key={`${entry.name}-${idx}`} entry={entry} />
                                                    ))
                                                }
                                            </Stack>
                                        </Tabs.Panel>
                                        <Tabs.Panel value="structs">
                                            <Stack gap="xs">
                                                {contractStructs.length === 0 ? (
                                                    <Text size="sm" c="dimmed">
                                                        —
                                                    </Text>
                                                ) : null}
                                                {
                                                    contractStructs.map((entry, idx) => (
                                                        <RenderAbiEntry key={`${entry.name}-${idx}`} entry={entry} />
                                                    ))
                                                }
                                            </Stack>
                                        </Tabs.Panel>
                                        <Tabs.Panel value="interfaces">
                                            <Stack gap="xs">
                                                {contractInterfaces.length === 0 ? (
                                                    <Text size="sm" c="dimmed">
                                                        —
                                                    </Text>
                                                ) : null}
                                                {
                                                    contractInterfaces.map((entry, idx) => (
                                                        <RenderAbiEntry key={`${entry.name}-${idx}`} entry={entry} />
                                                    ))
                                                }
                                            </Stack>
                                        </Tabs.Panel>
                                    </Tabs>

                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="artifacts">
                                <Grid>
                                    <Grid.Col span={{ md: 6 }}>
                                        <CustomCardWithHeaderAndFooter title='CASM' Icon={IconJson}>
                                            <Button onClick={() => viewCode(contract?.casm || '')}>View Code</Button>
                                        </CustomCardWithHeaderAndFooter>
                                    </Grid.Col>
                                    <Grid.Col span={{ md: 6 }}>
                                        <CustomCardWithHeaderAndFooter title='SIERRA' Icon={IconJson}>
                                            <Button onClick={() => viewCode(contract?.sierra || '')}>View Code</Button>
                                        </CustomCardWithHeaderAndFooter>
                                    </Grid.Col>
                                </Grid>
                            </Tabs.Panel>
                        </Tabs>
                    </Stack>
                </CustomCardWithHeaderAndFooter>
            </Stack>
        </Paper>
    )
}

export default QuickContractInfo