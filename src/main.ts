import { Kernel } from "@omoearth/o-os";
import { Boot, ViewComponents } from "@omoearth/o-design-system";


declare global {
  interface Window {
    o: Kernel;
  }
}

let UI;

if (window.location.pathname == "/") {
  location.replace(window.location.origin + "/ipns/bafzbeihcehyawlhvltossqfhblyqeuer34yak24ctesgwnnf7aeyk33lce");
}

Kernel.boot().then(o => {
  window.o = o;
  ViewComponents.forEach((v) => o.registry.registerClass(v));

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


