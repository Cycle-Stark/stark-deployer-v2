import Dexie, { Table } from 'dexie';
import { ISysLog, LogLevel } from '../types/common';

// Database class
class LogsDB extends Dexie {
  logs!: Table<ISysLog>;

  constructor() {
    super('LogsDB');
    this.version(1).stores({
      logs: '++id, level, timestamp, message, chain, contractAddress, network'
    });
  }
}

// Database instance
const db = new LogsDB();

// Manager class
export class LogsManager {
  private static instance: LogsManager;
  
  private constructor() {}

  static getInstance(): LogsManager {
    if (!LogsManager.instance) {
      LogsManager.instance = new LogsManager();
    }
    return LogsManager.instance;
  }

  // Create a new log entry
  async create(log: Omit<ISysLog, 'id'>): Promise<number> {
    try {
      const id = await db.logs.add({
        ...log,
        timestamp: log.timestamp || this.getCurrentTimestamp()
      });
      return id as number;
    } catch (error) {
      console.error('Failed to create log:', error);
      throw error;
    }
  }

  // Create multiple log entries
  async createBulk(logs: Omit<ISysLog, 'id'>[]): Promise<number[]> {
    try {
      const logsWithTimestamp = logs.map(log => ({
        ...log,
        timestamp: log.timestamp || this.getCurrentTimestamp()
      }));
      const ids = await db.logs.bulkAdd(logsWithTimestamp, { allKeys: true });
      return ids as number[];
    } catch (error) {
      console.error('Failed to create bulk logs:', error);
      throw error;
    }
  }

  // Get all logs
  async getAll(): Promise<ISysLog[]> {
    try {
      return await db.logs.orderBy('id').toArray();
    } catch (error) {
      console.error('Failed to get all logs:', error);
      return [];
    }
  }

  // Get logs by level
  async getByLevel(level: LogLevel): Promise<ISysLog[]> {
    try {
      return await db.logs.where('level').equals(level).reverse().toArray();
    } catch (error) {
      console.error('Failed to get logs by level:', error);
      return [];
    }
  }

  // Get logs by chain
  async getByChain(chain: string): Promise<ISysLog[]> {
    try {
      return await db.logs.where('chain').equals(chain).reverse().toArray();
    } catch (error) {
      console.error('Failed to get logs by chain:', error);
      return [];
    }
  }

  // Get logs with pagination
  async getPaginated(offset: number = 0, limit: number = 50): Promise<ISysLog[]> {
    try {
      return (await db.logs.orderBy('id').reverse().offset(offset).limit(limit).toArray()).reverse();
    } catch (error) {
      console.error('Failed to get paginated logs:', error);
      return [];
    }
  }

  // Get log by ID
  async getById(id: number): Promise<ISysLog | undefined> {
    try {
      return await db.logs.get(id);
    } catch (error) {
      console.error('Failed to get log by ID:', error);
      return undefined;
    }
  }

  // Update a log entry
  async update(id: number, updates: Partial<ISysLog>): Promise<boolean> {
    try {
      const updated = await db.logs.update(id, updates);
      return updated === 1;
    } catch (error) {
      console.error('Failed to update log:', error);
      return false;
    }
  }

  // Delete a log entry
  async delete(id: number): Promise<boolean> {
    try {
      await db.logs.delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete log:', error);
      return false;
    }
  }

  // Delete multiple log entries
  async deleteBulk(ids: number[]): Promise<boolean> {
    try {
      await db.logs.bulkDelete(ids);
      return true;
    } catch (error) {
      console.error('Failed to delete bulk logs:', error);
      return false;
    }
  }

  // Clear all logs
  async clear(): Promise<boolean> {
    try {
      await db.logs.clear();
      console.log('All logs cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return false;
    }
  }

  // Delete logs older than specified days
  async deleteOlderThan(days: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const oldLogs = await db.logs.where('timestamp').below(cutoffDate.toISOString()).toArray();
      const ids = oldLogs.map(log => log.id!);
      
      if (ids.length > 0) {
        await db.logs.bulkDelete(ids);
      }
      
      return ids.length;
    } catch (error) {
      console.error('Failed to delete old logs:', error);
      return 0;
    }
  }

  // Get logs count
  async getCount(): Promise<number> {
    try {
      return await db.logs.count();
    } catch (error) {
      console.error('Failed to get logs count:', error);
      return 0;
    }
  }

  // Get logs count by level
  async getCountByLevel(level: LogLevel): Promise<number> {
    try {
      return await db.logs.where('level').equals(level).count();
    } catch (error) {
      console.error('Failed to get logs count by level:', error);
      return 0;
    }
  }

  // Search logs by message content
  async search(query: string): Promise<ISysLog[]> {
    try {
      return await db.logs.filter(log => 
        log.message.toLowerCase().includes(query.toLowerCase())
      ).reverse().toArray();
    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  }

  // Helper method to get current timestamp
  private getCurrentTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Helper method to log info message
  async logInfo(message: string, chain?: string, network?: string): Promise<number> {
    return this.create({
      level: LogLevel.INFO,
      message,
      timestamp: this.getCurrentTimestamp(),
      chain,
      network
    });
  }

  // Helper method to log success message
  async logSuccess(message: string, chain?: string, network?: string): Promise<number> {
    return this.create({
      level: LogLevel.SUCCESS,
      message,
      timestamp: this.getCurrentTimestamp(),
      chain,
      network
    });
  }

  // Helper method to log warning message
  async logWarning(message: string, chain?: string, network?: string): Promise<number> {
    return this.create({
      level: LogLevel.WARNING,
      message,
      timestamp: this.getCurrentTimestamp(),
      chain,
      network
    });
  }

  // Helper method to log error message
  async logError(message: string, chain?: string, network?: string): Promise<number> {
    return this.create({
      level: LogLevel.ERROR,
      message,
      timestamp: this.getCurrentTimestamp(),
      chain,
      network
    });
  }

  // Helper method to log pending message
  async logPending(message: string, chain?: string, network?: string): Promise<number> {
    return this.create({
      level: LogLevel.PENDING,
      message,
      timestamp: this.getCurrentTimestamp(),
      chain,
      network
    });
  }
}

// Export singleton instance
export const logsManager = LogsManager.getInstance();
