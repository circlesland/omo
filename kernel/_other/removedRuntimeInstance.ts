import type {Event} from "../interfaces/event";

export class RemovedRuntimeInstance implements Event
{
  public static readonly type = "RemovedRuntimeInstance";

  readonly _eventType: string = RemovedRuntimeInstance.type;
  readonly _timestamp: Number = new Date().getTime();

  instanceId:string;

  constructor(instanceId:string)
  {
    this.instanceId = instanceId;
  }
}
