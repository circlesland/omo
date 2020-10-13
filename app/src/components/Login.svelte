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

<body class="bg-gray-200 font-sans text-gray-700">
  <div class="container mx-auto p-8 flex">
    <div class="max-w-md w-full mx-auto">
      <h1 class="text-4xl text-center mb-8 font-thin">
        <h3 class="font-title">Omo Sapien <br />Login with textile.io</h3>
      </h1>

      <div class="bg-white rounded-lg overflow-hidden shadow-2xl">
        <div class="p-8">
          {#if loginProcess == LoginState.None}
            <form method="POST" class="" action="#" onsubmit="return false;">
              <div class="mb-5">
                <label
                  for="email"
                  class="block mb-2 text-sm font-medium text-gray-600">Email</label>

                <input
                  type="text"
                  name="email"
                  class="block w-full p-3 rounded bg-gray-200 border border-transparent focus:outline-none"
                  bind:value={login} />
              </div>
              <button
                class="w-full p-3 mt-4 bg-primary text-white rounded shadow"
                on:click={() => signInOrSignUpAsync()}>Send Magic Login Link</button>
              <button />
            </form>
          {/if}
          {#if loginProcess == LoginState.LoggingIn}
            <p>Magic Login Link has been send to you, please check you email</p>
          {/if}
          {#if loginProcess == LoginState.LoggedIn}
            <p>Herzlich willkommen {user.name}({user.email})</p>
          {/if}

          {#if loginProcess == LoginState.Error}
            <p>Fehler!</p>
            <p>{error.message} Code: {error.code}</p>
            <p>{JSON.stringify(error.metadata)}</p>
          {/if}
        </div>

        <div
          class="flex justify-between p-8 text-sm border-t border-gray-300 bg-gray-100">
          HUB:
          {addrGatewayUrl}
        </div>
      </div>
    </div>
  </div>
</body>
