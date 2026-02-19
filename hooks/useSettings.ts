import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { siteSettingsManager } from '../storage/siteSettings';
import { ISiteSettings } from '../types/settings';

export function useSettings(key: string = 'main') {
  // Use liveQuery only for reading settings (read-only)
  const settings = useLiveQuery(
    async () => {
      // Initialize settings if they don't exist
      await siteSettingsManager.initialize();
      // Only read settings, no writes allowed in liveQuery
      return await siteSettingsManager.getSettings(key);
    },
    [key] // Dependencies - re-run if key changes
  );

  // Provide default values while loading or if settings don't exist
  const defaultSettings: ISiteSettings = {
    id: key,
    key: key,
    activeChain: 'starknet',
    activeNetwork: 'sepolia',
    uiux: {
      showLogs: true,
      theme: {
        primaryColor: 'blue',
        mode: 'auto'
      },
      serialization: {
        tabSize: "2"
      },
      autoRefreshIntervals: {
        contractInteractions: 30
      },
      defaultPageSize: "15",
      viewMode: 'expanded',
      enableAnimations: true
    },
    
    starknet: {
      networks: {
        mainnet: {
          rpcUrl: 'https://starknet.drpc.org',
          explorerUrl: 'https://starkscan.co'
        },
        sepolia: {
          rpcUrl: 'https://starknet-sepolia.drpc.org',
          explorerUrl: 'https://sepolia.starkscan.co'
        },
        devnet: {
          rpcUrl: 'http://127.0.0.1:5050',
          explorerUrl: 'http://localhost:4000',
          seed: '1350075753',
          dumpPath: '~/starknet_devnet/dump'
        }
      },
      customNetworks: [],
      explorer: 'starkscan'
    },
    gasTransaction: {
      showGasEstimation: true,
      autoCalculateGas: true,
      gasPriceAlerts: true,
      maxGasLimit: {
        'starknet': 1000000,
        'ethereum': 21000000
      },
      transactionTimeout: 300,
      autoRetryFailedTransactions: false,
      gasOptimizationSuggestions: true,
      priorityFeeSettings: {
        enabled: false,
        defaultTip: 2
      }
    },
    securityPrivacy: {
      autoLockWallet: {
        enabled: false,
        timeoutMinutes: 15
      },
      transactionConfirmationRequirements: {
        requireConfirmation: true,
        highValueThreshold: 1000
      },
      phishingProtection: true,
      contractVerificationRequired: false,
      addressBook: [],
      trustedContractAddresses: [],
      contractInteractionWarnings: true
    },
    developer: {
      debugMode: false,
      verboseLogging: 'basic',
      exportInteractionHistory: true,
      apiRateLimiting: {
        enabled: true,
        requestsPerMinute: 60
      },
      cacheManagement: {
        enabled: true,
        maxSizeMB: 100,
        ttlMinutes: 60
      },
      developmentToolsVisible: false
    },
    notifications: {
      transactionStatus: true,
      networkStatus: true,
      gasPriceNotifications: {
        enabled: false,
        thresholdGwei: 50
      },
      contractEvents: false,
      emailNotifications: {
        enabled: false
      },
      smsNotifications: {
        enabled: false
      },
      pushNotifications: true
    },
    dataManagement: {
      interactionHistoryRetention: {
        enabled: true,
        retentionDays: 90
      },
      autoCleanupOldData: true,
      exportFormats: ['json', 'csv'],
      backupFrequency: 'weekly',
      cloudSync: {
        enabled: false
      }
    }
  };

  // Return current settings or defaults
  const currentSettings = settings || defaultSettings;

  // Helper functions for common operations
  const toggleLogsVisibility = async () => {
    return await siteSettingsManager.toggleLogsVisibility(key);
  };

  const updateSettings = async (updates: Partial<ISiteSettings>) => {
    return await siteSettingsManager.updateSettings(key, updates);
  };

  const resetSettings = async () => {
    await siteSettingsManager.resetSettings(key);
  };


  // Helper function to update deeply nested settings
  const updateDeeplyNestedSetting = async (
    section: keyof ISiteSettings, 
    nestedField: string, 
    field: string, 
    value: any
  ) => {
    const sectionData = currentSettings[section] as any;
    const updates = {
      [section]: {
        ...sectionData,
        [nestedField]: {
          ...sectionData[nestedField],
          [field]: value
        }
      }
    };
    return await updateSettings(updates as Partial<ISiteSettings>);
  };

  return {
    // Current settings values
    areLogsVisible: currentSettings.uiux.showLogs,
    settings: currentSettings,
    
    // Helper functions
    toggleLogsVisibility,
    updateSettings,
    resetSettings,
    
    // Loading state
    isLoading: settings === undefined
  };
}