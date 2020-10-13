import type {Trigger} from "../trigger/trigger";

export interface Action
{
  name: string
  action:(trigger:Trigger) => void
}