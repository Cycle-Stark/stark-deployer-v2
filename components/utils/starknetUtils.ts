import { ICallDataItem } from "@/types";
import { IAbiEntry, IDevnetAccount } from "@/types/contracts";
import axios from "axios";
import { BigNumber } from "bignumber.js";
import { AbiEntry, AbiEnum, AbiStruct, FunctionAbi, InterfaceAbi, shortString } from "starknet";


// Helper functions
export function checkIfArray(type: string): boolean {
    return type.includes('Array::<') || type.includes('Span::<');
}

export function getCallDataItems(abiInputs: AbiEntry[]): ICallDataItem[] {
    const callDataItems: ICallDataItem[] = [];

    for (let i = 0; i < abiInputs.length; i++) {
        const input = abiInputs[i];

        if (input.type.includes('starknet::contract_address::ContractAddress')) {
            callDataItems.push({
                type: 'address',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else if (input.type.includes('felt252')) {
            callDataItems.push({
                type: 'felt',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else if (input.type.includes('core::integer::')) {
            callDataItems.push({
                type: 'number',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else if (input.type.includes('core::bool')) {
            callDataItems.push({
                type: 'bool',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else if (input.type.includes('core::enum::')) {
            callDataItems.push({
                type: 'enum',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else if (input.type.includes('starknet::class_hash::ClassHash')) {
            callDataItems.push({
                type: 'class_hash',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        } else {
            callDataItems.push({
                type: 'textarea',
                name: input.name,
                value: '',
                isArray: checkIfArray(input.type)
            });
        }
    }

    return callDataItems;
}

function createFunctionSignature(func: FunctionAbi): string {
    const inputsStr = (func.inputs || []).map((input: AbiEntry) => `${input.name}:${input.type}`).join(', ');
    return `${func.name}(${inputsStr}) ${func.state_mutability || ''}`.trim();
}

function createStructSignature(struct: AbiStruct): string {
    const membersStr = (struct.members || []).map((m: AbiEntry) => `${m.name}:${m.type}`).join(', ');
    return `struct ${struct.name} { ${membersStr} }`;
}

function createEnumSignature(enumType: AbiEnum): string {
    const variantsStr = (enumType.variants || []).map((v: AbiEntry) => `${v.name}:${v.type}`).join(', ');
    return `enum ${enumType.name} { ${variantsStr} }`;
}

function createEventSignature(event: any): string {
    if (event.kind === 'struct') {
        const membersStr = ((event.members || []) as []).map((m: any) => `${m.name}:${m.type}`).join(', ');
        return `event ${event.name} { ${membersStr} }`;
    } else if (event.kind === 'enum') {
        const variantsStr = (event.variants || []).map((v: any) => `${v.name}:${v.type}`).join(', ');
        return `event ${event.name} { ${variantsStr} }`;
    }
    return `event ${event.name}`;
}

function createImplSignature(impl: any): string {
    return `impl ${impl.name}${impl.interface_name ? ` of ${impl.interface_name}` : ''}`;
}

function createInterfaceSignature(iface: InterfaceAbi): string {
    return `interface ${iface.name}`;
}

function processAbiItem(item: any): any {
    const processed = { ...item };

    if (item.type === 'function') {
        processed.signature = createFunctionSignature(item);
        processed.callDataItems = getCallDataItems(item.inputs || []);
    } else if (item.type === 'constructor') {
        processed.signature = createFunctionSignature(item);
        processed.callDataItems = getCallDataItems(item.inputs || []);
    } else if (item.type === 'struct') {
        processed.signature = createStructSignature(item);
    } else if (item.type === 'enum') {
        processed.signature = createEnumSignature(item);
    } else if (item.type === 'event') {
        processed.signature = createEventSignature(item);
    } else if (item.type === 'impl') {
        processed.signature = createImplSignature(item);
    } else if (item.type === 'interface') {
        processed.signature = createInterfaceSignature(item);
        // Process functions inside interfaces
        if (item.items && Array.isArray(item.items)) {
            processed.items = item.items.map((subItem: any) => processAbiItem(subItem));
        }
    }

    return processed;
}

export function parseABI(_abiJson: any): IAbiEntry[] {
    let abiJson = _abiJson;
    if (typeof _abiJson === 'string') abiJson = JSON.parse(_abiJson);
    const abi = abiJson;
    return abi.map((item: any) => processAbiItem(item));
}


export function bigintToShortStr(bigintstr: string) {
    if (!bigintstr) return ""
    const bn = BigNumber(bigintstr)
    if (bn.isNaN()) return bigintstr
    const hex_sentence = `0x` + bn?.toString(16)
    return shortString.decodeShortString(hex_sentence)
}


export function formatTokensValue(tokens: any, decimals: number) {
    if (!tokens || !decimals) return ""
    const result = new BigNumber(tokens).dividedBy(10 ** decimals).toNumber()

    // If it's a whole number, return without decimals
    if (result % 1 === 0) {
        return result.toString()
    }

    // Otherwise, format to max 6 decimals and remove trailing zeros
    return parseFloat(result.toFixed(6)).toString()
}

export function bigintToLongStrAddress(bigintstr: any) {
    if (bigintstr === "") return "na"
    const bn = BigNumber(bigintstr)
    const hex_sentence = `0x` + bn.toString(16)
    if (shortString.isDecimalString(hex_sentence)) {
        return shortString.decodeShortString(hex_sentence)
    }
    return hex_sentence;
}

export const getChainId = (chainId: string) => {
    if (['0x534e5f4d41494e', 'SN_MAIN', '23448594291968334n', '23448594291968334'].includes(chainId)) return 'SN_MAIN';
    if (['0x534e5f5345504f4c4941', 'SN_SEPOLIA', '393402133025997798000961n', '393402133025997798000961'].includes(chainId)) return 'SN_SEPOLIA';
    if (['0x534e5f4445564e4554', 'SN_DEVNET', '1536727065640230077780n', '1536727065640230077780'].includes(chainId)) return 'SN_DEVNET';
    console.log("WE went default case Chain id: ", chainId);
    return chainId;
};

export const NETWORK_MAP: Record<string, string> = {
    'SN_MAIN': 'mainnet',
    'SN_SEPOLIA': 'sepolia',
    'SN_DEVNET': 'devnet',
    'mainnet': 'SN_MAIN',
    'sepolia': 'SN_SEPOLIA',
    'devnet': 'SN_DEVNET'
};


export const loadStarknetDevnetAccounts = async (rpc_endpoint: string): Promise<IDevnetAccount[]> => {
    try {
        let data = JSON.stringify({
            "id": 1,
            "jsonrpc": "2.0",
            "method": "devnet_getPredeployedAccounts"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${rpc_endpoint}/rpc`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        const res = await axios.request(config)
        return res?.data.result
    } catch (error) {
        return []
    }
}