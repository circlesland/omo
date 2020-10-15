import type { Storage } from "../interfaces/storage";
import type { Event } from "../interfaces/event";

export class Continuation implements Event {
  public static readonly type = "Continuation";

  readonly _eventType: string = Continuation.type;
  readonly _timestamp: Number = new Date().getTime();

  readonly dapp: string;
  readonly page: string;
  readonly args?: { [key: string]: string | number | object }[]
  canceled?: boolean;
  readonly continuations?: {
    success: string,
    error: string,
  }
  readonly previousHash: string;

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
    // hash content
    // save to session storage
    return storage.store(continuation);
  }
  static load<T extends Storage<Continuation>>(storage: T, hash: string): Continuation {
    // get session value
    return storage.load(hash);
  }
}



