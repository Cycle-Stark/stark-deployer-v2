import { useMemo } from 'react'
import { CodeHighlight } from '@mantine/code-highlight'
import { IAbiEntry, ICallDataItem } from '@/types'

interface FunctionSourceCodeProps {
  contractAddress: string
  functionName: string
  functionData: IAbiEntry | null
  callDataItems: ICallDataItem[]
}

export default function FunctionSourceCode({
  contractAddress,
  functionName,
  functionData,
  callDataItems,
}: FunctionSourceCodeProps) {
  const isView = functionData?.state_mutability === 'view'

  const code = useMemo(() => {
    const args = callDataItems
      .map((item) => {
        const val = item.value || `"<${item.name}>"`
        return `  ${item.name}: ${val},`
      })
      .join('\n')

    const argsBlock = callDataItems.length > 0
      ? `const args = {\n${args}\n};\n\n`
      : ''

    const callDataLine = callDataItems.length > 0
      ? `const callData = contract.populate("${functionName}", args);\n\n`
      : ''

    const invocationArgs = callDataItems.length > 0
      ? 'callData.calldata'
      : ''

    if (isView) {
      return `import { RpcProvider, Contract } from "starknet";

// Initialize provider
const provider = new RpcProvider({ nodeUrl: "<YOUR_RPC_URL>" });

// ABI — use the full ABI from your contract
const abi = [ /* ... */ ];

const contract = new Contract({ abi, address: "${contractAddress}", providerOrAccount: provider });

${argsBlock}${callDataLine}const result = await contract.call("${functionName}"${invocationArgs ? `, ${invocationArgs}` : ''});
console.log("Result:", result);`
    }

    return `import { RpcProvider, Account, Contract } from "starknet";

// Initialize provider and account
const provider = new RpcProvider({ nodeUrl: "<YOUR_RPC_URL>" });
const account = new Account(provider, "<ACCOUNT_ADDRESS>", "<PRIVATE_KEY>"); // OR use the connected wallet/account

// ABI — use the full ABI from your contract
const abi = [ /* ... */ ];

const contract = new Contract({ abi, address: "${contractAddress}", providerOrAccount: account });

${argsBlock}${callDataLine}const { transaction_hash } = await contract.invoke("${functionName}"${invocationArgs ? `, ${invocationArgs}` : ''});
console.log("Transaction hash:", transaction_hash);

// Wait for confirmation
const receipt = await provider.waitForTransaction(transaction_hash);
console.log("Receipt:", receipt);`
  }, [contractAddress, functionName, functionData, callDataItems, isView])

  return (
    <CodeHighlight
      code={code}
      language="ts"
      radius="lg"
      withCopyButton
    />
  )
}
