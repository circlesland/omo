import {mnemonicToEntropy} from "bip39";
import Web3 from "web3";
import {Account} from "web3-core";

const CirclesCore = require('@circles/core');
const BN = require("bn.js");

const ETHEREUM_NODE_WS="wss://xdai.poanetwork.dev/wss";
const provider = new Web3.providers.WebsocketProvider(
  ETHEREUM_NODE_WS,
  {
    timeout: 30000,
    reconnect: {
      auto: true,
      delay: 5000,
      maxAttempts: 5,
      onTimeout: false
    },
    clientConfig: {
      keepalive: true,
      keepaliveInterval: 60000
    }
  }
);

const web3 = new Web3();
web3.setProvider(provider);


/*
Testnet:
            API_SERVICE_EXTERNAL: "https://api.test.circles.garden",
            BASE_PATH: "https://test.circles.garden",
            ETHEREUM_NODE_WS: "wss://sokol.poa.network/wss",
            GRAPH_NODE_EXTERNAL: "https://graph.test.circles.garden",
            HUB_ADDRESS: "0x5D0dDd1d35D3FA9950Defd99F92053b3B9E236D0",
            NODE_ENV: "production",
            PROXY_FACTORY_ADDRESS: "0x0F9f9C38E53674EF7a29A1DE38EAbF34e1DCB81C",
            RELAY_SERVICE_EXTERNAL: "https://relay.test.circles.garden",
            SAFE_ADDRESS: "0x8b4404DE0CaECE4b966a9959f134f0eFDa636156",
            SAFE_FUNDER_ADDRESS: "0x691b74E59b7D65572DFF5543e5A0e23c2F32049a",
            SUBGRAPH_NAME: "CirclesUBI/circles-subgraph",
            EXPLORER_URL: "https://blockscout.com/poa/sokol/address/:address",
            SENTRY_DSN_URL: "https://8136e680db704fdfbde93258342082b0@o334096.ingest.sentry.io/5446125",
            STAGING_NOTIFICATION: "1",
            STORAGE_NAMESPACE: "sokol-v1",
            RELEASE_VERSION: "1.7.2",
            CORE_RELEASE_VERSION: "2.9.2"
 */
/*
Production:
            API_SERVICE_EXTERNAL: "https://api.circles.garden",
            BASE_PATH: "https://circles.garden",
            ETHEREUM_NODE_WS: "wss://frosty-delicate-sunset.xdai.quiknode.pro/",
            GRAPH_NODE_EXTERNAL: "https://graph.circles.garden",
            HUB_ADDRESS: "0x29b9a7fBb8995b2423a71cC17cf9810798F6C543",
            NODE_ENV: "production",
            PROXY_FACTORY_ADDRESS: "0x8b4404DE0CaECE4b966a9959f134f0eFDa636156",
            RELAY_SERVICE_EXTERNAL: "https://relay.circles.garden",
            SAFE_ADDRESS: "0x2CB0ebc503dE87CFD8f0eCEED8197bF7850184ae",
            SAFE_FUNDER_ADDRESS: "0x9219D44191b2709955FE67D03814b0DA6b224e0b",
            SUBGRAPH_NAME: "CirclesUBI/circles-subgraph",
            EXPLORER_URL: "https://blockscout.com/poa/xdai/address/:address",
            SENTRY_DSN_URL: "https://1c5b1a302d3d4e7a8037e67b31fefbd0@o334096.ingest.sentry.io/5446133",
            STORAGE_NAMESPACE: "mainnet",
            RELEASE_VERSION: "1.7.2",
            CORE_RELEASE_VERSION: "2.9.2"
 */

const core = new CirclesCore(web3, {
  hubAddress: '0x5D0dDd1d35D3FA9950Defd99F92053b3B9E236D0',
  proxyFactoryAddress: '0x0F9f9C38E53674EF7a29A1DE38EAbF34e1DCB81C',
  safeMasterAddress: '0x8b4404DE0CaECE4b966a9959f134f0eFDa636156',
  apiServiceEndpoint: 'https://api.test.circles.garden',
  graphNodeEndpoint: 'https://api.thegraph.com',
  relayServiceEndpoint: 'https://relay.test.circles.garden',
  subgraphName: 'circlesubi/circlesxdai',
});

