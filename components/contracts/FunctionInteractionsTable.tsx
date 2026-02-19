import React, { useEffect, useState, useMemo } from 'react'
import { ActionIcon, Group, Modal, ScrollArea, Stack, Text, Tooltip, useMantineTheme, TextInput, Select } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { DataTable } from 'mantine-datatable'
import { IconEye, IconSearch } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { ContractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { IContractInteraction } from '@/types/contracts'
import TransactionResultsAccordion from './TransactionResultsAccordion'
import { useLiveQuery } from 'dexie-react-hooks'
import { formatTimestamp } from '../utils'

interface FunctionInteractionsTableProps {
    contractId: number
    functionName: string
}

const FunctionInteractionsTable: React.FC<FunctionInteractionsTableProps> = ({
    contractId,
    functionName
}) => {
    const [selectedInteraction, setSelectedInteraction] = useState<IContractInteraction | null>(null)
    const [opened, { open, close }] = useDisclosure(false)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'
    const theme = useMantineTheme()

    // Use live query to watch for real-time changes
    const allInteractions = useLiveQuery(
        async () => {
            const interactionsManager = ContractInteractionsManager.getInstance()
            return await interactionsManager.getByFunction(contractId, functionName)
        },
        [contractId, functionName],
        []
    )

    // Filter and paginate data
    const { filteredInteractions, paginatedInteractions, totalFiltered } = useMemo(() => {
        if (!allInteractions) return { filteredInteractions: [], paginatedInteractions: [], totalFiltered: 0 }

        const filtered = allInteractions.filter(interaction => {
            const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter
            const matchesSearch = !searchQuery ||
                interaction.functionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (interaction.transactionHash && interaction.transactionHash.toLowerCase().includes(searchQuery.toLowerCase()))

            return matchesStatus && matchesSearch
        })

        const from = (page - 1) * pageSize
        const to = from + pageSize
        const paginated = filtered.slice(from, to)

        return {
            filteredInteractions: filtered,
            paginatedInteractions: paginated,
            totalFiltered: filtered.length
        }
    }, [allInteractions, page, pageSize, searchQuery, statusFilter])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchQuery, statusFilter])

    const handleViewInteraction = (interaction: IContractInteraction) => {
        setSelectedInteraction(interaction)
        open()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'green'
            case 'failed':
            case 'reverted':
                return 'red'
            case 'pending':
                return 'blue'
            default:
                return 'gray'
        }
    }

    return (
        <>
            <Stack gap="md">
                {/* Filters */}
                <Group gap="xs" align="end">
                    <TextInput
                        placeholder="Search interactions..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                        radius="md"
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
                        radius="md"
                    />
                </Group>

                <DataTable
                    withTableBorder
                    fz="sm"
                    minHeight="300px"
                    borderRadius="lg"
                    bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
                    fetching={!allInteractions}
                    columns={[
                    {
                        accessor: "id",
                        title: "#",
                        width: "60px",
                        render: (record, index) => index + 1
                    },
                    {
                        accessor: 'functionType',
                        title: 'Type',
                        width: "80px",
                        render: (record) => (
                            <Text size="sm" tt="capitalize" c={record.functionType === 'read' ? 'blue' : 'orange'}>
                                {record.functionType}
                            </Text>
                        )
                    },
                    {
                        accessor: 'status',
                        title: 'Status',
                        width: "100px",
                        render: (record) => (
                            <Text size="sm" tt="capitalize" c={getStatusColor(record.status)}>
                                {record.status}
                            </Text>
                        )
                    },
                    {
                        accessor: 'transactionHash',
                        title: 'Tx Hash',
                        width: "150px",
                        render: (record) => (
                            record.transactionHash ? (
                                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                                    {`${record.transactionHash.slice(0, 8)}...${record.transactionHash.slice(-6)}`}
                                </Text>
                            ) : (
                                <Text size="sm" c="dimmed">-</Text>
                            )
                        )
                    },
                    {
                        accessor: 'gasUsed',
                        title: 'Gas Used',
                        width: "120px",
                        render: (record) => (
                            record.gasUsed ? (
                                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                                    {parseInt(record.gasUsed).toLocaleString()}
                                </Text>
                            ) : (
                                <Text size="sm" c="dimmed">-</Text>
                            )
                        )
                    },
                    {
                        accessor: 'timestamp',
                        title: 'Executed At',
                        width: "180px",
                        render: (record) => (
                            <Text size="sm">
                                {formatTimestamp(record.timestamp)}
                            </Text>
                        )
                    },
                    {
                        accessor: 'errorMessage',
                        title: 'Error',
                        width: "200px",
                        render: (record) => (
                            record.errorMessage ? (
                                <Tooltip label={record.errorMessage} multiline w={300}>
                                    <Text size="sm" c="red" truncate>
                                        {record.errorMessage}
                                    </Text>
                                </Tooltip>
                            ) : (
                                <Text size="sm" c="dimmed">-</Text>
                            )
                        )
                    },
                    {
                        accessor: 'actions',
                        title: 'Actions',
                        width: "80px",
                        render: (record) => (
                            <Group>
                                <Tooltip label="View Details" radius="md">
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        onClick={() => handleViewInteraction(record)}
                                    >
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        )
                    },
                    ]}
                    records={paginatedInteractions}
                    totalRecords={totalFiltered}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={setPage}
                    paginationText={({ from, to, totalRecords }) =>
                        `Records ${from} - ${to} of ${totalRecords}`
                    }
                    recordsPerPageOptions={[10, 15, 20]}
                    onRecordsPerPageChange={setPageSize}
                    noRecordsText="No interactions found for this function"
                    loadingText="Loading interactions..."
                />
            </Stack>

            <Modal
                opened={opened}
                onClose={close}
                title={`Interaction Details - ${selectedInteraction?.functionName}`}
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
                            <Stack gap={"xs"}>
                                <Text size="sm" fw={500}>Error:</Text>
                                <Text size="sm" c="red" style={{
                                    wordBreak: "break-all"
                                }}>
                                    {selectedInteraction.errorMessage}
                                </Text>
                            </Stack>
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
        </>
    )
}

export default FunctionInteractionsTable
