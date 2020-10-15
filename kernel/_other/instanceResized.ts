import type {Event} from "../interfaces/event";

export class InstanceResized implements Event
{
  public static readonly type = "InstanceResized";

  readonly _eventType: string = InstanceResized.type;
  readonly _timestamp: Number = new Date().getTime();

  instanceId:string;

  left:number;
  top:number;
  width:number;
  height:number;

  constructor(instanceId:string, left:number, top:number, width:number, height:number)
  {
    this.instanceId = instanceId;

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }
}
