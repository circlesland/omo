import type {Actions} from "./actions";
import type {Event} from "./event";

export interface Trigger extends Event
{
  triggers:Actions,
  icon?:string,
  title:string,
  badge?:string
}
