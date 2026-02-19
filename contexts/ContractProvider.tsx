import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useContracts } from '@/hooks/useContracts';
import { IContract } from '@/types';
import { IAbiEntry } from '@/types/contracts';
import { Abi, Account, Contract, RpcProvider } from 'starknet';
import { logsManager } from '@/storage/logsDatabase';
import { useAppContext } from './AppContext';
import { siteSettingsManager } from '@/storage/siteSettings';

interface ContractContextType {
  contract: IContract | null;
  actualContract: Contract | null;
  contractId: string | null;
  functionName: string | null;
  isLoading: boolean;
  contractAbi: IAbiEntry[];
  actualContractAbi: Abi;
  getAllFunctions: () => IAbiEntry[];
  getFunction: (name: string) => IAbiEntry | null;
  refetchContract: () => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

interface ContractProviderProps {
  children: ReactNode;
}

export function ContractProvider({ children }: ContractProviderProps) {

  const { activeWalletAddress, connectedAccount, provider } = useAppContext()

  const { getContractById } = useContracts();
  const [contract, setContract] = useState<IContract | null>(null);
  const [actualContract, setActualContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const params = useParams();
  const contractId = params?.contractId as string | null;
  const functionName = params?.functionName as string | null;

  const contractAbi: IAbiEntry[] = contract ? JSON.parse(contract.abi || '[]') : [];
  const actualContractAbi: Abi = contract ? JSON.parse(contract.sierra || '[]').abi : [];

  const getAllFunctions = (): IAbiEntry[] => {
    if (!contract) return [];

    const functions = contractAbi.filter((entry) => entry.type === 'function');
    const interfaces = contractAbi.filter((entry) => entry.type === 'interface');
    const interfaceFunctions = interfaces.flatMap((entry) => entry.items || []);

    return [...functions, ...interfaceFunctions];
  };

  const getFunction = (name: string): IAbiEntry | null => {
    const allFunctions = getAllFunctions();
    return allFunctions.find((func) => func.name.toLowerCase() === name.toLowerCase()) || null;
  };

  const fetchContract = async () => {
    if (!contractId) return;

    if (!connectedAccount) {
      logsManager.logError("Connected account not found")
      return
    }

    setIsLoading(true);
    try {
      const _contractId = Number(contractId);
      const _contract = await getContractById(_contractId);
      if (!_contract) {
        logsManager.logError(`Contract with id ${_contractId} not found`);
        return;
      };
      setContract(_contract || null);
      const _contractAbi = _contract.sierra ? JSON.parse(_contract?.sierra || '[]').abi : JSON.parse(_contract?.abi || '[]') as Abi;
      const settings = await siteSettingsManager.getSettings()

      if (!settings) {
        return
      }

      const activeChain = settings.activeChain
      const activeNetwork = settings.activeNetwork

      if (activeChain === "starknet") {
        // const provider = new RpcProvider({
        //   nodeUrl: "http://localhost:5050"
        // })

        // const _providerOrAccount = new Account({
        //   provider,
        //   address: "0x01e6099bb8f28eb2d638780acd21401085ee8f2e4e89795200d8bf32f4576b83",
        //   signer: "0x0000000000000000000000000000000084feb7216f5ad02148181df2321bb989"
        // })

        const _actualContract = new Contract({
          address: _contract?.address || '',
          abi: _contractAbi,
          providerOrAccount: connectedAccount
        });
        setActualContract(_actualContract);
      } else {
        logsManager.logError(`Active chain: ${activeChain} is not supported`)
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchContract = async () => {
    await fetchContract();
  };

  useEffect(() => {
    fetchContract();
  }, [contractId, activeWalletAddress]);

  const value: ContractContextType = {
    contract,
    actualContract,
    contractId,
    functionName,
    isLoading,
    contractAbi,
    actualContractAbi,
    getAllFunctions,
    getFunction,
    refetchContract,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract(): ContractContextType {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}
