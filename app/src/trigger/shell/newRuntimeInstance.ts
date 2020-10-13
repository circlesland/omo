import type {Event} from "../event";

export class NewRuntimeInstance implements Event
{
  instanceId:string;
  instance:any;

  constructor(instanceId:string, instance:any)
  {
    this.instanceId = instanceId;
    this.instance = instance;
  }
}