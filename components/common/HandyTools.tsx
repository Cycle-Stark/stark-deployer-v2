import { useState } from 'react'
import {
  Accordion,
  ActionIcon,
  AppShell,
  Badge,
  Button,
  CopyButton,
  Divider,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  ScrollAreaAutosize,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendarTime,
  IconCheck,
  IconChecks,
  IconClock,
  IconCopy,
  IconCube,
  IconLetterCase,
  IconNote,
  IconReceipt,
  IconSearch,
  IconServer,
  IconSparkles,
  IconSwitchHorizontal,
  IconAt,
  IconX,
} from '@tabler/icons-react'
import { Contract, hash, cairo, num, byteArray } from 'starknet'
import BigNumber from 'bignumber.js'
import { useAppContext } from '@/contexts/AppContext'
import { shortString } from 'starknet'
import { logsManager } from '@/storage/logsDatabase'
import { notifications } from '@mantine/notifications'
import NotesTool from './NotesTool'

// ─── Shared: Copyable Result Field ───────────────────────────────────────────

function ResultField({ label, value, color = 'violet', monospace = true }: {
  label: string
  value: string
  color?: string
  monospace?: boolean
}) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  return (
    <Paper
      radius="md"
      p="xs"
      bg={isDark ? theme.colors.darkColor[7] : theme.colors.gray[1]}
      style={{
        borderLeft: `3px solid var(--mantine-color-${color}-5)`,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="10px" tt="uppercase" fw={600} c="dimmed" lh={1}>{label}</Text>
          <Text
            size="xs"
            ff={monospace ? 'monospace' : undefined}
            style={{ wordBreak: 'break-all' }}
            lh={1.4}
          >
            {value}
          </Text>
        </Stack>
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="left">
              <ActionIcon variant="subtle" size="xs" color={copied ? 'green' : 'gray'} onClick={copy} mt={2}>
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Paper>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Group gap={6} mt={4}>
      <Divider style={{ flex: 1 }} />
      <Text size="10px" tt="uppercase" fw={600} c="dimmed" lh={1}>{children}</Text>
      <Divider style={{ flex: 1 }} />
    </Group>
  )
}

// ─── Large Number Creator ─────────────────────────────────────────────────────

function LargeNumberTool() {
  const [amount, setAmount] = useState<string | number>('')
  const [decimals, setDecimals] = useState<string | number>('')

  const result = (() => {
    if (amount === '' || decimals === '') return '0'
    try {
      return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(Number(decimals))).toFixed(0)
    } catch {
      return '0'
    }
  })()

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">Multiply an amount by 10^decimals.</Text>
      <Group grow>
        <NumberInput
          size="xs"
          radius="md"
          label="Amount"
          placeholder="e.g. 100"
          hideControls
          value={amount}
          onChange={setAmount}
        />
        <NumberInput
          size="xs"
          radius="md"
          label="Decimals"
          placeholder="e.g. 18"
          hideControls
          value={decimals}
          onChange={setDecimals}
        />
      </Group>
      {result !== '0' && <ResultField label="Raw Value (amount x 10^decimals)" value={result} color="blue" />}
    </Stack>
  )
}

// ─── Reverse Large Number ─────────────────────────────────────────────────────

function ReverseNumberTool() {
  const [rawValue, setRawValue] = useState('')
  const [decimals, setDecimals] = useState<string | number>('')

  const result = (() => {
    if (rawValue === '' || decimals === '') return '0'
    try {
      return new BigNumber(rawValue).dividedBy(new BigNumber(10).pow(Number(decimals))).toFixed()
    } catch {
      return '0'
    }
  })()

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">Divide a raw value by 10^decimals.</Text>
      <TextInput
        size="xs"
        radius="md"
        label="Raw Value"
        placeholder="e.g. 1000000000000000000"
        value={rawValue}
        onChange={(e) => setRawValue(e.target.value)}
        ff="monospace"
      />
      <NumberInput
        size="xs"
        radius="md"
        label="Decimals"
        placeholder="e.g. 18"
        hideControls
        value={decimals}
        onChange={setDecimals}
      />
      {result !== '0' && <ResultField label="Human-Readable (raw / 10^decimals)" value={result} color="teal" />}
    </Stack>
  )
}

// ─── Approve Token Tool ───────────────────────────────────────────────────────

