import type {Trigger} from "../interfaces/trigger";

export class SetLayout implements Trigger {
  public static readonly type = "SetLayout";

  readonly _eventType: string = SetLayout.type;
  readonly _timestamp: Number = new Date().getTime();

  layoutName:string;
  id:string;

  constructor(targetId:string, layoutName:string)
  {
    this.id = targetId;
    this.layoutName = layoutName;
  }
}
