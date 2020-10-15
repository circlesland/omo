import {Command} from "../kernel/command/command";

export const marketplaceProductMocks = {
  "#2983823598": {
    seller: "#8437538905",
    name: "Deine Mudda ..",
    description: ".. kocht und putzt für nur:",
    price: 25332.50,
  }
};

export const mockEventsByHash = {
  // 1) User comes from a product detail page on the market and wants to buy the
  //    product.
  "#1": <Command>{
    _eventType: Command.type,
    _timestamp: Date.now(),
    receiver: {
      dapp: "omo/marketplace",
      page: "checkout"
    },
    context: {
      product: "#2983823598",
      seller: "#8437538905",
      buyer: "#8437538905"
    },
    continuations: {
      success: {
        dapp: "omo/wallet",
        page: "transfer"
      },
      error: {
        dapp: "omo/marketplace",
        page: "checkout"
      }
    }
  },
  // 2) The checkout page gathered the buyer-, seller- and price-information
  //    and transfers the user to the wallet to do the payment.
  "#2": <Command> {
    _eventType: Command.type,
    _timestamp: Date.now(),
    _previous: "#1",
    _noReEntry: true,
    receiver: {
      dapp: "omo/wallet",
      page: "transfer"
    },
    context: {
      product: "#2983823598",
      seller: "#8437538905",
      buyer: "#8437538905"
    },
    args: {
      sender: "#8437538905",
      receiver: "#8437538905",
      amount: 25.50
    },
    continuations: {
      success: {
        dapp: "omo/marketplace",
        page: "checkoutComplete"
      },
      error: "#1" // In case of an error, bring the user back to the checkout page
                  // so that he/she can try again.
    }
  },
  // 3) The payment was successfully transferred and the user is brought to the
  //    "checkout completed" page. This is a final state because it has no continuations.
  "#3": <Command> {
    _eventType: Command.type,
    _timestamp: Date.now(),
    _previous: "#2",
    receiver: {
      dapp: "omo/marketplace",
      page: "checkoutComplete"
    },
    context: {
      product: "#2983823598",
      seller: "#8437538905",
      buyer: "#8437538905"
    }
  }
}