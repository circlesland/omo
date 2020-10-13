import type {Event} from "../event";

export class InstanceResized implements Event
{
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