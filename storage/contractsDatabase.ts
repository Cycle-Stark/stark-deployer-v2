import Dexie, { Table } from 'dexie';
import { IContract } from '../types/contracts';

// Database class
class ContractsDB extends Dexie {
  contracts!: Table<IContract>;

  constructor() {
    super('ContractsDB');
    this.version(1).stores({
      contracts: '++id, name, address, classHash, txHash, deployerAddress, chain, network, deployedAt, status'
    });
  }
}

// Database instance
const db = new ContractsDB();

// Manager class
export class ContractsManager {
  private static instance: ContractsManager;
  
  private constructor() {}

  static getInstance(): ContractsManager {
    if (!ContractsManager.instance) {
      ContractsManager.instance = new ContractsManager();
    }
    return ContractsManager.instance;
  }

  // Create a new contract entry
  async create(contract: Omit<IContract, 'id'>): Promise<number> {
    try {
      const contractWithDefaults = {
        ...contract,
        deployedAt: contract.deployedAt || new Date(),
        status: contract.status || 'deployed' as const
      };
      
      const id = await db.contracts.add(contractWithDefaults);
      return id as number;
    } catch (error) {
      console.error('Failed to create contract:', error);
      throw error;
    }
  }

  // Create multiple contract entries
  async createBulk(contracts: Omit<IContract, 'id'>[]): Promise<number[]> {
    try {
      const contractsWithDefaults = contracts.map(contract => ({
        ...contract,
        deployedAt: contract.deployedAt || new Date(),
        status: contract.status || 'deployed' as const
      }));
      
      const ids = await db.contracts.bulkAdd(contractsWithDefaults, { allKeys: true });
      return ids as number[];
    } catch (error) {
      console.error('Failed to create bulk contracts:', error);
      throw error;
    }
  }

  // Get all contracts
  async getAll(): Promise<IContract[]> {
    try {
      return await db.contracts.orderBy('deployedAt').reverse().toArray();
    } catch (error) {
      console.error('Failed to get all contracts:', error);
      return [];
    }
  }

  // Get contracts by network
  async getByNetwork(network: string): Promise<IContract[]> {
    try {
      return await db.contracts.where('network').equals(network).reverse().toArray();
    } catch (error) {
      console.error('Failed to get contracts by network:', error);
      return [];
    }
  }

  // Get contracts by chain
  async getByChain(chain: string): Promise<IContract[]> {
    try {
      return await db.contracts.where('chain').equals(chain).reverse().toArray();
    } catch (error) {
      console.error('Failed to get contracts by chain:', error);
      return [];
    }
  }

  // Get contracts by deployer address
  async getByDeployer(deployerAddress: string): Promise<IContract[]> {
    try {
      return await db.contracts.where('deployerAddress').equals(deployerAddress).reverse().toArray();
    } catch (error) {
      console.error('Failed to get contracts by deployer:', error);
      return [];
    }
  }

  // Get contracts by status
  async getByStatus(status: 'pending' | 'deployed' | 'failed'): Promise<IContract[]> {
    try {
      return await db.contracts.where('status').equals(status).reverse().toArray();
    } catch (error) {
      console.error('Failed to get contracts by status:', error);
      return [];
    }
  }

  // Get contracts with pagination
  async getPaginated(offset: number = 0, limit: number = 50): Promise<IContract[]> {
    try {
      return await db.contracts.orderBy('deployedAt').reverse().offset(offset).limit(limit).toArray();
    } catch (error) {
      console.error('Failed to get paginated contracts:', error);
      return [];
    }
  }

  // Get contract by ID
  async getById(id: number): Promise<IContract | undefined> {
    try {
      return await db.contracts.get(id);
    } catch (error) {
      console.error('Failed to get contract by ID:', error);
      return undefined;
    }
  }

  // Get contract by address
  async getByAddress(address: string): Promise<IContract | undefined> {
    try {
      return await db.contracts.where('address').equals(address).first();
    } catch (error) {
      console.error('Failed to get contract by address:', error);
      return undefined;
    }
  }

