// UI/UX Settings
export interface UIUXSettings {
  showLogs: boolean;
  theme: {
    primaryColor: string;
    mode: 'light' | 'dark' | 'auto';
  };
  serialization: {
    tabSize: "2" | "4" | "8";
  };
  autoRefreshIntervals: {
    contractInteractions: number; // in seconds
  };
  defaultPageSize: "10" | "15" | "20" | "50";
  viewMode: 'compact' | 'expanded';
  enableAnimations: boolean;
}

// Starknet Specific Networks
export interface StarknetSettings {
  networks: {
    mainnet: {
      rpcUrl: string;
      explorerUrl: string;
    };
    sepolia: {
      rpcUrl: string;
      explorerUrl: string;
    };
    devnet: {
      rpcUrl: string;
      explorerUrl: string;
      seed?: string;
      dumpPath?: string;
    };
  };
  customNetworks: Array<{
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    type: 'katana' | 'madara' | 'custom';
  }>;
  explorer: 'starkscan' | 'voyager';
}

// Gas & Transaction Settings
export interface GasTransactionSettings {
  showGasEstimation: boolean;
  autoCalculateGas: boolean;
  gasPriceAlerts: boolean;
  maxGasLimit: Record<string, number>; // per network
  transactionTimeout: number; // in seconds
  autoRetryFailedTransactions: boolean;
  gasOptimizationSuggestions: boolean;
  priorityFeeSettings: {
    enabled: boolean;
    defaultTip: number;
  };
}

// Security & Privacy Settings
export interface SecurityPrivacySettings {
  autoLockWallet: {
    enabled: boolean;
    timeoutMinutes: number;
  };
  transactionConfirmationRequirements: {
    requireConfirmation: boolean;
    highValueThreshold: number;
  };
  phishingProtection: boolean;
  contractVerificationRequired: boolean;
  addressBook: Array<{
    name: string;
    address: string;
    trusted: boolean;
  }>;
  trustedContractAddresses: string[];
  contractInteractionWarnings: boolean;
}

// Developer Settings
export interface DeveloperSettings {
  debugMode: boolean;
  verboseLogging: 'none' | 'basic' | 'verbose' | 'debug';
  exportInteractionHistory: boolean;
  apiRateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  cacheManagement: {
    enabled: boolean;
    maxSizeMB: number;
    ttlMinutes: number;
  };
  developmentToolsVisible: boolean;
}

// Notification Settings
export interface NotificationSettings {
  transactionStatus: boolean;
  networkStatus: boolean;
  gasPriceNotifications: {
    enabled: boolean;
    thresholdGwei: number;
  };
  contractEvents: boolean;
  emailNotifications: {
    enabled: boolean;
    email?: string;
  };
  smsNotifications: {
    enabled: boolean;
    phoneNumber?: string;
  };
  pushNotifications: boolean;
}

// Data Management Settings
export interface DataManagementSettings {
  interactionHistoryRetention: {
    enabled: boolean;
    retentionDays: number;
  };
  autoCleanupOldData: boolean;
  exportFormats: Array<'json' | 'csv' | 'xlsx'>;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  cloudSync: {
    enabled: boolean;
    provider?: 'google' | 'dropbox' | 'icloud';
  };
}

// Main Settings Interface
export interface ISiteSettings {
  id: string;
  key: string;

  // UI/UX Settings
  uiux: UIUXSettings;

  // Critical Settings
  activeChain: string;
  activeNetwork: string;

  // Different Chains Settings
  starknet: StarknetSettings;

  // Transaction Settings
  gasTransaction: GasTransactionSettings;

  // Security Settings
  securityPrivacy: SecurityPrivacySettings;

  // Developer Settings
  developer: DeveloperSettings;

  // Notification Settings
  notifications: NotificationSettings;

  // Data Management Settings
  dataManagement: DataManagementSettings;
}
