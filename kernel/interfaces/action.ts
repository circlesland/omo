import type {Trigger} from "../interfaces/trigger";

export interface Action
{
  name: string
  action:(trigger:Trigger) => void
}
