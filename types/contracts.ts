import { AbiEntry } from "starknet";
import { ICallDataItem } from "./common";

export interface IContract {
    id?: number

    name: string;
    address: string;
    abi: string;
    sierra: string;
    casm: string;
    classHash: string;
    txHash: string;
    txReceipt: string;
    deployerAddress: string;

    chain: string; // starknet, polygon, etc
    network: string; // 'mainnet' | 'testnet' | 'devnet' etc
    deployedAt: Date;
    status: 'pending' | 'deployed' | 'failed';
    constructorArgs?: any[]; // Arguments used during deployment
    callData?: ICallDataItem[]
    description?: string;
}



export interface IAbiEntry extends AbiEntry {
    signature?: string;
    callDataItems?: ICallDataItem[];
    [key: string]: any;
}

export type InteractionStatus = 'pending' | 'success' | 'failed' | 'reverted';

export interface IContractInteraction {
    id?: number;
    contractId: number;
    functionName: string;
    functionType: 'read' | 'write'; // read for calls, write for invocations
    rawCallData: string[]; // Raw call data arguments
    callDataItems?: ICallDataItem[]; // Structured call data for replay
    response?: any; // Result from the call/invoke
    events?: any[]; // Events emitted (for write functions)
    transactionHash?: string; // Transaction hash for write functions
    gasUsed?: string; // Gas used for the transaction
    status: InteractionStatus,
    errorMessage?: string; // Error message if failed
    timestamp: Date;
    executedBy?: string; // Address that executed the interaction
}

export interface IContractStats {
    totalFunctions: number;
    writeFunctions: number;
    readFunctions: number;
    totalInteractions: number;
    recentInteractions: IContractInteraction[];
}

export interface IDevnetAccount {
    initial_balance: string;
    address: string;
    public_key: string;
    private_key: string;
    balance: string;
}