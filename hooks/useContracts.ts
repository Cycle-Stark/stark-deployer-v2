import { useLiveQuery } from 'dexie-react-hooks';
import { contractsManager } from '../storage/contractsDatabase';
import { IContract } from '../types';

interface UseContractsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  chain?: string;
  network?: string;
  status?: 'pending' | 'deployed' | 'failed';
  deployerAddress?: string;
}

export function useContracts(options: UseContractsOptions = {}) {
  const {
    limit = 50,
    offset = 0,
    search,
    chain,
    network,
    status,
    deployerAddress
  } = options;

  // Use liveQuery to reactively listen for contracts changes
  const contracts = useLiveQuery(
    async () => {
      // If search is provided, use search functionality
      if (search && search.trim()) {
        const searchResults = await contractsManager.search(search.trim());
        return applyFilters(searchResults);
      }

      // Apply specific filters
      if (chain) {
        const chainResults = await contractsManager.getByChain(chain);
        return applyFilters(chainResults);
      }

      if (network) {
        const networkResults = await contractsManager.getByNetwork(network);
        return applyFilters(networkResults);
      }

      if (status) {
        const statusResults = await contractsManager.getByStatus(status);
        return applyFilters(statusResults);
      }

      if (deployerAddress) {
        const deployerResults = await contractsManager.getByDeployer(deployerAddress);
        return applyFilters(deployerResults);
      }

      // Default: get paginated results
      return await contractsManager.getPaginated(offset, limit);
    },
    [limit, offset, search, chain, network, status, deployerAddress] // Dependencies
  );

  // Helper function to apply additional filters to results
  const applyFilters = (results: IContract[]): IContract[] => {
    let filtered = results;

    // Apply additional filters if multiple are specified
    if (chain && !options.chain) {
      filtered = filtered.filter(contract => contract.chain === chain);
    }
    if (network && !options.network) {
      filtered = filtered.filter(contract => contract.network === network);
    }
    if (status && !options.status) {
      filtered = filtered.filter(contract => contract.status === status);
    }
    if (deployerAddress && !options.deployerAddress) {
      filtered = filtered.filter(contract => contract.deployerAddress === deployerAddress);
    }

    // Apply pagination to filtered results
    return filtered.slice(offset, offset + limit);
  };

  // Get total count for pagination
  const totalCount = useLiveQuery(
    async () => {
      if (search && search.trim()) {
        const searchResults = await contractsManager.search(search.trim());
        return searchResults.length;
      }

      if (chain) {
        return await contractsManager.getCountByNetwork(chain); // Note: this should be getCountByChain when available
      }

      if (network) {
        return await contractsManager.getCountByNetwork(network);
      }

      if (status) {
        return await contractsManager.getCountByStatus(status);
      }

      return await contractsManager.getCount();
    },
    [search, chain, network, status, deployerAddress]
  );

  // Get unique networks for filter options
  const availableNetworks = useLiveQuery(
    async () => await contractsManager.getUniqueNetworks(),
    []
  );

  // Get unique chains for filter options
  const availableChains = useLiveQuery(
    async () => await contractsManager.getUniqueChains(),
    []
  );

  // Helper functions for contract operations
  const createContract = async (contract: Omit<IContract, 'id'>) => {
    return await contractsManager.create(contract);
  };

  const updateContract = async (id: number, updates: Partial<IContract>) => {
    return await contractsManager.update(id, updates);
  };

  const deleteContract = async (id: number) => {
    return await contractsManager.delete(id);
  };

  const getContractById = async (id: number) => {
    return await contractsManager.getById(id);
  };

  const getContractByAddress = async (address: string) => {
    return await contractsManager.getByAddress(address);
  };

  const getContractByClassHash = async (classHash: string) => {
    return await contractsManager.getByClassHash(classHash);
  };

  const getContractByTxHash = async (txHash: string) => {
    return await contractsManager.getByTxHash(txHash);
  };

  const updateContractStatus = async (id: number, status: 'pending' | 'deployed' | 'failed') => {
    return await contractsManager.updateStatus(id, status);
  };

  const checkContractExists = async (address: string) => {
    return await contractsManager.exists(address);
  };

  const getRecentContracts = async (days: number = 7) => {
    return await contractsManager.getRecentContracts(days);
  };

  const clearAllContracts = async () => {
    return await contractsManager.clear();
  };

  // Pagination helpers
  const hasNextPage = totalCount ? offset + limit < totalCount : false;
  const hasPreviousPage = offset > 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

  return {
    // Data
    contracts: contracts || [],
    totalCount: totalCount || 0,
    availableNetworks: availableNetworks || [],
    availableChains: availableChains || [],
    
    // Pagination info
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalPages,
    
    // CRUD operations
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getContractByAddress,
    getContractByClassHash,
    getContractByTxHash,
    updateContractStatus,
    checkContractExists,
    getRecentContracts,
    clearAllContracts,
    
    // Loading state
    isLoading: contracts === undefined,
  };
}

// Convenience hooks for specific use cases
export function useAllContracts(limit = 50) {
  return useContracts({ limit });
}

export function useContractsByNetwork(network: string, limit = 50) {
  return useContracts({ network, limit });
}

export function useContractsByChain(chain: string, limit = 50) {
  return useContracts({ chain, limit });
}

export function useContractsByStatus(status: 'pending' | 'deployed' | 'failed', limit = 50) {
  return useContracts({ status, limit });
}

export function useContractsSearch(search: string, limit = 50) {
  return useContracts({ search, limit });
}

export function useRecentContracts(limit = 10) {
  return useLiveQuery(
    async () => await contractsManager.getRecentContracts(7),
    []
  );
}
