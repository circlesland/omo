import { Context, defaultHost } from "@textile/context";
import { WebsocketTransport } from "@textile/grpc-transport";
import * as pb from "@textile/hub-grpc/hub_pb";
import {
    APIServiceClient,
    ServiceError,
} from "@textile/hub-grpc/hub_pb_service";
import type { ApiResponse } from "../interfaces/apiResponse";
import type { User } from "../interfaces/user";
import { Buckets, Identity, KeyInfo } from '@textile/hub'

const isLocal = window.location.hostname == "localhost" || window.location.hostname == "127.0.0.1";
const isDevelopment = window.location.hostname == "dev.omo.local";

export class SessionService {
    private session: string;
    private publicKey: string;
    private privateKey: string;
    addrGatewayUrl: string;
    addrAPIUrl: string;
    context: Context;
    client: APIServiceClient;
    username: string;
    useremail: string;

    private constructor() {
        this.addrGatewayUrl = isLocal || isDevelopment ? "https://hub.dev.omo.earth" : "https://hub.textile.io";
        this.addrAPIUrl = isLocal || isDevelopment ? "https://webapi.dev.omo.earth" : defaultHost;
        this.context = new Context(this.addrAPIUrl);
        this.client = new APIServiceClient(this.context.host, { transport: WebsocketTransport(), });

    }
    private static _instance: SessionService | null = null;
    static async GetInstance(): Promise<SessionService> {
        let instance = SessionService._instance;
        if (instance == null) {
            instance = window.sessionStorage["sid"] ?
                await this.restoreSession()
                : new SessionService();
        }
        window["session"] = instance;
        return instance;
    }

    static async storeSession(sessionId) {
        window.sessionStorage.setItem("sid", sessionId);
    }

    static async restoreSession(sessionId?: string): Promise<SessionService> {
        sessionId = sessionId ? sessionId : window.sessionStorage.getItem("sid");
        let instance = new SessionService();
        instance.session = window.sessionStorage["sid"];
        await SessionService.updateSession(sessionId, instance);
        return instance;
    }

    static async signInOrSignUp(userEmail: string, username?: string): Promise<ApiResponse> {
        let resp = await SessionService.signIn(userEmail);
        if (resp.error && resp.error.code == 5) {
            resp = await SessionService.signUp(userEmail, username);
        }
        if (!resp.error) {
            await SessionService.updateSession(resp.session);
        }
        return resp;
    }
    static async updateSession(sessionId: string, instance?: SessionService): Promise<SessionService> {
        SessionService.storeSession(sessionId);
        var instance = instance ? instance : await SessionService.GetInstance();
        let meta = await instance.context.withSession(instance.session).toMetadata();
        let req = new pb.GetSessionInfoRequest();

        return new Promise((resolve) => {
            instance.client.getSessionInfo(
                req,
                meta,
                (
                    error: ServiceError | null,
                    message: pb.GetSessionInfoResponse | null
                ) => {
                    instance.username = message.getUsername();
                    instance.useremail = message.getEmail();
                    instance.privateKey = message.getKey_asB64();
                    instance.session = sessionId;

                    let user: User = error
                        ? { name: "", email: "" }
                        : { name: message?.getUsername(), email: message?.getEmail() };
                    resolve(instance);
                }
            );
        });

    }

    static async signUp(userEmail: string, username?: string): Promise<ApiResponse> {
        let instance = await SessionService.GetInstance();
        let meta = await instance.context.toMetadata();
        let req = new pb.SignupRequest();
        req.setEmail(userEmail);
        username = username ? username : userEmail.split("@")[0];
        req.setUsername(username);

        return new Promise((resolve) => {
            instance.client.signup(
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

    static async signIn(usernameOrEmail): Promise<ApiResponse> {
        let instance = await SessionService.GetInstance();
        let meta = await instance.context.toMetadata();
        let req = new pb.SigninRequest();
        req.setUsernameOrEmail(usernameOrEmail);
        return new Promise((resolve) => {
            instance.client.signin(
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

    getUsername() {
        return this.username;
    }
    getUserMail() {
        return this.useremail;
    }

    async listKeys(): Promise<pb.ListKeysResponse> {
        this.context = this.context.withSession(this.session);
        let meta = await this.context.toMetadata();
        let req = new pb.ListKeysRequest();
        return new Promise((resolve) => {
            this.client.listKeys(req, meta, (error: ServiceError | null,
                message: pb.ListKeysResponse | null
            ) => {
                resolve(message)
            });
        });
    }

    async listBuckets(key, secret) {
        const buckets = await Buckets.withKeyInfo({ key, secret });
        let buck = await buckets.getOrCreate("mein bucket");
        
        let start = new Date();
        for(let i=0;i<100;i++)
        {
            const path = `index${i}.json`
            const buf = Buffer.from(JSON.stringify("testcontent"+i, null, 2))
            var foo =  await buckets.pushPath(buck.root.key, path, buf);
        }
       
       let end = new Date();
       console.log("hub push take (average 100) "+(end.getMilliseconds()-start.getMilliseconds())/100+" milliseconds")
       console.log("uploaded mudda",foo);
       
        // console.log(await buckets.listPathFlat(buck.root.key, "/"));
        // let bucks = await buckets.list();
        // console.log(bucks);
        // for (let buck of bucks) {

        //     console.log(await buckets.listPathFlat(buck.key, "/"));
        // }
        // buckets.
        return null;
    }

}