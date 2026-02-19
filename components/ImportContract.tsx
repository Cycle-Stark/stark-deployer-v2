import {
  Paper,
  Text,
  Group,
  TextInput,
  Button,
  Stack,
  Badge,
  ScrollArea,
  Grid,
  useMantineColorScheme,
  useMantineTheme,
  Alert,
  Transition,
  Box,
  Textarea,
  CopyButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconCloudDownload,
  IconSearch,
  IconCheck,
  IconAlertTriangle,
  IconFileCode,
  IconHash,
  IconCopy,
  IconArrowRight,
  IconBraces,
} from '@tabler/icons-react';
import InnerLayout from '@/layouts/InnerLayout';
import CustomCardWithHeaderAndFooter from './common/CustomCardWithHeaderAndFooter';
import { useForm } from '@mantine/form';
import { parseABI } from './utils';
import { logsManager } from '@/storage/logsDatabase';
import { contractsManager } from '@/storage/contractsDatabase';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import { useAppContext } from '@/contexts/AppContext';
import { useSettings } from '@/hooks/useSettings';

interface IStatCard {
  title: string
  value: string
  Icon: any
}

const StatCard = ({ title, value, Icon }: IStatCard) => {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  return (
    <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[1]} radius="lg" style={{
      overflow: "hidden"
    }}>
      <Stack p="lg" gap={"xs"}>
        <Group gap={"4px"} wrap='nowrap'>
          <Icon size={20} stroke={1.5} />
          <Text size="sm" c="dimmed">
            {title}
          </Text>
        </Group>
        <Group>
          <Text size="sm" fw={500} style={{
            wordBreak: 'break-all',
            whiteSpace: "pre-wrap"
          }} ff={"monospace"}>
            {value}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}


