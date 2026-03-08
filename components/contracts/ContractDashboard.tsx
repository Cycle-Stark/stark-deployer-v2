import React, { useState, useEffect } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
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
  Table,
  ScrollArea,
  Pagination,
  Select,
  TextInput,
} from '@mantine/core'
import {
  IconCopy,
  IconExternalLink,
  IconEye,
  IconSend,
  IconActivity,
  IconSearch,
  IconRefresh,
  IconShield,
  IconBraces,
  IconShare3,
  IconWorld,
} from '@tabler/icons-react'
import { IAbiEntry, IContract, IContractInteraction, IContractStats } from '@/types/contracts'
import { contractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { createSampleInteractions } from '@/utils/sampleData'
import { notifications } from '@mantine/notifications'
import { LineChart } from '@mantine/charts'
import { MetaBadge, StatusBadge } from './QuickContractInfo'

type Props = {
  contract: IContract
  className?: string
}

// Activity Chart Component
const ActivityChart = ({ data }: { data: { date: string; reads: number; writes: number; errors: number }[] }) => {
  return (
    <Box p="sm">
      <LineChart
        h={290}
        data={data}
        dataKey="date"
        series={[
          { name: 'reads', color: 'blue.6' },
          { name: 'writes', color: 'teal.6' },
          { name: 'errors', color: 'red.6' },
        ]}
        curveType="natural"
      />
    </Box>
  )
}

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}) => {
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Paper withBorder radius="lg" p="md"
      style={{
        borderBottom: `4px solid`,
        borderBottomColor: isDark ? theme.colors[color][7] : theme.colors[color][6]
      }}
    >
      <Group gap="xs" align="center" justify='space-between'>
        <Stack gap="4px" align="start">
          <Text size="sm" c="dimmed">{title}</Text>
          <Text size="xl" fw={700}>
            {value}
          </Text>
        </Stack>
        <ActionIcon size={"lg"} color={color} radius="md" variant='light' style={{ pointerEvents: "none" }}>
          {icon}
        </ActionIcon>
      </Group>
    </Paper>
  )
}

