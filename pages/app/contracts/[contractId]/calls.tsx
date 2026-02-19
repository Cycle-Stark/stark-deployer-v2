import CustomCardWithHeaderAndFooter from '@/components/common/CustomCardWithHeaderAndFooter'
import ContractLayoutWithProvider from '@/layouts/ContractLayout'
import InnerLayout from '@/layouts/InnerLayout'
import {
    Box,
    ScrollArea,
    Badge,
    Group,
    Text,
    ActionIcon,
    Tooltip,
    Button,
    TextInput,
    Select,
    Stack,
    Code,
    Modal,
    useMantineTheme,
    useMantineColorScheme,
    ScrollAreaAutosize
} from '@mantine/core'
import {
    IconActivity,
    IconExternalLink,
    IconSearch,
    IconEye,
    IconSend,
    IconCopy,
    IconCode
} from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import { DataTable } from 'mantine-datatable'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { IContractInteraction } from '@/types/contracts'
import { contractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { useDisclosure } from '@mantine/hooks'
import { CodeHighlight } from '@mantine/code-highlight'
import { formatAddress } from '@/utils'
import { formatTimestamp } from '@/components/utils'
import TransactionResultsAccordion from '@/components/contracts/TransactionResultsAccordion'


const AllContractCalls = () => {
    const router = useRouter()
    const { contractId } = router.query
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'

    const [pageSize, setPageSize] = useState(15)

    const [page, setPage] = useState(1)
    const [records, setRecords] = useState<IContractInteraction[]>([])
    const [allInteractions, setAllInteractions] = useState<IContractInteraction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [selectedInteraction, setSelectedInteraction] = useState<IContractInteraction | null>(null)
    const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false)

    // Load interactions data
    useEffect(() => {
        const loadInteractions = async () => {
            if (!contractId || typeof contractId !== 'string') return

            setLoading(true)
            try {
                const interactions = await contractInteractionsManager.getByContractId(parseInt(contractId))
                setAllInteractions(interactions)
            } catch (error) {
                console.error('Failed to load interactions:', error)
            } finally {
                setLoading(false)
            }
        }

        loadInteractions()
    }, [contractId])

    // Filter and paginate data
    useEffect(() => {
        let filtered = allInteractions.filter(interaction => {
            const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter
            const matchesType = typeFilter === 'all' || interaction.functionType === typeFilter
            const matchesSearch = !searchQuery ||
                interaction.functionName.toLowerCase().includes(searchQuery.toLowerCase())

            return matchesStatus && matchesType && matchesSearch
        })

        const from = (page - 1) * pageSize
        const to = from + pageSize
        setRecords(filtered.slice(from, to))
    }, [allInteractions, page, searchQuery, statusFilter, typeFilter])

    useEffect(() => {
        setPage(1)
    }, [typeFilter, statusFilter, searchQuery])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'teal'
            case 'failed': return 'red'
            case 'reverted': return 'orange'
            case 'pending': return 'yellow'
            default: return 'gray'
        }
    }

    const getTypeColor = (type: string) => {
        return type === 'write' ? 'blue' : 'cyan'
    }

    const explorerUrl = (txHash?: string) => {
        if (!txHash) return '#'
        return `https://starkscan.co/tx/${txHash}`
    }

    const handleViewDetails = (interaction: IContractInteraction) => {
        setSelectedInteraction(interaction)
        openDetails()
    }

    const filteredTotal = allInteractions.filter(interaction => {
        const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter
        const matchesType = typeFilter === 'all' || interaction.functionType === typeFilter
        const matchesSearch = !searchQuery ||
            interaction.functionName.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesType && matchesSearch
    }).length

    const RADIUS = "md"

    return (
        <InnerLayout>
            <ScrollArea scrollbars="y" offsetScrollbars p="md" h="100%">
                <CustomCardWithHeaderAndFooter
                    title="Function Calls & Invocations"
                    Icon={IconActivity}
                    subtitle='All interactions with this contract'
                >
                    <Stack gap="md">
                        {/* Filters */}
                        <Group gap="xs" align="end">
                            <TextInput
                                placeholder="Search functions..."
                                leftSection={<IconSearch size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ flex: 1 }}
                                radius={RADIUS}
                            />
                            <Select
                                placeholder="Status"
                                data={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'success', label: 'Success' },
                                    { value: 'failed', label: 'Failed' },
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'reverted', label: 'Reverted' },
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value || 'all')}
                                w={140}
                                radius={RADIUS}
                            />
                            <Select
                                placeholder="Type"
                                data={[
                                    { value: 'all', label: 'All Types' },
                                    { value: 'read', label: 'Read' },
                                    { value: 'write', label: 'Write' },
                                ]}
                                value={typeFilter}
                                onChange={(value) => setTypeFilter(value || 'all')}
                                w={120}
                                radius={RADIUS}
                            />
                        </Group>

                        {/* Data Table */}
                        <DataTable
                            borderRadius={theme.radius.lg}
                            height={500}
                            withTableBorder
                            withColumnBorders
                            striped
                            highlightOnHover
                            records={records}
                            fetching={loading}
                            columns={[
                                {
                                    accessor: 'id',
                                    title: '# ID',
                                    width: 80,
                                    render: ({ id }) => (
                                        <Text size="sm" fw={500}>{id}</Text>
                                    )
                                },
                                {
                                    accessor: 'functionName',
                                    title: 'Function',
                                    width: 200,
                                    render: ({ functionName, functionType }) => (
                                        <Group gap={6} wrap="nowrap">
                                            <Text size="sm" fw={500} truncate>
                                                {functionName}
                                            </Text>
                                            <Badge
                                                size="xs"
                                                color={getTypeColor(functionType)}
                                                variant="light"
                                            >
                                                {functionType}
                                            </Badge>
                                        </Group>
                                    )
                                },
                                {
                                    accessor: 'timestamp',
                                    title: 'Date & Time',
                                    width: 160,
                                    render: ({ timestamp }) => (
                                        <Stack gap={2}>
                                            <Text size="sm">
                                                {dayjs(timestamp).format('MMM D, YYYY')}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {dayjs(timestamp).format('HH:mm:ss')}
                                            </Text>
                                        </Stack>
                                    )
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    width: 100,
                                    render: ({ status }) => (
                                        <Badge
                                            size="sm"
                                            color={getStatusColor(status)}
                                            variant="light"
                                        >
                                            {status.toUpperCase()}
                                        </Badge>
                                    )
                                },
                                {
                                    accessor: 'transactionHash',
                                    title: 'Tx Hash',
                                    width: 120,
                                    render: ({ transactionHash }) => (
                                        transactionHash ? (
                                            <Group gap={4} wrap="nowrap">
                                                <Text size="xs" style={{ maxWidth: 80 }}>
                                                    {formatAddress(transactionHash, 6, 4)}
                                                </Text>
                                                <Tooltip label="View on Explorer">
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="light"
                                                        component="a"
                                                        href={explorerUrl(transactionHash)}
                                                        target="_blank"
                                                    >
                                                        <IconExternalLink size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        ) : (
                                            <Text size="xs" c="dimmed">—</Text>
                                        )
                                    )
                                },
                                {
                                    accessor: 'gasUsed',
                                    title: 'Gas Used',
                                    width: 100,
                                    render: ({ gasUsed }) => (
                                        gasUsed ? (
                                            <Text size="sm" ff="monospace">
                                                {parseInt(gasUsed).toLocaleString()}
                                            </Text>
                                        ) : (
                                            <Text size="xs" c="dimmed">—</Text>
                                        )
                                    )
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    width: 100,
                                    render: (interaction) => (
                                        <Group gap={4} wrap="nowrap">
                                            <Tooltip label="View Details">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => handleViewDetails(interaction)}
                                                >
                                                    <IconEye size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    )
                                }
                            ]}
                            totalRecords={filteredTotal}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            paginationText={({ from, to, totalRecords }) =>
                                `Records ${from} - ${to} of ${totalRecords}`
                            }
                            recordsPerPageOptions={[10, 15, 20]}
                            onRecordsPerPageChange={setPageSize}
                            noRecordsText="No interactions found"
                            loadingText="Loading interactions..."
                        />
                    </Stack>
                </CustomCardWithHeaderAndFooter>

                {/* Details Modal */}
                <Modal
                    opened={detailsOpened}
                    onClose={closeDetails}
                    title={
                        <Group gap="xs">
                            <IconCode size={20} />
                            <Text fw={400}>{`Interaction Details - ${selectedInteraction?.functionName}`}</Text>
                        </Group>
                    }
                    size="lg"
                    centered
                    radius={"lg"}
                >
                    {selectedInteraction && (
                        <Stack>
                            <Group>
                                <Text size="sm" fw={500}>Type:</Text>
                                <Text size="sm" tt="capitalize" c={selectedInteraction.functionType === 'read' ? 'blue' : 'orange'}>
                                    {selectedInteraction.functionType}
                                </Text>
                            </Group>

                            <Group>
                                <Text size="sm" fw={500}>Status:</Text>
                                <Text size="sm" tt="capitalize" c={getStatusColor(selectedInteraction.status)}>
                                    {selectedInteraction.status}
                                </Text>
                            </Group>

                            <Group>
                                <Text size="sm" fw={500}>Executed At:</Text>
                                <Text size="sm">
                                    {formatTimestamp(selectedInteraction.timestamp)}
                                </Text>
                            </Group>

                            {selectedInteraction.errorMessage && (
                                <Group>
                                    <Text size="sm" fw={500}>Error:</Text>
                                    <Text size="sm" c="red">
                                        {selectedInteraction.errorMessage}
                                    </Text>
                                </Group>
                            )}

                            <TransactionResultsAccordion
                                data={{
                                    result: selectedInteraction.response,
                                    transactionHash: selectedInteraction.transactionHash,
                                    receipt: selectedInteraction.response,
                                    events: selectedInteraction.events || [],
                                    transactionStatus: selectedInteraction.status === 'success'
                                        ? (selectedInteraction.functionType === 'read' ? 'Call Successful' : 'Transaction Successful')
                                        : selectedInteraction.status === 'failed'
                                            ? 'Transaction Failed'
                                            : selectedInteraction.status === 'reverted'
                                                ? 'Transaction Reverted'
                                                : 'Transaction Pending'
                                }}
                            />
                        </Stack>
                    )}
                </Modal>
            </ScrollArea>
        </InnerLayout>
    )
}

AllContractCalls.PageLayout = ContractLayoutWithProvider
export default AllContractCalls
