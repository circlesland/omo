import {CirclesWrapper} from "./circlesActions";

async function delay(delayInMs:number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delayInMs)
  })
}

export class CirclesFlows {

  private static readonly aliceAccount = CirclesWrapper.safeOwnerFromKeyphrase("");
  private static readonly aliceSafeAddress = "0x5d55bb60Cb624aAcD2bC107CfC89c19Db0766C33";

  private static readonly bobAccount = CirclesWrapper.safeOwnerFromKeyphrase("");
  private static readonly bobSafeAddress = "0x04a2DC7DFb42a5bcd5626d9c9BD8ad66Ae644E58";

  private static readonly charlyAccount = CirclesWrapper.safeOwnerFromKeyphrase("");
  private static readonly charlySafeAddress = "0x861c6Ee4941c354920804815b6b44AD9c8dD4e5C";

  static async deployNewSafe() {
    // Create a new account and safe
    const safeOwner = await CirclesWrapper.createSafeOwner();
    const safeAddress = await CirclesWrapper.createSafe(safeOwner);

    // Let Alice, Bob and Charly trust the new safe
/*
    await Promise.all([
      CirclesWrapper.addTrustLine(this.aliceAccount, this.aliceSafeAddress, safeAddress, 0)
    , CirclesWrapper.addTrustLine(this.bobAccount, this.bobSafeAddress, safeAddress, 0)
    , CirclesWrapper.addTrustLine(this.charlyAccount, this.charlySafeAddress, safeAddress, 0)]);
    await delay(20000);
*/

    // Deploy the new safe
    await CirclesWrapper.deploySafe(safeOwner, safeAddress);

    await delay(20000);

    await CirclesWrapper.deployToken(safeOwner, safeAddress);
/*
    // Let Alice, Bob and Charly un-trust the new safe
    await Promise.all([
      CirclesWrapper.removeTrustLine(this.aliceAccount, this.aliceSafeAddress, safeAddress)
    , CirclesWrapper.removeTrustLine(this.bobAccount, this.bobSafeAddress, safeAddress)
    , CirclesWrapper.removeTrustLine(this.charlyAccount, this.charlySafeAddress, safeAddress)]);
 */
  }
}