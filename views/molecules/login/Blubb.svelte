<script lang="ts">
  import { SessionService } from "../../../kernel/services/sessionService";
  let user: { name: string; email: string };
  SessionService.GetInstance().then((session) => {
    user = { name: session.getUsername(), email: session.getUserMail() };
  });
</script>

<style>
  @media screen and (min-width: 600px) {
    .wrap {
      height: 95%;
    }
  }
  @media screen and (min-width: 1024px) {
    .wrap {
      height: 85%;
    }
  }
  @media screen and (min-width: 1600px) {
    .wrap {
      height: 75%;
    }
  }
  .grid {
    @apply h-full w-full;
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-rows: 40px 1fr auto;
    grid-template-columns: 1fr;
  }
  header {
    grid-area: header;
  }
  main {
    grid-area: main;
    @apply overflow-y-scroll h-full bg-gray-100 p-8;
  }
  footer {
    grid-area: footer;
  }
</style>

<div
  class=" bg-white h-screen flex flex-col items-center justify-center bg-grey-lighter bg-cover bg-center"
  style="background-image: url(https://source.unsplash.com/7awMZWDS4rg)">
  <div
    class="wrap shadow-2xl border border-gray-300 bg-white rounded-lg md:m-12 w-full h-full max-w-md justify-center">
    <div class="grid">
      <header
        class="flex flex-col justify-center bg-grey-lighter border-b border-gray-300">
        <div class="text-primary font-bold uppercase text-center">Login</div>
      </header>
      <main>
        {#if user}
        <h1 class="text-center text-3xl font-title text-primary">
          Willkommen {user.name},
          <br />{user.email}
        </h1>
        {/if}
        <p class="text-sm py-4 text-center text-gray-700">Yeah!</p>
      </main>

      <footer class="text-sm border-t border-gray-300 p-6">
        <div>
          <form method="POST" onsubmit="return false;">
            <div
              class="w-full p-3 bg-primary uppercase font-bold text-white text-center rounded-lg">
              Oida!
            </div>
          </form>
        </div>
      </footer>
    </div>
  </div>
</div>
