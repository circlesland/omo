import type {Event} from "../event";

export class RemovedRuntimeInstance implements Event
{
  instanceId:string;

  constructor(instanceId:string)
  {
    this.instanceId = instanceId;
  }
}