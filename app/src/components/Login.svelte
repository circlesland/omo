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
    let local = window.location.hostname == "localhost"||window.location.hostname=="127.0.0.1";
    let development = window.location.hostname == "dev.omo.local";
    let addrGatewayUrl = local || development ? "https://hub.dev.omo.earth":"https://hub.textile.io";
    let addrAPIUrl = local || development ? "https://webapi.dev.omo.earth":defaultHost;

    async function signInOrSignUpAsync() {
        if (login == null || login == "") return;

        loginProcess = LoginState.LoggingIn;
        const ctx = new Context(addrAPIUrl);
        const client = new APIServiceClient(ctx.host, {
            transport: WebsocketTransport(),
        });
        let resp = await signIn(client, ctx);
        if (resp.error && resp.error.code == 5) {
            console.log("signUp")
            resp = await signUp(client, ctx);
        }
        if (resp.error)  {
            error = resp.error;
            loginProcess = LoginState.Error;
            return;
        }
        user = await getUser(resp.session,client,ctx);
        loginProcess = LoginState.LoggedIn;
    }

    async function getUser(session:string, client: APIServiceClient,
        ctx: Context):Promise<User> {
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
                        ?  {name:"",email:""}
                        :  {name:message.getUsername(),email:message.getEmail()};
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
        req.setUsername(login.split('@')[0]);
        
        return new Promise((resolve) => {
            client.signup(
                req,
                meta,
                (
                    error: ServiceError | null,
                    message: pb.SignupResponse | null
                ) => {
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
                (
                    error: ServiceError | null,
                    message: pb.SigninResponse | null
                ) => {
                    let resp: ApiResponse = error
                        ? { error, session: null }
                        : { error: null, session: message?.getSession() };
                    resolve(resp);
                }
            );
        });
    }
</script>
<h1>HUB: {addrGatewayUrl}</h1>
{#if loginProcess == LoginState.None}
    <p>Email oder Nutzername</p>
    <input bind:value={login} />
    <button on:click={() => signInOrSignUpAsync()}>magic login</button>
{/if}

{#if loginProcess == LoginState.LoggingIn}
    <p>Magic Login in progess</p>
{/if}

{#if loginProcess == LoginState.LoggedIn}
    <p>Herzlich willkommen {user.name}({user.email})</p>
{/if}

{#if loginProcess == LoginState.Error}
    <p>Fehler!</p>
    <p>{error.message} Code: {error.code}</p>
    <p>{JSON.stringify(error.metadata)}</p>
{/if}
