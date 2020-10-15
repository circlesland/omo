import type { Storage } from "../interfaces/storage";
import type { Event } from "../interfaces/event";

export interface Receiver {
  readonly dapp: string;
  readonly page: string;
}

export type CommandArgs = { [key: string]: (string | number | object | []) };

export class Command implements Event {
  public static readonly type = "Command";

  readonly _eventType: string = Command.type;
  readonly _timestamp: Number = new Date().getTime();
  readonly _previous?: string;
  readonly _noReEntry?: boolean;

  readonly receiver: Receiver;

  readonly args?:CommandArgs;
  readonly context?:CommandArgs;

  canceled?: boolean;

  readonly continuations?: {
    success: Receiver | string,
    error: Receiver | string,
  }

  constructor(
    dapp: string,
    page: string,
    args?: CommandArgs,
    canceled?: boolean,
    success?: string,
    error?: string
  ) {
    this.receiver = {
      dapp,
      page
    };
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

  static store<T extends Storage<Command>>(storage: T, continuation: Command): string {
    // hash content
    // save to session storage
    return storage.store(continuation);
  }
  static load<T extends Storage<Command>>(storage: T, hash: string): Command {
    // get session value
    return storage.load(hash);
  }
}