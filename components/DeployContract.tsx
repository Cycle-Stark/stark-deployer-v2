import {
  Paper,
  Text,
  Group,
  Stepper,
  TextInput,
  Button,
  Stack,
  Badge,
  ActionIcon,
  ScrollArea,
  Grid,
  em,
  useMantineColorScheme,
  useMantineTheme,
  Alert,
  CopyButton,
  Tooltip,
  ThemeIcon,
} from '@mantine/core';
import { useState } from 'react';
import {
  IconFileCode,
  IconSettings,
  IconFileText,
  IconTool,
  IconRocket,
  IconScan,
  IconFlagSearch,
  IconFileBarcode,
  IconShield,
  IconArrowRight,
  IconFilePlus,
  IconHash,
  IconCalculator,
  IconCoin,
  IconSend,
  IconListTree,
  IconAlertTriangle,
  IconBraces,
  IconCheck,
  IconCopy,
  IconConfetti,
  IconArrowLeft,
} from '@tabler/icons-react';
import InnerLayout from '@/layouts/InnerLayout';
import CustomCardWithHeaderAndFooter from './common/CustomCardWithHeaderAndFooter';
import { Dropzone } from '@mantine/dropzone';
// useRef removed - no longer needed for dropzone refs
import { useForm } from '@mantine/form';
import { formatFileSize, getCallDataItems, parseABI, readMultipleFiles } from './utils';
import { logsManager } from '@/storage/logsDatabase';
import { contractsManager } from '@/storage/contractsDatabase';
import { RpcProvider, Account, hash, EstimateFeeResponseOverhead, num, SuccessfulTransactionReceiptResponse, RevertedTransactionReceiptResponse, AbiEntry, CallData, RpcError } from 'starknet';
import { CallDataItem } from './contracts/CallDataItem';
// import { getCallDataItems } from './utils/contracts';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';
import { useAppContext } from '@/contexts/AppContext';
import BigNumber from 'bignumber.js';
import { useSettings } from '@/hooks/useSettings';


type ArtifactType = 'sierra' | 'casm' | 'unknown'

const MAX_CONTRACT_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Detect whether a JSON file is a Sierra or CASM artifact.
 * Sierra files contain `sierra_program` and `abi`.
 * CASM files contain `bytecode` or `prime` (compiled_contract_class).
 */
