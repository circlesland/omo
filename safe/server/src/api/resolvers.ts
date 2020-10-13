import {
  MutationResolvers,
  QueryResolvers
} from "../generated/graphql";
//import {Session} from "../../../../data/dist/session";

export class Resolvers
{
  readonly queryResolvers: QueryResolvers;
  readonly mutationResolvers: MutationResolvers;

  static readonly sessionTimeoutInSeconds = 60;

  constructor()
  {
    if (!process.env.PROXY_DOMAIN)
      throw new Error("process.env.PROXY_DOMAIN must be set to a domain name or ip address.");

    this.mutationResolvers = {
      exchangeToken: async (parent, {jwt}, context) =>
      {
        try
        {
          /*
          const session = await Session.createSessionFromJWT(jwt);

          context.setCookies.push({
            name: "session",
            value: session.sessionId,
            // Use a session cookie that should only last for the one browser session
            options: {
              domain: process.env.PROXY_EXTERN_DOMAIN,
              httpOnly: true,
              path: "/",
              sameSite: true,
              secure: !process.env.DEBUG
            }
          });
          */
          return {
            success: true
          }
        }
        catch (e)
        {
          console.error(e);
          return {
            success: false,
            errorMessage: "Couldn't create the session cookie from the supplied JWT. Please try again with a new JWT."
          }
        }
      }
    };
    this.queryResolvers = {};
  }
}