const ContractDashboard = ({ contract, className }: Props) => {
  const [interactions, setInteractions] = useState<IContractInteraction[]>([])
  const [stats, setStats] = useState<IContractStats>({
    totalFunctions: 0,
    writeFunctions: 0,
    readFunctions: 0,
    totalInteractions: 0,
    recentInteractions: [],
  })
  const [activityData, setActivityData] = useState<{ date: string; reads: number; writes: number; errors: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [days, setDays] = useState<string>('7')

  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const getAllFunctions = (abi: IAbiEntry[]) => {
    const functions = abi.filter((entry) => ['function'].includes(entry.type))
    const interfaces = abi.filter((entry) => entry.type === 'interface')
    return [...functions, ...interfaces.flatMap((entry) => entry.items || [])]
  }

  const loadData = async () => {
    if (!contract.id) return

    setLoading(true)
    try {
      // Load interactions
      const allInteractions = await contractInteractionsManager.getByContractId(contract.id)
      setInteractions(allInteractions)

      // Load activity data
      const activity = await contractInteractionsManager.getActivityData(contract.id, parseInt(days))
      setActivityData(activity)

      // Calculate stats
      const contractAbi = JSON.parse(contract.abi || '[]')
      const functions = getAllFunctions(contractAbi)
      const writeFunctions = functions.filter((f: any) =>
        f.state_mutability === 'external' || !f.state_mutability
      )
      const readFunctions = functions.filter((f: any) =>
        f.state_mutability === 'view'
      )

      const totalInteractions = await contractInteractionsManager.getCountByContractId(contract.id)
      const recentInteractions = await contractInteractionsManager.getRecentByContractId(contract.id, 5)

      setStats({
        totalFunctions: functions.length,
        writeFunctions: writeFunctions.length,
        readFunctions: readFunctions.length,
        totalInteractions,
        recentInteractions,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const reloadActivityData = async () => {
    if (!contract.id) return
    const activity = await contractInteractionsManager.getActivityData(contract.id, parseInt(days))
    setActivityData(activity)
  }

  const handleCreateSampleData = async () => {
    if (!contract.id) return

    try {
      await createSampleInteractions(contract.id)
      notifications.show({
        title: 'Success',
        message: 'Sample interaction data created successfully',
        color: 'teal',
      })
      await loadData() // Reload data to show the new interactions
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create sample data',
        color: 'red',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [contract.id])

  useEffect(() => {
    reloadActivityData()
  }, [days])

  const filteredInteractions = interactions.filter(interaction => {
    const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter
    const matchesType = typeFilter === 'all' || interaction.functionType === typeFilter
    const matchesSearch = !searchQuery ||
      interaction.functionName.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesType && matchesSearch
  })

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
    const network = contract.network?.toLowerCase()
    const base = network?.includes('main') ? 'https://starkscan.co' : 'https://testnet.starkscan.co'
    return `${base}/tx/${txHash}`
  }

  const abi = contract.sierra ? JSON.parse(contract.sierra)?.abi : JSON.parse(contract.abi || '[]')

  const contractAbi = JSON.stringify(abi, null, 4)

  return (
    <Stack gap="lg" className={className}>
      {/* Header */}
      <Paper withBorder radius="lg" p="md">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Group gap={8} wrap="wrap">
              <StatusBadge status={contract?.status} />
              <MetaBadge icon={<IconWorld size={14} />}>{contract?.chain || '—'}</MetaBadge>
              <MetaBadge icon={<IconShare3 size={14} />}>{contract?.network || '—'}</MetaBadge>
            </Group>
            <Title order={3} fw={400}>{contract.name}</Title>
            <Text size="sm" c="dimmed">
              Date added: {new Date(contract.deployedAt).toLocaleDateString()}
            </Text>
          </Stack>
          <Group gap="xs">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            {/* Quick Sample data creation */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSampleData}
            >
              Add Sample Data
            </Button> */}
          </Group>
        </Group>
      </Paper>

      {/* Contract Address */}
      <Paper withBorder radius="lg" p="md">
        <Stack gap="sm">
          <Text size="sm" fw={400}>Contract Address</Text>
          <Group gap="xs" align="center" wrap='nowrap'>
            <Box bg={isDark ? theme.colors.dark[8] : theme.colors.gray[1]} ff={"monospace"} style={{ flex: 1, fontSize: '14px', borderRadius: theme.radius.md }} p={"sm"} h={"40px"}>
              <Group wrap='nowrap'>
                <Text size='sm' style={{
                  wordBreak: "break-all",
                  wordWrap: "break-word"
                }}>
                  {contract.address}
                </Text>
                <Box ml="auto">
                  <IconShield size={20} color={theme.colors.green[5]} />
                </Box>
              </Group>
            </Box>
            <CopyButton value={contract.address} timeout={1200}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                  <Button
                    radius={"md"}
                    variant="light"
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    leftSection={<IconCopy size={16} />}
                    h={"40px"}
                  >
                    Copy Address
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
            <CopyButton value={contractAbi} timeout={1200}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                  <Button
                    radius={"md"}
                    variant="light"
                    color={copied ? 'teal' : 'violet'}
                    onClick={copy}
                    leftSection={<IconCopy size={16} />}
                    h={"40px"}
                  >
                    Copy ABI
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Functions"
            value={stats.totalFunctions}
            icon={<IconBraces size={16} />}
            color="violet"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Read Functions"
            value={stats.readFunctions}
            icon={<IconEye size={16} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Write Functions"
            value={stats.writeFunctions}
            icon={<IconSend size={16} />}
            color="teal"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Calls/Invocations"
            value={stats.totalInteractions}
            icon={<IconActivity size={16} />}
            color="orange"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          {/* Activity Chart */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={500}>Activity</Text>
                <Select
                  placeholder="Select days"
                  radius={"md"}
                  data={[
                    { value: '7', label: 'Last 7 days' },
                    { value: '14', label: 'Last 14 days' },
                    { value: '30', label: 'Last 30 days' },
                    { value: '60', label: 'Last 60 days' },
                  ]}
                  value={days}
                  onChange={(value) => setDays(value || '7')}
                  size="xs"
                  w={120}
                />
              </Group>
              <ActivityChart data={activityData} />
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          {/* Recent Calls/Invocations */}
          <Paper withBorder radius="lg" p="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={500}>Recent Calls/Invocations</Text>
                {/* <Group gap="xs">
                  <TextInput
                    placeholder="Search functions..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="xs"
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
                    size="xs"
                    w={120}
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
                    size="xs"
                    w={100}
                  />
                </Group> */}
              </Group>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th># ID</Table.Th>
                      <Table.Th>Function</Table.Th>
                      <Table.Th>Call Data</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Result/Error</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody h={"200px"}>
                    {stats.recentInteractions.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5}>
                          <Text ta="center" c="dimmed" py="xl">
                            No interactions found
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      stats.recentInteractions.map((interaction) => (
                        <Table.Tr key={interaction.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {interaction.id}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={4}>
                              <Group gap={6}>
                                <Text size="sm" fw={500}>
                                  {interaction.functionName}
                                </Text>
                                <Badge
                                  size="xs"
                                  color={getTypeColor(interaction.functionType)}
                                >
                                  {interaction.functionType}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {new Date(interaction.timestamp).toLocaleString()}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Button size="xs" variant="light">
                              Show
                            </Button>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="sm"
                              color={getStatusColor(interaction.status)}
                              variant="light"
                            >
                              {interaction.status.toUpperCase()}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Button size="xs" variant="light">
                                Show
                              </Button>
                              {interaction.transactionHash && (
                                <Tooltip label="View on Explorer">
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    component="a"
                                    href={explorerUrl(interaction.transactionHash)}
                                    target="_blank"
                                  >
                                    <IconExternalLink size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {/* {filteredInteractions.length > pageSize && (
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">
                    Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredInteractions.length)} of {filteredInteractions.length}
                  </Text>
                  <Group gap="xs">
                    <Select
                      data={[
                        { value: '10', label: '10 per page' },
                        { value: '25', label: '25 per page' },
                        { value: '50', label: '50 per page' },
                      ]}
                      value={pageSize.toString()}
                      onChange={(value) => {
                        setPageSize(parseInt(value || '10'))
                        setPage(1)
                      }}
                      size="xs"
                      w={120}
                    />
                    <Pagination
                      value={page}
                      onChange={setPage}
                      total={Math.ceil(filteredInteractions.length / pageSize)}
                      size="sm"
                    />
                  </Group>
                </Group>
              )} */}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}

export default ContractDashboard