export class CirclesWrapper
{
  static safeOwnerFromKeyphrase(keyPhrase: string): Account
  {
    const restoredKey = mnemonicToEntropy(keyPhrase);
    const safeOwner = web3.eth.accounts.privateKeyToAccount(restoredKey);
    return safeOwner;
  }

  static async createSafeOwner()
  {
    return web3.eth.accounts.create();
  }

  static async createSafe(safeOwner: Account)
  {
    const nonce = new Date().getTime();
    const safeAddress = await core.safe.prepareDeploy(safeOwner, {nonce});
    return safeAddress;
  }

  static async addTrustLine(
    trustGivingSafeOwner: Account,
    trustGivingSafeAddress: string,
    trustReceivingSafeAddress: string,
    trustPercentage: number
  )
  {
    let canSendToC = web3.utils.toChecksumAddress(trustGivingSafeAddress);
    let userC = web3.utils.toChecksumAddress(trustReceivingSafeAddress);

    // .. give user the permission to send their Token to you
    const trusted = await core.trust.addConnection(trustGivingSafeOwner, {
      canSendTo: canSendToC,
      user: userC,
      limitPercentage: trustPercentage
    });

    return trusted;
  }

  static async removeTrustLine(
    trustGivingSafeOwner: Account,
    trustGivingSafeAddress: string,
    trustReceivingSafeAddress: string
  )
  {
    let canSendToC = web3.utils.toChecksumAddress(trustGivingSafeAddress);
    let userC = web3.utils.toChecksumAddress(trustReceivingSafeAddress);

    const untrusted = await core.trust.removeConnection(trustGivingSafeOwner, {
      canSendTo: canSendToC,
      user: userC,
    });

    return untrusted;
  }

  static async deploySafe(
    safeOwner: Account,
    safeAddress: string,
  )
  {

    await core.safe.deploy(safeOwner, {safeAddress});
  }

  static async deployToken(
    safeOwner: Account,
    safeAddress: string)
  {
    await core.token.deploy(safeOwner, {safeAddress});
  }

  static async sendCircles(
    sendingSafeOwner: Account,
    sendingSafeAddress: string,
    receivingSafeAddress: string,
    amount: number
  )
  {
    let receivingSafeAddressC = web3.utils.toChecksumAddress(receivingSafeAddress);
    let sendingSafeAddressC = web3.utils.toChecksumAddress(sendingSafeAddress);

    // .. give user the permission to send their Token to you
    return await core.token.transfer(sendingSafeOwner, {
      from: sendingSafeAddressC,
      to: receivingSafeAddressC,
      value: new BN(web3.utils.toWei(amount.toString(), "ether"))
    });
  }

  static async checkUbi(safeOwner: Account, safeAddress: string)
  {
    const payout = await core.token.checkUBIPayout(safeOwner, {
      safeAddress,
    });
    return payout;
  }

  static async requestUbi(safeOwner: Account, safeAddress: string)
  {
    const payout = await core.token.requestUBIPayout(safeOwner, safeAddress);
    return payout;
  }

  static async getSafeOwners(safeOwner: Account, safeAddress: string)
  {
    const owners = await core.safe.getOwners(safeOwner, {
      safeAddress,
    });

    return owners;
  }

  static async addSafeOwner(safeOwner: Account, safeAddress: string, otherSafeOwnerAddress: string)
  {
    await core.safe.addOwner(safeOwner, {
      safeAddress,
      ownerAddress: otherSafeOwnerAddress
    });
  }

  static async removeSafeOwner(safeOwner: Account, safeAddress: string, otherSafeOwnerAddress: string)
  {
    await core.safe.removeOwner(safeOwner, {
      safeAddress,
      ownerAddress: otherSafeOwnerAddress
    });
  }
}