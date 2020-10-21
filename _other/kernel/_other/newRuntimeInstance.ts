import type {Event} from "../interfaces/event";

export class NewRuntimeInstance implements Event
{
  public static readonly type = "NewRuntimeInstance";

  readonly _eventType: string = NewRuntimeInstance.type;
  readonly _timestamp: Number = new Date().getTime();

  instanceId:string;
  instance:any;

  constructor(instanceId:string, instance:any)
  {
    this.instanceId = instanceId;
    this.instance = instance;
  }
}
