// import { Peer, BlockStore } from "../../node_modules/@textile/ipfs-lite/src"
// // Use any interface-datastore compliant store
// import { MemoryDatastore } from 'interface-datastore';
// import Libp2p from 'libp2p';

import * as  multihash from 'multihashes';
import * as bs58 from 'bs58';

import {createHash, publicEncrypt} from "crypto";
import CID from 'cids';
import sha256 from 'crypto-js/sha256';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';
import { Hash } from 'fast-sha256'
import multibase from 'multibase'
export class DagService {
    // private store = new BlockStore(new MemoryDatastore());
    // private memory = new MemoryDatastore();
    // private host = new Libp2p({});
    // private lite = new Peer(this.store, this.host);
    // private constructor() { }

    // private static _instance: DagService | null;
    // static async getInstance(): Promise<DagService> {
    //     if (DagService._instance == null) {
    //         DagService._instance = new DagService();
    //     }
    //     return DagService._instance;
    // }

    // async start() {
    //     await this.lite.start()

    // }


    async testhash() {
        let start = new Date();
        const buf = Buffer.from(JSON.stringify("testcontent", null, 2))

        const hash = new Hash();
        const mac = hash.update(buf).digest()
        const sig = multibase.encode('base32', Buffer.from(mac));


        // const buf = Buffer.from(JSON.stringify("testcontent", null, 2))

        // const hashed = createHash('sha256')
        // .update(buf)
        // .digest();
        const bas58Hash = bs58.encode(mac);
        




        // const hashDigest = sha256(buf);
        // const hmacDigest = Base64.stringify(hmacSHA512(path + hashDigest, privateKey));
        // const digest = crypto.subtle.digest('SHA-256', buf);

        // let mh = multihash.hash(hashDigest, 'sha2-256');
        // let mh = hmacSHA256(hashDigest);
        let cid = new CID(1, 'raw', sig, 'base32');
        let end = new Date();
        console.log(end.getMilliseconds() - start.getMilliseconds());
        // console.log(mh)

        // console.log(cid.toString())
        console.log(sig)




        // const address = bs58.encode(Buffer.from(fdsf))
        // console.log(address)
        // let foo =  await this.lite.put(buf,null,{onlyHash:true})
        // console.log(foo);
        // console.log(foo.toString());
        // return foo;
    }
}







