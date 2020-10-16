import App from "./App.svelte";
import {EventBroker, Topic} from "./_other/eventBroker";
import type Web3 from "web3";
import type { Event } from "./interfaces/event";

const appHashNameLookup = {
  "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y": "odentity",
  "": "wallet",
  "": "marketplace",
}

export const isLocal = window.location.hostname == "localhost"
  || window.location.hostname == "127.0.0.1"
  || window.location.hostname == "omo.local";

export async function xfetch(hash:string, page?:string) {
  let baseUrl = isLocal
    ? `http://${window.location.hostname}:5000/omo/${appHashNameLookup[hash]}/`
    : `https://${window.location.hostname}/ipns/${hash}/`;

  let url = page
    ? baseUrl + page
    : baseUrl + "index.json";

  const data = await fetch(url);
  const json = await data.json();

  return json;
}


declare global
{
    interface Window
    {
        eventBroker: EventBroker;
        omoEvents: Topic<Event>;
        trigger: (trigger: any) => void;
        web3: Web3;
    }
}

try
{
    const eventBroker = new EventBroker();
    window.eventBroker = eventBroker;
    window.omoEvents = eventBroker.createTopic("omo", "eventLoop");
    window.trigger = (trigger: any) => {window.omoEvents.publish(trigger);}
}
catch (e)
{
    throw new Error("Software Failure. Guru Meditation: #hash-goes-here ;)");
}
const app = new App({
    target: document.body,
});
export default app;
