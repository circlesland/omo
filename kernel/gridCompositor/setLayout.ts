import type {Trigger} from "../interfaces/trigger";
import {Actions} from "../interfaces/actions";

export class SetLayout implements Trigger {
  title: string = "SetLayout";
  triggers: Actions = Actions.setLayout;

  layoutName:string;
  id:string;

  constructor(targetId:string, layoutName:string)
  {
    this.id = targetId;
    this.layoutName = layoutName;
  }
}
