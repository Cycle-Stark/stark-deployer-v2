import Dexie, { Table } from 'dexie';
import { IContractInteraction } from '../types/contracts';

// Database class
class ContractInteractionsDB extends Dexie {
  interactions!: Table<IContractInteraction>;
  constructor() {
    super('ContractInteractionsDB');
    this.version(1).stores({
      interactions: '++id, contractId, functionName, functionType, status, timestamp, transactionHash, executedBy'
    });
    this.version(2).stores({
      interactions: '++id, contractId, functionName, functionType, status, timestamp, transactionHash, executedBy, [contractId+functionName], [contractId+functionType], [contractId+status]'
    });
  }
}

// Database instance
const db = new ContractInteractionsDB();

// Manager class
export class ContractInteractionsManager {
  private static instance: ContractInteractionsManager;
  
  private constructor() {}

  static getInstance(): ContractInteractionsManager {
    if (!ContractInteractionsManager.instance) {
      ContractInteractionsManager.instance = new ContractInteractionsManager();
    }
    return ContractInteractionsManager.instance;
  }

  // Create a new interaction entry
  async create(interaction: Omit<IContractInteraction, 'id'>): Promise<number> {
    try {
      const interactionWithDefaults = {
        ...interaction,
        timestamp: interaction.timestamp || new Date(),
        status: interaction.status || 'pending' as const
      };
      
      const id = await db.interactions.add(interactionWithDefaults);
      return id as number;
    } catch (error) {
      console.error('Failed to create interaction:', error);
      throw error;
    }
  }

  // Get all interactions for a contract
  async getByContractId(contractId: number): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where('contractId')
        .equals(contractId)
        // .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get interactions by contract ID:', error);
      return [];
    }
  }

  // Get recent interactions for a contract (last N interactions)
  async getRecentByContractId(contractId: number, limit: number = 10): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where('contractId')
        .equals(contractId)
        // .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Failed to get recent interactions:', error);
      return [];
    }
  }

  // Get interactions by function name
  async getByFunction(contractId: number, functionName: string): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where(['contractId', 'functionName'])
        .equals([contractId, functionName])
        // .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get interactions by function:', error);
      return [];
    }
  }

  // Get interactions by type (read/write)
  async getByType(contractId: number, functionType: 'read' | 'write'): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where(['contractId', 'functionType'])
        .equals([contractId, functionType])
        // .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get interactions by type:', error);
      return [];
    }
  }

  // Get interactions by status
  async getByStatus(contractId: number, status: 'pending' | 'success' | 'failed' | 'reverted'): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where(['contractId', 'status'])
        .equals([contractId, status])
        // .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get interactions by status:', error);
      return [];
    }
  }

  // Get interaction by ID
  async getById(id: number): Promise<IContractInteraction | undefined> {
    try {
      return await db.interactions.get(id);
    } catch (error) {
      console.error('Failed to get interaction by ID:', error);
      return undefined;
    }
  }

  // Get interaction by transaction hash
  async getByTxHash(txHash: string): Promise<IContractInteraction | undefined> {
    try {
      return await db.interactions.where('transactionHash').equals(txHash).first();
    } catch (error) {
      console.error('Failed to get interaction by transaction hash:', error);
      return undefined;
    }
  }

  // Update an interaction
  async update(id: number, updates: Partial<IContractInteraction>): Promise<boolean> {
    try {
      const updated = await db.interactions.update(id, updates);
      return updated === 1;
    } catch (error) {
      console.error('Failed to update interaction:', error);
      return false;
    }
  }

  // Update interaction status
  async updateStatus(id: number, status: 'pending' | 'success' | 'failed' | 'reverted', errorMessage?: string): Promise<boolean> {
    try {
      const updates: Partial<IContractInteraction> = { status };
      if (errorMessage) {
        updates.errorMessage = errorMessage;
      }
      return await this.update(id, updates);
    } catch (error) {
      console.error('Failed to update interaction status:', error);
      return false;
    }
  }

  // Delete an interaction
  async delete(id: number): Promise<boolean> {
    try {
      await db.interactions.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      return false;
    }
  }

  // Delete all interactions for a contract
  async deleteByContractId(contractId: number): Promise<boolean> {
    try {
      await db.interactions.where('contractId').equals(contractId).delete();
      return true;
    } catch (error) {
      console.error('Failed to delete interactions by contract ID:', error);
      return false;
    }
  }

  // Get interaction count for a contract
  async getCountByContractId(contractId: number): Promise<number> {
    try {
      return await db.interactions.where('contractId').equals(contractId).count();
    } catch (error) {
      console.error('Failed to get interaction count:', error);
      return 0;
    }
  }

  // Get interaction count by type for a contract
  async getCountByType(contractId: number, functionType: 'read' | 'write'): Promise<number> {
    try {
      return await db.interactions
        .where(['contractId', 'functionType'])
        .equals([contractId, functionType])
        .count();
    } catch (error) {
      console.error('Failed to get interaction count by type:', error);
      return 0;
    }
  }

  // Get interaction count by status for a contract
  async getCountByStatus(contractId: number, status: 'pending' | 'success' | 'failed' | 'reverted'): Promise<number> {
    try {
      return await db.interactions
        .where(['contractId', 'status'])
        .equals([contractId, status])
        .count();
    } catch (error) {
      console.error('Failed to get interaction count by status:', error);
      return 0;
    }
  }

  // Get interactions in date range
  async getByDateRange(contractId: number, startDate: Date, endDate: Date): Promise<IContractInteraction[]> {
    try {
      return await db.interactions
        .where('contractId')
        .equals(contractId)
        .and(interaction => 
          interaction.timestamp >= startDate && interaction.timestamp <= endDate
        )
        // .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get interactions by date range:', error);
      return [];
    }
  }

  // Get activity data for charts (interactions per day broken down by type and status)
  async getActivityData(contractId: number, days: number = 14): Promise<{ 
    date: string; 
    reads: number; 
    writes: number; 
    errors: number;
  }[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const interactions = await this.getByDateRange(contractId, startDate, endDate);
      
      // Group by date with breakdown
      const activityMap = new Map<string, { reads: number; writes: number; errors: number }>();
      
      // Initialize all dates with 0 values
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        activityMap.set(dateStr, { reads: 0, writes: 0, errors: 0 });
      }

      // Count interactions per date by type and status
      interactions.forEach(interaction => {
        const dateStr = interaction.timestamp.toISOString().split('T')[0];
        const current = activityMap.get(dateStr) || { reads: 0, writes: 0, errors: 0 };
        
        // Count errors (failed or reverted interactions)
        if (interaction.status === 'failed' || interaction.status === 'reverted') {
          current.errors += 1;
        } else if (interaction.status === 'success') {
          // Count successful reads and writes
          if (interaction.functionType === 'read') {
            current.reads += 1;
          } else if (interaction.functionType === 'write') {
            current.writes += 1;
          }
        }
        
        activityMap.set(dateStr, current);
      });

      // Convert to array format with formatted dates
      return Array.from(activityMap.entries()).map(([dateStr, counts]) => {
        // Format date as "Mar 22" style
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        return {
          date: formattedDate,
          reads: counts.reads,
          writes: counts.writes,
          errors: counts.errors,
        };
      });
    } catch (error) {
      console.error('Failed to get activity data:', error);
      return [];
    }
  }

  // Clear all interactions
  async clear(): Promise<boolean> {
    try {
      await db.interactions.clear();
      console.log('All interactions cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear interactions:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contractInteractionsManager = ContractInteractionsManager.getInstance();
