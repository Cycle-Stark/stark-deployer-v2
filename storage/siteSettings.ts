import Dexie, { Table } from 'dexie';
import { ISiteSettings } from '../types/settings';

// Default settings (moved here to be accessible in upgrade functions)
const defaultSettings: ISiteSettings = {
  id: 'main',
  key: 'main',
  
  // Legacy fields for backward compatibility
  activeChain: 'starknet',
  activeNetwork: 'sepolia',

  // New comprehensive settings
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

// Database class
class SiteSettingsDB extends Dexie {
  settings!: Table<ISiteSettings>;

  constructor() {
    super('SiteSettingsDB');
    this.version(1).stores({
      settings: 'id, key, areLogsVisible'
    });
    
    // Version 2: Add all necessary settings fields
    this.version(2).stores({
      settings: 'id, key, areLogsVisible, activeChain, activeNetwork'
    }).upgrade(tx => {
      // Migration logic for existing data
      return tx.table('settings').toCollection().modify(setting => {
        // Add default values for new fields if they don't exist
        if (!setting.activeChain) {
          setting.activeChain = 'starknet';
        }
        if (!setting.activeNetwork) {
          setting.activeNetwork = 'sepolia';
        }
      });
    });

    // Version 3: Add comprehensive settings structure
    this.version(3).stores({
      settings: 'id, key, areLogsVisible, activeChain, activeNetwork'
    }).upgrade(tx => {
      return tx.table('settings').toCollection().modify(setting => {
        // Add new comprehensive settings with defaults if they don't exist
        if (!setting.uiux) {
          setting.uiux = defaultSettings.uiux;
        }
        if (!setting.starknet) {
          setting.starknet = defaultSettings.starknet;
        }
        if (!setting.gasTransaction) {
          setting.gasTransaction = defaultSettings.gasTransaction;
        }
        if (!setting.securityPrivacy) {
          setting.securityPrivacy = defaultSettings.securityPrivacy;
        }
        if (!setting.developer) {
          setting.developer = defaultSettings.developer;
        }
        if (!setting.notifications) {
          setting.notifications = defaultSettings.notifications;
        }
        if (!setting.dataManagement) {
          setting.dataManagement = defaultSettings.dataManagement;
        }
      });
    });
  }
}

// Database instance
const db = new SiteSettingsDB();

// Manager class
export class SiteSettingsManager {
  private static instance: SiteSettingsManager;
  
  private constructor() {}

  static getInstance(): SiteSettingsManager {
    if (!SiteSettingsManager.instance) {
      SiteSettingsManager.instance = new SiteSettingsManager();
    }
    return SiteSettingsManager.instance;
  }

  // Initialize with default settings if not exists
  async initialize(): Promise<void> {
    try {
      const existing = await db.settings.get('main');
      if (!existing) {
        await db.settings.add(defaultSettings);
        console.log('Default site settings initialized');
      }
    } catch (error) {
      console.error('Failed to initialize site settings:', error);
    }
  }

  // Get settings by key (default: 'main')
  async getSettings(key: string = 'main'): Promise<ISiteSettings | undefined> {
    try {
      return await db.settings.get(key);
    } catch (error) {
      console.error('Failed to get settings:', error);
      return undefined;
    }
  }

  // Update settings
  async updateSettings(key: string = 'main', updates: Partial<ISiteSettings>): Promise<boolean> {
    try {
      const existing = await db.settings.get(key);
      if (existing) {
        await db.settings.update(key, updates);
        return true;
      } else {
        // Create new settings if doesn't exist
        const newSettings: ISiteSettings = {
          ...defaultSettings,
          id: key,
          key: key,
          ...updates
        };
        await db.settings.add(newSettings);
        return true;
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }

  // Toggle logs visibility
  async toggleLogsVisibility(key: string = 'main'): Promise<boolean> {
    try {
      const settings = await this.getSettings(key);
      if (settings) {
        const newVisibility = !settings.uiux.showLogs;
        await this.updateSettings(key, { uiux: { ...settings.uiux, showLogs: newVisibility } });
        return newVisibility;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle logs visibility:', error);
      return false;
    }
  }

  // Reset to default settings
  async resetSettings(key: string = 'main'): Promise<void> {
    try {
      const resetData = {
        ...defaultSettings,
        id: key,
        key: key
      };
      await db.settings.update(key, resetData);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }

  // Delete settings
  async deleteSettings(key: string = 'main'): Promise<void> {
    try {
      await db.settings.delete(key);
    } catch (error) {
      console.error('Failed to delete settings:', error);
    }
  }

  // Get all settings
  async getAllSettings(): Promise<ISiteSettings[]> {
    try {
      return await db.settings.toArray();
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return [];
    }
  }
}

// Export singleton instance
export const siteSettingsManager = SiteSettingsManager.getInstance();