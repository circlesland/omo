import App from "./App.svelte";
import {EventBroker, Topic} from "./_other/eventBroker";
import type Web3 from "web3";
import type { Event } from "./interfaces/event";
import {Command, CommandArgs} from "./command/command";
import {marketplaceProductMocks, mockEventsByHash} from "../mock/mockEventsByHash"

export interface IReceiver {
  activate(continuation:Command) : void;
}

export type ReceiverMap = {[dapp:string]:{[page:string]:IReceiver}};

function next(currentHash:string, current:Command, args:CommandArgs) {
  const nextReceiver = current.continuations.success;
  const next = <Command> {
    _timestamp: Date.now(),
    _eventType: Command.type,
    _previous: currentHash,
    receiver: nextReceiver,
    context: current.context,
    args: args,
  };
  window.omoEvents.publish(next);
}

function error(continuation:Command, e:Error) {
}

const mockReceivers:ReceiverMap = {
  "omo/marketplace": {
    "checkout": {
      async activate(command: Command)
      {
        console.log("omo/marketplace/checkout received:", command);
        try {
          // Find the product from the context
          const productHash = <string>command.context["product"];
          const product = marketplaceProductMocks[productHash];

          // Create the args for the continuation from the found product
          const paymentArgs = {
            sender: <string>command.context["buyer"],
            receiver: <string>command.context["seller"],
            amount: product.price
          };

          // Invoke the continuation
          next("#123", command, paymentArgs);
        } catch (e) {
          // Something went wrong, invoke the error continuation
          error(command, e)
        }
      }
    },
    "checkoutComplete": {
      activate(command: Command)
      {
        console.log("omo/marketplace/checkoutComplete received:", command);
      }
    }
  },
  "omo/odentity": {
    "login": {
      activate(command: Command)
      {
        console.log("omo/odentity/login received:", command);
      }
    }
  },
  "omo/shell": {},
  "omo/wallet": {
    "transfer": {
      activate(command: Command)
      {
        console.log("omo/wallet/transfer received:", command);
        window.omoEvents.publish(mockEventsByHash["#3"]); // Send to checkout complete
      }
    }
  }
}

const mockContinuationInterpreter = (continuation:Command) => {
  const receiver = mockReceivers[continuation.receiver.dapp][continuation.receiver.page];
  receiver.activate(continuation);
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
        case Command.type:
          mockContinuationInterpreter(<Command>event);
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