async function detectArtifactType(file: File): Promise<{ type: ArtifactType; content: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        const json = JSON.parse(content)
        if (json.sierra_program || (json.abi && json.contract_class_version)) {
          resolve({ type: 'sierra', content })
        } else if (json.bytecode || json.prime || json.compiler_version) {
          resolve({ type: 'casm', content })
        } else {
          resolve({ type: 'unknown', content })
        }
      } catch {
        resolve({ type: 'unknown', content })
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

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

export function DeployContract() {

  const { connectedAccount, provider, activeWalletAddress, activeNetwork } = useAppContext()

  const { settings } = useSettings();

  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deployedContractId, setDeployedContractId] = useState<string | null>(null)
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])

  const router = useRouter()

  const form = useForm({
    initialValues: {
      casm: null as File | null,
      sierra: null as File | null,
      casmContent: "",
      sierraContent: "",
      contractName: "",
      declarationFee: "",
      compiledClassHash: "",
      declaredClassHash: "",
      declareTxHash: "",
      constructorInputs: [],
      callData: [],
      constructorCallData: [],
      deploymentFee: "",
      deployTxHash: "",
      deployedAddress: "",
    }
  })

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const getConstructorInputs = (abi: AbiEntry[]) => {
    const constructor = abi.find((item: any) => item.type === "constructor") as any
    return constructor?.inputs ?? []
  }

  // Smart drop handler: filter by type/size, then iterate to find sierra & casm
  const handleFileDrop = async (files: File[]) => {
    setRejectedFiles([])
    const newRejected: string[] = []

    // Filter to only valid JSON files under 5 MB
    const validFiles: File[] = []
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        newRejected.push(file.name)
        notifications.show({
          title: 'Invalid file type',
          message: `"${file.name}" is not a JSON file. Only .json files are accepted.`,
          color: 'red',
        })
        logsManager.logWarning(`Rejected "${file.name}" — not a .json file`)
        continue
      }
      if (file.size > MAX_CONTRACT_FILE_SIZE) {
        newRejected.push(file.name)
        notifications.show({
          title: 'File too large',
          message: `"${file.name}" (${formatFileSize(file.size)}) exceeds the 5 MB limit.`,
          color: 'red',
        })
        logsManager.logWarning(`Rejected "${file.name}" — ${formatFileSize(file.size)} exceeds 5 MB limit`)
        continue
      }
      validFiles.push(file)
    }

    // Iterate through valid files to find sierra and casm artifacts
    let foundSierra = false
    let foundCasm = false

    for (const file of validFiles) {
      // Skip once we've found both
      if (foundSierra && foundCasm) {
        newRejected.push(file.name)
        logsManager.logWarning(`Skipped "${file.name}" — Sierra and CASM already assigned`)
        continue
      }

      try {
        const result = await detectArtifactType(file)
        if (result.type === 'sierra' && !foundSierra) {
          foundSierra = true
          form.setFieldValue('sierra', file)
          logsManager.logInfo(`Detected Sierra artifact: ${file.name} (${formatFileSize(file.size)})`)
        } else if (result.type === 'casm' && !foundCasm) {
          foundCasm = true
          form.setFieldValue('casm', file)
          logsManager.logInfo(`Detected CASM artifact: ${file.name} (${formatFileSize(file.size)})`)
        } else {
          newRejected.push(file.name)
          logsManager.logWarning(`Rejected "${file.name}" — not a recognized contract artifact`)
          notifications.show({
            title: 'Unrecognized file',
            message: `"${file.name}" is not a Sierra or CASM contract artifact.`,
            color: 'orange',
          })
        }
      } catch (err: any) {
        newRejected.push(file.name)
        logsManager.logError(`Failed to read "${file.name}": ${err?.message ?? String(err)}`)
      }
    }

    setRejectedFiles(newRejected)
  }

  const handleFilesRejected = (rejections: any[]) => {
    const newRejected: string[] = []
    for (const rejection of rejections) {
      const name = rejection.file?.name ?? 'unknown'
      newRejected.push(name)
      for (const error of rejection.errors ?? []) {
        if (error.code === 'file-too-large') {
          notifications.show({
            title: 'File too large',
            message: `"${name}" exceeds the 5 MB limit.`,
            color: 'red',
          })
          logsManager.logWarning(`Rejected "${name}" — exceeds 5 MB limit`)
        } else if (error.code === 'file-invalid-type') {
          notifications.show({
            title: 'Invalid file type',
            message: `"${name}" is not a JSON file.`,
            color: 'red',
          })
          logsManager.logWarning(`Rejected "${name}" — not a .json file`)
        } else {
          notifications.show({
            title: 'File rejected',
            message: `"${name}": ${error.message}`,
            color: 'red',
          })
          logsManager.logWarning(`Rejected "${name}" — ${error.message}`)
        }
      }
    }
    setRejectedFiles((prev) => [...prev, ...newRejected])
  }

  // Remove a specific artifact slot
  const clearArtifact = (type: 'casm' | 'sierra') => {
    form.setFieldValue(type, null)
    form.setFieldValue(`${type}Content`, '')
    logsManager.logInfo(`Cleared ${type.toUpperCase()} artifact`)
  }

  const parseArtifacts = async () => {
    try {
      const sierraFile: File | null = form.values.sierra
      const casmFile: File | null = form.values.casm
      if (casmFile === null || sierraFile === null) {
        logsManager.logError("CASM and Sierra files are required")
        notifications.show({
          title: 'Missing Files',
          message: 'Both CASM and Sierra files are required to parse artifacts.',
          color: 'red',
        })
        return
      }

      setLoading(true)
      const [casmContent, sierraContent] = await readMultipleFiles([casmFile, sierraFile])
      form.setFieldValue("casmContent", casmContent)
      form.setFieldValue("sierraContent", sierraContent)

      logsManager.logInfo("Artifacts parsed successfully")
      logsManager.logInfo(`SIERRA: ${sierraFile.name} (${formatFileSize(sierraFile.size)})`)
      logsManager.logInfo(`CASM: ${casmFile.name} (${formatFileSize(casmFile.size)})`)
      notifications.show({
        title: 'Artifacts Parsed',
        message: `Sierra (${formatFileSize(sierraFile.size)}) and CASM (${formatFileSize(casmFile.size)}) parsed successfully.`,
        color: 'green',
      })

      const name = getImpliedContractName(sierraContent)
      form.setFieldValue("contractName", name)

      const compiledClassHash = hash.computeSierraContractClassHash(JSON.parse(sierraContent))
      form.setFieldValue("compiledClassHash", compiledClassHash)

      const constructorInputs = getCallDataItems(getConstructorInputs(JSON.parse(sierraContent).abi))
      form.setFieldValue("callData", constructorInputs as any)

      setLoading(false)
      setActive(1)
    } catch (error: any) {
      logsManager.logError(error?.message ?? String(error))
      notifications.show({
        title: 'Parse Failed',
        message: error?.message ?? String(error),
        color: 'red',
      })
      setLoading(false)
    }
  }

  const getFileSize = (file: File | null) => {
    if (!file) return "0 kB"
    return formatFileSize(file.size)
  }

  const hasConstructor = () => {
    if (form.values.sierraContent === "") return false
    const abi = JSON.parse(form.values.sierraContent).abi
    return abi.some((item: any) => item.type === "constructor")
  }

  const getImpliedContractName = (abi: string) => {
    if (abi === "") return ""
    try {
      const abiJson = JSON.parse(abi)
      // Find the first event in the ABI
      const firstEvent = abiJson.abi?.find((item: any) => item.type === "event")

      if (firstEvent && firstEvent.name) {
        // Split by :: and get the second last item
        const nameParts = firstEvent.name.split("::")
        if (nameParts.length >= 2) {
          return nameParts[nameParts.length - 2]
        }
      }

      return ""
    } catch (error) {
      return ""
    }
  }

  const estimateDeclarationGasFee = async () => {
    if (!connectedAccount) {
      logsManager.logError("Connected account required for gas estimation")
      notifications.show({
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to estimate declaration fees.',
        color: 'red',
      })
      return null
    }
    try {
      if (!form.values.casmContent || !form.values.sierraContent) {
        logsManager.logError("CASM and Sierra content required for gas estimation")
        notifications.show({
          title: 'Missing Artifacts',
          message: 'CASM and Sierra content are required for gas estimation.',
          color: 'red',
        })
        return null
      }

      setLoading(true)

      // Initialize provider (using Sepolia testnet)
      // const provider = new RpcProvider({
      //   nodeUrl: "http://localhost:5050"
      // })
      // const account = new Account({
      //   provider,
      //   address: "0x01e6099bb8f28eb2d638780acd21401085ee8f2e4e89795200d8bf32f4576b83",
      //   signer: "0x0000000000000000000000000000000084feb7216f5ad02148181df2321bb989"
      // })

      // Parse the contract artifacts
      const sierraCode = JSON.parse(form.values.sierraContent)
      const casmCode = JSON.parse(form.values.casmContent)

      // Estimate declare transaction fee
      console.log(provider)
      console.log(connectedAccount)
      const declareEstimate: EstimateFeeResponseOverhead = await connectedAccount.estimateDeclareFee({
        contract: sierraCode,
        casm: casmCode,
        // classHash: form.values.compiledClassHash,
        // compiledClassHash: form.values.compiledClassHash,
      } as any)

      logsManager.logSuccess("Declaration gas fee estimated successfully")
      logsManager.logInfo(`Estimated declaration transaction fee:`)
      logsManager.logInfo(`${JSON.stringify(declareEstimate, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 4)}`)

      // Convert fee to human-readable format (overall_fee is bigint, STRK/ETH have 18 decimals)
      const DECIMALS_18 = new BigNumber(10).pow(18)
      const feeRaw = new BigNumber(declareEstimate.overall_fee.toString())
      let declarationFee = ""

      logsManager.logInfo(`Estimated declaration fee: ${declareEstimate.overall_fee} ${declareEstimate.unit}`)

      if (declareEstimate.unit === "FRI") {
        const feeInStrk = feeRaw.dividedBy(DECIMALS_18)
        logsManager.logInfo(`Fee in STRK: ${feeInStrk.toFixed(6)} STRK`)
        declarationFee = `${feeInStrk.toFixed(6)} STRK`
      } else {
        const feeInEth = feeRaw.dividedBy(DECIMALS_18)
        logsManager.logInfo(`Fee in ETH: ${feeInEth.toFixed(6)} ETH`)
        declarationFee = `${feeInEth.toFixed(6)} ETH`
      }

      // Store the fee in form for display
      form.setFieldValue("declarationFee", declarationFee)
      notifications.show({
        title: 'Fee Estimated',
        message: `Declaration fee: ~${declarationFee}`,
        color: 'green',
      })
      setLoading(false)
    } catch (error: any) {
      if ((JSON.stringify(error)).includes("is already declared")) {
        logsManager.logWarning("Contract is already declared")
        form.setFieldValue("declarationFee", "[ALREADY DECLARED]")
        form.setFieldValue("declaredClassHash", form.values.compiledClassHash)
        notifications.show({
          title: 'Already Declared',
          message: 'This contract class is already declared on-chain. You can skip to deployment.',
          color: 'blue',
        })
      } else {
        logsManager.logError(`Gas estimation failed: ${error.message ? error.message : error}`)
        notifications.show({
          title: 'Fee Estimation Failed',
          message: error.message ? error.message : String(error),
          color: 'red',
        })
      }
      setLoading(false)
      return null
    }
  }

  const declareContract = async () => {
    if (!connectedAccount) {
      logsManager.logError("Connected account required for gas estimation")
      notifications.show({
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to declare the contract.',
        color: 'red',
      })
      return null
    }
    try {
      setLoading(true)
      // const provider = new RpcProvider({
      //   nodeUrl: "http://localhost:5050"
      // })
      // const account = new Account({
      //   provider,
      //   address: "0x01e6099bb8f28eb2d638780acd21401085ee8f2e4e89795200d8bf32f4576b83",
      //   signer: "0x0000000000000000000000000000000084feb7216f5ad02148181df2321bb989"
      // })

      const sierraCode = JSON.parse(form.values.sierraContent)
      const casmCode = JSON.parse(form.values.casmContent)

      const declareResponse = await connectedAccount.declareIfNot({
        // compiledClassHash: form.values.compiledClassHash,
        contract: sierraCode,
        // classHash: form.values.declaredClassHash,
        casm: casmCode,
      })

      logsManager.logSuccess("Contract declared successfully")
      logsManager.logInfo("Declare response:")
      logsManager.logInfo(`${JSON.stringify(declareResponse, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 4)}`)

      const classHash = declareResponse.class_hash
      logsManager.logInfo(`Class hash: ${classHash}`)
      form.setFieldValue("declaredClassHash", classHash)

      const txHash = declareResponse.transaction_hash

      if (txHash) {
        form.setFieldValue("declareTxHash", txHash)
        logsManager.logInfo(`Transaction hash: ${txHash}`)
        notifications.show({
          title: 'Declaration Submitted',
          message: 'Waiting for transaction confirmation...',
          color: 'blue',
        })
        const txR = await provider.waitForTransaction(txHash)

        txR.match({
          SUCCEEDED: (txR: SuccessfulTransactionReceiptResponse) => {
            logsManager.logSuccess("Declaration transaction succesful")
            logsManager.logInfo(`Transaction`)
            logsManager.logInfo(`${JSON.stringify(txR, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)
            notifications.show({
              title: 'Declaration Confirmed',
              message: `Contract class declared successfully.`,
              color: 'green',
            })
          },
          REVERTED: (txR: RevertedTransactionReceiptResponse) => {
            logsManager.logError("Declaration transaction reverted")
            logsManager.logInfo(`${JSON.stringify(txR, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)
            notifications.show({
              title: 'Declaration Reverted',
              message: 'The declaration transaction was reverted by the network.',
              color: 'red',
            })
          },
          ERROR: (err: Error) => {
            logsManager.logError("Declaration transaction failed")
            logsManager.logInfo(`${JSON.stringify(err, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)
            notifications.show({
              title: 'Declaration Failed',
              message: 'The declaration transaction failed.',
              color: 'red',
            })
          },
        });
      } else {
        logsManager.logSuccess("Class hash already declared")
        notifications.show({
          title: 'Already Declared',
          message: 'Class hash was already declared. Proceeding to next step.',
          color: 'blue',
        })
      }

      setLoading(false)
      // Go to step 3
      setActive(3)
    } catch (error: any) {
      logsManager.logError(`Declaration failed: ${error.message ? error.message : error}`)
      notifications.show({
        title: 'Declaration Failed',
        message: error.message ? error.message : String(error),
        color: 'red',
      })
      setLoading(false)
      return null
    }
  }

  const estimateDeploymentGasFee = async () => {
    console.log("Estimate deploy fee: ", connectedAccount)
    if (!connectedAccount) {
      logsManager.logError("Connected account required for gas estimation")
      notifications.show({
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to estimate deployment fees.',
        color: 'red',
      })
      return null
    }
    try {
      if (!form.values.declaredClassHash || !form.values.compiledClassHash) {
        logsManager.logError("Declared class hash required for gas estimation")
        notifications.show({
          title: 'Missing Class Hash',
          message: 'Declared class hash is required. Please declare the contract first.',
          color: 'red',
        })
        return null
      }

      setLoading(true)

      // Initialize provider (using Sepolia testnet)
      // const provider = new RpcProvider({
      //   nodeUrl: "http://localhost:5050"
      // })
      // const account = new Account({
      //   provider,
      //   address: "0x01e6099bb8f28eb2d638780acd21401085ee8f2e4e89795200d8bf32f4576b83",
      //   signer: "0x0000000000000000000000000000000084feb7216f5ad02148181df2321bb989"
      // })

      // Estimate declare transaction fee
      const deployEstimate: EstimateFeeResponseOverhead = await connectedAccount.estimateDeployFee({
        classHash: form.values.declaredClassHash || form.values.compiledClassHash,
        constructorCalldata: form.values.constructorCallData
      })

      logsManager.logSuccess("Deployment gas fee estimated successfully")
      logsManager.logInfo(`Estimated deployment transaction fee:`)
      logsManager.logInfo(`${JSON.stringify(deployEstimate, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 4)}`)

      // Convert fee to human-readable format (overall_fee is bigint, STRK/ETH have 18 decimals)
      const DECIMALS_18 = new BigNumber(10).pow(18)
      const feeRaw = new BigNumber(deployEstimate.overall_fee.toString())
      let deploymentFee = ""

      logsManager.logInfo(`Estimated deployment fee: ${deployEstimate.overall_fee} ${deployEstimate.unit}`)
      if (deployEstimate.unit === "FRI") {
        const feeInStrk = feeRaw.dividedBy(DECIMALS_18)
        logsManager.logInfo(`Fee in STRK: ${feeInStrk.toFixed(6)} STRK`)
        deploymentFee = `${feeInStrk.toFixed(6)} STRK`
      } else {
        const feeInEth = feeRaw.dividedBy(DECIMALS_18)
        logsManager.logInfo(`Fee in ETH: ${feeInEth.toFixed(6)} ETH`)
        deploymentFee = `${feeInEth.toFixed(6)} ETH`
      }

      // Store the fee in form for display
      form.setFieldValue("deploymentFee", deploymentFee)
      notifications.show({
        title: 'Fee Estimated',
        message: `Deployment fee: ~${deploymentFee}`,
        color: 'green',
      })
      setLoading(false)
    } catch (error: any) {
      console.log("Error: ", error)
      if ((JSON.stringify(error)).includes("is already declared")) {
        logsManager.logWarning("Contract is already declared")
        form.setFieldValue("declarationFee", "[ALREADY DECLARED]")
        notifications.show({
          title: 'Already Declared',
          message: 'This contract class is already declared.',
          color: 'blue',
        })
      } else {
        logsManager.logError(`Gas estimation failed: ${error}`)
        notifications.show({
          title: 'Fee Estimation Failed',
          message: error?.message ? error.message : String(error),
          color: 'red',
        })
      }
      setLoading(false)
      return null
    }
  }

  const deployContract = async () => {
    console.log("Forms: ", form.values)
    if (!connectedAccount) {
      logsManager.logError("Connected account required for gas estimation")
      notifications.show({
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to deploy the contract.',
        color: 'red',
      })
      return null
    }
    try {
      setLoading(true)
      // const provider = new RpcProvider({
      //   nodeUrl: "http://localhost:5050"
      // })
      // const account = new Account({
      //   provider,
      //   address: "0x01e6099bb8f28eb2d638780acd21401085ee8f2e4e89795200d8bf32f4576b83",
      //   signer: "0x0000000000000000000000000000000084feb7216f5ad02148181df2321bb989"
      // })

      // const sierraCode = JSON.parse(form.values.sierraContent)
      // const casmCode = JSON.parse(form.values.casmContent)

      const deployResponse = await connectedAccount.deployContract({
        // compiledClassHash: form.values.compiledClassHash,
        classHash: form.values.compiledClassHash,
        constructorCalldata: form.values.constructorCallData,
      })

      logsManager.logSuccess("Contract deployed successfully")
      logsManager.logSuccess(`Contract hash: ${form.values.declaredClassHash}`)
      logsManager.logSuccess(`Deployed contract address: ${deployResponse.contract_address}`)

      logsManager.logInfo("Deploy response:")
      logsManager.logInfo(`${JSON.stringify(deployResponse, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 4)}`)

      const classHash = form.values.compiledClassHash
      logsManager.logInfo(`Contract deployed successfully with class hash: ${classHash}`)
      form.setFieldValue("deployedAddress", deployResponse.contract_address)

      const txHash = deployResponse.transaction_hash

      if (txHash) {
        form.setFieldValue("deployTxHash", txHash)
        logsManager.logInfo(`Transaction hash: ${txHash}`)
        notifications.show({
          title: 'Deployment Submitted',
          message: 'Waiting for transaction confirmation...',
          color: 'blue',
        })
        const txR = await provider.waitForTransaction(txHash)

        txR.match({
          SUCCEEDED: async (txR: SuccessfulTransactionReceiptResponse) => {
            logsManager.logSuccess("Deployment transaction succesful")
            logsManager.logInfo(`Transaction`)
            logsManager.logInfo(`${JSON.stringify(txR, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)

            // Save the contract to the database
            try {
              const contractData = {
                name: form.values.contractName || `Contract-${Date.now()}`,
                address: deployResponse.contract_address,
                abi: JSON.stringify(parseABI(JSON.parse(form.values.sierraContent).abi)),
                sierra: form.values.sierraContent,
                casm: form.values.casmContent,
                classHash: classHash,
                txHash: txHash,
                txReceipt: JSON.stringify(txR),
                deployerAddress: activeWalletAddress,
                chain: settings?.activeChain,
                network: settings?.activeNetwork,
                deployedAt: new Date(),
                status: 'deployed' as const,
                constructorArgs: form.values.constructorCallData,
                callData: form.values.callData,
                description: `Contract deployed via Stark Deployer at ${new Date().toLocaleString()}`
              };

              const contractId = await contractsManager.create(contractData);
              setDeployedContractId(`${contractId}`)
              logsManager.logSuccess(`Contract saved to database with ID: ${contractId}`);

              notifications.show({
                title: 'Contract Deployed Successfully!',
                message: `Contract ${contractData.name} has been deployed and saved to your contracts database.`,
                color: 'green',
              });

            } catch (dbError) {
              logsManager.logError(`Failed to save contract to database: ${dbError}`);
              notifications.show({
                title: 'Database Error',
                message: 'Contract deployed successfully but failed to save to database.',
                color: 'orange',
              });
            }
          },
          REVERTED: (txR: RevertedTransactionReceiptResponse) => {
            logsManager.logError("Deployment transaction reverted")
            logsManager.logInfo(`${JSON.stringify(txR, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)
            notifications.show({
              title: 'Deployment Reverted',
              message: 'The deployment transaction was reverted by the network.',
              color: 'red',
            })
          },
          ERROR: (err: Error) => {
            logsManager.logError("Deployment transaction failed")
            logsManager.logInfo(`${JSON.stringify(err, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 4)}`)
            notifications.show({
              title: 'Deployment Failed',
              message: 'The deployment transaction failed.',
              color: 'red',
            })
          },
        });
      } else {
        logsManager.logError("Something went wrong!")
        notifications.show({
          title: 'Deployment Error',
          message: 'No transaction hash returned. Something went wrong.',
          color: 'red',
        })
      }

      setLoading(false)
      // Go to step 5 ->> Completed
      setActive(5)
    } catch (error: any) {
      console.log("Error: ", error)
      logsManager.logError(`Deployment failed: ${error?.message ? error?.message : error}`)
      notifications.show({
        title: 'Deployment Failed',
        message: error?.message ? error.message : String(error),
        color: 'red',
      })
      setLoading(false)
      return null
    }
  }


  const computeCallData = () => {
    try {
      const abi = JSON.parse(form.values.sierraContent).abi
      const args: Record<string, any> = {}
      form.values.callData.forEach((input: any) => {
        args[input.name] = input.value
      })
      const callData = new CallData(abi).compile("constructor", args)
      form.setFieldValue("constructorCallData", callData as any)
      logsManager.logInfo(`Call data computed successfully`)
      logsManager.logInfo(`${JSON.stringify(callData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 4)}`)
      notifications.show({
        title: 'Call Data Ready',
        message: 'Constructor call data compiled successfully.',
        color: 'green',
      })
      setActive(4)
      return callData
    } catch (error: any) {
      logsManager.logError(`Call data computation failed: ${error}`)
      notifications.show({
        title: 'Call Data Failed',
        message: error?.message ? error.message : String(error),
        color: 'red',
      })
      return null
    }
  }

  return (
    <InnerLayout>
      <ScrollArea h="100%" p="sm">
        <Stack gap={"md"}>
          {/* Header */}
          <Group justify="space-between" align="center">
            <div>
              <Text size="xl" fw={600}>
                Deploy Contract
              </Text>
              <Text size="sm" c="dimmed">
                Upload artifacts, declare, and deploy your contract in one seamless flow.
              </Text>
            </div>
            <Group>
              <Badge variant="light" color="violet" size="lg" radius="md">
                {activeNetwork}
              </Badge>
              <Badge variant="dot" color={connectedAccount ? "green" : "red"} size="lg" radius="md">
                {connectedAccount ? "Connected" : "Not Connected"}
              </Badge>
            </Group>
          </Group>

          {/* Stepper */}
          <Paper withBorder p="lg" radius="lg">
            <Stepper size='sm' active={active} onStepClick={setActive} allowNextStepsSelect={true}>

              <Stepper.Step value={0} icon={<IconFileCode size="1.2rem" />} label="Artifacts" description="Code & Sierra">
                <CustomCardWithHeaderAndFooter title="Upload Artifacts" Icon={IconFileCode} description="Drop both files at once or one at a time" footerContent={
                  <Group justify="space-between" align="center">
                    <Text size='xs' c="dimmed">
                      Files are auto-detected as CASM or Sierra based on their content.
                    </Text>
                    <Button
                      variant="filled" color='indigo'
                      fw={400} radius={"md"}
                      leftSection={<IconScan size={16} />}
                      disabled={form.values.casm === null || form.values.sierra === null}
                      loading={loading}
                      onClick={parseArtifacts}
                    >
                      Parse Artifacts
                    </Button>
                  </Group>
                }>
                  <Stack gap="md">
                    {/* Single smart dropzone */}
                    <Dropzone
                      onDrop={handleFileDrop}
                      onReject={handleFilesRejected}
                      activateOnClick={true}
                      multiple={true}
                      style={{ cursor: "pointer" }}
                      radius={"lg"}
                      accept={{ "application/json": [".json"] }}
                      maxSize={MAX_CONTRACT_FILE_SIZE}
                    >
                      <Stack gap="md" align="center" py="lg">
                        <ThemeIcon size={56} radius="xl" variant="light" color="violet">
                          <IconFileCode size={28} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                          <Text size="md" fw={600}>
                            Drop your contract artifacts here
                          </Text>
                          <Text size="sm" c="dimmed" ta="center" maw={400}>
                            Drop one or more JSON files (max 5 MB each). Each file will be scanned and auto-detected as either
                            a <Text span fw={600} c="violet">Sierra</Text> or <Text span fw={600} c="indigo">CASM</Text> artifact.
                          </Text>
                        </Stack>
                        <Badge variant="outline" radius="md" size="sm">
                          Click or drag & drop .json files
                        </Badge>
                      </Stack>
                    </Dropzone>

                    {/* Artifact status cards */}
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Paper
                          withBorder
                          radius="lg"
                          p="md"
                          style={{
                            borderColor: form.values.sierra
                              ? (isDark ? theme.colors.green[8] : theme.colors.green[4])
                              : undefined,
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Group gap="sm">
                              <ThemeIcon
                                size={36}
                                radius="md"
                                variant="light"
                                color={form.values.sierra ? 'green' : 'gray'}
                              >
                                <IconFileBarcode size={18} stroke={1.5} />
                              </ThemeIcon>
                              <Stack gap={0}>
                                <Text size="sm" fw={600}>Sierra</Text>
                                {form.values.sierra ? (
                                  <Text size="xs" c="dimmed" lineClamp={1} maw={180}>
                                    {(form.values.sierra as File).name}
                                  </Text>
                                ) : (
                                  <Text size="xs" c="dimmed">Not uploaded</Text>
                                )}
                              </Stack>
                            </Group>
                            {form.values.sierra ? (
                              <Group gap="xs">
                                <Badge variant="light" color="green" size="sm" leftSection={<IconCheck size={10} />}>
                                  {getFileSize(form.values.sierra)}
                                </Badge>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); clearArtifact('sierra') }}
                                >
                                  <Text size="xs" fw={700}>&times;</Text>
                                </ActionIcon>
                              </Group>
                            ) : (
                              <Badge variant="outline" color="gray" size="sm">Waiting</Badge>
                            )}
                          </Group>
                        </Paper>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Paper
                          withBorder
                          radius="lg"
                          p="md"
                          style={{
                            borderColor: form.values.casm
                              ? (isDark ? theme.colors.green[8] : theme.colors.green[4])
                              : undefined,
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Group gap="sm">
                              <ThemeIcon
                                size={36}
                                radius="md"
                                variant="light"
                                color={form.values.casm ? 'green' : 'gray'}
                              >
                                <IconFileCode size={18} stroke={1.5} />
                              </ThemeIcon>
                              <Stack gap={0}>
                                <Text size="sm" fw={600}>CASM</Text>
                                {form.values.casm ? (
                                  <Text size="xs" c="dimmed" lineClamp={1} maw={180}>
                                    {(form.values.casm as File).name}
                                  </Text>
                                ) : (
                                  <Text size="xs" c="dimmed">Not uploaded</Text>
                                )}
                              </Stack>
                            </Group>
                            {form.values.casm ? (
                              <Group gap="xs">
                                <Badge variant="light" color="green" size="sm" leftSection={<IconCheck size={10} />}>
                                  {getFileSize(form.values.casm)}
                                </Badge>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); clearArtifact('casm') }}
                                >
                                  <Text size="xs" fw={700}>&times;</Text>
                                </ActionIcon>
                              </Group>
                            ) : (
                              <Badge variant="outline" color="gray" size="sm">Waiting</Badge>
                            )}
                          </Group>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    {/* Rejected files warning */}
                    {rejectedFiles.length > 0 && (
                      <Alert variant="light" color="orange" radius="lg" title="Unrecognized files" icon={<IconAlertTriangle size={18} />}>
                        <Text size="sm">
                          {rejectedFiles.join(', ')} {rejectedFiles.length === 1 ? "doesn't" : "don't"} appear to be valid CASM or Sierra artifacts.
                          Sierra files contain <Text span ff="monospace" size="xs">sierra_program</Text> and CASM files contain <Text span ff="monospace" size="xs">bytecode</Text>.
                        </Text>
                      </Alert>
                    )}

                    {/* Hint when one file is still missing */}
                    {((form.values.casm && !form.values.sierra) || (!form.values.casm && form.values.sierra)) && (
                      <Alert variant="light" color="blue" radius="lg" icon={<IconAlertTriangle size={18} />}>
                        <Text size="sm">
                          {form.values.sierra ? 'Sierra detected! Now drop the CASM file.' : 'CASM detected! Now drop the Sierra file.'}
                        </Text>
                      </Alert>
                    )}
                  </Stack>
                </CustomCardWithHeaderAndFooter>
              </Stepper.Step>

              <Stepper.Step value={1} icon={<IconSettings size="1.2rem" />} label="Parse" description="ABI & Metadata">
                <CustomCardWithHeaderAndFooter title="ABI & Metadata" Icon={IconFlagSearch} description="Parsed from uploaded artifacts" footerContent={
                  <Group justify="space-between" align="center">
                    <Text size='xs' c="dimmed">
                      Class hash computed from CASM; ABI extracted from Sierra.
                    </Text>
                    <Group>
                      <Button
                        variant="default"
                        fw={400}
                        radius={"md"}
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setActive(0)}>
                        Back
                      </Button>
                      <Button
                        variant="filled"
                        color='indigo'
                        fw={400} radius={"md"}
                        rightSection={<IconArrowRight size={16} />}
                        disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                        loading={loading}
                        onClick={() => {
                          if (form.values.contractName === "") {
                            logsManager.logError("Contract name is required")
                            form.setFieldError("contractName", "Contract name is required")
                            notifications.show({
                              title: 'Missing Contract Name',
                              message: 'Please provide a name for your contract before continuing.',
                              color: 'orange',
                            })
                            return
                          }
                          setActive(2)
                        }}
                      >
                        Continue
                      </Button>
                    </Group>
                  </Group>
                }>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconFileCode}
                        title="CASM Size"
                        value={`${getFileSize(form.values.casm)}`}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconFileBarcode}
                        title="Sierra Size"
                        value={`${getFileSize(form.values.sierra)}`}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <StatCard
                        Icon={IconShield}
                        title="Has Constructor"
                        value={`${hasConstructor() ? "Yes" : "No"}`}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Contract Name"
                        placeholder="e.g. MyToken, NFTMarketplace"
                        {...form.getInputProps("contractName")}
                        description="A friendly name to identify this contract"
                        radius={"md"}
                        size="sm"
                      />
                    </Grid.Col>
                  </Grid>
                </CustomCardWithHeaderAndFooter>
              </Stepper.Step>

              <Stepper.Step value={2} icon={<IconFileText size="1.2rem" />} label="Declare" description="Send to L2">
                <CustomCardWithHeaderAndFooter title="Declare Contract" Icon={IconFilePlus} description="Submit class declaration to L2" footerContent={
                  <Group justify="space-between" align="center">
                    <Text size='xs' c="dimmed">
                      Estimate the fee first, then declare the contract class.
                    </Text>
                    <Group>
                      <Button
                        variant="default"
                        fw={400}
                        radius={"md"}
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setActive(1)}>
                        Back
                      </Button>
                      <Button
                        variant="light"
                        color='violet'
                        fw={400} radius={"md"}
                        leftSection={<IconCalculator size={16} />}
                        disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                        loading={loading}
                        onClick={() => {
                          estimateDeclarationGasFee()
                        }}
                      >
                        Estimate Fee
                      </Button>
                      {
                        form.values.declaredClassHash ? (
                          <Button
                            variant="filled"
                            color='indigo'
                            fw={400} radius={"md"}
                            rightSection={<IconArrowRight size={16} />}
                            disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                            loading={loading}
                            onClick={() => {
                              setActive(3)
                            }}
                          >
                            Continue
                          </Button>

                        ) : (
                          <Button
                            variant="filled"
                            color='green'
                            fw={400} radius={"md"}
                            leftSection={<IconSend size={16} />}
                            disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                            loading={loading}
                            onClick={() => {
                              declareContract()
                            }}
                          >
                            Declare
                          </Button>
                        )
                      }
                    </Group>
                  </Group>
                }>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[1]} radius="lg" p="lg">
                        <Stack gap="xs">
                          <Group gap={4}>
                            <IconHash size={16} stroke={1.5} />
                            <Text size="sm" c="dimmed">Compiled Class Hash</Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Text size="sm" fw={500} ff="monospace" style={{ wordBreak: 'break-all' }}>
                              {form.values.compiledClassHash || '-'}
                            </Text>
                            {form.values.compiledClassHash && (
                              <CopyButton value={form.values.compiledClassHash}>
                                {({ copied, copy }) => (
                                  <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                    <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy} size="sm">
                                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            )}
                          </Group>
                        </Stack>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <StatCard
                        Icon={IconCoin}
                        title="Declaration Fee"
                        value={form.values.declarationFee ? `~${form.values.declarationFee}` : "-"}
                      />
                    </Grid.Col>
                  </Grid>
                </CustomCardWithHeaderAndFooter>
              </Stepper.Step>

              <Stepper.Step value={3} icon={<IconTool size="1.2rem" />} label="Constructor" description="Args & Options">
                <CustomCardWithHeaderAndFooter title="Constructor Arguments" Icon={IconListTree} description="Provide values for constructor parameters" footerContent={
                  <Group justify="space-between" align="center">
                    <Text size='xs' c="dimmed">
                      Fill in the constructor arguments, then prepare the call data.
                    </Text>
                    <Group>
                      <Button
                        variant="default"
                        fw={400}
                        radius={"md"}
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setActive(2)}>
                        Back
                      </Button>
                      <Button
                        variant="light"
                        color='green'
                        fw={400} radius={"md"}
                        leftSection={<IconBraces size={16} />}
                        disabled={!hasConstructor() || form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                        loading={loading}
                        onClick={() => {
                          computeCallData()
                        }}
                      >
                        Prepare
                      </Button>
                      <Button
                        variant="filled"
                        color='indigo'
                        fw={400} radius={"md"}
                        rightSection={<IconArrowRight size={16} />}
                        disabled={hasConstructor() && (form.values.constructorCallData.length === 0 || form.values.constructorCallData.length !== form.values.callData.length)}
                        loading={loading}
                        onClick={() => {
                          setActive(4)
                        }}
                      >
                        Continue
                      </Button>
                    </Group>
                  </Group>
                }>
                  {
                    hasConstructor() ? (
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Stack gap="xs">
                            <Text size="sm" fw={600} c="dimmed">Input Fields</Text>
                            <Grid>
                              {
                                form.values.callData.map((input: any, index: number) => (
                                  <Grid.Col span={12} key={index}>
                                    <CallDataItem
                                      inputType={input.type}
                                      form={form}
                                      index={index}
                                      hideDeleteBtn={true}
                                    />
                                  </Grid.Col>
                                ))
                              }
                            </Grid>
                          </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Stack gap={"xs"}>
                            <Text size="sm" fw={600} c="dimmed">
                              Compiled Call Data
                            </Text>
                            <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]} radius="md" p={"md"}>
                              <Text size="xs" ff="monospace" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                {JSON.stringify(form.values.constructorCallData, null, 2)}
                              </Text>
                            </Paper>
                          </Stack>
                        </Grid.Col>
                      </Grid>
                    ) : (
                      <Alert variant="light" radius={"lg"} color="indigo" title="No constructor" icon={<IconAlertTriangle size={24} />}>
                        This contract has no constructor. You can proceed directly to deployment.
                      </Alert>
                    )
                  }
                </CustomCardWithHeaderAndFooter>
              </Stepper.Step>

              <Stepper.Step value={4} icon={<IconRocket size="1.2rem" />} label="Deploy" description="Go Live">
                <CustomCardWithHeaderAndFooter title="Deploy Contract" Icon={IconRocket} description="Final step - deploy to the network" footerContent={
                  <Group justify="space-between" align="center">
                    <Text size='xs' c="dimmed">
                      Estimate the deployment fee, then deploy your contract.
                    </Text>
                    <Group>
                      <Button
                        variant="default"
                        fw={400}
                        radius={"md"}
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setActive(3)}>
                        Back
                      </Button>
                      <Button
                        variant="light"
                        color='violet'
                        fw={400} radius={"md"}
                        leftSection={<IconCalculator size={16} />}
                        disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                        loading={loading}
                        onClick={() => {
                          estimateDeploymentGasFee()
                        }}
                      >
                        Estimate Fee
                      </Button>
                      {
                        form.values.deployedAddress ? (
                          <Button
                            variant="filled"
                            color='indigo'
                            fw={400} radius={"md"}
                            rightSection={<IconArrowRight size={16} />}
                            disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                            loading={loading}
                            onClick={() => {
                              setActive(5)
                            }}
                          >
                            Continue
                          </Button>
                        ) : (
                          <Button
                            variant="filled"
                            color='green'
                            fw={400} radius={"md"}
                            leftSection={<IconRocket size={16} />}
                            disabled={form.values.casm === null || form.values.sierra === null || form.values.contractName === ""}
                            loading={loading}
                            onClick={() => {
                              deployContract()
                            }}
                          >
                            Deploy
                          </Button>
                        )
                      }
                    </Group>
                  </Group>
                }>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[1]} radius="lg" p="lg">
                        <Stack gap="xs">
                          <Group gap={4}>
                            <IconBraces size={16} stroke={1.5} />
                            <Text size="sm" c="dimmed">Constructor Call Data</Text>
                          </Group>
                          <Text size="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(form.values.constructorCallData, null, 2)}
                          </Text>
                        </Stack>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <StatCard
                        Icon={IconCoin}
                        title="Deployment Fee"
                        value={form.values.deploymentFee ? `~${form.values.deploymentFee}` : "-"}
                      />
                    </Grid.Col>
                  </Grid>
                </CustomCardWithHeaderAndFooter>
              </Stepper.Step>

              <Stepper.Completed>
                <Paper
                  bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
                  radius="lg"
                  p="xl"
                  style={{ textAlign: 'center' }}
                >
                  <Stack align="center" gap="lg">
                    <ThemeIcon size={64} radius="xl" variant="light" color="green">
                      <IconConfetti size={32} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text size="xl" fw={700}>
                        Contract Deployed!
                      </Text>
                      <Text size="sm" c="dimmed">
                        Your contract is live on {activeNetwork} and ready for interaction.
                      </Text>
                    </Stack>

                    <Grid w="100%" gutter="md">
                      <Grid.Col span={12}>
                        <Paper bg={isDark ? theme.colors.darkColor[7] : theme.white} radius="lg" p="lg" withBorder>
                          <Stack gap="xs">
                            <Group gap={4}>
                              <IconHash size={16} stroke={1.5} />
                              <Text size="sm" c="dimmed">Transaction Hash</Text>
                            </Group>
                            <Group justify="space-between" align="center">
                              <Text size="sm" fw={500} ff="monospace" style={{ wordBreak: 'break-all' }}>
                                {form.values.deployTxHash}
                              </Text>
                              <CopyButton value={form.values.deployTxHash}>
                                {({ copied, copy }) => (
                                  <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                    <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy} size="sm">
                                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Paper bg={isDark ? theme.colors.darkColor[7] : theme.white} radius="lg" p="lg" withBorder>
                          <Stack gap="xs">
                            <Group gap={4}>
                              <IconHash size={16} stroke={1.5} />
                              <Text size="sm" c="dimmed">Deployed Address</Text>
                            </Group>
                            <Group justify="space-between" align="center">
                              <Text size="sm" fw={500} ff="monospace" style={{ wordBreak: 'break-all' }}>
                                {form.values.deployedAddress}
                              </Text>
                              <CopyButton value={form.values.deployedAddress}>
                                {({ copied, copy }) => (
                                  <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                    <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy} size="sm">
                                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    </Grid>

                    <Button
                      variant="filled"
                      color='violet'
                      size="md"
                      fw={400} radius={"md"}
                      rightSection={<IconRocket size={18} />}
                      disabled={!deployedContractId}
                      loading={loading}
                      onClick={() => {
                        router.push(`/app/contracts/${deployedContractId}`)
                      }}
                    >
                      Interact with Contract
                    </Button>
                  </Stack>
                </Paper>
              </Stepper.Completed>
            </Stepper>
          </Paper>
        </Stack>

      </ScrollArea>
    </InnerLayout>
  );
}
