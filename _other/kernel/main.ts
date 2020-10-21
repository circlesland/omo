import App from "./App.svelte";
import { EventBroker, Topic } from "./_other/eventBroker";
import type Web3 from "web3";
import type { Event } from "./interfaces/event";
import Process, { LoginProcess } from "./processes/process";
import { Kernel, Registry } from "./registry";
import page from "page";

import { foo } from "circles-protocol";


alert(foo);
const appHashNameLookup = {
  "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y": "odentity",
  "bafzbeicmtet2ytuo5jlg2jtuh4rbtfvntznwah5mt2kb4xj3zgxt2ol5ma": "wallet",
  "bafzbeiafbjcuy4dxnily3nbt7nab6ebdwyti3z7jgdrblnm4ivqw7hubki": "textile",
  "bafzbeiahddbruy5letgjx6tiijzaednwr3zngtk57u3yyrjcsba7sqjbdq": "marketplace"
}
const hashAppNameLookup = {
  "odentity": "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y",
  "wallet": "bafzbeicmtet2ytuo5jlg2jtuh4rbtfvntznwah5mt2kb4xj3zgxt2ol5ma",
  "textile": "bafzbeiafbjcuy4dxnily3nbt7nab6ebdwyti3z7jgdrblnm4ivqw7hubki",
  "marketplace": "bafzbeiahddbruy5letgjx6tiijzaednwr3zngtk57u3yyrjcsba7sqjbdq"
}
export const navigateTo = function navigateTo(dapp: string, action: string) {
  // page.base(`/ipns/`);
  let dappLink = `/ipns/${hashAppNameLookup[dapp.toLowerCase()]}`
  if (dappLink != window.location.pathname) {
    window.history.pushState(null, null, dappLink);
    page.base(dappLink);
  }
  page.redirect(action.toLowerCase());
}

export const isLocal = window.location.hostname == "localhost"
  || window.location.hostname == "127.0.0.1"
  || window.location.hostname == "omo.local";

export async function xfetch(hash: string, page?: string): Promise<object> {
  let baseUrl = `${window.location.origin}/${isLocal
    ? `omo/${appHashNameLookup[hash]}/`
    : `ipns/${hash}/`}`;
  page = page == "" || page == "/" || !page ? "index" : page;
  const data = await fetch(baseUrl + page + ".json");
  const json = await data.json();

  return json;
}

declare global {
  interface Window {
    eventBroker: EventBroker;
    omoEvents: Topic<Event>;
    trigger: (trigger: any) => void;
    web3: Web3;
    o: Kernel;
  }
}

try {
  window.o = new Kernel();
  window.o.registry.register(LoginProcess);
  window.o.registry.register(class WTFProcess extends LoginProcess {
    hello() {
      console.log("hello world")
    }
  });

  const eventBroker = new EventBroker();
  window.eventBroker = eventBroker;
  window.omoEvents = eventBroker.createTopic("omo", "eventLoop");
  window.trigger = (trigger: any) => { window.omoEvents.publish(trigger); }
}
catch (e) {
  throw new Error("Software Failure. Guru Meditation: #hash-goes-here ;)");
}
const app = new App({
  target: document.body,
});
export default app;
