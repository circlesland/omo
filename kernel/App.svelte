<script lang="ts">
  import OmoFavicon from "../views/atoms/OmoFavicon.svelte";
  import GridCompositor from "./gridCompositor/GridCompositor.svelte";
  import { loader } from "./_other/loader";
  import {xfetch} from "./main";

  // import { Login } from "../dapps/omo/odentity/index.json";

  let viewDocument;

  async function load() {
    viewDocument = await xfetch("bafzbeidz3eazquyorhjdiosdgbc5j73yz5omnyqrasuz7pertimlmz7e5y")
  }
  load();



  let local = window.location.hostname == "localhost" || window.location.hostname == "127.0.0.1";
  let development = window.location.hostname == "omo.local";
  let css = (local || development) ? "bundle.css" : "https://hub.textile.io/ipns/bafzbeigrqxbkog345dvrbl7puqjw4aggbbqrgtkq6cx6hvtpy326oifycq/build/bundle.css";

</script>

<style global>
  @import url("https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@1,300&family=Josefin+Sans:wght@700&family=Nunito+Sans:wght@400&display=swap");
  /* @import url("https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@700&display=swap"); */
  @import url("https://fonts.googleapis.com/css2?family=Quicksand:wght@500&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Aclonica&display=swap");

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