const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' },
    ],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'external',
  },
]

function ApproveTokenTool() {
  const { connectedAccount } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [tokenAddress, setTokenAddress] = useState('')
  const [spenderAddress, setSpenderAddress] = useState('')
  const [amount, setAmount] = useState<string | number>('')
  const [decimals, setDecimals] = useState<string | number>('18')

  const computedAmount = (() => {
    if (amount === '' || decimals === '') return '0'
    try {
      return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(Number(decimals))).toFixed(0)
    } catch {
      return '0'
    }
  })()

  const handleApprove = async () => {
    if (!connectedAccount) {
      notifications.show({ title: 'Not connected', message: 'Connect your wallet first.', color: 'orange' })
      return
    }
    if (!tokenAddress || !spenderAddress || amount === '') {
      notifications.show({ title: 'Missing fields', message: 'Fill in all fields.', color: 'orange' })
      return
    }

    try {
      setLoading(true)
      logsManager.logInfo(`Approving ${computedAmount} tokens on ${tokenAddress} for spender ${spenderAddress}`)

      const erc20 = new Contract({ abi: ERC20_APPROVE_ABI, address: tokenAddress, providerOrAccount: connectedAccount })
      const callData = erc20.populate('approve', [spenderAddress, computedAmount])

      const tx = await connectedAccount.execute([
        {
          contractAddress: tokenAddress,
          entrypoint: 'approve',
          calldata: callData.calldata as string[],
        },
      ])

      logsManager.logSuccess(`Approve tx submitted: ${tx.transaction_hash}`)
      notifications.show({
        title: 'Approval Submitted',
        message: `Tx: ${tx.transaction_hash.slice(0, 20)}...`,
        color: 'green',
        icon: <IconChecks size={16} />,
      })
    } catch (err: any) {
      logsManager.logError(`Approve failed: ${err?.message || err}`)
      notifications.show({
        title: 'Approval Failed',
        message: `${err?.message || 'Unknown error'}`,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">Approve a spender to use your ERC20 tokens.</Text>
      <TextInput
        size="xs"
        radius="md"
        label="Token Address"
        placeholder="0x049d..."
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        ff="monospace"
      />
      <TextInput
        size="xs"
        radius="md"
        label="Spender Address"
        placeholder="0x04a1..."
        value={spenderAddress}
        onChange={(e) => setSpenderAddress(e.target.value)}
        ff="monospace"
      />
      <Group grow>
        <NumberInput
          size="xs"
          radius="md"
          label="Amount"
          placeholder="e.g. 1000"
          hideControls
          value={amount}
          onChange={setAmount}
        />
        <NumberInput
          size="xs"
          radius="md"
          label="Decimals"
          placeholder="18"
          hideControls
          value={decimals}
          onChange={setDecimals}
        />
      </Group>
      {computedAmount !== '0' && (
        <ResultField label="Raw amount to approve" value={computedAmount} color="green" />
      )}
      <Button
        size="xs"
        radius="md"
        variant="filled"
        color="green"
        leftSection={<IconChecks size={14} />}
        onClick={handleApprove}
        loading={loading}
        disabled={!tokenAddress || !spenderAddress || amount === ''}
        fullWidth
      >
        Approve
      </Button>
    </Stack>
  )
}

// ─── Block Timestamp Tool ─────────────────────────────────────────────────────

function BlockTimestampTool() {
  const { provider } = useAppContext()
  const [blockTimestamp, setBlockTimestamp] = useState<string>('')
  const [blockNumber, setBlockNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchBlockTimestamp = async () => {
    if (!provider) {
      notifications.show({ title: 'No provider', message: 'Connect your wallet first.', color: 'orange' })
      return
    }
    try {
      setLoading(true)
      const block = await provider.getBlock('latest')
      setBlockTimestamp(`${block.timestamp}`)
      setBlockNumber(`${block.block_number}`)
      logsManager.logInfo(`Current block #${block.block_number} timestamp: ${block.timestamp}`)
    } catch (err: any) {
      logsManager.logError(`Failed to fetch block: ${err?.message || err}`)
      notifications.show({ title: 'Error', message: `${err?.message || 'Failed to fetch block'}`, color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  const readableTime = blockTimestamp
    ? new Date(Number(blockTimestamp) * 1000).toLocaleString()
    : '-'

  return (
    <Stack gap="xs">
      <Button
        size="xs"
        radius="md"
        variant="light"
        color="violet"
        leftSection={<IconClock size={14} />}
        onClick={fetchBlockTimestamp}
        loading={loading}
        fullWidth
      >
        Fetch Latest Block
      </Button>
      {blockTimestamp && (
        <Stack gap={6}>
          <Group gap={6}>
            <Badge variant="light" color="violet" size="sm" leftSection={<IconCube size={10} />}>
              Block #{blockNumber}
            </Badge>
          </Group>
          <ResultField label="Unix Timestamp" value={blockTimestamp} color="violet" />
          <ResultField label="Human Readable" value={readableTime} color="grape" monospace={false} />
        </Stack>
      )}
    </Stack>
  )
}

// ─── Date/Timestamp Converter ─────────────────────────────────────────────────

function TimestampConverterTool() {
  const [dateInput, setDateInput] = useState('')
  const [timestampInput, setTimestampInput] = useState<string | number>('')

  const dateToTimestamp = (() => {
    if (!dateInput) return ''
    try {
      const ts = Math.floor(new Date(dateInput).getTime() / 1000)
      return isNaN(ts) ? '' : `${ts}`
    } catch {
      return ''
    }
  })()

  const timestampToDate = (() => {
    if (timestampInput === '') return ''
    try {
      const num = Number(timestampInput)
      if (isNaN(num)) return ''
      const ms = num > 1e12 ? num : num * 1000
      return new Date(ms).toLocaleString()
    } catch {
      return ''
    }
  })()

  return (
    <Stack gap="xs">
      <SectionLabel>Date to Timestamp</SectionLabel>
      <TextInput
        size="xs"
        radius="md"
        type="datetime-local"
        label="Select Date & Time"
        value={dateInput}
        onChange={(e) => setDateInput(e.target.value)}
      />
      {dateToTimestamp && <ResultField label="Unix Timestamp" value={dateToTimestamp} color="orange" />}

      <SectionLabel>Timestamp to Date</SectionLabel>
      <NumberInput
        size="xs"
        radius="md"
        label="Unix Timestamp"
        placeholder="e.g. 1707325692"
        hideControls
        value={timestampInput}
        onChange={setTimestampInput}
      />
      {timestampToDate && <ResultField label="Readable Date" value={timestampToDate} color="yellow" monospace={false} />}
    </Stack>
  )
}

// ─── Felt / String Converter ──────────────────────────────────────────────────

function FeltStringTool() {
  const [feltInput, setFeltInput] = useState('')
  const [stringInput, setStringInput] = useState('')

  const feltToString = (() => {
    if (!feltInput) return ''
    try {
      const bn = new BigNumber(feltInput)
      if (bn.isNaN()) return ''
      const hex = '0x' + bn.toString(16)
      return shortString.decodeShortString(hex)
    } catch {
      return ''
    }
  })()

  const stringToFelt = (() => {
    if (!stringInput) return ''
    try {
      return shortString.encodeShortString(stringInput)
    } catch {
      return 'String too long (max 31 chars)'
    }
  })()

  return (
    <Stack gap="xs">
      <SectionLabel>Felt to Short String</SectionLabel>
      <TextInput
        size="xs"
        radius="md"
        label="Felt Value"
        placeholder="e.g. 23448594291968334"
        value={feltInput}
        onChange={(e) => setFeltInput(e.target.value)}
        ff="monospace"
      />
      {feltToString && <ResultField label="Decoded String" value={feltToString} color="cyan" monospace={false} />}

      <SectionLabel>Short String to Felt</SectionLabel>
      <TextInput
        size="xs"
        radius="md"
        label="String (max 31 chars)"
        placeholder="e.g. SN_MAIN"
        value={stringInput}
        onChange={(e) => setStringInput(e.target.value)}
        maxLength={31}
      />
      {stringToFelt && <ResultField label="Encoded Felt" value={stringToFelt} color="indigo" />}
    </Stack>
  )
}

// ─── Transaction Lookup Tool ──────────────────────────────────────────────────

function TransactionLookupTool() {
  const { provider } = useAppContext()
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const lookupTransaction = async () => {
    if (!provider) {
      notifications.show({ title: 'No provider', message: 'Connect your wallet first.', color: 'orange' })
      return
    }
    if (!txHash.trim()) return

    try {
      setLoading(true)
      setResult(null)
      setError('')
      logsManager.logInfo(`Looking up transaction: ${txHash}`)

      const receipt = await provider.getTransactionReceipt(txHash)

      const serialized = JSON.parse(JSON.stringify(receipt, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ))

      setResult(serialized)
      logsManager.logSuccess(`Transaction lookup successful`)
    } catch (err: any) {
      const msg = err?.message || 'Transaction not found'
      setError(msg)
      logsManager.logError(`Transaction lookup failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    if (!result) return 'gray'
    const status = result.execution_status || result.statusReceipt
    if (status === 'SUCCEEDED') return 'green'
    if (status === 'REVERTED') return 'red'
    return 'orange'
  }

  const getStatusLabel = () => {
    if (!result) return ''
    return result.execution_status || result.statusReceipt || 'Unknown'
  }

  const getFinalityColor = () => {
    if (!result?.finality_status) return 'gray'
    if (result.finality_status === 'ACCEPTED_ON_L2') return 'blue'
    if (result.finality_status === 'ACCEPTED_ON_L1') return 'green'
    return 'orange'
  }

  return (
    <Stack gap="xs">
      <TextInput
        size="xs"
        radius="md"
        label="Transaction Hash"
        placeholder="0x..."
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        ff="monospace"
      />
      <Button
        size="xs"
        radius="md"
        variant="light"
        color="violet"
        leftSection={<IconSearch size={14} />}
        onClick={lookupTransaction}
        loading={loading}
        disabled={!txHash.trim()}
        fullWidth
      >
        Lookup
      </Button>

      {error && (
        <Paper
          radius="md"
          p="xs"
          bg={isDark ? 'rgba(255,0,0,0.08)' : theme.colors.red[0]}
          style={{ borderLeft: '3px solid var(--mantine-color-red-5)' }}
        >
          <Text size="xs" c="red" style={{ wordBreak: 'break-all' }}>{error}</Text>
        </Paper>
      )}

      {result && (
        <Stack gap={8}>
          {/* Status badges row */}
          <Group gap={6} wrap="wrap">
            <Badge
              variant="dot"
              color={getStatusColor()}
              size="sm"
            >
              {getStatusLabel()}
            </Badge>
            {result.finality_status && (
              <Badge
                variant="dot"
                color={getFinalityColor()}
                size="sm"
              >
                {result.finality_status.replace('ACCEPTED_ON_', 'L').replace('L_', '')}
              </Badge>
            )}
            {result.type && (
              <Badge variant="light" color="gray" size="sm">
                {result.type}
              </Badge>
            )}
          </Group>

          {/* Block info */}
          {result.block_number && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="gray" radius="xl">
                <IconCube size={10} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">Block</Text>
              <Text size="xs" ff="monospace" fw={600}>#{result.block_number}</Text>
            </Group>
          )}

          {/* Fee */}
          {result.actual_fee && (() => {
            const feeUnit = result.actual_fee.unit
            const tokenSymbol = feeUnit === 'FRI' ? 'STRK' : feeUnit === 'WEI' ? 'ETH' : feeUnit
            const rawAmount = new BigNumber(result.actual_fee.amount).toFixed(0)
            const humanAmount = new BigNumber(rawAmount).dividedBy(new BigNumber(10).pow(18)).toFixed()
            return (
              <ResultField
                label={`Fee (${tokenSymbol})`}
                value={`${humanAmount} ${tokenSymbol}`}
                color={tokenSymbol === 'STRK' ? 'violet' : 'blue'}
              />
            )
          })()}

          {/* Execution Resources */}
          {result.execution_resources && (
            <Paper
              radius="md"
              p="xs"
              bg={isDark ? theme.colors.darkColor[7] : theme.colors.gray[1]}
              style={{ borderLeft: '3px solid var(--mantine-color-gray-5)' }}
            >
              <Group gap={4} mb={4}>
                <IconServer size={10} color="gray" />
                <Text size="10px" tt="uppercase" fw={600} c="dimmed" lh={1}>Execution Resources</Text>
              </Group>
              <Group gap="md">
                {result.execution_resources.l1_gas != null && (
                  <Stack gap={0} align="center">
                    <Text size="xs" ff="monospace" fw={600}>{result.execution_resources.l1_gas.toLocaleString()}</Text>
                    <Text size="10px" c="dimmed">L1 Gas</Text>
                  </Stack>
                )}
                {result.execution_resources.l2_gas != null && (
                  <Stack gap={0} align="center">
                    <Text size="xs" ff="monospace" fw={600}>{result.execution_resources.l2_gas.toLocaleString()}</Text>
                    <Text size="10px" c="dimmed">L2 Gas</Text>
                  </Stack>
                )}
                {result.execution_resources.l1_data_gas != null && (
                  <Stack gap={0} align="center">
                    <Text size="xs" ff="monospace" fw={600}>{result.execution_resources.l1_data_gas.toLocaleString()}</Text>
                    <Text size="10px" c="dimmed">L1 Data</Text>
                  </Stack>
                )}
              </Group>
            </Paper>
          )}

          {/* Events count */}
          {result.events && result.events.length > 0 && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="yellow" radius="xl">
                <IconSparkles size={10} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">
                {result.events.length} event{result.events.length !== 1 ? 's' : ''} emitted
              </Text>
            </Group>
          )}

          {/* Messages sent */}
          {result.messages_sent && result.messages_sent.length > 0 && (
            <Group gap={6}>
              <ThemeIcon size="xs" variant="light" color="cyan" radius="xl">
                <IconArrowUp size={10} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">
                {result.messages_sent.length} message{result.messages_sent.length !== 1 ? 's' : ''} sent to L1
              </Text>
            </Group>
          )}

          {/* Revert reason */}
          {result.revert_reason && (
            <Paper
              radius="md"
              p="xs"
              bg={isDark ? 'rgba(255,0,0,0.08)' : theme.colors.red[0]}
              style={{ borderLeft: '3px solid var(--mantine-color-red-5)' }}
            >
              <Text size="10px" tt="uppercase" fw={600} c="red" mb={2}>Revert Reason</Text>
              <Text size="xs" c="red" ff="monospace" style={{ wordBreak: 'break-all' }}>
                {result.revert_reason}
              </Text>
            </Paper>
          )}

          {/* Raw JSON toggle */}
          <Accordion variant="subtle" radius="md" styles={{ control: { padding: '4px 0' }, panel: { padding: 0 } }}>
            <Accordion.Item value="raw">
              <Accordion.Control>
                <Text size="10px" tt="uppercase" fw={600} c="dimmed">Raw Receipt JSON</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Paper
                  bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                  radius="md"
                  p="xs"
                  style={{ maxHeight: 200, overflow: 'auto' }}
                >
                  <Text size="10px" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(result, null, 2)}
                  </Text>
                </Paper>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      )}
    </Stack>
  )
}

// ─── Universal Converter Tool ─────────────────────────────────────────────────

const FELT_MAX = new BigNumber('3618502788666131106986593281521497120414687020801267626233049500247285301248')
const MASK_128 = new BigNumber(2).pow(128).minus(1)
const MASK_86 = new BigNumber(2).pow(86).minus(1)

function isHexString(s: string) {
  return /^0x[0-9a-fA-F]+$/.test(s)
}

function isDecimalString(s: string) {
  return /^\d+$/.test(s)
}

function toBN(input: string): BigNumber {
  if (!input) return new BigNumber(0)
  if (isHexString(input)) return new BigNumber(input.slice(2), 16)
  if (isDecimalString(input)) return new BigNumber(input, 10)
  // treat as short string → encode each char
  let hex = ''
  for (let i = 0; i < input.length; i++) {
    hex += input.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return new BigNumber(hex, 16)
}

function toHexStr(bn: BigNumber): string {
  if (bn.isZero()) return '0x0'
  return '0x' + bn.toString(16)
}

function hexToAscii(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (!clean || clean.length % 2 !== 0) return ''
  let str = ''
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.substring(i, i + 2), 16)
    if (code < 32 || code > 126) return '' // non-printable
    str += String.fromCharCode(code)
  }
  return str
}

interface ConversionResult {
  label: string
  value: string
  color: string
  valid: boolean
  multiline?: boolean
}

function computeConversions(input: string): ConversionResult[] {
  if (!input.trim()) return []

  const results: ConversionResult[] = []

  try {
    const bn = toBN(input)
    const isValid = bn.lte(FELT_MAX) && bn.gte(0)

    // Felt (decimal)
    results.push({
      label: 'Felt (Decimal)',
      value: bn.toFixed(0),
      color: 'blue',
      valid: isValid,
    })

    // Hex
    results.push({
      label: 'Hex',
      value: toHexStr(bn),
      color: 'violet',
      valid: isValid,
    })

    // String (ASCII decode)
    const hexStr = bn.toString(16)
    const padded = hexStr.length % 2 !== 0 ? '0' + hexStr : hexStr
    const asciiStr = hexToAscii(padded)
    if (asciiStr) {
      results.push({
        label: 'String',
        value: asciiStr,
        color: 'cyan',
        valid: true,
      })
    }

    // Felt array (char codes) — only for string-like input
    if (!isHexString(input) && !isDecimalString(input) && input.length > 0) {
      const feltArr = input.split('').map((c) => c.charCodeAt(0).toString())
      results.push({
        label: 'Felt Array',
        value: feltArr.join(', '),
        color: 'teal',
        valid: true,
      })
    }

    // ByteArray — only for string-like input
    if (!isHexString(input) && !isDecimalString(input) && input.length > 0) {
      try {
        const ba = byteArray.byteArrayFromString(input)
        const serialized = JSON.stringify(ba, (_k, v) => typeof v === 'bigint' ? v.toString() : v, 2)
        results.push({
          label: 'ByteArray',
          value: serialized,
          color: 'grape',
          valid: true,
          multiline: true,
        })
      } catch { /* skip */ }
    }

    // Selector — only for non-hex, non-decimal (function name)
    if (!isHexString(input) && !isDecimalString(input) && input.length > 0) {
      try {
        const sel = hash.getSelectorFromName(input)
        results.push({
          label: 'Selector',
          value: sel,
          color: 'pink',
          valid: true,
        })
      } catch { /* skip */ }
    }

    // uint256 (low, high)
    if (isValid && !bn.isNaN()) {
      const low = bn.mod(MASK_128.plus(1)).toFixed(0)
      const high = bn.dividedToIntegerBy(MASK_128.plus(1)).toFixed(0)
      const lowHex = toHexStr(new BigNumber(low))
      const highHex = toHexStr(new BigNumber(high))
      results.push({
        label: 'uint256 (low, high)',
        value: `low: ${low}\nhigh: ${high}\n\nlow: ${lowHex}\nhigh: ${highHex}`,
        color: 'orange',
        valid: true,
        multiline: true,
      })
    }

    // Big3 (d0, d1, d2) — 86-bit limbs
    if (isValid && !bn.isNaN()) {
      const d0 = bn.mod(MASK_86.plus(1)).toFixed(0)
      const d1 = bn.dividedToIntegerBy(MASK_86.plus(1)).mod(MASK_86.plus(1)).toFixed(0)
      const d2 = bn.dividedToIntegerBy(new BigNumber(2).pow(172)).toFixed(0)
      const d0Hex = toHexStr(new BigNumber(d0))
      const d1Hex = toHexStr(new BigNumber(d1))
      const d2Hex = toHexStr(new BigNumber(d2))
      results.push({
        label: 'Big3 (d0, d1, d2)',
        value: `d0: ${d0}\nd1: ${d1}\nd2: ${d2}\n\nd0: ${d0Hex}\nd1: ${d1Hex}\nd2: ${d2Hex}`,
        color: 'yellow',
        valid: true,
        multiline: true,
      })
    }
  } catch {
    // If all parsing fails, no results
  }

  return results
}

function UniversalConverterTool() {
  const [input, setInput] = useState('')
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const conversions = computeConversions(input)

  const inputType = (() => {
    if (!input.trim()) return null
    if (isHexString(input)) return 'hex'
    if (isDecimalString(input)) return 'decimal'
    return 'string'
  })()

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">Enter any value — hex, decimal, or string — and see all conversions at once.</Text>
      <TextInput
        size="xs"
        radius="md"
        placeholder="0x1a4, 420, transfer, SN_MAIN..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        ff="monospace"
        rightSection={
          inputType ? (
            <Badge variant="light" color={inputType === 'hex' ? 'violet' : inputType === 'decimal' ? 'blue' : 'cyan'} size="xs" mr={4}>
              {inputType}
            </Badge>
          ) : undefined
        }
        rightSectionWidth={70}
      />
      {conversions.length > 0 && (
        <Stack gap={6}>
          {conversions.map((conv) => (
            <Paper
              key={conv.label}
              radius="md"
              p="xs"
              bg={isDark ? theme.colors.darkColor[7] : theme.colors.gray[1]}
              style={{
                borderLeft: `3px solid var(--mantine-color-${conv.color}-5)`,
                opacity: conv.valid ? 1 : 0.5,
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={4}>
                    <Text size="10px" tt="uppercase" fw={600} c="dimmed" lh={1}>{conv.label}</Text>
                    {!conv.valid && (
                      <Badge variant="light" color="red" size="xs">overflow</Badge>
                    )}
                  </Group>
                  <Text
                    size="xs"
                    ff="monospace"
                    style={{
                      wordBreak: 'break-all',
                      whiteSpace: conv.multiline ? 'pre-wrap' : undefined,
                    }}
                    lh={1.4}
                  >
                    {conv.value}
                  </Text>
                </Stack>
                <CopyButton value={conv.value}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="left">
                      <ActionIcon variant="subtle" size="xs" color={copied ? 'green' : 'gray'} onClick={copy} mt={2}>
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

// ─── Starknet ID Resolver Tool ────────────────────────────────────────────────

function StarknetIdTool() {
  const { activeNetwork } = useAppContext()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ address?: string; domain?: string; error?: string } | null>(null)

  const getApiNetwork = () => {
    if (activeNetwork === 'mainnet') return 'mainnet'
    return 'sepolia'
  }

  const isStarkDomain = (val: string) => val.trim().endsWith('.stark')
  const isAddress = (val: string) => val.trim().startsWith('0x') && val.trim().length > 10

  const handleResolve = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setLoading(true)
    setResult(null)

    const network = getApiNetwork()

    try {
      if (isStarkDomain(trimmed)) {
        // Domain → Address
        // const domain = trimmed.replace('.stark', '')
        const domain = trimmed
        const res = await fetch(`https://api.starknet.id/domain_to_addr?domain=${domain}&network=${network}`)
        const data = await res.json()
        if (data.addr) {
          setResult({ address: data.addr, domain: trimmed })
        } else {
          setResult({ error: data.error || 'Domain not found' })
        }
      } else if (isAddress(trimmed)) {
        // Address → Domain
        const res = await fetch(`https://api.starknet.id/addr_to_domain?addr=${trimmed}&network=${network}`)
        const data = await res.json()
        if (data.domain) {
          setResult({ domain: `${data.domain}.stark`, address: trimmed })
        } else {
          setResult({ error: data.error || 'No .stark name found for this address' })
        }
      } else {
        // Assume it's a domain without .stark suffix
        const res = await fetch(`https://api.starknet.id/domain_to_addr?domain=${trimmed}&network=${network}`)
        const data = await res.json()
        if (data.addr) {
          setResult({ address: data.addr, domain: `${trimmed}.stark` })
        } else {
          setResult({ error: data.error || 'Domain not found' })
        }
      }
    } catch (err: any) {
      setResult({ error: err?.message || 'Failed to resolve' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        Resolve a .stark name to an address, or an address to its .stark name.
      </Text>
      <TextInput
        size="xs"
        radius="md"
        placeholder="dalmasonto.stark or 0x04a1..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        ff="monospace"
        onKeyDown={(e) => { if (e.key === 'Enter') handleResolve() }}
        rightSection={
          <Badge variant="light" color="gray" size="xs" mr={4}>
            {getApiNetwork()}
          </Badge>
        }
        rightSectionWidth={70}
      />
      <Button
        size="xs"
        radius="md"
        variant="light"
        color="violet"
        leftSection={<IconSearch size={14} />}
        onClick={handleResolve}
        loading={loading}
        disabled={!input.trim()}
        fullWidth
      >
        Resolve
      </Button>

      {result?.error && (
        <ResultField label="Error" value={result.error} color="red" monospace={false} />
      )}

      {result?.domain && !result?.error && (
        <ResultField label="Stark Name" value={result.domain} color="pink" monospace={false} />
      )}

      {result?.address && !result?.error && (
        <ResultField label="Address" value={result.address} color="violet" />
      )}
    </Stack>
  )
}

// ─── Accordion Item Wrapper ──────────────────────────────────────────────────

interface ToolItemProps {
  value: string
  icon: React.ReactNode
  iconColor: string
  label: string
  children: React.ReactNode
}

function ToolItem({ value, icon, iconColor, label, children }: ToolItemProps) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Control
        icon={
          <ThemeIcon size={24} radius="md" variant="light" color={iconColor}>
            {icon}
          </ThemeIcon>
        }
      >
        <Text size="xs" fw={600}>{label}</Text>
      </Accordion.Control>
      <Accordion.Panel>
        {children}
      </Accordion.Panel>
    </Accordion.Item>
  )
}

// ─── Main HandyTools Component ────────────────────────────────────────────────

export default function HandyTools({onClose}: { onClose: () => void }) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  return (
    <>
      <AppShell.Section h={"60px"} style={{
        borderBottom: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[3]}`
      }}>
        <Group gap="xs" px={"md"} align="center" h={"100%"}>
          <ThemeIcon size="md" variant="gradient" gradient={{ from: 'violet', to: 'grape', deg: 135 }} radius="md">
            <IconSparkles size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600}>Handy Tools</Text>
          <Badge variant="light" color="violet" size="xs" radius="sm">10</Badge>
          <ActionIcon onClick={onClose} variant="light" size="md" color={isDark ? "gray" : "darkColor"} radius="md" ml="auto">
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </AppShell.Section>
      <AppShell.Section grow component={ScrollAreaAutosize} scrollbars="y" p={"md"}>
        {/* <ScrollArea h="100%" offsetScrollbars scrollbars="y"> */}
        <Stack gap="sm">
          <Accordion
            variant="separated"
            radius="md"
            multiple
            defaultValue={['large-number']}
            styles={{
              item: {
                backgroundColor: isDark ? theme.colors.darkColor[8] : theme.colors.gray[0],
                border: `1px solid ${isDark ? theme.colors.darkColor[6] : theme.colors.gray[2]}`,
                '&[data-active]': {
                  borderColor: isDark ? theme.colors.darkColor[5] : theme.colors.gray[3],
                },
              },
              control: {
                padding: '6px 10px',
                borderRadius: theme.radius.md,
              },
              panel: {
                padding: '0 10px 10px',
              },
              chevron: {
                width: 16,
                height: 16,
              },
            }}
          >
            <ToolItem value="universal-converter" icon={<IconSwitchHorizontal size={13} />} iconColor="grape" label="Universal Converter">
              <UniversalConverterTool />
            </ToolItem>

            <ToolItem value="large-number" icon={<IconArrowUp size={13} />} iconColor="blue" label="Large Number Creator">
              <LargeNumberTool />
            </ToolItem>

            <ToolItem value="reverse-number" icon={<IconArrowDown size={13} />} iconColor="teal" label="Reverse Large Number">
              <ReverseNumberTool />
            </ToolItem>

            <ToolItem value="approve-token" icon={<IconChecks size={13} />} iconColor="green" label="Approve Token">
              <ApproveTokenTool />
            </ToolItem>

            <ToolItem value="block-timestamp" icon={<IconClock size={13} />} iconColor="violet" label="Block Timestamp">
              <BlockTimestampTool />
            </ToolItem>

            <ToolItem value="timestamp-converter" icon={<IconCalendarTime size={13} />} iconColor="orange" label="Date / Timestamp">
              <TimestampConverterTool />
            </ToolItem>

            <ToolItem value="felt-string" icon={<IconLetterCase size={13} />} iconColor="cyan" label="Felt / String">
              <FeltStringTool />
            </ToolItem>

            <ToolItem value="tx-lookup" icon={<IconReceipt size={13} />} iconColor="pink" label="Transaction Lookup">
              <TransactionLookupTool />
            </ToolItem>

            <ToolItem value="starknet-id" icon={<IconAt size={13} />} iconColor="indigo" label="Starknet ID (.stark)">
              <StarknetIdTool />
            </ToolItem>

            <ToolItem value="notes" icon={<IconNote size={13} />} iconColor="teal" label="Notes">
              <NotesTool />
            </ToolItem>
          </Accordion>
        </Stack>
        {/* </ScrollArea> */}
      </AppShell.Section>
    </>
  )
}
