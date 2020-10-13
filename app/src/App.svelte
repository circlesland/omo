<script lang="ts">
  import OmoFavicon from "./components/OmoFavicon.svelte";
  import GridCompositor from "./components/GridCompositor.svelte";
  import Tailwind from "./Tailwind.svelte";
  import { library } from "./library";

  import { Home } from "./pages/Home";

  let viewDocument = Home;
</script>

<OmoFavicon />
<Tailwind />
<GridCompositor {library} component={viewDocument} />

works