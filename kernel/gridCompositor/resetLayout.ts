import type {Trigger} from "../interfaces/trigger";
import {Actions} from "../interfaces/actions";

export class ResetLayout implements Trigger {
  title: string = "ResetLayout";
  triggers: Actions = Actions.resetLayout;

  id:string;

  constructor(targetId:string)
  {
    this.id = targetId;
  }
}
