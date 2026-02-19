import { useLiveQuery } from 'dexie-react-hooks';
import { logsManager } from '../storage/logsDatabase';
import { LogLevel } from '../types';

export function useLogs() {
  // Use liveQuery to reactively listen for logs changes (last 50 logs)
  const logs = useLiveQuery(
    async () => {
      // return await logsManager.getAll();
      return await logsManager.getPaginated(0, 50);
    },
    [] // No dependencies - always listen for changes
  );

  // Helper functions for logging
  const logInfo = async (message: string, chain?: string, network?: string) => {
    return await logsManager.logInfo(message, chain, network);
  };

  const logSuccess = async (message: string, chain?: string, network?: string) => {
    return await logsManager.logSuccess(message, chain, network);
  };

  const logWarning = async (message: string, chain?: string, network?: string) => {
    return await logsManager.logWarning(message, chain, network);
  };

  const logError = async (message: string, chain?: string, network?: string) => {
    return await logsManager.logError(message, chain, network);
  };

  const logPending = async (message: string, chain?: string, network?: string) => {
    return await logsManager.logPending(message, chain, network);
  };

  const clearLogs = async () => {
    return await logsManager.clear();
  };

  const deleteLogs = async (ids: number[]) => {
    return await logsManager.deleteBulk(ids);
  };

  const searchLogs = async (query: string) => {
    return await logsManager.search(query);
  };

  const getLogsByLevel = async (level: LogLevel) => {
    return await logsManager.getByLevel(level);
  };

  return {
    // Data
    logs: logs || [],
    
    // Actions
    logInfo,
    logSuccess,
    logWarning,
    logError,
    logPending,
    clearLogs,
    deleteLogs,
    searchLogs,
    getLogsByLevel,
    
    // State
    isLoading: logs === undefined
  };
}
