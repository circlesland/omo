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

<body class="flex h-screen bg-gray-200 font-sans text-gray-600">
  <div class="container mx-auto mt-24 flex">
    <div class="max-w-md w-full mx-auto">
      <div class="bg-white rounded-lg overflow-hidden shadow-2xl">
        <div class="px-8">
          {#if loginProcess == LoginState.None}
            <h1 class="text-3xl pt-12 text-center mb-4 font-title text-primary">
              Omo Sapien Login
            </h1>
            <p class="text-sm mb-8">
              Willkommen in der Omo Welt. Omo's entwickeln und kontrollieren
              100% ihre eigenen Daten und Apps. Um dich als Omo Sapien
              einzuloggen oder einen neuen OmoPod zu installieren, melde dich
              bei unserem Daten Hosting Partner
              <a href="https://textile.io">Textile</a>
              an.
            </p>
            <form method="POST" class="" action="#" onsubmit="return false;">
              <div
                class="mb-5 w-full px-2 pt-1 rounded bg-gray-200 border border-transparent focus:outline-none">
                <label
                  for="email"
                  class="block mb-1 text-xs font-medium text-gray-600">Email</label>

                <input
                  type="text"
                  name="email"
                  class="block mb-1 text-xl w-full rounded bg-gray-200 border border-transparent focus:outline-none"
                  bind:value={login} />
              </div>
              <button
                class="w-full p-3 bg-primary text-white rounded shadow"
                on:click={() => signInOrSignUpAsync()}>Send Magic Login</button>
              <button />
            </form>
          {/if}
          {#if loginProcess == LoginState.LoggingIn}
            <h1 class="text-3xl pt-12 text-center mb-4 font-title text-primary">
              Logging in ...
            </h1>
            <p class="my-8">
              Magic Login Link wurde an deine Email geschickt. Bitte öffne den
              Link in deiner Email, um dich anzumelden.
            </p>
          {/if}
          {#if loginProcess == LoginState.LoggedIn}
            <h1 class="text-3xl pt-12 text-center mb-4 font-title text-primary">
              Herzlich willkommen
            </h1>
            <p class="my-8">{user.name}({user.email})</p>
          {/if}

          {#if loginProcess == LoginState.Error}
            <div class="m-8">
              <p>Fehler!</p>
              <p>{error.message} Code: {error.code}</p>
              <p>{JSON.stringify(error.metadata)}</p>
            </div>
          {/if}
        </div>

        <div class="p-8 text-sm border-t border-gray-300 bg-gray-100">
          <div>
            <a href="https://textile.io/">Dein privater Omo DatenPod wird bei
              Textile gehosted:
              <span
                class="hover:text-green-500 text-blue-700">{addrGatewayUrl}</span></a>
          </div>
          <div>
            <img
              class="pt-2"
              src="https://github.com/omoearth/omo-marketplace/workflows/dev.omo.earth/badge.svg"
              alt="deployBadge" />
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