export function ImportContract() {
  const { provider, activeNetwork, activeChain } = useAppContext()
  const { settings } = useSettings()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [fetchedAbi, setFetchedAbi] = useState<any>(null)
  const [classHash, setClassHash] = useState<string>('')

  const form = useForm({
    initialValues: {
      contractName: '',
      contractAddress: '',
    },
    validate: {
      contractName: (value) => value.trim() === '' ? 'Contract name is required' : null,
      contractAddress: (value) => {
        if (value.trim() === '') return 'Contract address is required'
        if (!value.startsWith('0x')) return 'Address must start with 0x'
        return null
      },
    }
  })

  const handleFetchABI = async () => {
    const validation = form.validate()
    if (validation.hasErrors) return

    if (!provider) {
      logsManager.logError('No provider available. Please connect your wallet first.')
      notifications.show({
        title: 'No Provider',
        message: 'Please connect your wallet to fetch contract ABI.',
        color: 'orange',
      })
      return
    }

    try {
      setLoading(true)
      logsManager.logInfo(`Fetching ABI for contract at ${form.values.contractAddress}...`)

      const contractClass = await provider.getClassAt(form.values.contractAddress)

      if (!contractClass || !contractClass.abi) {
        logsManager.logError('No ABI found for the given contract address.')
        notifications.show({
          title: 'No ABI Found',
          message: 'Could not retrieve ABI for this contract address.',
          color: 'red',
        })
        setLoading(false)
        return
      }

      const abi = contractClass.abi
      setFetchedAbi(abi)

      // Try to get class hash
      try {
        const classHashResult = await provider.getClassHashAt(form.values.contractAddress)
        setClassHash(classHashResult)
        logsManager.logInfo(`Class hash: ${classHashResult}`)
      } catch {
        logsManager.logWarning('Could not fetch class hash')
      }

      logsManager.logSuccess(`ABI fetched successfully! Found ${abi.length} entries.`)

      notifications.show({
        title: 'ABI Fetched',
        message: `Successfully retrieved ABI with ${abi.length} entries.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching ABI:', error)
      logsManager.logError(`Failed to fetch ABI: ${error?.message || error}`)

      notifications.show({
        title: 'Fetch Failed',
        message: error?.message?.includes('not found')
          ? 'Contract not found at this address on the current network.'
          : `Failed to fetch ABI: ${error?.message || 'Unknown error'}`,
        color: 'red',
      })
      setLoading(false)
    }
  }

  const handleImportContract = async () => {
    if (!fetchedAbi) {
      notifications.show({
        title: 'No ABI',
        message: 'Please fetch the ABI first before importing.',
        color: 'orange',
      })
      return
    }

    try {
      setLoading(true)
      logsManager.logInfo('Saving contract to database...')

      const parsedAbi = parseABI(fetchedAbi)

      const contractData = {
        name: form.values.contractName,
        address: form.values.contractAddress,
        abi: JSON.stringify(parsedAbi),
        sierra: '',
        casm: '',
        classHash: classHash,
        txHash: '',
        txReceipt: '',
        deployerAddress: '',
        chain: settings?.activeChain || 'starknet',
        network: settings?.activeNetwork || activeNetwork,
        deployedAt: new Date(),
        status: 'deployed' as const,
        description: `Imported contract on ${activeNetwork} at ${new Date().toLocaleString()}`
      }

      const contractId = await contractsManager.create(contractData)
      logsManager.logSuccess(`Contract "${form.values.contractName}" imported with ID: ${contractId}`)

      notifications.show({
        title: 'Contract Imported!',
        message: `"${form.values.contractName}" has been saved. Redirecting to contracts...`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })

      setTimeout(() => {
        router.push('/app/contracts')
      }, 1000)
    } catch (error: any) {
      console.error('Error importing contract:', error)
      logsManager.logError(`Failed to import contract: ${error?.message || error}`)

      notifications.show({
        title: 'Import Failed',
        message: `${error?.message || 'Unknown error'}`,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const functionCount = fetchedAbi?.filter((item: any) => item.type === 'function').length || 0
  const eventCount = fetchedAbi?.filter((item: any) => item.type === 'event').length || 0
  const interfaceCount = fetchedAbi?.filter((item: any) => item.type === 'interface').length || 0

  return (
    <InnerLayout>
      <ScrollArea h="100%" p="sm">
        <Stack gap={"md"}>
          {/* Header */}
          <Group justify="space-between" align="center">
            <div>
              <Text size="xl" fw={600}>
                Import Contract
              </Text>
              <Text size="sm" c="dimmed">
                Import an existing contract by its address. The ABI will be fetched directly from the chain.
              </Text>
            </div>
            <Badge variant="light" color="violet" size="lg" radius="md">
              {activeNetwork}
            </Badge>
          </Group>

          {/* Import Form */}
          <CustomCardWithHeaderAndFooter
            title="Contract Details"
            Icon={IconCloudDownload}
            description="Enter the contract name and address"
            footerContent={
              <Group justify="space-between" align="center">
                <Text size='xs' c="dimmed">
                  The ABI will be fetched from the {activeNetwork} network.
                </Text>
                <Group>
                  <Button
                    variant="light"
                    color='violet'
                    fw={400}
                    radius={"md"}
                    leftSection={<IconSearch size={16} />}
                    loading={loading && !fetchedAbi}
                    onClick={handleFetchABI}
                    disabled={form.values.contractAddress.trim() === '' || form.values.contractName.trim() === ''}
                  >
                    Fetch ABI
                  </Button>
                  {fetchedAbi && (
                    <Button
                      variant="filled"
                      color='green'
                      fw={400}
                      radius={"md"}
                      leftSection={<IconCloudDownload size={16} />}
                      loading={loading}
                      onClick={handleImportContract}
                    >
                      Import Contract
                    </Button>
                  )}
                </Group>
              </Group>
            }
          >
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Contract Name"
                  placeholder="e.g. MyToken, NFTMarketplace"
                  description="A friendly name to identify this contract"
                  radius={"md"}
                  size="sm"
                  {...form.getInputProps('contractName')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Contract Address"
                  placeholder="0x04a1..."
                  description="The deployed contract address on Starknet"
                  radius={"md"}
                  size="sm"
                  ff="monospace"
                  {...form.getInputProps('contractAddress')}
                />
              </Grid.Col>
            </Grid>
          </CustomCardWithHeaderAndFooter>

          {/* Results Section */}
          <Transition mounted={!!fetchedAbi} transition="slide-up" duration={300}>
            {(styles) => (
              <Stack gap="md" style={styles}>
                {/* ABI Summary */}
                <CustomCardWithHeaderAndFooter
                  title="ABI Summary"
                  Icon={IconBraces}
                  description={`${fetchedAbi?.length || 0} entries found`}
                >
                  <Grid>
                    {classHash && (
                      <Grid.Col span={12}>
                        <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[1]} radius="lg" p="lg">
                          <Group justify="space-between" align="center">
                            <Stack gap={4}>
                              <Group gap={4}>
                                <IconHash size={16} stroke={1.5} />
                                <Text size="sm" c="dimmed">Class Hash</Text>
                              </Group>
                              <Text size="sm" fw={500} ff="monospace" style={{ wordBreak: 'break-all' }}>
                                {classHash}
                              </Text>
                            </Stack>
                            <CopyButton value={classHash}>
                              {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                  <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          </Group>
                        </Paper>
                      </Grid.Col>
                    )}
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconFileCode}
                        title="Functions"
                        value={`${functionCount}`}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconAlertTriangle}
                        title="Events"
                        value={`${eventCount}`}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconBraces}
                        title="Interfaces"
                        value={`${interfaceCount}`}
                      />
                    </Grid.Col>
                  </Grid>
                </CustomCardWithHeaderAndFooter>

                {/* ABI Preview */}
                <CustomCardWithHeaderAndFooter
                  title="ABI Preview"
                  Icon={IconFileCode}
                  description="Raw ABI data"
                >
                  <Paper
                    bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                    radius="md"
                    p="md"
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                  >
                    <Text size="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(fetchedAbi, null, 2)}
                    </Text>
                  </Paper>
                </CustomCardWithHeaderAndFooter>
              </Stack>
            )}
          </Transition>

          {/* Help Alert */}
          {!fetchedAbi && !loading && (
            <Alert variant="light" radius="lg" color="violet" title="How it works" icon={<IconCloudDownload size={20} />}>
              <Stack gap={4}>
                <Text size="sm">1. Enter a name for the contract and its deployed address.</Text>
                <Text size="sm">2. Click "Fetch ABI" to retrieve the contract's ABI from the chain.</Text>
                <Text size="sm">3. Review the ABI summary, then click "Import Contract" to save it.</Text>
                <Text size="sm">4. The contract will appear in your Contracts list, ready for interaction.</Text>
              </Stack>
            </Alert>
          )}
        </Stack>
      </ScrollArea>
    </InnerLayout>
  )
}
