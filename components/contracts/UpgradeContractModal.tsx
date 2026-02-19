import { useState, useMemo } from 'react'
import {
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import {
  IconArrowUp,
  IconCheck,
  IconPlayerPlay,
  IconRefresh,
  IconRocket,
  IconSearch,
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { useContract } from '@/contexts/ContractProvider'
import { useAppContext } from '@/contexts/AppContext'
import { CallData, InvokedTransaction, RpcProvider } from 'starknet'
import { logsManager } from '@/storage/logsDatabase'
import { notifications } from '@mantine/notifications'
import { contractInteractionService } from '@/services/contractInteractionService'
import { ContractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { contractsManager } from '@/storage/contractsDatabase'
import { parseABI } from '@/components/utils/starknetUtils'
import { CallDataItem } from '@/components/contracts/CallDataItem'
import { IAbiEntry, ICallDataItem } from '@/types'

interface UpgradeContractModalProps {
  opened: boolean
  onClose: () => void
}

export default function UpgradeContractModal({ opened, onClose }: UpgradeContractModalProps) {
  const { contract, actualContract, contractId, getAllFunctions, refetchContract } = useContract()
  const { connectedAccount, provider } = useAppContext()
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const [active, setActive] = useState(0)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [functionData, setFunctionData] = useState<IAbiEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [txStatus, setTxStatus] = useState('')

  const form = useForm<{
    callData: ICallDataItem[]
  }>({
    initialValues: {
      callData: [],
    },
    validate: (values) => {
      const errors: Record<string, string> = {}
      for (let i = 0; i < values.callData.length; i++) {
        if (values.callData[i].value === '') {
          errors[`callData.${i}.value`] = 'Value is required'
        }
      }
      return errors
    },
  })

  // Find upgrade-like functions from the ABI
  const upgradeFunctions = useMemo(() => {
    const allFuncs = getAllFunctions()
    return allFuncs.filter((func) => {
      const name = func.name.toLowerCase()
      return (
        name.includes('upgrade') ||
        name.includes('replace_class') ||
        name.includes('set_implementation')
      )
    })
  }, [contract])

  const handleSelectFunction = (funcName: string | null) => {
    setSelectedFunction(funcName)
    if (!funcName) {
      setFunctionData(null)
      form.setFieldValue('callData', [])
      return
    }
    const allFuncs = getAllFunctions()
    const func = allFuncs.find((f) => f.name === funcName) || null
    setFunctionData(func)
    form.setFieldValue('callData', func?.callDataItems || [])
  }

  const handleExecuteUpgrade = async () => {
    const validation = form.validate()
    if (validation.hasErrors) return

    if (!actualContract || !connectedAccount || !contractId || !selectedFunction) {
      notifications.show({ title: 'Error', message: 'Missing contract or wallet connection.', color: 'red' })
      return
    }

    const args: Record<string, any> = {}
    for (const item of form.values.callData) {
      args[item.name] = item.value
    }

    const interactionsManager = ContractInteractionsManager.getInstance()
    let interactionId: number | null = null

    try {
      setLoading(true)
      setTxHash('')
      setTxStatus('Preparing...')

      const functionCallArgs = actualContract.populate(selectedFunction, args)
      if (!functionCallArgs.calldata) {
        notifications.show({ title: 'Error', message: 'Failed to populate call data.', color: 'red' })
        setLoading(false)
        return
      }

      interactionId = await interactionsManager.create({
        contractId: parseInt(contractId),
        functionName: selectedFunction,
        functionType: 'write',
        rawCallData: functionCallArgs.calldata as string[],
        callDataItems: form.values.callData,
        status: 'pending',
        timestamp: new Date(),
      })

      logsManager.logInfo(`Upgrading contract via ${selectedFunction}...`)

      const result = await actualContract.invoke(
        selectedFunction,
        functionCallArgs.calldata as [CallData]
      ) as InvokedTransaction

      setTxHash(result.transaction_hash)
      setTxStatus('Transaction Submitted')
      setActive(2)

      if (interactionId) {
        await interactionsManager.update(interactionId, {
          transactionHash: result.transaction_hash,
        })
      }

      logsManager.logInfo(`Upgrade tx submitted: ${result.transaction_hash}`)
      notifications.show({
        title: 'Upgrade Transaction Submitted',
        message: `Waiting for confirmation...`,
        color: 'blue',
      })

      // Monitor transaction in background
      contractInteractionService.monitorTransaction({
        interactionId: interactionId!,
        transactionHash: result.transaction_hash,
        provider,
        functionName: selectedFunction,
        actualContract,
        onSettled: async ({ status, receipt }) => {
          if (status === 'success') {
            setTxStatus('Transaction Successful')
            notifications.show({
              title: 'Upgrade Successful',
              message: 'Contract upgraded. Refreshing ABI...',
              color: 'green',
              icon: <IconCheck size={16} />,
            })
            // Auto-refresh ABI after successful upgrade
            await handleRefreshAbi()
          } else if (status === 'reverted') {
            setTxStatus('Transaction Reverted')
            notifications.show({
              title: 'Upgrade Reverted',
              message: receipt?.revert_reason || 'Transaction was reverted.',
              color: 'violet',
            })
          } else {
            setTxStatus('Transaction Failed')
            notifications.show({
              title: 'Upgrade Failed',
              message: 'Transaction failed.',
              color: 'red',
            })
          }
        },
      }).catch((err) => {
        console.error('Upgrade monitoring error:', err)
      })

      setLoading(false)
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      logsManager.logError(`Upgrade failed: ${errorMessage}`)
      setTxStatus(`Failed: ${errorMessage}`)
      notifications.show({
        title: 'Upgrade Failed',
        message: errorMessage,
        color: 'red',
      })

      if (interactionId) {
        await interactionsManager.update(interactionId, {
          status: 'failed',
          errorMessage,
        })
      }

      setLoading(false)
    }
  }

  const handleRefreshAbi = async () => {
    if (!contract?.address || !provider || !contractId) return

    try {
      setRefreshing(true)
      logsManager.logInfo('Refreshing contract ABI after upgrade...')

      // Fetch new class from chain
      const classResponse = await (provider as RpcProvider).getClassAt(contract.address)
      const newClassHash = await (provider as RpcProvider).getClassHashAt(contract.address)

      const newSierra = JSON.stringify(classResponse)
      const newAbi = JSON.stringify(parseABI((classResponse as any).abi))

      // Update contract in database
      await contractsManager.update(parseInt(contractId), {
        sierra: newSierra,
        abi: newAbi,
        classHash: newClassHash,
      })

      // Refetch in context
      await refetchContract()

      setActive(3)
      logsManager.logSuccess('Contract ABI refreshed successfully')
      notifications.show({
        title: 'ABI Refreshed',
        message: `Contract now uses class hash: ${newClassHash.slice(0, 20)}...`,
        color: 'green',
        icon: <IconRefresh size={16} />,
      })
    } catch (err: any) {
      logsManager.logError(`ABI refresh failed: ${err?.message || err}`)
      notifications.show({
        title: 'ABI Refresh Failed',
        message: err?.message || 'Could not fetch updated ABI from chain.',
        color: 'red',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleClose = () => {
    setActive(0)
    setSelectedFunction(null)
    setFunctionData(null)
    setTxHash('')
    setTxStatus('')
    form.reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="violet" radius="md">
            <IconArrowUp size={14} />
          </ThemeIcon>
          <Text fw={600} size="sm">Upgrade Contract</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      centered
      styles={{
        body: {
          padding: '0 24px 24px',
        },
      }}
    >
      <Stack gap="md">
        <Stepper
          active={active}
          size="xs"
          // color="orange"
          styles={{
            stepIcon: { borderWidth: 2 },
          }}
        >
          <Stepper.Step label="Select Function" description="Choose upgrade fn">
            <Stack gap="md" mt="md">
              <Text size="xs" c="dimmed">
                Select the upgrade function from your contract's ABI. Common names include
                `upgrade`, `replace_class`, or `set_implementation`.
              </Text>

              {upgradeFunctions.length > 0 ? (
                <Select
                  label="Upgrade Function"
                  placeholder="Select a function..."
                  data={upgradeFunctions.map((f) => ({
                    value: f.name,
                    label: f.name,
                  }))}
                  value={selectedFunction}
                  onChange={handleSelectFunction}
                  radius="md"
                  size="sm"
                  leftSection={<IconSearch size={14} />}
                />
              ) : (
                <Paper
                  p="md"
                  radius="md"
                  bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                  style={{ borderLeft: '3px solid var(--mantine-color-violet-5)' }}
                >
                  <Text size="xs" c="dimmed">
                    No upgrade-like functions found in the ABI. You can still select any write
                    function below.
                  </Text>
                </Paper>
              )}

              {/* Fallback: show all write functions */}
              {upgradeFunctions.length === 0 && (
                <Select
                  label="All Write Functions"
                  placeholder="Select a function..."
                  data={getAllFunctions()
                    .filter(
                      (f) =>
                        f.state_mutability === 'external' ||
                        f.state_mutability === 'nonpayable' ||
                        f.state_mutability === 'payable'
                    )
                    .map((f) => ({ value: f.name, label: f.name }))}
                  value={selectedFunction}
                  onChange={handleSelectFunction}
                  radius="md"
                  size="sm"
                  searchable
                  leftSection={<IconSearch size={14} />}
                />
              )}

              {functionData && (
                <Paper
                  p="xs"
                  radius="md"
                  bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                >
                  <Group gap={6}>
                    <Badge variant="light" size="xs">
                      {functionData.state_mutability}
                    </Badge>
                    <Text size="xs" ff="monospace" c="dimmed">
                      {functionData.signature}
                    </Text>
                  </Group>
                </Paper>
              )}

              <Group justify="flex-end">
                <Button
                  variant="light"
                  // color="orange"
                  radius="md"
                  size="sm"
                  disabled={!selectedFunction}
                  onClick={() => setActive(1)}
                >
                  Next
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Fill Inputs" description="Enter call data">
            <Stack gap="md" mt="md">
              {functionData?.callDataItems?.length === 0 ? (
                <Text size="sm" c="dimmed">This function takes no arguments.</Text>
              ) : (
                <>
                {/* <ScrollArea.Autosize mah={500} scrollbars="y"> */}
                  <form>
                    <Grid>
                      {functionData?.callDataItems?.map((input, index) => (
                        <Grid.Col span={12} key={index}>
                          <CallDataItem
                            inputType={input.type}
                            form={form}
                            index={index}
                            hideDeleteBtn
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </form>
                {/* </ScrollArea.Autosize> */}
                </>
              )}

              <Divider />

              <Group justify="space-between">
                <Button variant="default" radius="md" size="sm" onClick={() => setActive(0)}>
                  Back
                </Button>
                <Button
                  variant="filled"
                  // color="orange"
                  radius="md"
                  size="sm"
                  leftSection={<IconRocket size={14} />}
                  onClick={handleExecuteUpgrade}
                  loading={loading}
                >
                  Execute Upgrade
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Confirm" description="Waiting for tx">
            <Stack gap="md" mt="md" align="center">
              <ThemeIcon size={48} radius="xl" variant="light" color={txStatus.includes('Successful') ? 'green' : txStatus.includes('Failed') || txStatus.includes('Reverted') ? 'red' : 'violet'}>
                {txStatus.includes('Successful') ? <IconCheck size={24} /> : <IconPlayerPlay size={24} />}
              </ThemeIcon>
              <Text size="sm" fw={600}>{txStatus || 'Waiting...'}</Text>
              {txHash && (
                <Paper
                  p="xs"
                  radius="md"
                  bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                  w="100%"
                >
                  <Text size="10px" tt="uppercase" fw={600} c="dimmed" mb={2}>Transaction Hash</Text>
                  <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
                    {txHash}
                  </Text>
                </Paper>
              )}

              {txStatus.includes('Successful') && (
                <Button
                  variant="light"
                  color="green"
                  radius="md"
                  size="sm"
                  leftSection={<IconRefresh size={14} />}
                  onClick={handleRefreshAbi}
                  loading={refreshing}
                >
                  {refreshing ? 'Refreshing ABI...' : 'Refresh ABI Now'}
                </Button>
              )}

              {(txStatus.includes('Failed') || txStatus.includes('Reverted')) && (
                <Button variant="default" radius="md" size="sm" onClick={() => setActive(1)}>
                  Back to Inputs
                </Button>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack gap="md" mt="md" align="center">
              <ThemeIcon size={48} radius="xl" variant="light" color="green">
                <IconCheck size={24} />
              </ThemeIcon>
              <Text size="sm" fw={600}>Contract Upgraded & ABI Refreshed</Text>
              <Text size="xs" c="dimmed" ta="center">
                The contract's ABI has been updated with the new implementation.
                The sidebar functions list will reflect the changes.
              </Text>
              <Button variant="light" color="violet" radius="md" size="sm" onClick={handleClose}>
                Done
              </Button>
            </Stack>
          </Stepper.Completed>
        </Stepper>
      </Stack>
    </Modal>
  )
}
