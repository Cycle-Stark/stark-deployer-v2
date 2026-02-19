// import { ICallDataItem } from "@/types";
// import { AbiEntry } from "starknet";

// function checkIfArray(type: string) {
//     if (type.includes("core::array::Array::<")) {
//         return true
//     }
//     return false
// }

// export function getCallDataItems(abiEntry: AbiEntry[]): ICallDataItem[] {
//     let callDataItems: ICallDataItem[] = []
//     for (let i = 0; i < abiEntry.length; i++) {
//         if (abiEntry[i].type.includes("starknet::contract_address::ContractAddress")) {
//             callDataItems.push({
//                 type: 'address',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else if(abiEntry[i].type.includes("felt252")) {
//             callDataItems.push({
//                 type: 'felt',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else if(abiEntry[i].type.includes("core::integer::Integer")) {
//             callDataItems.push({
//                 type: 'number',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else if(abiEntry[i].type.includes("core::bool")) {
//             callDataItems.push({
//                 type: 'bool',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else if(abiEntry[i].type.includes("core::enum::Enum")) {
//             callDataItems.push({
//                 type: 'enum',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else if(abiEntry[i].type.includes("starknet::class_hash::ClassHash")) {
//             callDataItems.push({
//                 type: 'class_hash',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         } else {
//             callDataItems.push({
//                 type: 'textarea',
//                 name: abiEntry[i].name,
//                 value: "",
//                 isArray: checkIfArray(abiEntry[i].type)
//             })
//         }
//     }
//     return callDataItems
// }