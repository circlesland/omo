<script lang="ts">
  import OmoFavicon from "../views/atoms/OmoFavicon.svelte";
  import GridCompositor from "./gridCompositor/GridCompositor.svelte";
  import { loader } from "./_other/loader";
  import {xfetch, isLocal} from "./main";
  import * as qs from "./_other/query";
  import * as page from "page";
import { BucketContinuationStorage } from "./command/bucketContinuation";

  let viewDocument;

  // function parse(ctx, next) {
  //   ctx.query = qs.parse(location.search.slice(1));
  //   next();
  // }

  // async function show(ctx) {
  //   let page = ctx.query["page"];
  //   if (!page) {
  //     page = "index"
  //   }
  //   page += ".json";
  //   viewDocument = await xfetch("bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y", page);
  // }

  // page.base('/');
  
  // page('*', parse)
  // page('*', show)
  // page.start({popstate:true});
function getPageBase(){
  return window.location.pathname.split('#!')[0];
}

function getIpnsHashFromUrl(){
  return window.location.pathname.split('#!')[0].split("/ipns/")[1].replace(/\//g,"");
}
  async function show(ctx) {
        console.log("CONTEXT", ctx);
        // // current = ViewRegistry.getByName(ctx.path.replace(/\//g, ""));
        // let hash = "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y"; // always odentity hack
  page.base(getPageBase());
        viewDocument = await xfetch(getIpnsHashFromUrl(), ctx.path);
        // let base = window.location.pathname.split('/#!/')[0] + '/#!/';
        // page.base(base);
    }
    // async function navigate(ctx, hash:string) {
    //   console.log(ctx);
    //   console.log(hash);
    // }

  //   if(isLocal) {
  //     page("/ipns/bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y",navigate("bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y"))
  // //     "bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y": "odentity",
  // // "bafzbeicmtet2ytuo5jlg2jtuh4rbtfvntznwah5mt2kb4xj3zgxt2ol5ma": "wallet",
  // // "bafzbeiafbjcuy4dxnily3nbt7nab6ebdwyti3z7jgdrblnm4ivqw7hubki": "textile",
  // // "bafzbeiahddbruy5letgjx6tiijzaednwr3zngtk57u3yyrjcsba7sqjbdq": "marketplace"
  //   }

    // all before hashname belongs to url
    let base = window.location.pathname.split('#!/')[0];
    console.log("page base is",base);

    page.base(base);
    page("*", show);
    page({ popstate: true, hashbang: true });



  page.base(getPageBase());
   xfetch(getIpnsHashFromUrl()).then(json => {viewDocument = json;});

// page.redirect("/ipns/bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y")
  // setTimeout(() => {
  //   page.redirect("/blubb");
  //   setTimeout(() => {
  //     page.redirect("/");
  //     setTimeout(() => {
  //     page.redirect("/index");
  //   }, 5000);
  //   }, 5000);
  // }, 5000);

  let local = window.location.hostname == "localhost" || window.location.hostname == "127.0.0.1";
  let development = window.location.hostname == "omo.local";
  let css = (local || development) ? "/bundle.css" : "https://hub.textile.io/ipns/bafzbeigrqxbkog345dvrbl7puqjw4aggbbqrgtkq6cx6hvtpy326oifycq/build/bundle.css";

</script>

<style global>
  /* @import url("https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@1,300&family=Josefin+Sans:wght@700&family=Nunito+Sans:wght@400&display=swap"); */
  /* @import url("https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@700&display=swap"); */
  @import url("https://fonts.googleapis.com/css2?family=Quicksand:wght@500&display=swap");
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

  @tailwind base;
  @tailwind utilities;
  @tailwind components;

  html,
  body {
    height: 100%;
    overflow: hidden;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @apply font-sans;
  }
</style>

<svelte:head>
  <meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<title>Omo Earth</title>
	<link rel="stylesheet" href="{css}" />
</svelte:head>

<OmoFavicon />
<GridCompositor {loader} component={viewDocument} />
