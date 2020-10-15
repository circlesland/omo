import App from "./App.svelte";
import {EventBroker, Topic} from "./_other/eventBroker";
import type Web3 from "web3";
import type {Event} from "./interfaces/event";
import {Continuation} from "./continuation/continuation";

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
    window.trigger = (trigger: any) =>
    {
      // This code was used to address a single compositor component by id.
      // Not required right now but most likely later again.
      // if (trigger.id)
      // {
      //     const topic = window.eventBroker.getTopic("omo", trigger.id);
      //     if (!topic)
      //     {
      //         throw new Error("There is no topic for component id '" + trigger.id + "'. Request is:" + JSON.stringify(trigger));
      //     }
      //     topic.publish(trigger);
      // }
      // else
      // {
        window.omoEvents.publish(trigger);
      //}
    }

    window.omoEvents.observable.subscribe(event =>
    {
      switch (event._eventType) {
        case Continuation.type:

          break;
      }
    })
}
catch (e)
{
    throw new Error("Software Failure. Guru Meditation: #hash-goes-here ;)");
}
const app = new App({
    target: document.body,
});
export default app;
