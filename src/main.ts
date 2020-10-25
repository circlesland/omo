// import { Boot } from "o-design-system/src";
// import { Kernel } from "./o-os/src/Kernelrc/Kernel";

import { Kernel } from "@omoearth/o-os";
import { Boot } from "@omoearth/o-design-system";


declare global {
  interface Window {
    o: Kernel;
  }
}

let UI;

Kernel.boot().then(o => {
  window.o = o;
  UI = new Boot({
    target: document.body,
    props: {
      registry: o.registry
    }
  })
}).catch(e => {
  console.error(e);
  throw new Error("Software Failure. Guru Meditation: #hash-goes-here ;)");
});

export default UI;












// xfetch(
//   "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y",
//   "index"
// ).then((manifest: any) => {

// });

// export default app;


