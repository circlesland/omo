import type { Event } from "../interfaces/event";

/**
 * Loads an event from the given hash and passes it on to the event loop.
 */
export class EventFromHash implements Event {
  public static readonly type = "EventFromHash";

  readonly _eventType: string = EventFromHash.type;
  readonly _timestamp: Number = new Date().getTime();

  readonly hash:string;

  constructor(hash:string)
  {
    this.hash = hash;
  }
}