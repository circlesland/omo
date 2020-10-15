// import { Peer, BlockStore } from '@textile/ipfs-lite'
// // Use any interface-datastore compliant store
// import { MemoryDatastore } from 'interface-datastore'
// import Libp2p from 'libp2p'

// export class DagService {
//     private store = new BlockStore(new MemoryDatastore());
//     private host = new Libp2p({});
//     private lite = new Peer(this.store, this.host);
//     private constructor() { }

//     private static _instance: DagService | null;
//     static async getInstance(): Promise<DagService> {
//         if (DagService._instance == null) {
//             DagService._instance = new DagService();
//         }
//         return DagService._instance;
//     }

//     async start() {
//         await this.lite.start()
       
//     }


//     async hhh(){
//         const buf = Buffer.from(JSON.stringify("deine mudda", null, 2))
//         let foo =  await this.lite.put(buf,null,{onlyHash:true})
//         console.log(foo);
//         console.log(foo.toString());
//         return foo;
//     }
//     // const main = async () => {


//     //     const cid = "QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u"
//     //     const data = await lite.getFile(cid)
//     //     console.log(data.toString())
//     //     // Hello World
//     //     await this.lite.stop()
//     // }
// }
export const test = "";