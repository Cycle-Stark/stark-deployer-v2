
export enum LogLevel {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    PENDING = 'pending'
}

export interface ISysLog {
    id?: number;
    level: LogLevel;
    message: string;
    timestamp: string;
    chain?: string;
    contractAddress?: string;
    network?: string;
}

export interface ICallDataItem {
    type: 'address' | 'felt' | 'number' | 'bool' | 'enum' | 'class_hash' | 'json' | 'textarea';
    name: string;
    value: string;
    isArray: boolean;
}