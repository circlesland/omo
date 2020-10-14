import {Request} from "express";

export class RequestContext
{
    readonly origin:string;
    readonly sessionId?:string;

    readonly setCookies = [];
    readonly setHeaders = [];

    private constructor(origin:string, sessionId?:string)
    {
        this.origin = origin;
        this.sessionId = sessionId;
    }

    public static create(arg:{req?:Request}) : RequestContext
    {
        if (!arg.req) {
            throw new Error("Only queries and mutations are allowed.")
        }

      const originHeaderValue = arg.req.headers["origin"];
      const cookieValue = arg.req.headers["cookie"];

      console.log("Origin: " + originHeaderValue);
      console.log("Cookies: " + cookieValue);
      let sessionId:string|undefined = undefined;

      const cookieValueStartIndex = cookieValue?.indexOf("=");
      if(cookieValueStartIndex && cookieValue && cookieValue.substr(0, cookieValueStartIndex) == "session") {
        sessionId = decodeURIComponent(cookieValue.substring(cookieValueStartIndex + 1));
        console.log("sessionId: " + sessionId);
      }
      //if (!originHeaderValue)
      //    throw new Error("The incoming request doesn't have an Origin-header.")

      return new RequestContext(<string>originHeaderValue,  sessionId);
    }
}
