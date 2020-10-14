import type {Event} from "../interfaces/event";

export class RemovedRuntimeInstance implements Event
{
  instanceId:string;

  constructor(instanceId:string)
  {
    this.instanceId = instanceId;
  }
}
