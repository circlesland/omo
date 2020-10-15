import type { Continuation } from "../continuation/continuation";

export interface Storage<T extends Continuation> {
  load(hash: string): T;
  store(continuation: T): string;
}