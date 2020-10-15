import type {Event} from "./event";

export interface Trigger extends Event
{
  icon?:string,
  title?:string,
  badge?:string
}
