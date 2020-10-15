import type {Trigger} from "./trigger";

export interface Action
{
  name: string
  action:(trigger:Trigger) => void
}
