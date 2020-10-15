import type { Storage } from "../interfaces/storage";

export class Continuation {
  readonly dapp: string;
  readonly page: string;
  readonly args?: { [key: string]: string | number | object }[]
  canceled?: boolean;
  readonly continuations?: {
    success: string,
    error: string,
  }
  readonly previousHash: string;
  readonly timestamp: Number;

  constructor(dapp: string,
    page: string,
    args?: { [key: string]: string | number | object }[],
    canceled?: boolean,
    success?: string,
    error?: string) {
    this.dapp = dapp;
    this.page = page;
    this.args = args;
    this.canceled = canceled;

    if ((error && !success) || success && !error) {
      throw new Error("both success and error have to be defined");
    }

    if (error && success)
      this.continuations = {
        error,
        success
      }
  }

  static store<T extends Storage<Continuation>>(storage: T, continuation: Continuation): string {
    // hasch content
    // ssave to sesssion storage
    return storage.store(continuation);
  }
  static load<T extends Storage<Continuation>>(storage: T, hash: string): Continuation {
    // get session value

    return storage.load(hash);
  }
}




