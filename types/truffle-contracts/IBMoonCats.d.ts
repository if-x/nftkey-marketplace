/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface IBMoonCatsContract
  extends Truffle.Contract<IBMoonCatsInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<IBMoonCatsInstance>;
}

type AllEvents = never;

export interface IBMoonCatsInstance extends Truffle.ContractInstance {
  catOwners(
    catId: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  rescueOrder(
    index: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  methods: {
    catOwners(
      catId: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;

    rescueOrder(
      index: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
}
