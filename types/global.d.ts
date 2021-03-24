declare module "@truffle/contract" {
  import { ContractObject } from "@truffle/contract-schema";
  export default function truffleContract<T>(json: ContractObject): T;
}