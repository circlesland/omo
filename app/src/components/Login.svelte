<script lang="ts">
  import { Context, defaultHost } from "@textile/context";
  import {
    APIServiceClient,
    ServiceError,
  } from "@textile/hub-grpc/hub_pb_service";
  import { WebsocketTransport } from "@textile/grpc-transport";
  import * as pb from "@textile/hub-grpc/hub_pb";

  enum LoginState {
    None = 1,
    LoggingIn,
    LoggedIn,
    Error,
    Register,
  }

  class ApiResponse {
    error: ServiceError | null;
    session: string | null;
  }

  class User {
    name: string;
    email: string;
  }

  export let login: string = "";
  export let loginProcess = LoginState.None;
  export let user: User;
  export let error: ServiceError;
  let local =
    window.location.hostname == "localhost" ||
    window.location.hostname == "127.0.0.1";
  let development = window.location.hostname == "dev.omo.local";
  let addrGatewayUrl =
    local || development
      ? "https://hub.dev.omo.earth"
      : "https://hub.textile.io";
  let addrAPIUrl =
    local || development ? "https://webapi.dev.omo.earth" : defaultHost;

  async function signInOrSignUpAsync() {
    if (login == null || login == "") return;

    loginProcess = LoginState.LoggingIn;
    const ctx = new Context(addrAPIUrl);
    const client = new APIServiceClient(ctx.host, {
      transport: WebsocketTransport(),
    });
    let resp = await signIn(client, ctx);
    if (resp.error && resp.error.code == 5) {
      console.log("signUp");
      resp = await signUp(client, ctx);
    }
    if (resp.error) {
      error = resp.error;
      loginProcess = LoginState.Error;
      return;
    }
    user = await getUser(resp.session, client, ctx);
    loginProcess = LoginState.LoggedIn;
  }

  async function getUser(
    session: string,
    client: APIServiceClient,
    ctx: Context
  ): Promise<User> {
    let meta = await ctx.withSession(session).toMetadata();
    let req = new pb.GetSessionInfoRequest();
    return new Promise((resolve) => {
      client.getSessionInfo(
        req,
        meta,
        (
          error: ServiceError | null,
          message: pb.GetSessionInfoResponse | null
        ) => {
          let user: User = error
            ? { name: "", email: "" }
            : { name: message.getUsername(), email: message.getEmail() };
          resolve(user);
        }
      );
    });
  }

  async function signUp(
    client: APIServiceClient,
    ctx: Context
  ): Promise<ApiResponse> {
    let meta = await ctx.toMetadata();
    let req = new pb.SignupRequest();
    req.setEmail(login);
    req.setUsername(login.split("@")[0]);

    return new Promise((resolve) => {
      client.signup(
        req,
        meta,
        (error: ServiceError | null, message: pb.SignupResponse | null) => {
          let resp: ApiResponse = error
            ? { error, session: null }
            : { error: null, session: message?.getSession() };
          resolve(resp);
        }
      );
    });
  }

  async function signIn(
    client: APIServiceClient,
    ctx: Context
  ): Promise<ApiResponse> {
    let meta = await ctx.toMetadata();
    let req = new pb.SigninRequest();
    req.setUsernameOrEmail(login);
    return new Promise((resolve) => {
      client.signin(
        req,
        meta,
        (error: ServiceError | null, message: pb.SigninResponse | null) => {
          let resp: ApiResponse = error
            ? { error, session: null }
            : { error: null, session: message?.getSession() };
          resolve(resp);
        }
      );
    });
  }
</script>

<style>
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
    @apply overflow-hidden h-full bg-gray-100 p-8;
  }
  footer {
    grid-area: footer;
  }
</style>

<div
  class="bg-white h-screen flex flex-col items-center justify-center bg-grey-lighter bg-cover bg-center"
  style="background-image: url(https://source.unsplash.com/7awMZWDS4rg)">
  <div
    class="shadow-2xl border border-gray-300 bg-white rounded-lg md:m-12 w-full h-full max-w-md justify-center">
    <div class="grid">
      <header
        class="flex flex-col justify-center bg-grey-lighter border-b border-gray-300">
        <div class="text-primary font-title uppercase text-center">Login</div>
      </header>
      <!-- <header>
        <div class="flex flex-col justify-center bg-grey-lighter">Login</div>
      </header> -->
      {#if loginProcess != LoginState.LoggedIn}
        <main>
          <h1 class="text-center text-3xl font-title text-primary">Willkommen, <br />auf Omo Earth</h1>
          <p class="text-sm py-8 text-center text-gray-700">
            Die Menschen auf Omo Earth nennen sich Omo Sapiens. Jeder Omo entwickelt und
            kontrolliert 100% seiner eigenen Daten und Apps und speichert diese
            in seinem privaten Omo Haus. Um als Omo Sapien dein Haus zu öffnen
            oder ein neues Omo Sapien Haus zu bauen, melde dich unten über
            unseren Daten Hosting Partner textile.io an.
          </p>

          <div class="flex p-2 mx-auto">
            <img
              src="https://github.com/omoearth/omo-marketplace/workflows/dev.omo.earth/badge.svg"
              alt="deployBadge" />
            <img
              src="https://github.com/omoearth/textile/workflows/hub.dev.omo.earth/badge.svg"
              alt="deployBadge" />
          </div>
        </main>
      {/if}
      {#if loginProcess == LoginState.LoggedIn}
        <main>
          <p class="text-2xl text-center font-title text-primary">
            Herzlich Willkommen,<br />{user.name}
          </p>{user.email}
        </main>
      {/if}

      <footer class="text-sm border-t border-gray-300 p-6">
        {#if loginProcess == LoginState.None}
          <form method="POST" onsubmit="return false;">
            <div
              class="w-full mb-2 px-2 pt-1 rounded-lg bg-gray-200 border border-transparent focus:outline-none">
              <label
                for="gateway"
                class="block text-xs font-medium text-gray-600">Gateway</label>
              <input
                type="text"
                name="gateway"
                disabled
                class="text-xl w-full rounded-lg text-gray-500  bg-gray-200 border border-transparent focus:outline-none"
                bind:value={addrGatewayUrl} />
            </div>
            <div
              class="w-full mb-2 px-2 pt-1 rounded-lg bg-gray-200 border border-transparent focus:outline-none">
              <label
                for="email"
                class="block text-xs font-medium text-gray-600">Email</label>

              <input
                type="text"
                name="email"
                class=" text-xl w-full rounded-lg bg-gray-200 border border-transparent focus:outline-none"
                bind:value={login} />
            </div>
            <div
              class="w-full p-3 bg-primary text-bold text-white text-center rounded-lg"
              on:click={() => signInOrSignUpAsync()}>
              Omo Haus öffne dich
            </div>
          </form>
        {/if}
        {#if loginProcess == LoginState.LoggingIn}
          <div class="bg-gray-200 p-12 rounded-lg text-lg">
            Dein Türschlüssel wurde an deine Email geschickt. Bitte öffne den
            Link in deiner Email, um dein Haus aufzuschließen.
          </div>
        {/if}
        {#if loginProcess == LoginState.Error}
          <div class="bg-red-400 p-12 rounded-lg text-white text-lg">
            <p>{error.message}</p>
            <!-- <p>Code: {error.code}</p> -->
            <!-- <p>{JSON.stringify(error.metadata)}</p> -->
          </div>
        {/if}
        {#if loginProcess == LoginState.LoggedIn}
          <div class="p-8">App-Navbar</div>
        {/if}
      </footer>
    </div>
  </div>
</div>
