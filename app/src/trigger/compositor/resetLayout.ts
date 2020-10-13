import type {Trigger} from "../trigger";
import {Actions} from "../../actions/actions";

export class ResetLayout implements Trigger {
  title: string = "ResetLayout";
  triggers: Actions = Actions.resetLayout;

  id:string;

  constructor(targetId:string)
  {
    this.id = targetId;
  }
}