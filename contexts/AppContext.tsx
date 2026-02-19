import { IDevnetAccount } from '@/types/contracts';
import { createContext, useContext } from 'react';
import { Account } from 'starknet';

export interface IAppContext {
  // Simple connection state
  connectedAccount: Account | null;
  activeWalletAddress: string;
  provider: any | null;
  activeNetwork: string;
  activeChain: string;

  // Actions
  handleConnectWallet: () => Promise<void>;
  handleDisconnectWallet: () => Promise<void>;
  isConnecting: boolean;
  connectDevnetAccount: (index: number) => Promise<void>;
  devnetAccounts: IDevnetAccount[];
}

const initialData: IAppContext = {
  connectedAccount: null,
  activeWalletAddress: '',
  provider: null,
  activeNetwork: '',
  activeChain: '',
  handleConnectWallet: async () => { },
  handleDisconnectWallet: async () => { },
  isConnecting: false,
  connectDevnetAccount: async (index: number) => { },
  devnetAccounts: [],
};

export const AppContext = createContext<IAppContext>(initialData);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