  // Get contract by class hash
  async getByClassHash(classHash: string): Promise<IContract | undefined> {
    try {
      return await db.contracts.where('classHash').equals(classHash).first();
    } catch (error) {
      console.error('Failed to get contract by class hash:', error);
      return undefined;
    }
  }

  // Get contract by transaction hash
  async getByTxHash(txHash: string): Promise<IContract | undefined> {
    try {
      return await db.contracts.where('txHash').equals(txHash).first();
    } catch (error) {
      console.error('Failed to get contract by transaction hash:', error);
      return undefined;
    }
  }

  // Update a contract entry
  async update(id: number, updates: Partial<IContract>): Promise<boolean> {
    try {
      const updated = await db.contracts.update(id, updates);
      return updated === 1;
    } catch (error) {
      console.error('Failed to update contract:', error);
      return false;
    }
  }

  // Update contract status
  async updateStatus(id: number, status: 'pending' | 'deployed' | 'failed'): Promise<boolean> {
    try {
      return await this.update(id, { status });
    } catch (error) {
      console.error('Failed to update contract status:', error);
      return false;
    }
  }

  // Delete a contract entry
  async delete(id: number): Promise<boolean> {
    try {
      await db.contracts.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete contract:', error);
      return false;
    }
  }

  // Delete multiple contract entries
  async deleteBulk(ids: number[]): Promise<boolean> {
    try {
      await db.contracts.bulkDelete(ids);
      return true;
    } catch (error) {
      console.error('Failed to delete bulk contracts:', error);
      return false;
    }
  }

  // Clear all contracts
  async clear(): Promise<boolean> {
    try {
      await db.contracts.clear();
      console.log('All contracts cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear contracts:', error);
      return false;
    }
  }

  // Get contracts count
  async getCount(): Promise<number> {
    try {
      return await db.contracts.count();
    } catch (error) {
      console.error('Failed to get contracts count:', error);
      return 0;
    }
  }

  // Get contracts count by network
  async getCountByNetwork(network: string): Promise<number> {
    try {
      return await db.contracts.where('network').equals(network).count();
    } catch (error) {
      console.error('Failed to get contracts count by network:', error);
      return 0;
    }
  }

  // Get contracts count by status
  async getCountByStatus(status: 'pending' | 'deployed' | 'failed'): Promise<number> {
    try {
      return await db.contracts.where('status').equals(status).count();
    } catch (error) {
      console.error('Failed to get contracts count by status:', error);
      return 0;
    }
  }

  // Search contracts by name or description
  async search(query: string): Promise<IContract[]> {
    try {
      return await db.contracts.filter(contract => 
        contract.name.toLowerCase().includes(query.toLowerCase()) ||
        (contract.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      ).reverse().toArray();
    } catch (error) {
      console.error('Failed to search contracts:', error);
      return [];
    }
  }

  // Get contracts deployed in the last N days
  async getRecentContracts(days: number = 7): Promise<IContract[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return await db.contracts.where('deployedAt').above(cutoffDate).reverse().toArray();
    } catch (error) {
      console.error('Failed to get recent contracts:', error);
      return [];
    }
  }

  // Check if contract exists by address
  async exists(address: string): Promise<boolean> {
    try {
      const contract = await this.getByAddress(address);
      return !!contract;
    } catch (error) {
      console.error('Failed to check contract existence:', error);
      return false;
    }
  }

  // Get unique networks
  async getUniqueNetworks(): Promise<string[]> {
    try {
      const contracts = await db.contracts.toArray();
    //   const networks = [...new Set(contracts.map(c => c.network))];
    //   return networks.filter(Boolean);
    return ["mainnet", "testnet", "devnet"]
    } catch (error) {
      console.error('Failed to get unique networks:', error);
      return [];
    }
  }

  // Get unique chains
  async getUniqueChains(): Promise<string[]> {
    try {
      const contracts = await db.contracts.toArray();
    //   const chains = [...new Set(contracts.map(c => c.chain))];
    //   return chains.filter(Boolean);
    return ["starknet"]
    } catch (error) {
      console.error('Failed to get unique chains:', error);
      return [];
    }
  }
}

// Export singleton instance
export const contractsManager = ContractsManager.getInstance();
