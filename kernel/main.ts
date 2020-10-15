import App from "./App.svelte";
import {EventBroker, Topic} from "./_other/eventBroker";
import type Web3 from "web3";
import type {Event} from "./interfaces/event";
import {Continuation} from "./continuation/continuation";
import {mockEventsByHash} from "../mock/mockEventsByHash";

export interface IReceiver {
  receive(continuation:Continuation) : void;
}

export type ReceiverMap = {[dapp:string]:{[page:string]:IReceiver}};

const mockReceivers:ReceiverMap = {
  "omo/marketplace":{
    "checkout": {
      receive(continuation: Continuation)
      {
        console.log("omo/marketplace/checkout received:", continuation);
        window.omoEvents.publish(mockEventsByHash["#2"]); // Send to payment
      }
    },
    "checkoutComplete": {
      receive(continuation: Continuation)
      {
        console.log("omo/marketplace/checkoutComplete received:", continuation);
      }
    }
  },
  "omo/odentity":{
    "login": {
      receive(continuation: Continuation)
      {
        console.log("omo/odentity/login received:", continuation);
      }
    }
  },
  "omo/shell":{},
  "omo/wallet":{
    "transfer": {
      receive(continuation: Continuation)
      {
        console.log("omo/wallet/transfer received:", continuation);
        window.omoEvents.publish(mockEventsByHash["#3"]); // Send to checkout complete
      }
    }
  },
}

const mockContinuationInterpreter = (continuation:Continuation) => {
  const receiver = mockReceivers[continuation.receiver.dapp][continuation.receiver.page];
  receiver.receive(continuation);
};

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
          mockContinuationInterpreter(<Continuation>event);
          break;
      }
    });

  window.omoEvents.publish(mockEventsByHash["#1"]);
}
catch (e)
{
    throw new Error("Software Failure. Guru Meditation: #hash-goes-here ;)");
}
const app = new App({
    target: document.body,
});
export default app;
