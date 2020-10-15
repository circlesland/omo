import type { Command } from "./command";
import type { Storage } from "../interfaces/storage";

export class BucketContinuationStorage implements Storage<Command>{
    load(hash: string): Command {
        throw new Error("Method not implemented.");
    }
    store(continuation: Command): string {
        // write to localstore
        // push to bucket 
            //->/then/ on success remove from localstore
        throw new Error("Method not implemented.");
    }
}



// var bucketContinuationStorage = new BucketContinuationStorage();
// var conti = Continuation.load(bucketContinuationStorage, "hash");
// var serialized = Continuation.store(bucketContinuationStorage, conti);



// import { Buckets, Identity, KeyInfo } from '@textile/hub'
// Buckets.
// // const setup = async (key: KeyInfo, identity: Identity) => {
// //   // Use the insecure key to set up the buckets client
//   const buckets = await Buckets.withKeyInfo(key)

// buckets.
//   // Authorize the user and your insecure keys with getToken
//   await buckets.getToken(identity) 

//   const result = await buckets.open('io.textile.dropzone')
//   if (!result.root) {
//     throw new Error('Failed to open bucket')
//   }
//   return {
//       buckets: buckets, 
//       bucketKey: result.root.key,
//   }
// }